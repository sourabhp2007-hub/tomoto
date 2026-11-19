import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { analyze, blank, today } from "./data/creators";
const Context = createContext(null);
export const useStudio = () => useContext(Context);
export async function call(path, body) {
  const res = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = Error(data.error || "The request failed.");
    err.status = res.status;
    throw err;
  }
  return data;
}
export function StudioProvider({ children }) {
  const [session, setSession] = useState(null),
    [state, setState] = useState({ doc: blank(), version: 0 }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [id, select] = useState(""),
    [platform, setPlatform] = useState("All"),
    [days, setDays] = useState(30),
    [end, setEnd] = useState(today),
    [message, notify] = useState("");
  const timer = useRef(),
    lock = useRef(false);
  async function refresh() {
    setError("");
    setBusy(true);
    try {
      const s = await call("session");
      const data = s.user
        ? await call("workspace")
        : { doc: blank(), version: 0 };
      setSession(s);
      setState(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    refresh();
    return () => clearTimeout(timer.current);
  }, []);
  const c =
    state.doc.accounts.find((a) => a.id === id) || state.doc.accounts[0];
  const data = useMemo(
    () => analyze(state.doc, c?.id, platform, days, end),
    [state, c, platform, days, end],
  );
  function toast(m) {
    notify(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => notify(""), 3200);
  }
  async function save(kind, record) {
    if (lock.current) throw Error("A save is in progress.");
    lock.current = true;
    try {
      const r = await call("records", { kind, record, version: state.version });
      setState({ doc: r.doc, version: r.version });
      return r.id;
    } catch (e) {
      if (e.status === 409) setState(await call("workspace"));
      throw e;
    } finally {
      lock.current = false;
    }
  }
  async function logout() {
    if (session?.local) {
      await call("logout", {});
      select("");
      setPlatform("All");
      setDays(30);
      await refresh();
      window.location.assign("/");
    } else window.location.assign("/signout-with-chatgpt?return_to=%2F");
  }
  return (
    <Context.Provider
      value={{
        session,
        doc: state.doc,
        c,
        select,
        platform,
        setPlatform,
        days,
        setDays,
        end,
        setEnd,
        data,
        save,
        toast,
        logout,
        refresh,
        busy,
        error,
      }}
    >
      {children}
      <div role="status" className={"toast " + (message ? "visible" : "")}>
        {message}
      </div>
    </Context.Provider>
  );
}
