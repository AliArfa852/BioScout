import React from "react";

// Common UI components to be reused throughout the application

// Loading Spinner
export const LoadingSpinner = ({ size = "medium", message = "Loading..." }) => {
  const sizeClass = {
    small: "spinner-small",
    medium: "spinner-medium",
    large: "spinner-large"
  }[size] || "spinner-medium";

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClass}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

// Error Display
export const ErrorDisplay = ({ message, onRetry }) => {
  return (
    <div className="error-display">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{message || "An error occurred"}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

// Section Container
export const SectionContainer = ({ 
  title, 
  children, 
  className = "", 
  titleRight = null 
}) => {
  return (
    <section className={`section-container ${className}`}>
      <div className="section-header">
        {title && <h2 className="section-title">{title}</h2>}
        {titleRight && <div className="section-title-right">{titleRight}</div>}
      </div>
      <div className="section-content">{children}</div>
    </section>
  );
};

// Card Component
export const Card = ({ 
  title, 
  children, 
  className = "", 
  footer = null,
  onClick = null,
  hoverable = false 
}) => {
  return (
    <div 
      className={`card ${className} ${hoverable ? 'card-hoverable' : ''}`}
      onClick={onClick}
    >
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

// Button Component
export const Button = ({ 
  children, 
  onClick, 
  type = "primary", 
  size = "medium",
  disabled = false,
  fullWidth = false,
  icon = null,
  className = ""
}) => {
  return (
    <button
      className={`btn btn-${type} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

// Badge Component
export const Badge = ({ children, type = "default", className = "" }) => {
  return (
    <span className={`badge badge-${type} ${className}`}>
      {children}
    </span>
  );
};

// Empty State Component
export const EmptyState = ({ 
  title = "No data found", 
  message = "There's nothing to display here", 
  icon = "📭",
  action = null 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

// Toggle Switch Component
export const ToggleSwitch = ({ 
  checked, 
  onChange, 
  label = "", 
  id,
  disabled = false 
}) => {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          id={id}
          disabled={disabled}
        />
        <span className="toggle-slider"></span>
      </label>
      {label && <label htmlFor={id} className="toggle-label">{label}</label>}
    </div>
  );
};