// Local development/preview only. Hosted requests use Sites identity and D1.
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { api, json } from "./api.js";
const derive = promisify(scrypt),
  hash = (s) => createHash("sha256").update(s).digest("hex");
export function localApi(dir = process.env.VERCEL ? "/tmp/.tomato" : ".tomato") {
  mkdirSync(dir, { recursive: true });
  const sql = new DatabaseSync(dir + "/workspace.sqlite");
  sql.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,pw TEXT NOT NULL,admin INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);",
  );
  const drizzleDir = new URL("../drizzle", import.meta.url);
  for (const f of readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (sql.prepare("SELECT name FROM local_migrations WHERE name=?").get(f))
      continue;
    sql.exec("BEGIN");
    try {
      sql.exec(readFileSync(new URL("../drizzle/" + f, import.meta.url), "utf8"));
      sql.prepare("INSERT INTO local_migrations VALUES(?)").run(f);
      sql.exec("COMMIT");
    } catch (e) {
      sql.exec("ROLLBACK");
      throw e;
    }
  }
  const db = {
    prepare(query) {
      const stmt = sql.prepare(query);
      function bound(args) {
        return {
          bind: (...v) => bound(v),
          first: () => stmt.get(...args),
          all: () => ({ results: stmt.all(...args) }),
          run: () => ({ meta: stmt.run(...args) }),
        };
      }
      return bound([]);
    },
  };
  const attempts = new Map();
  const handler = async (req, res, next) => {
    if (!req.url?.startsWith("/api/")) return next();
    try {
      const url = new URL(req.url, "http://localhost"),
        cookie =
          (req.headers.cookie || "").match(
            /(?:^|;\s*)tomato_session=([a-f0-9]{64})(?:;|$)/,
          )?.[1] || "";
      const user = sql
        .prepare(
          "SELECT u.id,u.email,u.admin FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
        )
        .get(hash(cookie), Date.now());
      let response;
      if (
        req.method !== "GET" &&
        (!req.headers["content-type"]?.startsWith("application/json") ||
          req.headers["sec-fetch-site"] === "cross-site")
      )
        response = json({ error: "Same-origin JSON required." }, 403);
      let body = "";
      if (!response)
        for await (const c of req) {
          body += c;
          if (body.length > 24000) {
            response = json({ error: "Entry is too large." }, 413);
            break;
          }
        }
      if (
        !response &&
        url.pathname === "/api/logout" &&
        req.method === "POST"
      ) {
        sql.prepare("DELETE FROM sessions WHERE token=?").run(hash(cookie));
        res.setHeader(
          "Set-Cookie",
          "tomato_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
        );
        response = json({ ok: true });
      }
      if (
        !response &&
        ["/api/register", "/api/login"].includes(url.pathname) &&
        req.method === "POST"
      ) {
        const { email: raw, password } = JSON.parse(body),
          email = String(raw || "")
            .trim()
            .toLowerCase();
        if (
          !/^\S+@\S+\.\S+$/.test(email) ||
          email.length > 254 ||
          typeof password !== "string" ||
          password.length < 10 ||
          password.length > 200
        )
          response = json(
            {
              error: "Enter a valid email and a password of 10–200 characters.",
            },
            400,
          );
        else {
          const key = req.socket.remoteAddress;
          const now = Date.now();
          const errors = (attempts.get(key) || []).filter(
            (t) => now - t < 600000,
          );
          if (errors.length >= 25)
            response = json(
              { error: "Too many attempts. Try again in ten minutes." },
              429,
            );
          else {
            const existing = sql
                .prepare("SELECT * FROM users WHERE email=?")
                .get(email),
              register = url.pathname.endsWith("register");
            const salt = existing?.salt || randomBytes(16).toString("hex"),
              pw = await derive(password, salt, 64);
            let id;
            if (register && !existing) {
              id = crypto.randomUUID();
              sql
                .prepare(
                  "INSERT INTO users SELECT ?,?,?,?, CASE WHEN EXISTS(SELECT 1 FROM users) THEN 0 ELSE 1 END",
                )
                .run(id, email, salt, pw.toString("hex"));
            } else if (
              !register &&
              existing &&
              timingSafeEqual(pw, Buffer.from(existing.pw, "hex"))
            )
              id = existing.id;
            else {
              attempts.set(key, [...errors, now]);
              response = json(
                {
                  error: register
                    ? "An account with that email already exists."
                    : "Check your email and password.",
                },
                register ? 409 : 401,
              );
            }
            if (id) {
              attempts.delete(key);
              const token = randomBytes(32).toString("hex");
              sql
                .prepare("INSERT INTO sessions VALUES(?,?,?)")
                .run(hash(token), id, now + 604800000);
              res.setHeader(
                "Set-Cookie",
                "tomato_session=" +
                  token +
                  "; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800",
              );
              response = json({ ok: true });
            }
          }
        }
      }
      if (!response) {
        const request = new Request(url, {
          method: req.method,
          headers: req.headers,
          ...(req.method !== "GET" ? { body } : {}),
        });
        response = await api(
          request,
          db,
          user ? { ...user, name: user.email.split("@")[0] } : null,
          { local: true, admin: !!user?.admin },
        );
      }
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(await response.text());
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Could not process this request." }));
    }
  };
  handler.close = () => sql.close();
  return handler;
}
