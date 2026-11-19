import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowDownUp, Plus } from "lucide-react";
import { Panel, Dialog, Lines } from "../components/Common";
import { Thumb, PlatformIcon } from "../components/Brand";
import { useStudio } from "../Studio";
import {
  fmt,
  clock,
  shortDate,
  rate,
  eng,
  retentionPoints,
} from "../data/creators";
export default function Content() {
  const { data: d } = useStudio(),
    { open } = useOutletContext(),
    [type, setType] = useState("All"),
    [sort, setSort] = useState(["views", -1]),
    [p, detail] = useState(null);
  const rows = d.posts
    .map((p) => ({
      ...p,
      retention: p.watch != null ? rate(p.watch, p.duration) : null,
    }))
    .filter((p) => type === "All" || p.type === type)
    .sort((a, b) => {
      const x = a[sort[0]],
        y = b[sort[0]];
      return x == null
        ? 1
        : y == null
          ? -1
          : sort[1] * (typeof x === "string" ? x.localeCompare(y) : x - y);
    });
  const curve = p ? retentionPoints(p.curve, p.duration) : [];
  const drop = curve
    .slice(1)
    .map((r, i) => ({ ...r, loss: curve[i].remaining - r.remaining }))
    .sort((a, b) => b.loss - a.loss)[0];
  return (
    <>
      <Panel
        title="Post performance"
        extra={
          <button className="btn red" onClick={() => open("posts")}>
            <Plus size={15} />
            Add post
          </button>
        }
      >
        <div className="filter-row">
          <select
            aria-label="Post type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {["All", ...new Set(d.posts.map((p) => p.type))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <small>{rows.length} posts published in this period</small>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  {[
                    ["title", "Post"],
                    ["platform", "Platform"],
                    ["date", "Published"],
                    ["views", "Views"],
                    ["likes", "Likes"],
                    ["comments", "Comments"],
                    ["shares", "Shares"],
                    ["watch", "Avg watch"],
                    ["retention", "Retention"],
                  ].map(([k, l]) => (
                    <th key={k}>
                      <button
                        onClick={() =>
                          setSort([k, sort[0] === k ? -sort[1] : -1])
                        }
                      >
                        {l}
                        <ArrowDownUp size={12} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} onClick={() => detail(p)}>
                    <td>
                      <button className="post-name">
                        <Thumb post={p} />
                        <span>
                          {p.title}
                          <small>{p.type}</small>
                        </span>
                      </button>
                    </td>
                    <td>{p.platform}</td>
                    <td>{shortDate(p.date)}</td>
                    {["views", "likes", "comments", "shares"].map((k) => (
                      <td key={k}>{fmt(p[k])}</td>
                    ))}
                    <td>{clock(p.watch)}</td>
                    <td>
                      {p.retention == null ? "—" : p.retention.toFixed(1) + "%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            No posts recorded for these filters. Add a post with its publication
            date and platform.
          </p>
        )}
      </Panel>
      {p && (
        <Dialog drawer title="Post details" onClose={() => detail(null)}>
          <span className="badge">
            <PlatformIcon platform={p.platform} />
            {p.platform} · {p.type}
          </span>
          <h3 className="detail-title">{p.title}</h3>
          <p>
            {shortDate(p.date)} {p.time && p.time + " IST"}
          </p>
          <div className="detail-metrics">
            <div>
              Views<b>{fmt(p.views)}</b>
            </div>
            <div>
              Interactions<b>{fmt(eng(p))}</b>
            </div>
            <div>
              Retention
              <b>{p.retention == null ? "—" : p.retention.toFixed(1) + "%"}</b>
            </div>
          </div>
          {p.url && /\.(mp4|webm)(\?|$)/i.test(p.url) && (
            <video
              className="recorded-video"
              controls
              preload="none"
              src={p.url}
            />
          )}
          <p>{p.caption}</p>
          {curve.length > 0 && (
            <>
              <h3>Viewer retention</h3>
              <Lines
                data={curve}
                a="remaining"
                aName="Viewers remaining"
                percent
                marker={drop?.loss > 0 ? drop.label : undefined}
              />
              {drop?.loss > 0 && (
                <p className="note">
                  The largest measured drop ends at {drop.label}:{" "}
                  {fmt(drop.loss)} percentage points.
                </p>
              )}
            </>
          )}
          <p className="muted">
            {[p.tags, p.topic, p.sound].filter(Boolean).join(" · ")}
          </p>
          <div className="edit-actions">
            {p.url && (
              <a
                className="small-btn"
                href={p.url}
                target="_blank"
                rel="noreferrer"
              >
                Open original post
              </a>
            )}
            <button
              className="btn red"
              onClick={() => {
                detail(null);
                open("posts", p);
              }}
            >
              Edit post
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
