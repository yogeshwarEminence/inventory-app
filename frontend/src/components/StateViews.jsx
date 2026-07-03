import React from "react";

// Consistent "table is loading" skeleton instead of a bare "Loading…" row.
export function SkeletonRows({ columns, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="skeleton-row">
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c}>
              <span className="skeleton-bar" style={{ width: `${55 + ((r + c) % 4) * 10}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Consistent "the request failed" row with a retry action, used in every
// table on the site so failures are always recoverable without a full
// page refresh.
export function ErrorRow({ columns, message, onRetry }) {
  return (
    <tr>
      <td colSpan={columns}>
        <div className="inline-error">
          <span>⚠️ {message || "Something went wrong."}</span>
          {onRetry && (
            <button className="btn btn-secondary btn-sm" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function EmptyRow({ columns, message, action }) {
  return (
    <tr>
      <td colSpan={columns}>
        <div className="inline-empty">
          <span>{message || "Nothing here yet."}</span>
          {action}
        </div>
      </td>
    </tr>
  );
}
