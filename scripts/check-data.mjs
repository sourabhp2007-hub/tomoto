import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { api } from "../server/api.js";
import {
  analyze,
  blank,
  today,
  dayOffset,
  validate,
} from "../src/data/creators.js";
const end = today(),
  account = "test",
  post = {
    account,
    platform: "Instagram",
    date: end,
    time: "19:00",
    title: "Test post",
    type: "Reel",
    views: 1000,
    likes: 70,
    comments: 20,
    shares: 10,
    reach: 600,
    watch: 10,
    duration: 20,
    tags: "#test",
    topic: "Food",
    sound: "",
    caption: "",
    url: "",
  };
const snap = {
  account,
  platform: "Instagram",
  date: end,
  followers: 500,
  ages: [40, 30, 20, 10],
  gender: [50, 45, 5],
  cities: "Pune=80",
  online: "Sat 19=90",
  interests: "Food",
};
test("empty input and range-based aggregation", () => {
  const doc = blank();
  doc.accounts.push({ id: account, name: "Test" });
  assert.equal(analyze(doc, account).current.followers, null);
  doc.posts = [
    { ...post, id: "p1" },
    {
      ...post,
      date: dayOffset(end, -10),
      views: 400,
      platform: "YouTube",
      id: "p2",
    },
    { ...post, date: dayOffset(end, -32), views: 200, id: "p3" },
  ];
  doc.audiences = [
    snap,
    { ...snap, date: dayOffset(end, -35), followers: 400 },
  ];
  const all = analyze(doc, account, "All", 30, end);
  assert.equal(all.current.views, 1400);
  assert.equal(all.previous.views, 200);
  assert.equal(all.current.followers, 500);
  assert.equal(all.previous.followers, 400);
  assert.equal(
    all.series.reduce((n, r) => n + r.views, 0),
    1400,
  );
  assert.equal(all.ages.length, 4);
  assert.equal(all.retention[0].retention, 50);
  assert.equal(
    analyze(doc, account, "Instagram", 7, end).current.engagement,
    10,
  );
  assert.equal(analyze(doc, account, "X").posts.length, 0);
  assert.throws(() => validate("audiences", { ...snap, followers: -1 }, doc));
  assert.throws(() => validate("posts", { ...post, watch: 25 }, doc));
  assert.throws(() =>
    validate("posts", { ...post, url: "javascript:alert(1)" }, doc),
  );
});
test("database writes, user isolation, conflicts, inquiries and booking status", async () => {
  const sql = new DatabaseSync(":memory:");
  for (const f of readdirSync("drizzle").filter((f) => f.endsWith(".sql")))
    sql.exec(readFileSync("drizzle/" + f, "utf8"));
  const db = {
    prepare(s) {
      const stmt = sql.prepare(s);
      const make = (a) => ({
        bind: (...a) => make(a),
        first: () => stmt.get(...a),
        all: () => ({ results: stmt.all(...a) }),
        run: () => ({ meta: stmt.run(...a) }),
      });
      return make([]);
    },
  };
  const user = { id: "one", email: "one@example.test", name: "One" },
    other = { ...user, id: "two" };
  const run = (route, body, u = user, admin = false) =>
    api(
      new Request("https://test.local/api/" + route, {
        method: body ? "POST" : "GET",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }),
      db,
      u,
      { admin },
    );
  assert.equal((await run("workspace", null, null)).status, 401);
  const first = await (
    await run("records", {
      version: 0,
      kind: "accounts",
      record: { name: "First" },
    })
  ).json();
  assert.equal(first.version, 1);
  assert.equal(
    (
      await run("records", {
        version: 0,
        kind: "accounts",
        record: { name: "Stale" },
      })
    ).status,
    409,
  );
  assert.equal(
    (await (await run("workspace", null, other)).json()).doc.accounts.length,
    0,
  );
  const p = await (
    await run("records", {
      version: 1,
      kind: "posts",
      record: { ...post, account: first.id },
    })
  ).json();
  assert.equal(p.doc.posts[0].views, 1000);
  const updated = await (
    await run("records", {
      version: 2,
      kind: "posts",
      record: { ...p.doc.posts[0], views: 2000 },
    })
  ).json();
  assert.equal(updated.doc.posts.length, 1);
  assert.equal(updated.doc.posts[0].views, 2000);
  const id = crypto.randomUUID();
  const request = {
    id,
    name: "One",
    email: user.email,
    message: "Review content",
    slot: dayOffset(end, 2) + "T15:00",
  };
  assert.equal((await run("inquiries", request)).status, 201);
  assert.equal((await run("inquiries", request)).status, 201);
  assert.equal((await (await run("inquiries")).json()).length, 1);
  assert.equal((await (await run("inquiries", null, other)).json()).length, 0);
  assert.equal(
    (await run("inquiries/status", { id, status: "Confirmed" }, other)).status,
    403,
  );
  assert.equal(
    (await run("inquiries/status", { id, status: "Confirmed" }, other, true))
      .status,
    200,
  );
  const another = { ...request, id: crypto.randomUUID() };
  await run("inquiries", another, other);
  assert.equal(
    (
      await run(
        "inquiries/status",
        { id: another.id, status: "Confirmed" },
        other,
        true,
      )
    ).status,
    409,
  );
  sql.close();
});
test("local registration, session recovery, reload, logout and sign-in", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs"),
    { tmpdir } = await import("node:os"),
    { join } = await import("node:path"),
    { randomBytes } = await import("node:crypto"),
    { Readable } = await import("node:stream");
  const { localApi } = await import("../server/local.js");
  const dir = mkdtempSync(join(tmpdir(), "tomato-test-"));
  let serve = localApi(dir);
  const credentials = {
    email: "qa@example.test",
    password: randomBytes(28).toString("hex"),
  };
  let cookie = "";
  async function send(path, body) {
    const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
    Object.assign(req, {
      url: "/api/" + path,
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", cookie },
      socket: { remoteAddress: "127.0.0.1" },
    });
    let output;
    const res = {
      statusCode: 200,
      setHeader(k, v) {
        if (k.toLowerCase() === "set-cookie") cookie = v.split(";")[0];
      },
      end(txt) {
        output = JSON.parse(txt);
      },
    };
    await serve(req, res, () => assert.fail("unhandled route"));
    return [res.statusCode, output];
  }
  try {
    assert.equal((await send("register", credentials))[0], 200);
    assert.equal((await send("session"))[1].user.email, credentials.email);
    const [status, saved] = await send("records", {
      kind: "accounts",
      version: 0,
      record: { name: "Persistence check" },
    });
    assert.equal(status, 200);
    const stored = await send("records", {
      kind: "posts",
      version: 1,
      record: { ...post, account: saved.id },
    });
    assert.equal(stored[0], 200);
    serve = localApi(dir);
    assert.equal((await send("workspace"))[1].doc.posts[0].views, 1000);
    const [s, prices] = await send("pricing", {
      plans: [
        { name: "Strategy", description: "Monthly review", monthly: 2200 },
      ],
      revision: 0,
    });
    assert.equal(s, 200);
    assert.equal(prices.revision, 1);
    assert.equal((await send("logout", {}))[0], 200);
    assert.equal((await send("workspace"))[0], 401);
    assert.equal((await send("pricing"))[1].plans[0].monthly, 2200);
    assert.equal(
      (
        await send("login", {
          ...credentials,
          password: credentials.password + "x",
        })
      )[0],
      401,
    );
    assert.equal((await send("login", credentials))[0], 200);
    assert.equal((await send("workspace"))[1].doc.accounts.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
