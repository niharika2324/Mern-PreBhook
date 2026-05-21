import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAuthPage = location.pathname === "/" || location.pathname === "/register";

  useEffect(() => {
    const load = () => {
      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "null");
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [location]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    setCurrentUser(null);
    navigate("/");
  };

  const navLinks = {
    user: [
      { to: "/restaurants",    label: "Restaurants" },
      { to: "/user/bookings",  label: "My Bookings" },
    ],
    owner: [
      { to: "/owner/dashboard", label: "Dashboard" },
      { to: "/owner/add-table", label: "Add Table" },
      { to: "/owner/add-menu",  label: "Add Menu" },
    ],
    admin: [
      { to: "/admin/dashboard",   label: "Admin Panel" },
      { to: "/admin/users",       label: "Users" },
      { to: "/admin/restaurants", label: "Restaurants" },
    ],
  };

  const links = currentUser ? navLinks[currentUser.role] || [] : [];

  if (isAuthPage) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-3 border-b border-white/5"
          : "py-5"
      }`}
      style={{
        background: isScrolled
          ? "rgba(8,12,18,0.85)"
          : "rgba(8,12,18,0.5)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">

        {/* Logo */}
        <Link to={currentUser ? `/${currentUser.role}/dashboard` : "/"} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)", boxShadow: "0 4px 12px rgba(44,122,92,0.4)" }}>
            PB
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-white">
            Pre<span className="text-brand-accent">Bhookh</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                location.pathname === l.to
                  ? "bg-white/8 text-white"
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {!currentUser ? (
            <>
              <Link to="/" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-brand text-sm py-2 px-5">
                Get Started
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-xl transition-all duration-150 border border-white/8 hover:border-white/15 hover:bg-white/4"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                  {currentUser.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white leading-none">{currentUser.name?.split(" ")[0]}</p>
                  <p className="text-[10px] text-text-muted leading-none mt-0.5 capitalize">{currentUser.role}</p>
                </div>
                <svg className={`w-3.5 h-3.5 text-text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden shadow-float"
                  style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-xs text-text-muted">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-text-muted truncate">{currentUser.email}</p>
                  </div>
                  <div className="py-1">
                    <Link to={`/${currentUser.role}/dashboard`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/4 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                      Dashboard
                    </Link>
                    {currentUser.role === "user" && (
                      <Link to="/user/bookings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/4 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        My Bookings
                      </Link>
                    )}
                  </div>
                  <div className="py-1 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-5 h-0.5 bg-white/70 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white/70 transition-all duration-300 ${mobileMenuOpen ? "opacity-0 scale-x-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white/70 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 mx-4 rounded-2xl overflow-hidden shadow-float"
          style={{ background: "#0E1520", border: "1px solid rgba(255,255,255,0.08)" }}>
          {currentUser && (
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                <p className="text-xs text-text-muted capitalize">{currentUser.role}</p>
              </div>
            </div>
          )}
          <div className="p-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to}
                className="flex items-center px-4 py-3 text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="p-3 border-t border-white/5">
            {!currentUser ? (
              <div className="flex flex-col gap-2">
                <Link to="/" className="w-full text-center py-3 text-sm font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-white/5 transition-colors">Sign In</Link>
                <Link to="/register" className="w-full text-center py-3 text-sm font-bold text-white rounded-xl transition-all"
                  style={{ background: "linear-gradient(135deg, #2C7A5C, #3A9970)" }}>Get Started</Link>
              </div>
            ) : (
              <button onClick={handleLogout}
                className="w-full py-3 text-sm font-medium text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/8 transition-colors">
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
