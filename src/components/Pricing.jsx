import React, { useState, useEffect } from "react";
import { Dialog } from "./Common";
import { RequestForm } from "./Requests";
import { useStudio, call } from "../Studio";
export default function Pricing() {
  const { session } = useStudio(),
    [state, setState] = useState(null),
    [error, fail] = useState(""),
    [form, setForm] = useState(null),
    [ask, setAsk] = useState(""),
    [year, setYear] = useState(false),
    [busy, setBusy] = useState(false);
  const reload = async () => {
    try {
      setState(await call("pricing"));
      fail("");
    } catch (e) {
      fail(e.message);
    }
  };
  useEffect(() => {
    reload();
  }, []);
  const plan = () => ({ name: "", monthly: "", description: "" });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      setState(
        await call("pricing", {
          revision: state.revision,
          plans: form.map((p) => ({ ...p, monthly: Number(p.monthly) })),
        }),
      );
      setForm(null);
      fail("");
    } catch (e) {
      fail(e.message);
      if (e.status === 409) {
        setForm(null);
        await reload();
      }
    } finally {
      setBusy(false);
    }
  }
  function update(i, k, v) {
    setForm(form.map((p, j) => (i === j ? { ...p, [k]: v } : p)));
  }
  return (
    <section className="price-section" id="pricing">
      <div className="wrap section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRICING</p>
            <h2>
              Growth services<span>.</span>
            </h2>
          </div>
          {session?.admin && state && (
            <button
              className="small-btn"
              onClick={() =>
                setForm(state.plans.length ? state.plans : [plan()])
              }
            >
              Edit pricing
            </button>
          )}
        </div>
        {state?.plans.length ? (
          <>
            <div className="segmented price-toggle">
              {["Monthly", "Yearly · save 20%"].map((text, i) => (
                <button
                  key={text}
                  className={year === !!i ? "on" : ""}
                  onClick={() => setYear(!!i)}
                >
                  {text}
                </button>
              ))}
            </div>
            <div className="three-grid">
              {state.plans.map((p, i) => (
                <article
                  key={i}
                  className={"price-card " + (i === 1 ? "featured" : "")}
                >
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                  <strong>
                    ₹
                    {(year ? p.monthly * 12 * 0.8 : p.monthly).toLocaleString(
                      "en-IN",
                      { maximumFractionDigits: 2 },
                    )}
                  </strong>
                  <small> / {year ? "year" : "month"}</small>
                  <div>
                    <button
                      className="btn outline"
                      onClick={() =>
                        setAsk(
                          "I am interested in " +
                            p.name +
                            " (" +
                            (year ? "yearly" : "monthly") +
                            ").",
                        )
                      }
                    >
                      Enquire about plan
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : state ? (
          <div className="quote-info">
            <p>
              Request a quote for your channels, posting schedule and growth
              goals.
            </p>
            <a className="btn outline" href="#contact">
              Request a quote
            </a>
          </div>
        ) : (
          <p className="muted">{error || "Opening pricing…"}</p>
        )}
        {error && !form && (
          <button className="text-link" onClick={reload}>
            Reload pricing
          </button>
        )}
        {form && (
          <Dialog title="Edit service pricing" onClose={() => setForm(null)}>
            <form className="data-form" onSubmit={save}>
              <p className="muted">
                Published yearly prices use a 20% discount on twelve months.
              </p>
              {form.map((p, i) => (
                <div className="plan-editor" key={i}>
                  <label>
                    Plan name
                    <input
                      required
                      maxLength="80"
                      value={p.name}
                      onChange={(e) => update(i, "name", e.target.value)}
                    />
                  </label>
                  <label>
                    Monthly price (₹)
                    <input
                      required
                      type="number"
                      min=".01"
                      step=".01"
                      max="100000000"
                      value={p.monthly}
                      onChange={(e) => update(i, "monthly", e.target.value)}
                    />
                  </label>
                  <label>
                    Includes
                    <textarea
                      maxLength="400"
                      value={p.description}
                      onChange={(e) => update(i, "description", e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setForm(form.filter((_, j) => i !== j))}
                  >
                    Remove from draft
                  </button>
                </div>
              ))}
              {form.length < 3 && (
                <button
                  className="small-btn"
                  type="button"
                  onClick={() => setForm([...form, plan()])}
                >
                  Add plan
                </button>
              )}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <button className="btn red" disabled={busy}>
                Publish pricing
              </button>
            </form>
          </Dialog>
        )}
        {ask && (
          <Dialog title="Plan enquiry" onClose={() => setAsk("")}>
            <RequestForm prefix={ask} />
          </Dialog>
        )}
      </div>
    </section>
  );
}
