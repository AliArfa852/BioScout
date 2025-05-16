import React from "react";

const UserStatsHeader = ({ username, rank, totalUsers, observations, species, locations }) => {
  // Calculate percentage rank in community
  const percentileRank = Math.round((1 - (rank / totalUsers)) * 100);
  
  return (
    <section className="user-stats-header paper">
      <div className="header-content">
        <div className="user-avatar-large">
          <div className="avatar-placeholder">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="user-info">
          <h2>{username}'s Biodiversity Stats</h2>
          
          <div className="rank-indicator">
            <div className="rank-badge">
              <span className="rank-number">#{rank}</span>
              <span className="rank-text">Community Rank</span>
            </div>
            
            <div className="rank-percentile">
              <div className="percentile-bar">
                <div 
                  className="percentile-fill" 
                  style={{ width: `${percentileRank}%` }}
                ></div>
              </div>
              <span className="percentile-text">
                Top {percentileRank}% of contributors
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="quick-stats">
        <div className="quick-stat">
          <div className="quick-stat-value">{observations}</div>
          <div className="quick-stat-label">Observations</div>
        </div>
        <div className="quick-stat">
          <div className="quick-stat-value">{species}</div>
          <div className="quick-stat-label">Species</div>
        </div>
        <div className="quick-stat">
          <div className="quick-stat-value">{locations}</div>
          <div className="quick-stat-label">Locations</div>
        </div>
      </div>
    </section>
  );
};

export default UserStatsHeader;