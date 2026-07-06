import React from "react";

export default function Pagination({ page, totalPages, onPageClick }) {
  if (!totalPages || totalPages <= 1) return <div className="pagination" />;

  const maxButtons = 7;
  let start = Math.max(1, page - 3);
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="pagination">
      {pages.map((p) => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onPageClick(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
