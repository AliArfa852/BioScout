import React, { useState, useEffect } from 'react';

const MobileStatsDrawer = ({ activeTab, onTabChange }) => {
  return (
    <div className="mobile-stats-drawer">
      <div className="drawer-tabs">
        <div 
          className={`drawer-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => onTabChange('overview')}
        >
          <div className="drawer-tab-icon">📊</div>
          <div className="drawer-tab-label">Overview</div>
        </div>
        
        <div 
          className={`drawer-tab ${activeTab === 'rewards' ? 'active' : ''}`}
          onClick={() => onTabChange('rewards')}
        >
          <div className="drawer-tab-icon">🏆</div>
          <div className="drawer-tab-label">Rewards</div>
        </div>
        
        <div 
          className={`drawer-tab ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => onTabChange('challenges')}
        >
          <div className="drawer-tab-icon">🎯</div>
          <div className="drawer-tab-label">Challenges</div>
        </div>
        
        <div 
          className={`drawer-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => onTabChange('trends')}
        >
          <div className="drawer-tab-icon">📈</div>
          <div className="drawer-tab-label">Trends</div>
        </div>
        
        <div 
          className={`drawer-tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => onTabChange('community')}
        >
          <div className="drawer-tab-icon">👥</div>
          <div className="drawer-tab-label">Community</div>
        </div>
      </div>
    </div>
  );
};

const ProgressAnimation = ({ value, maxValue, size = 100, strokeWidth = 8, color = '#2E7D32' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = value / maxValue;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div className="progress-animation" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out'
          }}
        />
        
        {/* Text value */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size / 4}
          fontWeight="bold"
          fill="#333"
        >
          {Math.round(progress * 100)}%
        </text>
      </svg>
    </div>
  );
};
