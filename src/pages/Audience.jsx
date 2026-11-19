import React from "react";
import { useOutletContext } from "react-router-dom";
import { Panel, Donut } from "../components/Common";
import { useStudio } from "../Studio";
import { weekdays, shortDate, fmt } from "../data/creators";
export default function Audience() {
  const { data: d, doc, c, platform } = useStudio(),
    { open } = useOutletContext(),
    history = doc.audiences
      .filter(
        (s) =>
          s.account === c.id &&
          (platform === "All" || s.platform === platform) &&
          s.date >= d.start &&
          s.date <= d.end,
      )
      .sort((a, b) => b.date.localeCompare(a.date)),
    peak = Math.max(...d.online.map((x) => x.value));
  return (
    <>
      <div className="edit-actions">
        <button className="btn red" onClick={() => open("audiences")}>
          Add audience snapshot
        </button>
      </div>
      <p className="muted">
        {d.snapshots.length
          ? "Latest recorded audience on or before " +
            d.end +
            " · " +
            d.snapshots
              .map((r) => r.platform + " " + shortDate(r.date))
              .join(" / ")
          : "Enter audience measurements from your platform insights."}
      </p>
      <div className="two-grid">
        <Panel title="Age distribution">
          {d.ages.length ? (
            <Donut items={d.ages} />
          ) : (
            <p className="empty">
              Add the age percentages supplied by your platform.
            </p>
          )}
        </Panel>
        <Panel title="Gender distribution">
          {d.gender.length ? (
            <Donut items={d.gender} label="Gender" />
          ) : (
            <p className="empty">Add the gender percentages in a snapshot.</p>
          )}
        </Panel>
      </div>
      <div className="two-grid">
        <Panel title="Top cities">
          {d.cities.length ? (
            <div className="city-bars">
              {d.cities.map((r) => (
                <div key={r.name}>
                  <span>{r.name}</span>
                  <div>
                    <i style={{ width: r.value + "%" }} />
                  </div>
                  <strong>{r.value}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">
              Add city names and percentages to see their distribution.
            </p>
          )}
        </Panel>
        <Panel title="Audience interests">
          {d.interests.length ? (
            <div className="tags">
              {d.interests.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          ) : (
            <p className="empty">
              Record audience interests from your insights.
            </p>
          )}
        </Panel>
      </div>
      <Panel title="When your audience is online">
        <div className="heat-scroll">
          <div className="heatmap">
            <b />
            {Array.from({ length: 24 }, (_, h) => (
              <small key={h}>{h % 3 === 0 ? h : ""}</small>
            ))}
            {weekdays.map((day) => (
              <React.Fragment key={day}>
                <small>{day}</small>
                {Array.from({ length: 24 }, (_, h) => {
                  const key = day + " " + String(h).padStart(2, "0"),
                    row = d.online.find((r) => r.name === key);
                  return (
                    <span
                      key={h}
                      title={
                        key +
                        ":00 IST · " +
                        (row ? row.value + "%" : "Unrecorded")
                      }
                      style={{
                        background: row
                          ? row.value === peak
                            ? "#f26a2b"
                            : "rgba(160,28,32," +
                              (0.14 + (0.7 * row.value) / 100) +
                              ")"
                          : "#eee8e3",
                      }}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p className="muted">
          {d.online.length
            ? "Orange marks the highest measured activity."
            : "Enter hourly activity to highlight the busiest measured slot."}{" "}
          Grey cells have no recorded value. Times in IST.
        </p>
      </Panel>
      <Panel title="Snapshots in this period">
        {history.length ? (
          <div className="ideas">
            {history.map((r) => (
              <div key={r.id}>
                <b>{r.date}</b>
                <span>
                  {r.platform} · {fmt(r.followers)} followers
                </span>
                <button
                  className="small-btn"
                  onClick={() => open("audiences", r)}
                >
                  Edit snapshot
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No snapshots dated within this period.</p>
        )}
      </Panel>
    </>
  );
}
