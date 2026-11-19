// Schema and analytical definitions shared by the editor, server and reports.
export const platforms = ["Instagram", "YouTube", "X"];
export const types = {
  Instagram: ["Reel", "Post"],
  YouTube: ["Video", "Short"],
  X: ["Thread", "Post"],
};
export const palette = ["#D1221F", "#F26A2B", "#EEB958", "#602121"];
export const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const ageLabels = ["18–24", "25–34", "35–44", "45+"];
export const genderLabels = ["Female", "Male", "Other / unspecified"];
export const blank = () => ({
  accounts: [],
  posts: [],
  audiences: [],
  tasks: [],
});
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const fmt = (n) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n);
export const shortDate = (s) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(s.slice(0, 10) + "T12:00:00Z"));
export const clock = (n) =>
  n == null
    ? "—"
    : Math.floor(n / 60) + ":" + String(Math.floor(n) % 60).padStart(2, "0");
export const dayOffset = (date, offset) =>
  new Date(Date.parse(date + "T12:00:00Z") + offset * 86400000)
    .toISOString()
    .slice(0, 10);
const total = (rows, key) => rows.reduce((v, r) => v + (r[key] ?? 0), 0);
export const rate = (n, den) => (den ? (100 * n) / den : null);
export const eng = (p) => p.likes + p.comments + p.shares;
export const compare = (now, prior) =>
  now == null || !prior ? null : (100 * (now - prior)) / prior;
