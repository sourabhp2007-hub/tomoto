import React, { useState, useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { useStudio } from "../Studio";
import { fmt, compare, shortDate } from "../data/creators";
import { metricLabels, showMetric } from "./Overview";
import { insights } from "./Recommendations";
import { Dialog } from "../components/Common";
export default function Reports() {
  const { c, data: d, platform, toast } = useStudio(),
    ref = useRef(),
    [busy, setBusy] = useState(false),
    [sharing, setSharing] = useState(false);
  const top = d.posts[0],
    steps = insights(d).slice(0, 3),
    summary =
      c.name +
      " · " +
      platform +
      " · " +
      d.start +
      " to " +
      d.end +
      "\n" +
      Object.entries(metricLabels)
        .map(([k, l]) => l + ": " + showMetric(k, d.current[k]))
        .join(" · ") +
      (top
        ? "\nTop post: " + top.title + " (" + fmt(top.views) + " views)"
        : "");
  async function pdf() {
    setBusy(true);
    try {
      const [{ jsPDF }, { default: canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      await document.fonts.ready;
      const img = await canvas(ref.current, {
        backgroundColor: "#ffffff",
        scale: 1.8,
        logging: false,
      });
      const doc = new jsPDF({ unit: "mm", format: "a4" }),
        scale = Math.min(190 / img.width, 277 / img.height);
      doc.addImage(
        img.toDataURL("image/png"),
        "PNG",
        10,
        10,
        img.width * scale,
        img.height * scale,
      );
      doc.save(
        "Tomato-Stats-" +
          c.name.replace(/[^\p{L}\p{N}]+/gu, "-") +
          "-" +
          d.end +
          ".pdf",
      );
    } catch (e) {
      toast("Could not create the PDF. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Tomato Stats report", text: summary });
      } else {
        await navigator.clipboard.writeText(summary);
        toast("Report summary copied");
      }
    } catch (e) {
      if (e.name !== "AbortError") setSharing(true);
    }
  }
  return (
    <>
      <div className="report-actions">
        <button className="small-btn" onClick={pdf} disabled={busy}>
          <Download size={16} />
          {busy ? "Creating PDF…" : "Download PDF"}
        </button>
        <button className="small-btn" onClick={share}>
          <Share2 size={16} />
          Share report
        </button>
      </div>
      <article className="report" ref={ref}>
        <div className="report-hero">
          <p className="eyebrow">TOMATO STATS / CREATOR REPORT</p>
          <h2>Performance report</h2>
          <p>
            {c.name} · {platform === "All" ? "All platforms" : platform} ·{" "}
            {d.start} to {d.end}
          </p>
        </div>
        <div className="report-body">
          <h3>Summary</h3>
          <p>
            {d.posts.length} recorded posts published in this period account for{" "}
            {fmt(d.current.views)} views.
          </p>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>This period</th>
                <th>Previous period</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metricLabels).map(([k, l]) => {
                const delta = compare(d.current[k], d.previous[k]);
                return (
                  <tr key={k}>
                    <td>{l}</td>
                    <td>{showMetric(k, d.current[k])}</td>
                    <td>{showMetric(k, d.previous[k])}</td>
                    <td>
                      {delta == null
                        ? "—"
                        : (delta >= 0 ? "+" : "") + fmt(delta) + "%"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="report-best">
            <div>
              <small>BEST CONTENT</small>
              <h3>{top?.title || "No posts in this period"}</h3>
              {top && (
                <p>
                  {top.platform} · {shortDate(top.date)} · {fmt(top.views)}{" "}
                  views
                </p>
              )}
            </div>
          </div>
          <div className="two-grid">
            <div>
              <h3>Highlights</h3>
              <ul>
                {d.posts.length ? (
                  <>
                    <li>
                      {fmt(d.current.views)} views across {d.posts.length}{" "}
                      posts.
                    </li>
                    <li>
                      {fmt(d.posts.reduce((n, p) => n + p.comments, 0))}{" "}
                      comments recorded.
                    </li>
                    <li>
                      {fmt(d.posts.reduce((n, p) => n + p.shares, 0))} shares
                      recorded.
                    </li>
                  </>
                ) : (
                  <li>Add post metrics to populate the report.</li>
                )}
              </ul>
            </div>
            <div>
              <h3>Next steps</h3>
              <ul>
                {steps.length ? (
                  steps.map((s) => <li key={s.action}>{s.action}.</li>)
                ) : (
                  <li>Enter an audience snapshot and your most recent post.</li>
                )}
              </ul>
            </div>
          </div>
          <p className="report-foot">
            Source: creator-entered platform insights. Post metrics are saved
            totals grouped by publication date. Followers use the latest
            recorded snapshot.
          </p>
        </div>
      </article>
      {sharing && (
        <Dialog title="Share report summary" onClose={() => setSharing(false)}>
          <label>
            Copy this summary
            <textarea
              readOnly
              value={summary}
              onFocus={(e) => e.target.select()}
              rows={5}
            />
          </label>
        </Dialog>
      )}
    </>
  );
}
