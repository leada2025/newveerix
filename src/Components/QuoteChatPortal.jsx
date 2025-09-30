import React from "react";
import { createPortal } from "react-dom";
import QuoteChatPopup from "./QuoteChatPopup";

export default function QuoteChatPortal({ show, quoteId, customerId, onClose,isAdmin }) {
  if (!show) return null;
console.log("QuoteChatPortal render:", { show, quoteId, customerId })

  return createPortal(
<div className="fixed inset-0 z-[9999] flex justify-end items-end p-4">
      {/* Remove pointer-events-none from parent */}
      <QuoteChatPopup
        quoteId={quoteId}
        customerId={customerId}
         isAdmin={isAdmin} 
        onClose={onClose}
      />
    </div>,
    document.body
  );
}
