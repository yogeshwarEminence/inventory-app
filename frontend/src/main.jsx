import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";

// NOTE: HashRouter is used intentionally instead of BrowserRouter.
// The app is served as static files by nginx with no SPA fallback
// (try_files) configured, so a hard refresh/direct link on a route
// like /orders previously hit nginx directly and returned a 404.
// HashRouter keeps all client-side routes under a single "/" request
// (e.g. /#/orders), which nginx always resolves to index.html.
// See CHANGES.txt for the alternative (nginx try_files) if the
// Docker/nginx config is ever opened up for changes.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
