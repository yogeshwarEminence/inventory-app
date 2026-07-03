import React from "react";
import { IconChevronLeft, IconChevronRight } from "./Icons.jsx";

export default function Pagination({ page, totalPages, onPageClick }) {
  if (!totalPages || totalPages <= 1) return <div className="pagination" />;

  const maxButtons = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);

  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="pagination">
      <button
        className="pagination-arrow"
        disabled={page <= 1}
        onClick={() => onPageClick(page - 1)}
        aria-label="Previous page"
      >
        <IconChevronLeft width={15} height={15} />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageClick(1)}>1</button>
          {start > 2 && <span className="pagination-ellipsis">···</span>}
        </>
      )}
      {pages.map((p) => (
        <button key={p} className={p === page ? "active" : ""} onClick={() => onPageClick(p)}>
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-ellipsis">···</span>}
          <button onClick={() => onPageClick(totalPages)}>{totalPages}</button>
        </>
      )}
      <button
        className="pagination-arrow"
        disabled={page >= totalPages}
        onClick={() => onPageClick(page + 1)}
        aria-label="Next page"
      >
        <IconChevronRight width={15} height={15} />
      </button>
    </div>
  );
}
