import { blank, validate } from "../src/data/creators.js";
export const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
const error = (message, status) => json({ error: message }, status);
async function readBody(req) {
  const s = await req.text();
  if (s.length > 24000) throw Error("The entry is too long.");
  return JSON.parse(s);
}
async function load(db, owner) {
  const row = await db
    .prepare("SELECT version, document FROM workspaces WHERE owner = ?")
    .bind(owner)
    .first();
  return row
    ? { version: row.version, doc: JSON.parse(row.document) }
    : { version: 0, doc: blank() };
}
export async function api(
  req,
  db,
  user,
  { local = false, admin = false } = {},
) {
  const path = new URL(req.url).pathname,
    method = req.method;
  if (
    method !== "GET" &&
    (!req.headers.get("content-type")?.includes("application/json") ||
      req.headers.get("sec-fetch-site") === "cross-site")
  )
    return error("Same-origin JSON is required.", 403);
  if (path === "/api/session" && method === "GET")
    return json({
      user: user ? { name: user.name, email: user.email } : null,
      local,
      admin: !!user && admin,
    });
  if (path === "/api/pricing" && method === "GET") {
    try {
      const row = await db
        .prepare("SELECT revision,payload FROM pricing WHERE key='plans'")
        .first();
      return json(
        row
          ? { revision: row.revision, plans: JSON.parse(row.payload) }
          : { revision: 0, plans: [] },
      );
    } catch {
      return error("Pricing could not be loaded.", 503);
    }
  }
  if (!user) return error("Sign in to open your workspace.", 401);
  try {
    if (path === "/api/pricing" && method === "POST") {
      if (!admin) return error("Owner access is required.", 403);
      const { revision, plans } = await readBody(req);
      if (
        !Number.isSafeInteger(revision) ||
        !Array.isArray(plans) ||
        plans.length > 3
      )
        return error("Check the plan details.", 400);
      const clean = plans.map((p) => {
        if (
          typeof p.name !== "string" ||
          !p.name.trim() ||
          p.name.length > 80 ||
          typeof p.description !== "string" ||
          p.description.length > 400 ||
          typeof p.monthly !== "number" ||
          !Number.isFinite(p.monthly) ||
          p.monthly <= 0 ||
          p.monthly > 1e8
        )
          throw Error("Enter a name and monthly price for each plan.");
        return {
          name: p.name.trim(),
          description: p.description.trim(),
          monthly: Math.round(p.monthly * 100) / 100,
        };
      });
      const payload = JSON.stringify(clean);
      const write =
        revision === 0
          ? db
              .prepare(
                "INSERT INTO pricing(key,revision,payload) VALUES('plans',1,?) ON CONFLICT(key) DO NOTHING",
              )
              .bind(payload)
          : db
              .prepare(
                "UPDATE pricing SET revision=revision+1,payload=? WHERE key='plans' AND revision=?",
              )
              .bind(payload, revision);
      return (await write.run()).meta.changes === 1
        ? json({ plans: clean, revision: revision + 1 })
        : error("Prices changed in another tab. Reopen the editor.", 409);
    }
    if (path === "/api/workspace" && method === "GET")
      return json(await load(db, user.id));
    if (path === "/api/records" && method === "POST") {
      const { kind, record, version } = await readBody(req);
      if (
        !["accounts", "posts", "audiences", "tasks"].includes(kind) ||
        !record ||
        !Number.isSafeInteger(version)
      )
        return error("Invalid record.", 400);
      const state = await load(db, user.id);
      if (state.version !== version)
        return error(
          "This workspace changed in another tab. Review the refreshed data and save again.",
          409,
        );
      const old = record.id
        ? state.doc[kind].find((r) => r.id === record.id)
        : null;
      if (record.id && !old) return error("This record is unavailable.", 404);
      if (old && old.account !== record.account)
        return error("The record belongs to another profile.", 400);
      const clean = validate(kind, record, state.doc);
      const id = old?.id || crypto.randomUUID(),
        saved = { ...clean, id };
      if (old) state.doc[kind][state.doc[kind].indexOf(old)] = saved;
      else state.doc[kind].push(saved);
      const payload = JSON.stringify(state.doc);
      if (new TextEncoder().encode(payload).length > 1800000)
        return error("This workspace has reached its storage limit.", 413);
      const write =
        version === 0
          ? db
              .prepare(
                "INSERT INTO workspaces(owner,version,document) VALUES(?,1,?) ON CONFLICT(owner) DO NOTHING",
              )
              .bind(user.id, payload)
          : db
              .prepare(
                "UPDATE workspaces SET document=?,version=version+1 WHERE owner=? AND version=?",
              )
              .bind(payload, user.id, version);
      const result = await write.run();
      if (result.meta.changes !== 1)
        return error(
          "Another change was saved first. Review the refreshed workspace and retry.",
          409,
        );
      return json({ version: version + 1, doc: state.doc, id });
    }
    if (path === "/api/inquiries" && method === "POST") {
      const { id, name, email, message, slot } = await readBody(req);
      if (
        !/^[a-f0-9-]{36}$/.test(id) ||
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 100 ||
        typeof email !== "string" ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        email.length > 254 ||
        typeof message !== "string" ||
        !message.trim() ||
        message.length > 3000
      )
        return error("Enter a name, reply email and message.", 400);
      if (
        slot &&
        (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(slot) ||
          !(Date.parse(slot + ":00+05:30") > Date.now()))
      )
        return error("Choose a future time in India Standard Time.", 400);
      await db
        .prepare(
          "INSERT INTO inquiries (id,owner,name,email,message,requested_slot,created,status) VALUES(?,?,?,?,?,?,?,'Received') ON CONFLICT(id) DO NOTHING",
        )
        .bind(
          id,
          user.id,
          name.trim(),
          email.trim(),
          message.trim(),
          slot || null,
          new Date().toISOString(),
        )
        .run();
      const receipt = await db
        .prepare("SELECT id,status FROM inquiries WHERE id=? AND owner=?")
        .bind(id, user.id)
        .first();
      return receipt ? json(receipt, 201) : error("Try submitting again.", 409);
    }
    if (path === "/api/inquiries" && method === "GET") {
      const q = admin
        ? db.prepare("SELECT * FROM inquiries ORDER BY created DESC LIMIT 200")
        : db
            .prepare(
              "SELECT * FROM inquiries WHERE owner=? ORDER BY created DESC LIMIT 200",
            )
            .bind(user.id);
      const { results } = await q.all();
      return json(results.map(({ owner, ...row }) => row));
    }
    if (path === "/api/inquiries/status" && method === "POST") {
      if (!admin) return error("Owner access is required.", 403);
      const { id, status } = await readBody(req);
      if (!["Reviewed", "Confirmed", "Declined"].includes(status))
        return error("Choose a status.", 400);
      const row = await db
        .prepare("SELECT requested_slot FROM inquiries WHERE id=?")
        .bind(id)
        .first();
      if (!row) return error("Request unavailable.", 404);
      if (status === "Confirmed" && !row.requested_slot)
        return error("Only session requests can be confirmed.", 400);
      const update =
        status === "Confirmed"
          ? db
              .prepare(
                "UPDATE inquiries SET status=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM inquiries WHERE requested_slot=? AND status='Confirmed' AND id<>?)",
              )
              .bind(status, id, row.requested_slot, id)
          : db
              .prepare("UPDATE inquiries SET status=? WHERE id=?")
              .bind(status, id);
      const r = await update.run();
      return r.meta.changes === 1
        ? json({ saved: true })
        : error(
            "Another session has already been confirmed for that time.",
            409,
          );
    }
  } catch (e) {
    if (
      e instanceof SyntaxError ||
      e instanceof RangeError ||
      e.message.startsWith("Invalid URL")
    )
      return error("Check your entry and try again.", 400);
    if (
      /^(Choose |Check |Enter |Use |Complete |City |Average |A snapshot|Unknown |Counts |The entry)/.test(
        e.message,
      )
    )
      return error(e.message, 400);
    return error(
      "The database could not complete this request. Please retry.",
      503,
    );
  }
  return error("Route unavailable.", 404);
}
