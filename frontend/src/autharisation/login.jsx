import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: ""});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
 const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2000);
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Login successful");

        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        if (data.departments)
          localStorage.setItem("departments", JSON.stringify(data.departments));

        if (data.redirect) {
          navigate(data.redirect);
        }
      } else {
        showToast(data.message || "Login failed", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Login error", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-sky-100 flex items-center justify-center p-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl text-sm font-medium transition-colors ${
            toast.isError ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          {toast.message}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/95 backdrop-blur border border-slate-200 rounded-3xl p-7 shadow-lg"
      >
        <div className="mb-5">
          <p className="text-xs font-medium tracking-[0.2em] text-indigo-500 uppercase">
            University Portal
          </p>
          <h1 className="text-2xl font-semibold mt-2 text-slate-900">
            Sign in to continue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access assignments, reviews and approvals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-sm pr-12 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-3 text-xs text-slate-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white shadow-md disabled:bg-slate-300 disabled:text-slate-500"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center text-xs text-slate-500 mt-3">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-indigo-500 font-medium hover:underline"
            >
              Create one
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
