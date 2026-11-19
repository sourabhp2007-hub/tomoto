import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Eye, Heart, Users, Radio, Plus, Lightbulb } from "lucide-react";
import { Panel, Change, Lines, Bars, Donut } from "../components/Common";
import { Thumb } from "../components/Brand";
import { useStudio } from "../Studio";
import { fmt, compare } from "../data/creators";
export const metricLabels = {
  views: "Views",
  engagement: "Engagement",
  followers: "Followers",
  reach: "Reach",
};
export const showMetric = (k, n) =>
  n == null ? "—" : k === "engagement" ? n.toFixed(1) + "%" : fmt(n);
export default function Overview() {
  const { data: d } = useStudio(),
    { open } = useOutletContext();
  return (
    <>
      <div className="edit-actions">
        <button className="btn red" onClick={() => open("posts")}>
          <Plus size={16} />
          Add post
        </button>
        <button className="small-btn" onClick={() => open("audiences")}>
          Add audience snapshot
        </button>
      </div>
      <div className="kpi-grid">
        {Object.entries(metricLabels).map(([k, label], i) => {
          const Icon = [Eye, Heart, Users, Radio][i],
            growth = compare(d.current[k], d.previous[k]);
          return (
            <article className="kpi" key={k}>
              <div>
                {label}
                <Icon size={18} />
              </div>
              <strong>{showMetric(k, d.current[k])}</strong>
              <footer>
                {growth != null ? (
                  <>
                    <Change v={growth} />
                    <small>vs prior period</small>
                  </>
                ) : (
                  <small>
                    {k === "followers"
                      ? "Latest recorded snapshot"
                      : k === "reach" && d.current.reach === null
                        ? "Add reach for each post"
                        : "No prior comparison"}
                  </small>
                )}
              </footer>
            </article>
          );
        })}
      </div>
      <div className="overview-charts">
        <Panel title="Performance trend">
          <p className="muted">Views on posts grouped by publication date</p>
          {d.posts.length ? (
            <Lines data={d.series} a="views" aName="Views" area />
          ) : (
            <p className="empty">
              Add a post published in this period to plot its views.
            </p>
          )}
        </Panel>
        <Panel title="Platform comparison">
          {d.posts.length || d.prior.length ? (
            <Bars data={d.comparison} />
          ) : (
            <p className="empty">
              Your recorded views will appear by platform.
            </p>
          )}
        </Panel>
      </div>
      <div className="snapshot-row">
        <Panel title="Audience snapshot">
          {d.ages.length ? (
            <Donut items={d.ages} />
          ) : (
            <p className="empty">
              Enter an age breakdown in an audience snapshot.
            </p>
          )}
        </Panel>
        <section className="tip-banner">
          <Lightbulb />
          <p className="eyebrow">TODAY’S TOP TIP</p>
          <h2>
            {d.posts.length
              ? "Review “" +
                d.posts[0].title +
                "”. It leads this period with " +
                fmt(d.posts[0].views) +
                " views."
              : "Add your first post with its views, likes, comments and shares."}
          </h2>
          <Link to="/app/recommendations">View recommendations</Link>
        </section>
      </div>
      <Panel
        title="Top performing content"
        extra={
          <Link className="text-link" to="/app/content">
            View content
          </Link>
        }
      >
        {d.posts.length ? (
          <div className="post-grid">
            {d.posts.slice(0, 4).map((p) => (
              <button
                key={p.id}
                className="post-card"
                onClick={() => open("posts", p)}
              >
                <Thumb post={p} large />
                <div className="badge">{p.platform}</div>
                <h3>{p.title}</h3>
                <small>{fmt(p.views)} views</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty">
            Posts appear here once you record their performance.
          </p>
        )}
      </Panel>
    </>
  );
}