function cleanText(v, max, required = false) {
  if (typeof v !== "string" || v.length > max || (required && !v.trim()))
    throw Error("Check the required text and length.");
  return v.trim();
}
function num(v, max = 1e12, optional = false) {
  if (optional && (v === null || v === "")) return null;
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max)
    throw Error("Enter a valid non-negative number.");
  return v;
}
function count(v, optional = false) {
  const n = num(v, 1e12, optional);
  if (n !== null && !Number.isInteger(n))
    throw Error("Counts must be whole numbers.");
  return n;
}
function date(v) {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    v < "2000-01-01" ||
    v > today() ||
    dayOffset(v, 0) !== v
  )
    throw Error("Choose a valid date up to today.");
  return v;
}
function pick(v, choices) {
  if (!choices.includes(v)) throw Error("Choose one of the listed options.");
  return v;
}
function url(v) {
  if (!v) return "";
  const u = new URL(v);
  if (u.protocol !== "https:" || u.username || u.password || v.length > 1500)
    throw Error("Enter a secure HTTPS link.");
  return u.href;
}
function splitLines(v) {
  return cleanText(v || "", 3600)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
export function breakdown(v, online = false) {
  const seen = new Set();
  return splitLines(v).map((line) => {
    const [name, extra, ...more] = line.split("=").map((x) => x.trim());
    const n = Number(extra);
    if (
      !name ||
      !extra ||
      more.length ||
      !Number.isFinite(n) ||
      n < 0 ||
      n > 100 ||
      seen.has(name.toLowerCase()) ||
      (online && !/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) ([01]\d|2[0-3])$/.test(name))
    )
      throw Error(
        online
          ? "Use one unique slot per line, e.g. Sat 19=80."
          : "Use one unique city per line, e.g. Pune=40.",
      );
    seen.add(name.toLowerCase());
    return { name, value: n };
  });
}
export function retentionPoints(value, duration) {
  const rows = splitLines(value)
    .map((line) => {
      const [sec, pct, ...rest] = line.split("=").map((x) => x.trim());
      const seconds = Number(sec),
        remaining = Number(pct);
      if (
        !sec ||
        !pct ||
        rest.length ||
        !Number.isFinite(seconds) ||
        seconds < 0 ||
        !Number.isFinite(remaining) ||
        remaining < 0 ||
        remaining > 100 ||
        !duration ||
        seconds > duration
      )
        throw Error(
          "Enter retention as seconds=percent within the video duration.",
        );
      return { seconds, remaining, label: clock(seconds) };
    })
    .sort((a, b) => a.seconds - b.seconds);
  if (rows.some((r, i) => i && r.seconds === rows[i - 1].seconds))
    throw Error("Enter one retention measurement per time.");
  return rows;
}
function shares(list, length) {
  if (!Array.isArray(list) || list.length !== length)
    throw Error("Check the audience breakdown.");
  const result = list.map((v) => num(v, 100, true));
  if (
    result.some((v) => v !== null) &&
    (result.some((v) => v === null) ||
      Math.abs(
        total(
          result.map((value) => ({ value })),
          "value",
        ) - 100,
      ) > 0.12)
  )
    throw Error(
      "Complete the breakdown so the percentages add up to 100, or leave it blank.",
    );
  return result;
}
export function validate(kind, raw, doc) {
  if (kind === "accounts")
    return {
      name: cleanText(raw.name, 80, true),
      handle: cleanText(raw.handle || "", 80),
      niche: cleanText(raw.niche || "", 100),
      city: cleanText(raw.city || "", 80),
    };
  if (!doc.accounts.some((c) => c.id === raw.account))
    throw Error("Choose a saved creator profile.");
  const account = raw.account;
  if (kind === "tasks")
    return {
      account,
      title: cleanText(raw.title, 220, true),
      done: !!raw.done,
    };
  const platform = pick(raw.platform, platforms),
    d = date(raw.date);
  if (kind === "posts") {
    const t = cleanText(raw.time || "", 5);
    if (t && !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))
      throw Error("Choose a valid posting time.");
    const duration = num(raw.duration, 86400, true),
      watch = num(raw.watch, 86400, true);
    if (
      watch != null &&
      (duration == null || duration <= 0 || watch > duration)
    )
      throw Error(
        "Average watch time needs a duration at least as long as the average.",
      );
    const reach = count(raw.reach, true);
    retentionPoints(raw.curve, duration);
    return {
      account,
      platform,
      date: d,
      time: t,
      title: cleanText(raw.title, 140, true),
      type: pick(raw.type, types[platform]),
      views: count(raw.views),
      likes: count(raw.likes),
      comments: count(raw.comments),
      shares: count(raw.shares),
      reach,
      watch,
      duration,
      curve: cleanText(raw.curve || "", 3600),
      url: url(raw.url),
      caption: cleanText(raw.caption || "", 1800),
      tags: cleanText(raw.tags || "", 400),
      sound: cleanText(raw.sound || "", 120),
      topic: cleanText(raw.topic || "", 120),
    };
  }
  if (kind !== "audiences") throw Error("Unknown record type.");
  if (
    doc.audiences.some(
      (r) =>
        r.id !== raw.id &&
        r.account === account &&
        r.platform === platform &&
        r.date === d,
    )
  )
    throw Error(
      "A snapshot already exists for this platform and date. Edit the saved snapshot.",
    );
  const cities = breakdown(raw.cities);
  if (total(cities, "value") > 100.1)
    throw Error("City percentages cannot exceed 100.");
  breakdown(raw.online, true);
  return {
    account,
    platform,
    date: d,
    followers: count(raw.followers),
    ages: shares(raw.ages, 4),
    gender: shares(raw.gender, 3),
    cities: raw.cities || "",
    online: raw.online || "",
    interests: cleanText(raw.interests || "", 350),
  };
}
function totals(rows) {
  return {
    views: total(rows, "views"),
    reach:
      rows.length && rows.every((p) => p.reach != null)
        ? total(rows, "reach")
        : null,
    engagement: rate(
      rows.reduce((n, p) => n + eng(p), 0),
      total(rows, "views"),
    ),
  };
}
function latest(audiences, end) {
  return platforms
    .map(
      (platform) =>
        audiences
          .filter((r) => r.platform === platform && r.date <= end)
          .sort((a, b) => b.date.localeCompare(a.date))[0],
    )
    .filter(Boolean);
}
function mix(rows, get) {
  const valid = rows
    .map((r) => ({ weight: r.followers, items: get(r) }))
    .filter((x) => x.weight > 0 && x.items.length);
  const denom = total(valid, "weight");
  const map = new Map();
  for (const { weight, items } of valid)
    for (const { name, value } of items)
      map.set(name, (map.get(name) || 0) + weight * value);
  return [...map].map(([name, n]) => ({
    name,
    value: Math.round((n / denom) * 10) / 10,
  }));
}
export function analyze(
  doc,
  account,
  platform = "All",
  days = 30,
  end = today(),
) {
  const start = dayOffset(end, 1 - days),
    prevStart = dayOffset(start, -days),
    priorEnd = dayOffset(start, -1);
  const matches = (r) =>
    r.account === account && (platform === "All" || r.platform === platform);
  const all = doc.posts.filter(matches),
    period = (a, b) =>
      all
        .filter((p) => p.date >= a && p.date <= b)
        .sort((x, y) => y.views - x.views || y.date.localeCompare(x.date));
  const posts = period(start, end),
    prior = period(prevStart, priorEnd),
    aud = doc.audiences.filter(matches),
    snapshots = latest(aud, end),
    old = latest(aud, priorEnd);
  const current = totals(posts),
    previous = totals(prior);
  current.followers = snapshots.length ? total(snapshots, "followers") : null;
  previous.followers =
    old.length && old.length === snapshots.length
      ? total(old, "followers")
      : null;
  const series = Array.from({ length: days }, (_, i) => {
    const date = dayOffset(start, i),
      rows = posts.filter((p) => p.date === date);
    return {
      date,
      label: shortDate(date),
      views: total(rows, "views"),
      posts: rows.length,
    };
  });
  const groups = (rows) => {
    const m = new Map();
    for (const p of rows) {
      for (const [kind, strings] of [
        ["Hashtag", p.tags.split(/[\s,]+/).map((t) => t.replace(/^#+/, ""))],
        ["Sound", [p.sound]],
        ["Topic", [p.topic]],
      ]) {
        for (const v of new Set(
          strings.map((v) => v.trim().toLowerCase()).filter(Boolean),
        )) {
          const key = kind + "/" + v,
            row = m.get(key) || {
              name: (kind === "Hashtag" ? "#" : "") + v,
              kind,
              views: 0,
              posts: 0,
              interactions: 0,
            };
          row.posts++;
          row.views += p.views;
          row.interactions += eng(p);
          m.set(key, row);
        }
      }
    }
    return m;
  };
  const priorTrends = groups(prior);
  const trends = [...groups(posts)]
    .map(([key, t]) => ({
      ...t,
      growth: compare(t.views, priorTrends.get(key)?.views),
      match: rate(t.posts, posts.length),
    }))
    .sort((a, b) => b.views - a.views);
  const times = new Map();
  for (const p of posts.filter((p) => p.time && p.views > 0)) {
    const dow = weekdays[new Date(p.date + "T12:00:00Z").getUTCDay()],
      hour = p.time.slice(0, 2),
      key = p.platform + " " + dow + " " + hour;
    const t = times.get(key) || {
      platform: p.platform,
      dow,
      hour,
      n: 0,
      views: 0,
      actions: 0,
    };
    t.n++;
    t.views += p.views;
    t.actions += eng(p);
    times.set(key, t);
  }
  const slots = [...times.values()]
    .map((t) => ({ ...t, rate: rate(t.actions, t.views) }))
    .sort((a, b) => b.rate - a.rate || b.n - a.n);
  const weekly = new Map();
  for (const p of posts.filter(
    (p) => p.duration > 0 && p.watch !== null && p.views > 0,
  )) {
    const start = dayOffset(
      p.date,
      -((new Date(p.date + "T12:00:00Z").getUTCDay() + 6) % 7),
    );
    const r = weekly.get(start) || { start, num: 0, den: 0 };
    r.num += p.watch * p.views;
    r.den += p.duration * p.views;
    weekly.set(start, r);
  }
  return {
    start,
    end,
    posts,
    prior,
    current,
    previous,
    series,
    snapshots,
    trends,
    slots,
    comparison: platforms
      .filter((p) => platform === "All" || p === platform)
      .map((name) => ({
        name,
        views: total(
          posts.filter((p) => p.platform === name),
          "views",
        ),
        previous: total(
          prior.filter((p) => p.platform === name),
          "views",
        ),
      })),
    ages: mix(snapshots, (r) =>
      r.ages[0] == null
        ? []
        : ageLabels.map((name, i) => ({ name, value: r.ages[i] })),
    ),
    gender: mix(snapshots, (r) =>
      r.gender[0] == null
        ? []
        : genderLabels.map((name, i) => ({ name, value: r.gender[i] })),
    ),
    cities: mix(snapshots, (r) => breakdown(r.cities))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    online: mix(snapshots, (r) => breakdown(r.online, true)),
    interests: [
      ...new Set(
        snapshots.flatMap((r) =>
          r.interests
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      ),
    ],
    retention: [...weekly.values()]
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((r) => ({
        label: shortDate(r.start),
        retention: rate(r.num, r.den),
      })),
  };
}
export const comparison = [
  [
    "Tomato Stats",
    "Creator workspace",
    "Track your posts and plan changes using your own metrics.",
  ],
  [
    "Hootsuite",
    "Social media management",
    "Plan publishing around recommended posting times.",
  ],
  [
    "SocialPilot",
    "Publishing and reporting",
    "Schedule posts and review account performance.",
  ],
  [
    "Social Blade",
    "Public creator statistics",
    "Compare public channel growth over time.",
  ],
  [
    "YouTube Analytics",
    "YouTube channel analysis",
    "Inspect the moments where viewers stop watching.",
  ],
];
