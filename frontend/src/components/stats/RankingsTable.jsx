import React, { useState } from "react";

const RankingsTable = ({ communityStats, username }) => {
  const [activeCategory, setActiveCategory] = useState('top_observers');
  
  // Map category keys to display names
  const categoryLabels = {
    top_observers: 'Top Observers',
    species_diversity: 'Species Diversity Leaders',
    location_explorers: 'Location Explorers',
    recent_contributors: 'Recent Contributors'
  };
  
  // Map category keys to data fields
  const categoryFields = {
    top_observers: { key: 'observations', label: 'Observations' },
    species_diversity: { key: 'unique_species', label: 'Species' },
    location_explorers: { key: 'unique_locations', label: 'Locations' },
    recent_contributors: { key: 'recent_observations', label: 'Recent Obs.' }
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };
  
  // Get current data based on active category
  const currentData = communityStats[activeCategory];
  const fieldInfo = categoryFields[activeCategory];
  
  return (
    <div className="rankings-container">
      <section className="community-overview paper">
        <h3>Community Overview</h3>
        <div className="community-stats">
          <div className="community-stat">
            <div className="community-stat-value">{communityStats.total_community_observations}</div>
            <div className="community-stat-label">Total Observations</div>
          </div>
          <div className="community-stat">
            <div className="community-stat-value">{communityStats.total_users}</div>
            <div className="community-stat-label">Contributors</div>
          </div>
        </div>
      </section>
      
      <section className="rankings-table paper">
        <div className="rankings-categories">
          {Object.keys(categoryLabels).map(category => (
            <button
              key={category}
              className={`category-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
        
        <div className="rankings-content">
          <h3>{categoryLabels[activeCategory]}</h3>
          
          <table className="rankings-table-content">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Contributor</th>
                <th>{fieldInfo.label}</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((user, index) => (
                <tr 
                  key={index}
                  className={user.name.toLowerCase() === username.toLowerCase() ? 'current-user' : ''}
                >
                  <td className="rank-cell">
                    {index + 1}
                    {index < 3 && (
                      <span className={`rank-medal rank-${index + 1}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </td>
                  <td className="name-cell">
                    {user.name}
                    {user.name.toLowerCase() === username.toLowerCase() && (
                      <span className="current-user-indicator"> (You)</span>
                    )}
                  </td>
                  <td className="value-cell">{user[fieldInfo.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="paper rankings-info">
        <h3>How Rankings Work</h3>
        <div className="info-content">
          <p>
            Rankings are calculated based on your contributions to the BioScout Islamabad community.
            Different categories highlight various aspects of biodiversity documentation:
          </p>
          
          <ul className="rankings-info-list">
            <li>
              <strong>Top Observers:</strong> Total number of submitted observations
            </li>
            <li>
              <strong>Species Diversity:</strong> Number of unique species documented
            </li>
            <li>
              <strong>Location Explorers:</strong> Number of different locations visited
            </li>
            <li>
              <strong>Recent Contributors:</strong> Activity in the last 30 days
            </li>
          </ul>
          
          <p>
            Rankings update daily based on community contributions. Keep submitting quality observations
            to improve your rank and earn more rewards!
          </p>
        </div>
      </section>
    </div>
  );
};

export default RankingsTable;