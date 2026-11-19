import React, { useState, useEffect, useRef } from "react";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fmt, palette } from "../data/creators";
export const metricText = (name, v) =>
  name === "Engagement" ? v.toFixed(1) + "%" : fmt(v);
export function Change({ v }) {
  const I = v >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={"change " + (v >= 0 ? "positive" : "negative")}>
      <I size={14} />
      {v >= 0 ? "+" : ""}
      {v.toFixed(1)}%
    </span>
  );
}
export function Count({ name, value }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf;
    const start = performance.now();
    function frame(t) {
      const p = Math.min(1, (t - start) / 270);
      setN(value * (1 - (1 - p) ** 3));
      if (p < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span aria-label={metricText(name, value)}>{metricText(name, n)}</span>
  );
}
export function Panel({ title, extra, children, className = "" }) {
  return (
    <section className={"panel " + className}>
      <div className="panel-head">
        <h2>{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}
export function Dialog({ title, onClose, drawer = false, children }) {
  const ref = useRef(),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prior = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current.focus();
    const key = (e) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const els = Array.from(
          ref.current.querySelectorAll(
            'button:not(:disabled),input,select,a[href],[tabindex="0"]',
          ),
        );
        if (!els.length) return;
        const first = els[0],
          last = els.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      prior?.focus();
    };
  }, []);
  return (
    <div
      className={"overlay " + (drawer ? "drawer-wrap" : "")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={drawer ? "drawer" : "dialog"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex="-1"
      >
        <div className="dialog-head">
          <h2>{title}</h2>
          <button
            className="iconbtn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
const axis = {
    tickLine: false,
    axisLine: false,
    tick: { fill: "#776563", fontSize: 12 },
  },
  grid = (
    <CartesianGrid stroke="#ecdfda" strokeDasharray="3 4" vertical={false} />
  );
const pop = {
  border: "1px solid #e5dad4",
  borderRadius: 12,
  fontSize: 13,
  boxShadow: "0 7px 20px #2a0b0c12",
};
export function Lines({
  data,
  x = "label",
  a,
  b,
  aName,
  bName,
  percent = false,
  marker,
  area = false,
  height = 220,
}) {
  const format = (v) => (percent ? Number(v).toFixed(1) + "%" : fmt(v));
  const Chart = area ? AreaChart : LineChart,
    Stroke = area ? Area : Line;
  return (
    <div
      style={{ height, minWidth: 0 }}
      role="img"
      aria-label={(aName || a) + " trend chart"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
          {grid}
          <XAxis dataKey={x} {...axis} minTickGap={35} />
          <YAxis {...axis} width={47} tickFormatter={format} />
          <Tooltip formatter={format} contentStyle={pop} />
          {b && (
            <Stroke
              type="monotone"
              dataKey={b}
              name={bName || b}
              stroke="#a78580"
              strokeDasharray="4 4"
              fill="transparent"
              strokeWidth={2}
              dot={data.length === 1}
              animationDuration={260}
            />
          )}
          <Stroke
            type="monotone"
            dataKey={a}
            name={aName || a}
            stroke="#d1221f"
            fill={area ? "#ffe1d84d" : "none"}
            strokeWidth={3}
            dot={data.length === 1}
            animationDuration={280}
          />
          {marker && (
            <ReferenceLine
              x={marker}
              stroke="#8e1212"
              strokeDasharray="4 3"
              label={{
                value: "Drop-off",
                position: "insideTopRight",
                fontSize: 11,
              }}
            />
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
export function Bars({ data }) {
  return (
    <div
      className="chart-box"
      role="img"
      aria-label="Views by platform, selected and previous periods"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -8, top: 12, right: 8 }}>
          {grid}
          <XAxis dataKey="name" {...axis} />
          <YAxis {...axis} width={54} tickFormatter={fmt} />
          <Tooltip formatter={(v) => fmt(v)} contentStyle={pop} />
          <Bar
            dataKey="previous"
            name="Previous period"
            fill="#ebc9be"
            radius={[5, 5, 0, 0]}
            maxBarSize={38}
            animationDuration={260}
          />
          <Bar
            dataKey="views"
            name="Selected period"
            fill="#d1221f"
            radius={[5, 5, 0, 0]}
            maxBarSize={38}
            animationDuration={280}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function Donut({ items, label = "Age split" }) {
  return (
    <div className="donut-wrap">
      <div className="donut">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              innerRadius={48}
              outerRadius={67}
              paddingAngle={2}
              stroke="none"
              animationDuration={280}
            >
              {items.map((v, i) => (
                <Cell key={v.name} fill={palette[i]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => v + "%"} contentStyle={pop} />
          </PieChart>
        </ResponsiveContainer>
        <span>{label}</span>
      </div>
      <div className="donut-legend">
        {items.map((v, i) => (
          <div key={v.name}>
            <i style={{ background: palette[i] }} />
            {v.name}
            <strong>{v.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
