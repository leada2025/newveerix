import React from "react";
import { createPortal } from "react-dom";
import QuoteChatPopup from "./QuoteChatPopup";

export default function QuoteChatPortal({ show, quoteId, customerId, onClose, isAdmin }) {
  if (!show) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-none" // 👈 lets clicks pass through
    >
      <div className="absolute bottom-4 right-4 pointer-events-auto"> {/* 👈 popup only is clickable */}
        <QuoteChatPopup
          quoteId={quoteId}
          customerId={customerId}
          isAdmin={isAdmin}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
