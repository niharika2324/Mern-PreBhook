import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { apiUrl } from "../../config/api.js";

const FEATURES = [
  { icon: "🍽️", text: "Instant table reservations" },
  { icon: "📱", text: "SMS confirmation & reminders" },
  { icon: "🧑‍🍳", text: "Pre-order from curated menus" },
  { icon: "⭐", text: "Exclusive member dining perks" },
];

const Login = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const toastId = toast.loading("Signing you in...");
    try {
      const res = await axios.post(apiUrl("/api/users/login"), loginData);
      const { token, user } = res.data;
      localStorage.setItem("authToken", token);
      localStorage.setItem("currentUser", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));
      toast.success(`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.`, { id: toastId });
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "owner") navigate("/owner/dashboard");
      else navigate("/user/dashboard");
    } catch (err) {
      const data = err.response?.data;
      // If account exists but email not verified, bounce to register OTP step
      if (data?.requiresVerification) {
        toast("Verify your email to continue.", { id: toastId });
        navigate("/register", {
          state: { pendingUserId: data.userId, pendingEmail: data.email, step: "otp" }
        });
        return;
      }
      const msg = data?.message || "Invalid credentials. Please try again.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#080C12" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400&q=80&fit=crop"
            alt="Fine dining"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, rgba(8,12,18,0.92) 0%, rgba(8,12,18,0.6) 60%, rgba(8,12,18,0.85) 100%)"
          }} />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 16px rgba(44,122,92,0.5)" }}>
              PB
            </div>
            <span className="font-serif font-bold text-xl text-white">
              Pre<span style={{ color: "#C8A96A" }}>Bhookh</span>
            </span>
          </div>

          {/* Hero text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-10 h-0.5 mb-6" style={{ background: "#C8A96A" }} />
              <h1 className="font-serif text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
                Culinary<br />
                <span style={{
                  background: "linear-gradient(135deg, #C8A96A 0%, #E8C97A 50%, #C8A96A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>Excellence.</span>
              </h1>
              <p className="text-lg text-white/60 max-w-md font-light leading-relaxed mb-10">
                Reserve your seat at the finest tables. Experience dining redefined through technology and taste.
              </p>

              {/* Feature pills */}
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="text-base">{f.icon}</span>
                    <span className="text-xs font-medium text-white/70">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom testimonial */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["E", "J", "S"].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-app flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: ["#2C7A5C", "#5C3D2E", "#1E3A5F"][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/50">
              <span className="text-white font-semibold">2,400+</span> happy diners this month
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 lg:p-14"
        style={{ background: "#080C12" }}>
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
              PB
            </div>
            <span className="font-serif font-bold text-xl text-white">Pre<span style={{ color: "#C8A96A" }}>Bhookh</span></span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-sm text-text-secondary">Sign in to your account to continue.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="input-dark"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B9CB5" }}>
                  Password
                </label>
                <button type="button" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: "#C8A96A" }}>
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="input-dark"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              className="mt-2 w-full py-3.5 rounded-xl font-semibold text-white text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loading ? "#2C7A5C" : "linear-gradient(135deg, #2C7A5C 0%, #3A9970 100%)",
                boxShadow: "0 4px 20px -4px rgba(44,122,92,0.5)"
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In…
                </>
              ) : "Sign In"}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs font-medium" style={{ color: "#4A5568" }}>New to PreBhookh?</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <Link
            to="/register"
            className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            Create an Account
          </Link>

          {/* Role hints */}
          <div className="mt-8 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#4A5568" }}>Demo Roles</p>
            <div className="flex flex-wrap gap-2">
              {[
                { role: "User", color: "#60A5FA" },
                { role: "Owner", color: "#C8A96A" },
                { role: "Admin", color: "#F87171" },
              ].map(r => (
                <span key={r.role} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}25` }}>
                  {r.role}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
