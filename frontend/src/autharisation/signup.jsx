import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const STEP_FORM = 1;
const STEP_OTP = 2;

export default function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        department: "",
    });
    const [departments, setDepartments] = useState([]);
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(STEP_FORM);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    const formVariant = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
    };

    const showToast = (message, isError = false) => {
        setToast({ message, isError });
        setTimeout(() => setToast(null), 2000);
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/department`);
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch {}
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.department) {
            showToast("Please select a department", true);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                showToast(data.message || "OTP sent successfully");
                setStep(STEP_OTP);
            } else {
                showToast(data.message || "Signup failed", true);
            }
        } catch {
            showToast("Network error during signup", true);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, otp }),
            });
            const data = await res.json();

            if (res.ok) {
                showToast(data.message || "Verification successful");
                setTimeout(() => navigate("/"), 1500);
            } else {
                showToast(data.message || "OTP verification failed", true);
            }
        } catch {
            showToast("Network error", true);
        } finally {
            setLoading(false);
        }
    };

    const renderSignupForm = () => (
        <motion.form
            key="signup-form"
            onSubmit={handleSignupSubmit}
            className="space-y-4"
            variants={formVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.4 }}
        >
            <div>
                <label className="text-xs font-medium text-slate-600">Full name</label>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300"
                />
            </div>

            <div>
                <label className="text-xs font-medium text-slate-600">Email (Username)</label>
                <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300"
                />
            </div>

            <div>
                <label className="text-xs font-medium text-slate-600">Password</label>
                <div className="relative mt-1">
                    <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-emerald-500 transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium text-slate-600">Department</label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300"
                    >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                            <option key={dept.slug} value={dept.slug}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-medium text-white shadow-md disabled:bg-slate-300 disabled:text-slate-500"
            >
                {loading ? "Sending OTP..." : "Register & Send Verification Code"}
            </button>
        </motion.form>
    );

    const renderOtpForm = () => (
        <motion.form
            key="otp-form"
            onSubmit={handleOtpSubmit}
            className="space-y-4"
            variants={formVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.4 }}
        >
            <div className="p-4 bg-indigo-50 rounded-xl text-indigo-700 text-sm">
                <p>A 6-digit code has been sent to your email:</p>
                <p className="font-semibold">{formData.email}</p>
            </div>

            <div>
                <label className="text-xs font-medium text-slate-600">Verification Code</label>
                <input
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength="6"
                    className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-900 text-xl tracking-widest text-center focus:ring-2 focus:ring-emerald-400 focus:border-emerald-300"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full py-3 rounded-full bg-indigo-500 hover:bg-indigo-400 text-sm font-medium text-white shadow-md disabled:bg-slate-300 disabled:text-slate-500"
            >
                {loading ? "Verifying..." : "Verify OTP & Submit for Approval"}
            </button>

            <div className="text-center text-xs text-slate-500 mt-3">
                <button
                    type="button"
                    onClick={() => setStep(STEP_FORM)}
                    className="text-emerald-500 font-medium hover:underline"
                >
                    Go back to change details
                </button>
            </div>
        </motion.form>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-sky-100 flex items-center justify-center p-6">
            <AnimatePresence>
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
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-white/95 backdrop-blur border border-slate-200 rounded-3xl p-7 shadow-lg"
            >
                <div className="mb-5">
                    <p className="text-xs font-medium tracking-[0.2em] text-emerald-500 uppercase">
                        Join the portal
                    </p>
                    <h1 className="text-2xl font-semibold mt-2 text-slate-900">
                        {step === STEP_FORM ? "Create your account" : "Verify Email & OTP"}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {step === STEP_FORM
                            ? "Fill in your details to register."
                            : `Enter the code sent to ${formData.email}.`}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === STEP_FORM && renderSignupForm()}
                    {step === STEP_OTP && renderOtpForm()}
                </AnimatePresence>

                <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
                    Already registered?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-emerald-500 font-medium hover:underline"
                    >
                        Sign in
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
