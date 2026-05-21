import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { apiUrl } from "../../config/api.js";

const ROLES = [
  { value: "user",  label: "Diner",  icon: "🍽️", desc: "Browse restaurants & book tables" },
  { value: "owner", label: "Owner",  icon: "🏪", desc: "Manage your restaurant on PreBhookh" },
  { value: "admin", label: "Admin",  icon: "👑", desc: "Full platform administration" },
];

/* Mask email: niharika@gmail.com → ni*****@gmail.com */
const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
};

const Register = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* ── Step state: "form" | "otp" ── */
  // Support being redirected from Login when email is unverified
  const navState = location.state || {};
  const [step, setStep]           = useState(navState.step === "otp" ? "otp" : "form");
  const [pendingUserId, setPendingUserId] = useState(navState.pendingUserId || null);
  const [pendingEmail,  setPendingEmail]  = useState(navState.pendingEmail  || "");

  /* Form */
  const [formData, setFormData]   = useState({ name: "", email: "", password: "", role: "user" });
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  /* OTP */
  const [otp,          setOtp]          = useState(["", "", "", "", "", ""]);
  const [otpLoading,   setOtpLoading]   = useState(false);
  const [otpError,     setOtpError]     = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  /* Cooldown timer */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── Registration submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const toastId = toast.loading("Creating your account...");
    try {
      const res = await axios.post(apiUrl("/api/users/register"), formData);
      setPendingUserId(res.data.userId);
      setPendingEmail(res.data.email || formData.email);
      setStep("otp");
      setResendCooldown(60);
      toast.success("OTP sent to your email.", { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP digit input helpers ── */
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  /* ── OTP verify ── */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpLoading(true);
    setOtpError("");
    const toastId = toast.loading("Verifying OTP...");
    try {
      const res = await axios.post(apiUrl("/api/users/verify-otp"), {
        userId: pendingUserId,
        otp: code,
      });
      const { token, user } = res.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("currentUser", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));
      toast.success("Account verified. Welcome to PreBhookh.", { id: toastId });
      if (user.role === "admin")      navigate("/admin/dashboard");
      else if (user.role === "owner") navigate("/owner/dashboard");
      else                            navigate("/user/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP. Please try again.";
      setOtpError(msg);
      toast.error(msg, { id: toastId });
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const toastId = toast.loading("Sending a fresh OTP...");
    try {
      await axios.post(apiUrl("/api/users/resend-otp"), { userId: pendingUserId });
      setResendCooldown(60);
      setOtpError("");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast.success("A fresh OTP has been sent.", { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.message || "Could not resend OTP.";
      setOtpError(msg);
      toast.error(msg, { id: toastId });
    }
  };

  /* ══════════════════════════════════════════════════════
     SHARED LEFT PANEL
  ══════════════════════════════════════════════════════ */
  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&q=80&fit=crop"
          alt="Restaurant interior" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(160deg, rgba(8,12,18,0.95) 0%, rgba(8,12,18,0.6) 50%, rgba(8,12,18,0.9) 100%)"
        }} />
      </div>
      <div className="relative z-10 flex flex-col justify-between h-full p-14">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 16px rgba(44,122,92,0.5)" }}>PB</div>
          <span className="font-serif font-bold text-xl text-white">Pre<span style={{ color: "#C8A96A" }}>Bhookh</span></span>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="w-10 h-0.5 mb-6" style={{ background: "#C8A96A" }} />
          <h1 className="font-serif text-5xl font-bold text-white leading-tight mb-4">
            {step === "otp" ? "Check Your\nInbox." : "Join Our\nCommunity."}
          </h1>
          <p className="text-white/60 leading-relaxed max-w-xs">
            {step === "otp"
              ? "We sent a 6-digit verification code to your email. It expires in 10 minutes."
              : "Whether you dine or own, PreBhookh gives you the tools for extraordinary culinary experiences."}
          </p>
        </motion.div>
        <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#C8A96A" }}>Platform stats</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["500+", "Restaurants"], ["12K+", "Bookings"], ["4.9", "Rating"]].map(([v, l]) => (
              <div key={l}><p className="text-xl font-bold text-white font-serif">{v}</p><p className="text-xs text-white/40 mt-0.5">{l}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen w-full flex" style={{ background: "#080C12" }}>
      <LeftPanel />

      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto" style={{ background: "#080C12" }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1: REGISTRATION FORM ── */}
          {step === "form" && (
            <motion.div key="form" className="w-full max-w-[480px] my-auto"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}>

              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 mb-10 lg:hidden">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>PB</div>
                <span className="font-serif font-bold text-xl text-white">Pre<span style={{ color: "#C8A96A" }}>Bhookh</span></span>
              </div>

              <div className="mb-8">
                <h2 className="font-serif text-3xl font-bold text-white mb-2">Create account</h2>
                <p className="text-sm text-text-secondary">Fill in your details to get started.</p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Full Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    required placeholder="John Doe" className="input-dark" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Email Address</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    required placeholder="you@example.com" className="input-dark" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Password</label>
                  <input type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                    required placeholder="Min. 6 characters" className="input-dark" />
                </div>

                {/* Role selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>Account Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => setFormData(p => ({ ...p, role: r.value }))}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all duration-150"
                        style={{
                          background: formData.role === r.value ? "rgba(44,122,92,0.15)" : "rgba(255,255,255,0.03)",
                          border: formData.role === r.value ? "1px solid rgba(44,122,92,0.4)" : "1px solid rgba(255,255,255,0.07)",
                        }}>
                        <span className="text-xl">{r.icon}</span>
                        <span className="text-xs font-bold" style={{ color: formData.role === r.value ? "#2C7A5C" : "#8B9CB5" }}>{r.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#4A5568" }}>{ROLES.find(r => r.value === formData.role)?.desc}</p>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.99 } : {}}
                  className="mt-2 w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #2C7A5C 0%, #3A9970 100%)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.5)" }}>
                  {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending OTP…</> : "Continue →"}
                </motion.button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <span className="text-xs" style={{ color: "#4A5568" }}>Already have an account?</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              <Link to="/" className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                Sign In Instead
              </Link>
            </motion.div>
          )}

          {/* ── STEP 2: OTP VERIFICATION ── */}
          {step === "otp" && (
            <motion.div key="otp" className="w-full max-w-[420px] my-auto"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}>

              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 mb-10 lg:hidden">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>PB</div>
                <span className="font-serif font-bold text-xl text-white">Pre<span style={{ color: "#C8A96A" }}>Bhookh</span></span>
              </div>

              {/* Email icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "rgba(44,122,92,0.12)", border: "1px solid rgba(44,122,92,0.25)" }}>
                <svg className="w-8 h-8" style={{ color: "#2C7A5C" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="font-serif text-3xl font-bold text-white mb-2">Verify your email</h2>
              <p className="text-sm text-text-secondary mb-1">
                We sent a 6-digit code to
              </p>
              <p className="text-sm font-semibold mb-8" style={{ color: "#C8A96A" }}>
                {maskEmail(pendingEmail)}
              </p>

              {otpError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 rounded-xl flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{otpError}</p>
                </motion.div>
              )}

              <form onSubmit={handleVerifyOTP}>
                {/* 6-digit OTP boxes */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-8" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      className="w-10 h-11 sm:w-11 sm:h-12 text-center text-xl font-bold rounded-lg outline-none transition-all"
                      style={{
                        background: digit ? "rgba(44,122,92,0.12)" : "rgba(255,255,255,0.04)",
                        border: digit ? "1px solid rgba(44,122,92,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        color: "#F1F5F9",
                        boxShadow: digit ? "0 0 0 3px rgba(44,122,92,0.1)" : "none",
                      }}
                    />
                  ))}
                </div>

                <motion.button type="submit" disabled={otpLoading || otp.join("").length < 6}
                  whileHover={!otpLoading ? { scale: 1.01 } : {}} whileTap={!otpLoading ? { scale: 0.99 } : {}}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm tracking-wide disabled:opacity-40 flex items-center justify-center gap-2 mb-4"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 20px -4px rgba(44,122,92,0.5)" }}>
                  {otpLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</> : "Verify & Create Account"}
                </motion.button>
              </form>

              {/* Resend */}
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: "#4A5568" }}>Didn't receive the code?</p>
                <button onClick={handleResend} disabled={resendCooldown > 0}
                  className="text-sm font-semibold transition-all disabled:cursor-not-allowed"
                  style={{ color: resendCooldown > 0 ? "#4A5568" : "#2C7A5C" }}
                  onMouseEnter={e => { if (resendCooldown === 0) e.currentTarget.style.color = "#3A9970"; }}
                  onMouseLeave={e => { if (resendCooldown === 0) e.currentTarget.style.color = "#2C7A5C"; }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>

              {/* Back to form */}
              <button onClick={() => { setStep("form"); setOtp(["","","","","",""]); setOtpError(""); }}
                className="mt-6 w-full flex items-center justify-center gap-1.5 text-sm transition-colors"
                style={{ color: "#4A5568" }}
                onMouseEnter={e => e.currentTarget.style.color = "#8B9CB5"}
                onMouseLeave={e => e.currentTarget.style.color = "#4A5568"}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to registration
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Register;
