import React, { useState, useEffect } from "react";

const AchievementNotification = ({ achievement, onClose }) => {
  useEffect(() => {
    // Auto-close notification after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Get appropriate color based on achievement level
  const getBgColor = () => {
    switch (achievement.level) {
      case 3: return "#fff9c4"; // Gold
      case 2: return "#f5f5f5"; // Silver
      case 1: return "#fee8d6"; // Bronze
      default: return "#f5f5f5";
    }
  };
  
  return (
    <div className="achievement-notification" style={{ backgroundColor: getBgColor() }}>
      <div className="notification-content">
        <div className="achievement-icon">{achievement.icon}</div>
        <div className="achievement-info">
          <h4>New Achievement Unlocked!</h4>
          <p className="achievement-name">{achievement.name}</p>
          <p className="achievement-description">{achievement.description}</p>
        </div>
      </div>
      <button className="close-notification" onClick={onClose}>×</button>
    </div>
  );
};

export default AchievementNotification;