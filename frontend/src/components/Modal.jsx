import React from "react";
import { IconClose } from "./Icons.jsx";

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) onClose();
      }}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Close dialog" type="button">
          <IconClose width={16} height={16} />
        </button>
        {children}
      </div>
    </div>
  );
}
