import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserStatsHeader from "./components/stats/UserStatsHeader";
import RewardsGallery from "./components/stats/RewardsGallery";
import StatsGraph from "./components/stats/StatsGraph";
import RankingsTable from "./components/stats/RankingsTable";
import ContributionMap from "./components/stats/ContributionMap";

const StatsPage = () => {
  // We'll simulate user from localStorage until you integrate with your auth system
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const [userStats, setUserStats] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    // Get user from localStorage or your auth system
    const savedUser = localStorage.getItem('bioscout_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user", error);
        navigate('/login');
        return;
      }
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }
    
    // Fetch user statistics
    fetchUserStats();
    
    // Fetch community leaderboard
    fetchCommunityLeaderboard();
  }, [navigate]);
  
  const fetchUserStats = async () => {
    // Make sure we have a user
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/user/stats/${encodeURIComponent(user.name)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      
      const data = await response.json();
      setUserStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message);
    }
  };
  
  const fetchCommunityLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/community/leaderboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch community leaderboard');
      }
      
      const data = await response.json();
      setCommunityStats(data);
    } catch (err) {
      console.error('Error fetching community stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your biodiversity stats...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container paper">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Error Loading Statistics</h3>
        <p>{error}</p>
        <button className="btn primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="stats-page">
      {userStats && (
        <>
          <UserStatsHeader 
            username={userStats.username} 
            rank={userStats.rank} 
            totalUsers={userStats.total_users}
            observations={userStats.total_observations}
            species={userStats.unique_species}
            locations={userStats.unique_locations}
          />
          
          <div className="stats-nav paper">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => handleTabChange('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
              onClick={() => handleTabChange('rewards')}
            >
              Rewards & Badges
            </button>
            <button 
              className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
              onClick={() => handleTabChange('trends')}
            >
              Contribution Trends
            </button>
            <button 
              className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => handleTabChange('community')}
            >
              Community Rankings
            </button>
          </div>
          
          {activeTab === 'overview' && (
            <div className="stats-overview">
              <section className="paper">
                <h3>Your Biodiversity Impact</h3>
                <div className="impact-stats">
                  <div className="impact-stat">
                    <div className="impact-icon">🔍</div>
                    <div className="impact-value">{userStats.total_observations}</div>
                    <div className="impact-label">Observations</div>
                  </div>
                  <div className="impact-stat">
                    <div className="impact-icon">🦉</div>
                    <div className="impact-value">{userStats.unique_species}</div>
                    <div className="impact-label">Species</div>
                  </div>
                  <div className="impact-stat">
                    <div className="impact-icon">🗺️</div>
                    <div className="impact-value">{userStats.unique_locations}</div>
                    <div className="impact-label">Locations</div>
                  </div>
                  <div className="impact-stat">
                    <div className="impact-icon">📊</div>
                    <div className="impact-value">#{userStats.rank}</div>
                    <div className="impact-label">Rank</div>
                  </div>
                </div>
              </section>
              
              <div className="two-column-stats">
                <section className="paper">
                  <h3>Your Top Species</h3>
                  <ul className="stats-list">
                    {userStats.top_species.map((species, index) => (
                      <li key={index} className="stats-list-item">
                        <span className="stats-item-name">{species.name}</span>
                        <span className="stats-item-count">{species.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                
                <section className="paper">
                  <h3>Your Top Locations</h3>
                  <ul className="stats-list">
                    {userStats.top_locations.map((location, index) => (
                      <li key={index} className="stats-list-item">
                        <span className="stats-item-name">{location.name}</span>
                        <span className="stats-item-count">{location.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              
              <section className="paper">
                <h3>Recent Activity</h3>
                <div className="recent-activity">
                  <div className="activity-stat">
                    <div className="activity-value">{userStats.recent_observations}</div>
                    <div className="activity-label">Observations in last 30 days</div>
                  </div>
                  
                  <StatsGraph 
                    data={userStats.monthly_trends} 
                    title="Your Monthly Observations"
                  />
                </div>
              </section>
              
              <section className="paper">
                <h3>Featured Rewards</h3>
                <div className="featured-rewards">
                  {userStats.rewards.slice(0, 3).map((reward, index) => (
                    <div key={index} className={`reward-card level-${reward.level}`}>
                      <div className="reward-icon">{reward.icon}</div>
                      <div className="reward-details">
                        <h4>{reward.name}</h4>
                        <p>{reward.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {userStats.rewards.length > 3 && (
                  <button 
                    className="btn secondary view-all-btn" 
                    onClick={() => handleTabChange('rewards')}
                  >
                    View All {userStats.rewards.length} Rewards
                  </button>
                )}
              </section>
            </div>
          )}
          
          {activeTab === 'rewards' && (
            <RewardsGallery rewards={userStats.rewards} />
          )}
          
          {activeTab === 'trends' && (
            <div className="trends-container">
              <section className="paper">
                <h3>Monthly Contribution Trends</h3>
                <StatsGraph 
                  data={userStats.monthly_trends} 
                  title="Your Monthly Observations"
                  fullSize={true}
                />
              </section>
              
              <section className="paper">
                <h3>Species Discovery Timeline</h3>
                <div className="no-data-message">
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <p>Detailed timeline coming soon!</p>
                </div>
              </section>
              
              <section className="paper">
                <h3>Contribution Hotspots</h3>
                <ContributionMap 
                  locations={userStats.top_locations}
                />
              </section>
            </div>
          )}
          
          {activeTab === 'community' && communityStats && (
            <RankingsTable communityStats={communityStats} username={userStats.username} />
          )}
        </>
      )}
    </div>
  );
};

export default StatsPage;