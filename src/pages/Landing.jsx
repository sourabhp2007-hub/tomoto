import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Link2,
  Lightbulb,
  TrendingUp,
  Check,
  ChartNoAxesCombined,
  AudioLines,
  Sprout,
  FileChartColumn,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { Logo, Preview, TomatoSlice, PlatformIcon } from "../components/Brand";
import { comparison, platforms } from "../data/creators";
import { RequestForm } from "../components/Requests";
import Pricing from "../components/Pricing";
export default function Landing() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="marketing">
      <header className="navbar">
        <div className="wrap nav-inner">
          <Logo light />
          <nav className={menu ? "open" : ""} aria-label="Main navigation">
            {[
              ["Why us", "why-us"],
              ["Features", "features"],
              ["Services", "services"],
              ["Pricing", "pricing"],
              ["Contact", "contact"],
            ].map(([n, id]) => (
              <a key={id} href={"#" + id} onClick={() => setMenu(false)}>
                {n}
              </a>
            ))}
          </nav>
          <Link className="nav-login" to="/login">
            Login
          </Link>
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span /> SOCIAL MEDIA ANALYTICS
              </div>
              <h1>
                Great content
                <br />
                deserves an
                <br />
                <em>audience.</em>
              </h1>
              <p>
                We turn social media data into actionable insights and creative
                recommendations for better content.
              </p>
              <div className="hero-actions">
                <Link to="/login" className="btn red">
                  Open workspace
                </Link>
                <a href="#features" className="btn outline">
                  <Play size={16} fill="currentColor" />
                  How it works
                </a>
              </div>
              <div className="social-row">
                {platforms.map((p) => (
                  <span key={p}>
                    <PlatformIcon platform={p} size={16} />
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <Preview />
          </div>
        </section>
        <section id="why-us" className="stat-band">
          <div className="wrap stat-content">
            <div className="giant">
              42<span>%</span>
            </div>
            <div className="stat-text">
              <h2>
                Only 42% of marketers know basic information about their target
                audience.
              </h2>
              <p>Source: HubSpot, State of Marketing Report 2025</p>
            </div>
            <TomatoSlice />
          </div>
        </section>
        <section className="wrap section" id="features">
          <h2>
            How it works<span>.</span>
          </h2>
          <div className="three-grid">
            {[
              [
                Link2,
                "Add your accounts",
                "Enter your post metrics from Instagram, YouTube and X.",
              ],
              [
                Lightbulb,
                "Get plain-English advice",
                "Compare engagement and average watch time across your posts.",
              ],
              [
                TrendingUp,
                "Grow with our team",
                "Turn your strongest ideas into a weekly content routine.",
              ],
            ].map(([Icon, n, d]) => (
              <article key={n} className="feature-card">
                <Icon />
                <h3>{n}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="service-section" id="services">
          <div className="wrap section split-section">
            <div>
              <p className="eyebrow">SERVICES</p>
              <h2>
                Support for your
                <br />
                <em>next post.</em>
              </h2>
            </div>
            <div>
              {[
                [
                  ChartNoAxesCombined,
                  "Content strategy",
                  "Build a posting plan around what your audience watches.",
                ],
                [
                  AudioLines,
                  "Trend-based ideas",
                  "Find sounds, topics and hashtags that fit your niche.",
                ],
                [
                  Sprout,
                  "Audience growth campaigns",
                  "Reach people who share your community’s interests.",
                ],
                [
                  FileChartColumn,
                  "Monthly reports",
                  "Review the posts and decisions that moved your numbers.",
                ],
              ].map(([Icon, n, d]) => (
                <div className="service" key={n}>
                  <Icon />
                  <div>
                    <h3>{n}</h3>
                    <p>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="wrap section">
          <h2>
            Compare the tools<span>.</span>
          </h2>
          <div className="table-scroll">
            <table className="compare">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Focus</th>
                  <th>Example use</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((r) => (
                  <tr key={r[0]}>
                    {r.map((x, i) => (
                      <td key={i}>{x}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <Pricing />
        <section id="contact" className="wrap section split-section">
          <div>
            <p className="eyebrow">CONTACT</p>
            <h2>
              Let’s talk
              <br />
              <em>growth.</em>
            </h2>
          </div>
          <RequestForm />
        </section>
      </main>
      <footer>
        <div className="wrap">
          <Logo light />
          <p>MIT Academy of Engineering, Alandi, Pune.</p>
        </div>
      </footer>
    </div>
  );
}
