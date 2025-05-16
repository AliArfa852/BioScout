import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import UserStatsHeader from '../components/stats/UserStatsHeader';
import RewardsGallery from '../components/stats/RewardsGallery';
import StatsGraph from '../components/stats/StatsGraph';
import RankingsTable from '../components/stats/RankingsTable';
import ContributionMap from '../components/stats/ContributionMap';
import MobileStatsDrawer from '../components/stats/MobileStatsDrawer';
import ChallengeTracker from '../components/stats/ChallengeTracker';
import AchievementNotification from '../components/stats/AchievementNotification';
import ProgressAnimation from '../components/stats/ProgressAnimation';

// Configure API base URL for different environments
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const StatsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [userStats, setUserStats] = useState(null);
  const [communityStats, setCommunityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);
  
  // Use useCallback to memoize fetch functions so they can be used in dependency array
  const fetchUserStats = useCallback(async () => {
    if (!user?.name) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/stats/${encodeURIComponent(user.name)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch user statistics (${response.status})`);
      }
      
      const data = await response.json();
      setUserStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message);
    }
  }, [user]);
  
  const fetchCommunityLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/leaderboard`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch community leaderboard (${response.status})`);
      }
      
      const data = await response.json();
      setCommunityStats(data);
    } catch (err) {
      console.error('Error fetching community stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchChallenges = useCallback(async () => {
    if (!user?.name) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/challenges/${encodeURIComponent(user.name)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch challenges (${response.status})`);
      }
      const data = await response.json();
      setActiveChallenges(data.challenges || []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      // Don't set error state here as this is not a critical feature
    }
  }, [user]);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Set loading to true when starting a new fetch
    setLoading(true);
    setError(null);
    
    // Fetch all data
    Promise.all([
      fetchUserStats(),
      fetchCommunityLeaderboard(),
      fetchChallenges()
    ]).catch(err => {
      console.error('Error in data fetching:', err);
      setLoading(false);
    });
    
    // Simulate a new achievement notification after 3 seconds (for demo purposes)
    const timer = setTimeout(() => {
      setNewAchievement({
        id: "location-visitor",
        name: "Location Visitor",
        description: "Visited 3+ different locations",
        icon: "🗺️",
        level: 1
      });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [user, navigate, fetchUserStats, fetchCommunityLeaderboard, fetchChallenges]);
  
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
        <button className="btn primary" onClick={() => {
          setLoading(true);
          setError(null);
          Promise.all([fetchUserStats(), fetchCommunityLeaderboard()])
            .finally(() => setLoading(false));
        }}>
          Try Again
        </button>
      </div>
    );
  }
  
  // Check if we have the necessary data
  if (!userStats) {
    return (
      <div className="error-container paper">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>User Data Not Found</h3>
        <p>We couldn't find your statistics data. Please try again later.</p>
        <button className="btn primary" onClick={() => {
          setLoading(true);
          fetchUserStats().finally(() => setLoading(false));
        }}>
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="stats-page">
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
        <button 
          className={`tab-button ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => handleTabChange('challenges')}
        >
          Challenges
        </button>
      </div>
      
      <MobileStatsDrawer activeTab={activeTab} onTabChange={handleTabChange} />
      
      {newAchievement && (
        <AchievementNotification 
          achievement={newAchievement} 
          onClose={() => setNewAchievement(null)} 
        />
      )}
      
      {activeTab === 'overview' && (
        <div className="stats-overview">
          <section className="paper">
            <h3>Your Biodiversity Impact</h3>
            <div className="impact-stats">
              <div className="impact-stat">
                <div className="impact-icon">🔍</div>
                <div className="impact-value">{userStats.total_observations || 0}</div>
                <div className="impact-label">Observations</div>
              </div>
              <div className="impact-stat">
                <div className="impact-icon">🦉</div>
                <div className="impact-value">{userStats.unique_species || 0}</div>
                <div className="impact-label">Species</div>
              </div>
              <div className="impact-stat">
                <div className="impact-icon">🗺️</div>
                <div className="impact-value">{userStats.unique_locations || 0}</div>
                <div className="impact-label">Locations</div>
              </div>
              <div className="impact-stat">
                <div className="impact-icon">📊</div>
                <div className="impact-value">#{userStats.rank || '-'}</div>
                <div className="impact-label">Rank</div>
              </div>
            </div>
            
            <div className="progress-overview">
              <ProgressAnimation value={userStats.unique_species || 0} maxValue={30} color="#4CAF50" />
              <ProgressAnimation value={userStats.unique_locations || 0} maxValue={10} color="#2196F3" />
            </div>
          </section>
          
          <div className="two-column-stats">
            <section className="paper">
              <h3>Your Top Species</h3>
              {userStats.top_species && userStats.top_species.length > 0 ? (
                <ul className="stats-list">
                  {userStats.top_species.map((species, index) => (
                    <li key={index} className="stats-list-item">
                      <span className="stats-item-name">{species.name}</span>
                      <span className="stats-item-count">{species.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No species data available</p>
              )}
            </section>
            
            <section className="paper">
              <h3>Your Top Locations</h3>
              {userStats.top_locations && userStats.top_locations.length > 0 ? (
                <ul className="stats-list">
                  {userStats.top_locations.map((location, index) => (
                    <li key={index} className="stats-list-item">
                      <span className="stats-item-name">{location.name}</span>
                      <span className="stats-item-count">{location.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-data">No location data available</p>
              )}
            </section>
          </div>
          
          <section className="paper">
            <h3>Recent Activity</h3>
            <div className="recent-activity">
              <div className="activity-stat">
                <div className="activity-value">{userStats.recent_observations || 0}</div>
                <div className="activity-label">Observations in last 30 days</div>
              </div>
              
              {userStats.monthly_trends && userStats.monthly_trends.length > 0 ? (
                <StatsGraph 
                  data={userStats.monthly_trends} 
                  title="Your Monthly Observations"
                />
              ) : (
                <div className="no-data-message">
                  <p>No trend data available yet</p>
                </div>
              )}
            </div>
          </section>
          
          <section className="paper">
            <h3>Featured Rewards</h3>
            {userStats.rewards && userStats.rewards.length > 0 ? (
              <>
                <div className="featured-rewards">
                  {userStats.rewards.slice(0, 3).map((reward, index) => (
                    <div key={index} className={`reward-card level-${reward.level || 'basic'}`}>
                      <div className="reward-icon">{reward.icon || '🏆'}</div>
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
              </>
            ) : (
              <p className="no-data">No rewards earned yet</p>
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
      
      {activeTab === 'challenges' && (
        <ChallengeTracker challenges={activeChallenges} />
      )}
    </div>
  );
};

export default StatsPage;