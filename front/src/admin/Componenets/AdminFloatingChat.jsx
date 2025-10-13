// src/components/AdminFloatingChat.jsx
import React, { useState } from "react";
import AdminSupportChat from "./AdminSupportChat";
import { FaCommentAlt } from "react-icons/fa";

export default function AdminFloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            backgroundColor: "#a31d06ff",
            color: "#fff",
            borderRadius: "50%",
            width: "60px",
            height: "60px",
            fontSize: "28px",
            zIndex: 999,
          }}
        >
          <FaCommentAlt />
        </button>
      )}

      {open && <AdminSupportChat onClose={() => setOpen(false)} />}
    </>
  );
}
