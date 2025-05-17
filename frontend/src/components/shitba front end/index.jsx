import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Polyfills or global configurations could be added here

/**
 * Initialize the React application by creating a root and rendering the App component
 * 
 * The createRoot API is part of React 18's concurrent rendering features
 * which enables improved performance and new capabilities.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the application with StrictMode for additional development checks
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If implementing service worker for PWA functionality:
// registerServiceWorker();

/**
 * Performance monitoring could be added here
 * Example: reportWebVitals(console.log);
 */