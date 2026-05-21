import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === "/" || location.pathname === "/register";
  if (isAuthPage) return null;

  const handleProtectedLink = (e, path, requiredRole = "user") => {
    e.preventDefault();
    try {
      const u = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (!u) { navigate("/"); return; }
      if (u.role !== requiredRole) { navigate("/"); return; }
      navigate(path);
    } catch { navigate("/"); }
  };

  const LINKS = {
    Platform: [
      { label: "Home",          onClick: (e) => handleProtectedLink(e, "/user/dashboard", "user") },
      { label: "Book a Table",  onClick: (e) => handleProtectedLink(e, "/restaurants", "user") },
      { label: "Pre-Order",     onClick: (e) => handleProtectedLink(e, "/restaurants", "user") },
      { label: "My Bookings",   onClick: (e) => handleProtectedLink(e, "/user/bookings",   "user") },
    ],
    Company: [
      { label: "About Us",       href: "#" },
      { label: "Careers",        href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms",          href: "#" },
    ],
    "For Owners": [
      { label: "List Restaurant", href: "/register" },
      { label: "Owner Dashboard", onClick: (e) => handleProtectedLink(e, "/owner/dashboard", "owner") },
      { label: "Add Menu",        onClick: (e) => handleProtectedLink(e, "/owner/add-menu",  "owner") },
    ],
  };

  return (
    <footer style={{ background: "#060A10", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>PB</div>
              <span className="font-serif font-bold text-xl text-white">
                Pre<span style={{ color: "#C8A96A" }}>Bhookh</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-5" style={{ color: "#4A5568" }}>
              Smart table booking and food pre-ordering for modern, premium dining experiences across India.
            </p>
            {/* Social icons */}
            <div className="flex gap-2">
              {["🌐", "📸", "🐦", "💼"].map((icon, i) => (
                <button key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(44,122,92,0.15)"; e.currentTarget.style.borderColor = "rgba(44,122,92,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#C8A96A" }}>{title}</h4>
              <ul className="space-y-2.5">
                {links.map((l, i) => (
                  <li key={i}>
                    {l.href ? (
                      <Link to={l.href} className="text-sm transition-colors" style={{ color: "#4A5568" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#F1F5F9"}
                        onMouseLeave={e => e.currentTarget.style.color = "#4A5568"}>
                        {l.label}
                      </Link>
                    ) : (
                      <button onClick={l.onClick} className="text-sm text-left transition-colors" style={{ color: "#4A5568" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#F1F5F9"}
                        onMouseLeave={e => e.currentTarget.style.color = "#4A5568"}>
                        {l.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact chips */}
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            { icon: "📍", text: "Ahmedabad, India" },
            { icon: "📧", text: "support@prebhookh.com" },
            { icon: "📞", text: "+91 98765 43210" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#4A5568" }}>
              <span>{c.icon}</span>
              <span>{c.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs" style={{ color: "#2A3545" }}>
            © {new Date().getFullYear()} PreBhookh · All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#2A3545" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
            All systems operational
            <span className="mx-2">·</span>
            Designed for Premium Dining
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
