import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page">
      <div className="card not-found-card">
        <h1>404</h1>
        <p className="muted">The page you're looking for doesn't exist or has been moved.</p>
        <Link className="btn btn-primary" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
