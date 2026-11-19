import React, { useState } from "react";
import { Panel, Lines, Dialog } from "../components/Common";
import { useStudio } from "../Studio";
import { fmt, weekdays, eng, rate } from "../data/creators";
import { RequestForm } from "../components/Requests";
import { PlanButton } from "./Trends";
export function insights(d) {
  const results = [];
  if (d.posts.length) {
    const questions = d.posts.filter(
      (p) => p.caption && !/[?？]/.test(p.caption),
    ).length;
    const timeMissing = d.posts.filter((p) => !p.time).length,
      watchMissing = d.posts.filter(
        (p) => ["Reel", "Short", "Video"].includes(p.type) && p.watch == null,
      ).length;
    if (questions)
      results.push({
        why: questions + " recorded captions have no question.",
        action: "Test a direct question in your next caption",
      });
    if (timeMissing)
      results.push({
        why: timeMissing + " posts have no publication time.",
        action: "Record the posting time for your next post",
      });
    if (watchMissing)
      results.push({
        why: watchMissing + " videos lack average watch time.",
        action: "Record average watch time to compare video retention",
      });
    if (d.posts.length > 1) {
      const ranked = d.posts
        .filter((p) => p.views > 0)
        .sort((a, b) => eng(b) / b.views - eng(a) / a.views);
      if (ranked.length)
        results.push({
          why:
            "“" +
            ranked[0].title +
            "” earned " +
            fmt(rate(eng(ranked[0]), ranked[0].views)) +
            "% engagement.",
          action: "Reuse the format of “" + ranked[0].title + "”",
        });
    }
    if (!results.length)
      results.push({
        why: "There are " + d.posts.length + " measured posts in this period.",
        action: "Test a second hook and compare engagement",
      });
  }
  return results;
}
export default function Recommendations() {
  const { c, doc, data: d, save, toast } = useStudio(),
    [booking, setBooking] = useState(false),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false);
  const tasks = doc.tasks.filter((t) => t.account === c.id),
    complete = tasks.filter((t) => t.done).length,
    advice = insights(d);
  async function addTask(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await save("tasks", { account: c.id, title: draft, done: false });
      setDraft("");
      toast("Added to your content plan");
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(t) {
    setBusy(true);
    try {
      await save("tasks", { ...t, done: !t.done });
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Panel title="Best time to post">
        <p className="muted">
          Observed engagement by publication time, in IST. Each slot shows the
          number of posts behind it.
        </p>
        {d.slots.length ? (
          <>
            <div className="slot-grid">
              {d.slots
                .filter(
                  (s, i, a) =>
                    a.findIndex((x) => x.platform === s.platform) === i,
                )
                .map((s) => (
                  <article key={s.platform}>
                    <small>{s.platform}</small>
                    <h3>
                      {s.dow} · {s.hour}:00
                    </h3>
                    <p>
                      {fmt(s.rate)}% engagement · {s.n} posts
                    </p>
                  </article>
                ))}
            </div>
            <div className="week-cal">
              {weekdays.map((day) => (
                <div key={day}>
                  <b>{day}</b>
                  {d.slots
                    .filter((s) => s.dow === day)
                    .slice(0, 3)
                    .map((s) => (
                      <span key={s.hour + s.platform}>
                        {s.platform} {s.hour}:00
                      </span>
                    ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="empty">
            Record a post with its time, views and interactions to compare
            posting slots.
          </p>
        )}
      </Panel>
      <Panel title="What is lacking">
        <div className="flag-grid">
          {advice.length ? (
            advice.map((a) => (
              <article key={a.action}>
                <p>{a.why}</p>
                <h3>{a.action}</h3>
                <PlanButton title={a.action} />
              </article>
            ))
          ) : (
            <p className="empty">
              Record post metrics to get a recommendation grounded in your
              results.
            </p>
          )}
        </div>
      </Panel>
      <Panel title="Retention over time">
        <p className="muted">
          Weekly average of watch time as a share of duration, weighted by
          recorded viewing time available.
        </p>
        {d.retention.length > 1 ? (
          <Lines data={d.retention} a="retention" percent aName="Retention" />
        ) : d.retention.length ? (
          <p className="note">
            Week of {d.retention[0].label} · {fmt(d.retention[0].retention)}%
            retention. Add a video from another week to compare.
          </p>
        ) : (
          <p className="empty">
            Enter a video’s duration and average watch time to measure
            retention.
          </p>
        )}
      </Panel>
      <Panel title="Content ideas for next week">
        <div className="ideas">
          {d.posts.slice(0, 5).map((p) => (
            <div key={p.id}>
              <span className="badge">{p.type}</span>
              <strong>Follow up on “{p.title}”</strong>
              <PlanButton title={"Follow up on “" + p.title + "”"} />
            </div>
          ))}
          {!d.posts.length && (
            <p className="empty">
              Your top posts will supply starting points for next week’s ideas.
            </p>
          )}
        </div>
      </Panel>
      <Panel
        title="Your content plan"
        extra={
          <span className="badge">
            {complete}/{tasks.length} complete
          </span>
        }
      >
        <progress
          aria-label="Plan progress"
          value={complete}
          max={tasks.length || 1}
        />
        <div className="ideas">
          {tasks.map((t) => (
            <div key={t.id}>
              <strong>{t.title}</strong>
              <button
                disabled={busy}
                className={"small-btn " + (t.done ? "success" : "")}
                onClick={() => toggle(t)}
              >
                {t.done ? "Completed · reopen" : "Mark as done"}
              </button>
            </div>
          ))}
        </div>
        <form className="plan-form" onSubmit={addTask}>
          <label>
            Your next action
            <input
              required
              maxLength="220"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button className="small-btn" disabled={busy}>
            Add action
          </button>
        </form>
      </Panel>
      <div className="strategy">
        <h2>Want us to do this for you?</h2>
        <button className="btn white" onClick={() => setBooking(true)}>
          Talk to a growth strategist
        </button>
      </div>
      {booking && (
        <Dialog
          title="Request a strategy session"
          onClose={() => setBooking(false)}
        >
          <RequestForm booking />
        </Dialog>
      )}
    </>
  );
}
