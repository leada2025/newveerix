import React, { useState } from "react";
import { FaPhoneAlt, FaWhatsapp, FaTimes } from "react-icons/fa";

const ContactSupport = () => {
  const [open, setOpen] = useState(false);

  const supportNumber = "+911234567890"; // Replace with your number
  const whatsappLink = `https://wa.me/${supportNumber.replace(/\D/g, "")}`;

  return (
    <>
      {/* Floating Button */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 999,
        }}
      >
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            style={{
              backgroundColor: "#a31d06ff",
              border: "none",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              color: "#fff",
              fontSize: "24px",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            }}
          >
            ?
          </button>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "15px",
              width: "220px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                alignSelf: "flex-end",
                cursor: "pointer",
                marginBottom: "10px",
              }}
              onClick={() => setOpen(false)}
            >
              <FaTimes />
            </div>

            <h4 style={{ margin: "5px 0" }}>Contact Support</h4>
            <p style={{ margin: "5px 0" }}>{supportNumber}</p>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <a href={`tel:${supportNumber}`} style={{ color: "#25D366" }}>
                <FaPhoneAlt size={24} />
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#25D366" }}
              >
                <FaWhatsapp size={24} />
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContactSupport;
