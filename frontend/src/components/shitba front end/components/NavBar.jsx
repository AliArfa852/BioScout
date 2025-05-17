import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();
  
  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>BioScout Islamabad</h1>
          <h4>AI for Community Biodiversity & Sustainable Insights</h4>
          <p>Event Date: May 16th, 2025</p>
        </Link>
      </div>

      <nav className="navbar-menu">
        <Link to="/" className={isActive("/") ? "active" : ""}>
          <span className="icon">🏠</span>
          <span>Home</span>
        </Link>

        <Link to="/dashboard" className={isActive("/dashboard") ? "active" : ""}>
          <span className="icon">📊</span>
          <span>Dashboard</span>
        </Link>

        <Link to="/submit" className={isActive("/submit") ? "active" : ""}>
          <span className="icon">📝</span>
          <span>Submit</span>
        </Link>

        <Link to="/observations" className={isActive("/observations") ? "active" : ""}>
          <span className="icon">🔍</span>
          <span>Observations</span>
        </Link>

        <Link to="/map" className={isActive("/map") ? "active" : ""}>
          <span className="icon">🗺️</span>
          <span>Map</span>
        </Link>

        <Link to="/qa" className={isActive("/qa") ? "active" : ""}>
          <span className="icon">❓</span>
          <span>Q&A</span>
        </Link>

        <Link to="/classify" className={isActive("/classify") ? "active" : ""}>
          <span className="icon">🔬</span>
          <span>Classify</span>
        </Link>

        <Link to="/about" className={isActive("/about") ? "active" : ""}>
          <span className="icon">ℹ️</span>
          <span>About</span>
        </Link>
      </nav>
    </header>
  );
}