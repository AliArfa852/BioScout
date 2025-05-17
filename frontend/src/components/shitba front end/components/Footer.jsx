import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>BioScout Islamabad</h3>
          <p>AI for Community Biodiversity & Sustainable Insights</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/submit">Submit Observation</a></li>
            <li><a href="/map">Biodiversity Map</a></li>
            <li><a href="/classify">AI Classifier</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Connect</h3>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="mailto:contact@bioscout-islamabad.org">Email Us</a></li>
            <li><a href="https://github.com/bioscout-islamabad" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} BioScout Islamabad. All rights reserved.</p>
        <p>
          Developed by <a href="/about">Shitba, Manahil, and Ali</a> | FAST NUCES Islamabad
        </p>
      </div>
    </footer>
  );
}