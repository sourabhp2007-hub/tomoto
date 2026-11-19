import React from "react";
import { Panel } from "../components/Common";
import { useStudio } from "../Studio";
import { fmt } from "../data/creators";
export function PlanButton({ title }) {
  const { c, doc, save, toast } = useStudio(),
    [busy, setBusy] = React.useState(false),
    exists = doc.tasks.some((t) => t.account === c.id && t.title === title);
  async function add() {
    setBusy(true);
    try {
      await save("tasks", { account: c.id, title, done: false });
      toast("Added to your content plan");
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className="small-btn" onClick={add} disabled={exists || busy}>
      {exists ? "In your plan" : busy ? "Saving…" : "Use this idea"}
    </button>
  );
}
export default function Trends() {
  const { data: d } = useStudio();
  return (
    <Panel title="Trends in your content">
      <p className="muted">
        Ranked by views on your published posts. Growth compares the previous
        equal-length period. Match is the share of your posts using the trend.
      </p>
      <div className="trend-grid">
        {["Sound", "Hashtag", "Topic"].map((kind) => (
          <section className="trend-col" key={kind}>
            <h3>{kind === "Sound" ? "Audios & sounds" : kind + "s"}</h3>
            {d.trends.some((t) => t.kind === kind) ? (
              d.trends
                .filter((t) => t.kind === kind)
                .map((t) => (
                  <article key={t.name}>
                    <h4>{t.name}</h4>
                    <p>
                      {fmt(t.views)} views · {t.posts} posts
                    </p>
                    <small>
                      {t.growth == null
                        ? "No previous baseline"
                        : (t.growth >= 0 ? "+" : "") +
                          fmt(t.growth) +
                          "% view growth"}
                    </small>
                    <div className="score-label">
                      Trend match <b>{fmt(t.match)}%</b>
                    </div>
                    <div className="score-line">
                      <i style={{ width: t.match + "%" }} />
                    </div>
                    <PlanButton title={"Create a follow-up using " + t.name} />
                  </article>
                ))
            ) : (
              <p className="empty">
                Enter a {kind.toLowerCase()} on a post to track its performance.
              </p>
            )}
          </section>
        ))}
      </div>
    </Panel>
  );
}
