import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/dm-sans/wght.css";
import "./style.css";
import { StudioProvider } from "./Studio";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Shell from "./pages/Shell";
import Overview from "./pages/Overview";
import Content from "./pages/Content";
import Audience from "./pages/Audience";
import Trends from "./pages/Trends";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
function App() {
  const loc = useLocation();
  React.useEffect(() => {
    if (!loc.hash) window.scrollTo(0, 0);
    if (!loc.pathname.startsWith("/app"))
      document.title = "Tomato Stats · Creator analytics";
  }, [loc.pathname]);
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        {[
          ["dashboard", Overview],
          ["content", Content],
          ["audience", Audience],
          ["trends", Trends],
          ["recommendations", Recommendations],
          ["reports", Reports],
        ].map(([path, Page]) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <StudioProvider>
      <App />
    </StudioProvider>
  </BrowserRouter>,
);
