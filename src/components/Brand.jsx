import React from "react";
import {
  Instagram,
  Youtube,
  UtensilsCrossed,
  Cpu,
  Shirt,
  Play,
  TrendingUp,
  ChartNoAxesCombined,
  CalendarDays,
  Clock3,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ light = false, link = "/" }) {
  return (
    <Link
      className={"logo " + (light ? "light" : "")}
      to={link}
      aria-label="Tomato Stats home"
    >
      <span className="logo-fruit">
        <img alt="" src="/tomato.svg" />
      </span>
      Tomato Stats
    </Link>
  );
}
export function PlatformIcon({ platform, size = 18 }) {
  return platform === "Instagram" ? (
    <Instagram size={size} />
  ) : platform === "YouTube" ? (
    <Youtube size={size} />
  ) : (
    <span className="xmark" style={{ fontSize: size }}>
      𝕏
    </span>
  );
}
const symbols = { utensils: UtensilsCrossed, cpu: Cpu, spool: Shirt };
export function Avatar({ c }) {
  const Icon = symbols[c.symbol] || Users;
  return (
    <span
      className="avatar"
      style={{ background: c.color }}
      aria-label={c.name + " avatar"}
    >
      <Icon size={20} />
    </span>
  );
}
export function Thumb({ post, large = false }) {
  const Icon = symbols[post.icon] || ChartNoAxesCombined;
  return (
    <div
      className={
        "thumb tone" + (post.title.length % 6) + (large ? " large" : "")
      }
      role="img"
      aria-label={"Illustrated thumbnail for " + post.title}
    >
      <Icon className="thumb-icon" />
      <span className="thumb-title">{post.title}</span>
      <span className="thumb-play">
        <Play size={12} fill="currentColor" />
      </span>
    </div>
  );
}
export function TomatoSlice() {
  return (
    <svg className="tomato-slice" viewBox="0 0 240 240" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M120 19C60 1 8 53 12 119c-3 67 42 109 100 108 62 8 119-36 118-101 4-66-49-113-110-107Z" />
        <path d="M119 27C59 10 17 59 21 120c-2 61 38 98 94 99 63 6 108-36 107-95 0-58-45-104-103-97Z" />
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} transform={"rotate(" + i * 72 + " 120 120)"}>
            <path d="M112 95C101 82 68 65 83 48c16-22 61-20 74-2 8 15-13 26-23 48-7 16-13 15-22 1Z" />
            {Array.from({ length: 5 }, (_, j) => (
              <ellipse
                key={j}
                cx={91 + j * 11}
                cy={57 + Math.sin(j * 1.4) * 7}
                rx="2.8"
                ry="6"
                transform={
                  "rotate(" +
                  (j * 13 - 20) +
                  " " +
                  (91 + j * 11) +
                  " " +
                  (57 + Math.sin(j * 1.4) * 7) +
                  ")"
                }
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
export function Preview() {
  const [views, setViews] = React.useState(""),
    [interactions, setInteractions] = React.useState("");
  const value =
    views > 0 && interactions !== ""
      ? (Number(interactions) / Number(views)) * 100
      : null;
  return (
    <div className="preview-stage">
      <div className="preview-paper calc">
        <div className="preview-bar">
          <span>
            <ChartNoAxesCombined size={16} /> Engagement calculator
          </span>
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="preview-inner">
          <p className="eyebrow">YOUR POST</p>
          <div className="calc-inputs">
            <label>
              Views
              <input
                type="number"
                min="1"
                value={views}
                onChange={(e) => setViews(e.target.value)}
              />
            </label>
            <label>
              Likes, comments &amp; shares
              <input
                type="number"
                min="0"
                value={interactions}
                onChange={(e) => setInteractions(e.target.value)}
              />
            </label>
          </div>
          <div className="preview-label">Engagement rate</div>
          <output className="preview-value">
            {value != null && value >= 0 ? value.toFixed(2) + "%" : "—"}
          </output>
          <div className="calc-meter">
            <i
              style={{ width: Math.max(0, Math.min(value || 0, 100)) + "%" }}
            />
          </div>
          <p className="calc-note">
            Enter the views and total interactions from one post.
          </p>
        </div>
      </div>
    </div>
  );
}
