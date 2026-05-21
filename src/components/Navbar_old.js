import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.png";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if a user is logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || 'null');
    setCurrentUser(user);
  }, []);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Toggle dark/light theme
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.className = darkMode ? "light" : "dark";
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    navigate("/");
  };

  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""} ${darkMode ? "navbar-dark" : "navbar-light"}`}>
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="PreBhookh Logo" className="logo-img" />
        </Link>
      </div>

      <nav className="nav-links">
        {currentUser && currentUser.role === "user" && (
          <>
            <Link to="/user/dashboard">Dashboard</Link>
            <Link to="/user/book-table">Book Table</Link>
            <Link to="/user/preorder">Pre-Order</Link>
          </>
        )}
        {currentUser && currentUser.role === "owner" && (
          <>
            <Link to="/owner/dashboard">Dashboard</Link>
            <Link to="/owner/add-table">Add Table</Link>
            <Link to="/owner/add-menu">Add Menu</Link>
          </>
        )}
        {currentUser && currentUser.role === "admin" && (
          <>
            <Link to="/admin/dashboard">Admin Dashboard</Link>
          </>
        )}
      </nav>

      <div className="nav-actions">
        <button onClick={toggleTheme} className="theme-btn">
          {darkMode ? "☀️" : "🌙"}
        </button>

        {!currentUser ? (
          <>
            <Link to="/" className="btn">Login</Link>
            <Link to="/register" className="btn btn-outline">Register</Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: "10px" }}>Hi, {currentUser.name}</span>
            <button onClick={handleLogout} className="btn logout">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
