import React, { useState } from "react";
import { Dialog } from "./Common";
import { useStudio } from "../Studio";
import {
  platforms,
  types,
  today,
  ageLabels,
  genderLabels,
  validate,
} from "../data/creators";
const newRecord = (kind, account, platform) =>
  kind === "accounts"
    ? { name: "", handle: "", niche: "", city: "" }
    : kind === "posts"
      ? {
          account,
          platform,
          date: today(),
          time: "",
          title: "",
          type: types[platform][0],
          views: "",
          reach: "",
          likes: "",
          comments: "",
          shares: "",
          watch: "",
          duration: "",
          tags: "",
          topic: "",
          sound: "",
          caption: "",
          url: "",
        }
      : {
          account,
          platform,
          date: today(),
          followers: "",
          ages: Array(4).fill(""),
          gender: Array(3).fill(""),
          cities: "",
          online: "",
          interests: "",
        };
export function Editor({ kind, record, onClose }) {
  const { c, doc, platform, select, save, toast } = useStudio(),
    [v, set] = useState(
      () =>
        record ||
        newRecord(kind, c?.id, platform === "All" ? "Instagram" : platform),
    ),
    [error, fail] = useState(""),
    [busy, setBusy] = useState(false);
  const update = (k, val) =>
    set((prev) => ({
      ...prev,
      [k]: val,
      ...(kind === "posts" && k === "platform" ? { type: types[val][0] } : {}),
    }));
  const field = (k, label, opts = {}) => (
    <label key={k}>
      {label}
      <input
        value={v[k] ?? ""}
        required={opts.required}
        type={opts.type || "text"}
        min={opts.type === "number" ? 0 : undefined}
        max={opts.type === "date" ? today() : undefined}
        step={opts.step || undefined}
        maxLength={opts.maxLength || undefined}
        onChange={(e) => update(k, e.target.value)}
      />
    </label>
  );
  const area = (k, label, hint) => (
    <label>
      {label}
      <textarea
        value={v[k] || ""}
        rows={2}
        onChange={(e) => update(k, e.target.value)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
  const percentFields = (k, labels) => (
    <div>
      <h4>
        {k === "ages" ? "Age breakdown" : "Gender breakdown"} <small>(%)</small>
      </h4>
      <div className="pct-fields">
        {labels.map((l, i) => (
          <label key={l}>
            {l}
            <input
              type="number"
              min="0"
              max="100"
              step=".1"
              value={v[k][i] ?? ""}
              onChange={(e) =>
                update(
                  k,
                  v[k].map((x, j) => (j === i ? e.target.value : x)),
                )
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    fail("");
    try {
      const form = { ...v };
      const nums =
        kind === "posts"
          ? [
              "views",
              "reach",
              "likes",
              "comments",
              "shares",
              "duration",
              "watch",
            ]
          : kind === "audiences"
            ? ["followers"]
            : [];
      for (const k of nums)
        form[k] = form[k] === "" || form[k] == null ? null : Number(form[k]);
      if (kind === "audiences")
        for (const k of ["ages", "gender"])
          form[k] = form[k].map((x) =>
            x === "" || x == null ? null : Number(x),
          );
      const clean = validate(kind, form, doc);
      const id = await save(kind, { ...clean, ...(v.id ? { id: v.id } : {}) });
      if (kind === "accounts") select(id);
      toast("Saved to your workspace");
      onClose();
    } catch (e) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  }
  const name = {
    accounts: "creator profile",
    posts: "post",
    audiences: "audience snapshot",
  }[kind];
  return (
    <Dialog title={(record ? "Edit " : "Add ") + name} onClose={onClose}>
      <form className="data-form" onSubmit={submit}>
        {kind === "accounts" ? (
          <>
            {field("name", "Creator or brand name", {
              required: true,
              maxLength: 80,
            })}
            {field("handle", "Social handle", { maxLength: 80 })}
            <div className="form-pair">
              {field("niche", "Niche")}
              {field("city", "City")}
            </div>
          </>
        ) : (
          <>
            <div className="form-pair">
              <label>
                Platform
                <select
                  value={v.platform}
                  onChange={(e) => update("platform", e.target.value)}
                >
                  {platforms.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              {field(
                "date",
                kind === "posts" ? "Publication date" : "Snapshot date",
                { type: "date", required: true },
              )}
            </div>
            {kind === "posts" ? (
              <>
                {field("title", "Post title", {
                  required: true,
                  maxLength: 140,
                })}
                <div className="form-pair">
                  <label>
                    Format
                    <select
                      value={v.type}
                      onChange={(e) => update("type", e.target.value)}
                    >
                      {types[v.platform].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  {field("time", "Posting time (IST)", { type: "time" })}
                </div>
                <p className="muted">
                  Enter the totals shown in your platform insights. Enter 0 for
                  a measured zero.
                </p>
                <div className="form-pair">
                  {[
                    ["views", "Views"],
                    ["likes", "Likes"],
                    ["comments", "Comments"],
                    ["shares", "Shares"],
                    ["reach", "Reach (optional)"],
                  ].map(([k, l]) =>
                    field(k, l, { type: "number", required: k !== "reach" }),
                  )}
                </div>
                <details open={!!record?.watch || undefined}>
                  <summary>Watch time, caption and discovery</summary>
                  <div className="form-pair">
                    {field("duration", "Duration (seconds)", {
                      type: "number",
                      step: ".1",
                    })}
                    {field("watch", "Average watch (seconds)", {
                      type: "number",
                      step: ".1",
                    })}
                  </div>
                  {area(
                    "curve",
                    "Viewer retention measurements",
                    "Enter seconds=percentage on each line, e.g. 4=62. Add the video duration above.",
                  )}
                  {field("url", "Original post URL", { type: "url" })}
                  {field("tags", "Hashtags")}
                  {field("sound", "Audio or sound")}
                  {field("topic", "Topic")}
                  {area("caption", "Caption")}
                </details>
              </>
            ) : (
              <>
                {field("followers", "Followers or subscribers", {
                  type: "number",
                  required: true,
                })}
                <p className="muted">
                  Optional breakdowns come from your platform’s audience
                  insights.
                </p>
                {percentFields("ages", ageLabels)}
                {percentFields("gender", genderLabels)}
                {area(
                  "cities",
                  "City percentages",
                  "One city per line, e.g. Pune=40.",
                )}
                {area(
                  "online",
                  "Hourly activity (%)",
                  "One measured slot per line, e.g. Sat 19=80. Use IST and a 24-hour clock.",
                )}
                {field("interests", "Audience interests (comma-separated)")}
              </>
            )}
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy} className="btn red">
          {busy ? "Saving…" : "Save " + name}
        </button>
      </form>
    </Dialog>
  );
}
