import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { call, useStudio } from "../Studio";
import { Dialog } from "./Common";
export function RequestForm({ booking = false, prefix = "" }) {
  const { session } = useStudio(),
    [error, fail] = useState(""),
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false),
    id = useRef(crypto.randomUUID());
  async function send(e) {
    e.preventDefault();
    fail("");
    setBusy(true);
    try {
      const f = Object.fromEntries(new FormData(e.target));
      await call("inquiries", { ...f, message: f.message, id: id.current });
      setSaved(
        booking
          ? "Session requested. Check Requests for confirmation from the team."
          : "Message saved in the team inbox.",
      );
    } catch (e) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (saved)
    return (
      <p className="note" role="status">
        {saved}
      </p>
    );
  if (!session?.user)
    return (
      <div>
        <p className="muted">
          Sign in to send a message and track the reply status.
        </p>
        <Link to="/login" className="btn red">
          Sign in
        </Link>
      </div>
    );
  return (
    <form className="data-form" onSubmit={send}>
      <label>
        Name
        <input
          name="name"
          required
          maxLength="100"
          defaultValue={session.user.name}
        />
      </label>
      <label>
        Reply email
        <input
          name="email"
          required
          type="email"
          maxLength="254"
          defaultValue={session.user.email}
        />
      </label>
      {booking && (
        <label>
          Preferred date and time (IST)
          <input name="slot" type="datetime-local" required />
        </label>
      )}
      <label>
        {booking ? "What would you like to work on?" : "Message"}
        <textarea
          required
          rows="3"
          name="message"
          maxLength="2600"
          defaultValue={prefix}
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button className="btn red" disabled={busy}>
        {busy ? "Saving…" : booking ? "Request session" : "Send message"}
      </button>
    </form>
  );
}
export function Requests({ onClose }) {
  const { session } = useStudio(),
    [rows, setRows] = useState(null),
    [error, fail] = useState(""),
    [busy, setBusy] = useState(false);
  const reload = async () => {
    try {
      setRows(await call("inquiries"));
      fail("");
    } catch (e) {
      fail(e.message);
    }
  };
  useEffect(() => {
    reload();
  }, []);
  async function update(id, status) {
    setBusy(true);
    try {
      await call("inquiries/status", { id, status });
      await reload();
    } catch (e) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={session.admin ? "Team inbox" : "Your requests"}
      onClose={onClose}
    >
      {rows === null && !error ? (
        <p>Opening requests…</p>
      ) : rows?.length ? (
        rows.map((r) => (
          <article className="inbox-item" key={r.id}>
            <b>
              {r.requested_slot ? "Strategy session" : "Contact message"} ·{" "}
              {r.status}
            </b>
            <small>
              {r.created.slice(0, 10)} · {r.name} · {r.email}
            </small>
            <p>{r.message}</p>
            {r.requested_slot && (
              <p>Requested time · {r.requested_slot.replace("T", " ")} IST</p>
            )}
            {session.admin && (
              <div className="filter-row">
                {(r.requested_slot ? ["Confirmed", "Declined"] : ["Reviewed"])
                  .filter((s) => s !== r.status)
                  .map((s) => (
                    <button
                      className="small-btn"
                      disabled={busy}
                      key={s}
                      onClick={() => update(r.id, s)}
                    >
                      {s === "Confirmed"
                        ? "Confirm session"
                        : s === "Declined"
                          ? "Decline"
                          : "Mark reviewed"}
                    </button>
                  ))}
              </div>
            )}
          </article>
        ))
      ) : (
        <p>Your contact and session requests will appear here.</p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error} <button onClick={reload}>Retry</button>
        </p>
      )}
    </Dialog>
  );
}
