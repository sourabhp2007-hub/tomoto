import React, { useState, useEffect } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Clapperboard,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  LogOut,
  Plus,
  Inbox,
  CalendarDays,
  Menu,
  X,
  Pencil,
} from "lucide-react";
import { Logo, Avatar } from "../components/Brand";
import { Editor } from "../components/Editor";
import { Requests } from "../components/Requests";
import { useStudio } from "../Studio";
import { platforms, shortDate, today } from "../data/creators";
export const pages = [
  ["Dashboard", LayoutDashboard],
  ["Content", Clapperboard],
  ["Audience", Users],
  ["Trends", TrendingUp],
  ["Recommendations", Lightbulb],
  ["Reports", FileText],
];
export default function Shell() {
  const {
    session,
    c,
    doc,
    select,
    platform,
    setPlatform,
    days,
    setDays,
    end,
    setEnd,
    data,
    logout,
    busy,
    error,
    refresh,
  } = useStudio();
  const [form, setForm] = useState(null),
    [requests, setRequests] = useState(false),
    [menu, setMenu] = useState(false);
  const loc = useLocation();
  const title =
    pages.find(([n]) =>
      loc.pathname.toLowerCase().endsWith("/" + n.toLowerCase()),
    )?.[0] || "Dashboard";
  useEffect(() => {
    document.title = title + " · Tomato Stats";
    window.scrollTo(0, 0);
  }, [title]);
  if (busy || error)
    return (
      <main className="auth">
        <Logo />
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={refresh}>Retry</button>
          </>
        ) : (
          <p role="status">Opening workspace…</p>
        )}
      </main>
    );
  if (!session?.user) return <Navigate to="/login" replace />;
  const open = (kind, record) => setForm({ kind, record });
  return (
    <div className="app">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Logo light link="/app/dashboard" />
        <nav aria-label="Workspace navigation">
          {pages.map(([n, Icon]) => (
            <NavLink
              key={n}
              to={"/app/" + n.toLowerCase()}
              onClick={() => setMenu(false)}
            >
              <Icon size={18} />
              {n}
            </NavLink>
          ))}
        </nav>
        <div className="nav-bottom">
          <button onClick={() => open("accounts")}>
            <Plus size={17} />
            Add profile
          </button>
          <button onClick={logout}>
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="toolbar">
          <button
            className="mobile-menu"
            aria-label="Toggle sidebar"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          {c ? (
            <div className="account-select">
              <Avatar c={c} />
              <select
                aria-label="Account"
                value={c.id}
                onChange={(e) => select(e.target.value)}
              >
                {doc.accounts.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <button
                aria-label="Edit profile"
                onClick={() => open("accounts", c)}
              >
                <Pencil size={14} />
              </button>
            </div>
          ) : (
            <strong>Your workspace</strong>
          )}
          <div className="segmented platform-tabs">
            {["All", ...platforms].map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={platform === p ? "on" : ""}
                aria-pressed={platform === p}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="range-select">
            <CalendarDays size={16} />
            <select
              aria-label="Date range"
              value={days}
              onChange={(e) => setDays(+e.target.value)}
            >
              {[7, 30, 90].map((d) => (
                <option key={d} value={d}>
                  Last {d} days
                </option>
              ))}
            </select>
          </div>
          <button
            aria-label="Requests"
            title="Requests"
            className="iconbtn"
            onClick={() => setRequests(true)}
          >
            <Inbox size={18} />
          </button>
        </header>
        <main className="workspace">
          <div className="page-heading">
            <div className="eyebrow">
              {c?.handle || c?.name || session.user.name} /{" "}
              {platform === "All" ? "ALL PLATFORMS" : platform}
            </div>
            <div>
              <h1>{title}</h1>
              <label className="period-control">
                Period ending
                <input
                  className="range-date"
                  aria-label="Period ending"
                  type="date"
                  min="2000-01-01"
                  max={today()}
                  value={end}
                  onChange={(e) => {
                    if (e.target.value && e.target.validity.valid)
                      setEnd(e.target.value);
                  }}
                />
              </label>
            </div>
          </div>
          {c ? (
            <Outlet
              key={c.id + "/" + platform + "/" + days}
              context={{ open }}
            />
          ) : (
            <section className="onboard">
              <p className="eyebrow">CREATOR WORKSPACE</p>
              <h2>Add your first creator profile.</h2>
              <p>
                Start with your creator or brand name. Then enter a post or
                audience snapshot from your platform insights.
              </p>
              <button className="btn red" onClick={() => open("accounts")}>
                <Plus size={18} />
                Create profile
              </button>
            </section>
          )}
        </main>
      </div>
      {form && <Editor {...form} onClose={() => setForm(null)} />}{" "}
      {requests && <Requests onClose={() => setRequests(false)} />}
    </div>
  );
}
