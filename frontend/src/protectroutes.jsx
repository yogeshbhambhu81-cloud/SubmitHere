import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [status, setStatus] = useState("loading"); // "loading" | "ok" | reason-code string
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setStatus("NO_TOKEN");
        return;
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setStatus("ok");
        } else {
          // Read the error code the backend sends (TOKEN_EXPIRED / INVALID_TOKEN / NO_TOKEN)
          const body = await res.json().catch(() => ({}));
          const code = body.code || "NO_TOKEN";

          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setStatus(code);
        }
      } catch {
        // Network failure — treat as unauthenticated
        setStatus("NO_TOKEN");
      }
    };

    checkAuth();
  }, []);

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#0f0f1a",
      }}>
        <div style={{
          width: "36px", height: "36px",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTop: "3px solid #6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (status !== "ok") {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, reason: status }}
        replace
      />
    );
  }

  // ── Role gate ──────────────────────────────────────────────────────────────
  if (allowedRoles) {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role && !allowedRoles.includes(user.role)) {
        return (
          <Navigate
            to="/unauthorized"
            state={{ from: location, reason: "WRONG_ROLE" }}
            replace
          />
        );
      }
    } catch {
      return <Navigate to="/unauthorized" state={{ reason: "NO_TOKEN" }} replace />;
    }
  }

  return children;
}

