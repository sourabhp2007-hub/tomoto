import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Logo, TomatoSlice } from "../components/Brand";
import { call, useStudio } from "../Studio";
export default function Login() {
  const { session, busy, error, refresh } = useStudio(),
    [register, setRegister] = useState(false),
    [warning, setWarning] = useState(""),
    [sending, setSending] = useState(false),
    nav = useNavigate();
  if (session?.user) return <Navigate to="/app/dashboard" replace />;
  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setWarning("");
    try {
      await call(
        register ? "register" : "login",
        Object.fromEntries(new FormData(e.target)),
      );
      await refresh();
      nav("/app/dashboard");
    } catch (e) {
      setWarning(e.message);
    } finally {
      setSending(false);
    }
  }
  return (
    <main className="auth">
      <div className="auth-nav">
        <Logo />
      </div>
      <div className="login-card">
        <div className="auth-illustration">
          <p className="eyebrow">TOMATO STATS</p>
          <h2>
            Great content deserves an <em>audience.</em>
          </h2>
          <TomatoSlice />
        </div>
        <div className="login-form">
          <h1>{register ? "Create an account" : "Welcome back"}</h1>
          <p>Sign in to your private creator workspace.</p>
          {error ? (
            <>
              <p role="alert">{error}</p>
              <button className="small-btn" onClick={refresh}>
                Retry
              </button>
            </>
          ) : busy ? (
            <p role="status">Opening workspace…</p>
          ) : session?.local ? (
            <>
              <form onSubmit={submit}>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                  />
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    minLength="10"
                    maxLength="200"
                    required
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                  />
                </label>
                {register && <small>Use at least 10 characters.</small>}
                <button className="btn red" disabled={sending}>
                  {register ? "Create account" : "Log in"}
                </button>
              </form>
              <button
                className="text-link login-toggle"
                onClick={() => {
                  setRegister(!register);
                  setWarning("");
                }}
              >
                {register
                  ? "Already registered? Log in"
                  : "New here? Create an account"}
              </button>
            </>
          ) : (
            <a
              className="btn red"
              href="/signin-with-chatgpt?return_to=%2Fapp%2Fdashboard"
              target="_top"
            >
              Continue with ChatGPT
            </a>
          )}
          {warning && (
            <p className="form-error" role="alert">
              {warning}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
