import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const REASONS = {
  NO_TOKEN: {
    icon: "🔒",
    title: "Authentication Required",
    subtitle: "You need to be logged in to access this page.",
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.3)",
  },
  TOKEN_EXPIRED: {
    icon: "⏳",
    title: "Session Expired",
    subtitle: "Your session has timed out. Please log in again to continue.",
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.3)",
  },
  WRONG_ROLE: {
    icon: "🚫",
    title: "Access Denied",
    subtitle: "You don't have permission to view this page.",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.3)",
  },
  DEFAULT: {
    icon: "🛡️",
    title: "Unauthorized",
    subtitle: "You are not authorized to access this resource.",
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.3)",
  },
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const reason = location.state?.reason || "DEFAULT";
  const { icon, title, subtitle, color, glow } = REASONS[reason] ?? REASONS.DEFAULT;

  return (
    <div style={styles.page}>
      {/* Animated background orbs */}
      <div style={{ ...styles.orb, background: glow, top: "10%", left: "15%" }} />
      <div style={{ ...styles.orb, background: glow, bottom: "15%", right: "10%", animationDelay: "2s" }} />

      <div style={styles.card}>
        {/* Icon */}
        <div style={{ ...styles.iconRing, boxShadow: `0 0 40px ${glow}`, borderColor: color }}>
          <span style={styles.icon}>{icon}</span>
        </div>

        {/* Error code */}
        <p style={{ ...styles.code, color }}>403</p>

        {/* Title */}
        <h1 style={styles.title}>{title}</h1>

        {/* Subtitle */}
        <p style={styles.subtitle}>{subtitle}</p>

        {/* Divider */}
        <div style={{ ...styles.divider, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

        {/* Actions */}
        <div style={styles.actions}>
          <button
            id="btn-go-back"
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={() => navigate(-1)}
          >
            ← Go Back
          </button>
          <button
            id="btn-go-login"
            style={{ ...styles.btn, background: color, boxShadow: `0 4px 20px ${glow}` }}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/", { replace: true });
            }}
          >
            Go to Login
          </button>
        </div>

        <p style={styles.footer}>UniPortal · Access Control</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    overflow: "hidden",
    position: "relative",
    padding: "20px",
  },
  orb: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.4,
    animation: "pulse 6s ease-in-out infinite",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255, 255, 255, 0.04)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    padding: "52px 44px",
    maxWidth: "480px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  iconRing: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    background: "rgba(255,255,255,0.05)",
  },
  icon: {
    fontSize: "42px",
    lineHeight: 1,
  },
  code: {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "4px",
    textTransform: "uppercase",
    margin: "0 0 12px",
    opacity: 0.9,
  },
  title: {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 700,
    margin: "0 0 12px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "15px",
    lineHeight: 1.6,
    margin: "0 0 28px",
  },
  divider: {
    height: "1px",
    margin: "0 0 28px",
    opacity: 0.4,
  },
  actions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  btn: {
    padding: "12px 28px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    color: "#ffffff",
    transition: "opacity 0.2s, transform 0.15s",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  footer: {
    marginTop: "28px",
    color: "rgba(255,255,255,0.2)",
    fontSize: "12px",
    letterSpacing: "1px",
  },
};
