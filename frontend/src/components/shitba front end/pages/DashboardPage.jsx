import React, { useState, useEffect } from "react";
import { 
  SectionContainer, 
  LoadingSpinner, 
  EmptyState,
  Card
} from "../components/common/UIComponents";

export default function DashboardPage({ observations, isLoading }) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get the current date in a readable format
  const getFormattedDate = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      setStatsLoading(true);
      setError(null);
      
      try {
        const res = await fetch("http://localhost:5000/api/analytics");
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data. Please try again later.");
      } finally {
        setStatsLoading(false);
      }
    }
    
    fetchAnalytics();
  }, []);

  // Function to get month name from date string
  const getMonthFromDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'long' });
  };
  
  // Group observations by month for the chart data
  const getMonthlyData = () => {
    if (!observations || observations.length === 0) return [];
    
    const monthCounts = {};
    observations.forEach(obs => {
      const month = getMonthFromDate(obs.date_observed);
      if (month) {
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    
    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count
    }));
  };

  // Calculate contribution percentages
  const calculateContributions = () => {
    if (!stats || !stats.top_observers) return [];
    
    const totalObservations = stats.total_observations || 0;
    if (totalObservations === 0) return [];
    
    return stats.top_observers.map(({ observer, count }) => ({
      observer,
      count,
      percentage: Math.round((count / totalObservations) * 100)
    }));
  };

  if (isLoading || statsLoading) {
    return <LoadingSpinner size="large" message="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Dashboard Error"
        message={error}
        icon="⚠️"
        action={
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Reload Dashboard
          </button>
        }
      />
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Biodiversity Dashboard</h1>
        <p className="dashboard-date">{getFormattedDate()}</p>
      </div>

      {/* Quick Stats Section */}
      <div className="stats-grid">
        <Card className="stat-card total-observations">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Observations</h3>
            <div className="stat-value">{stats?.total_observations || 0}</div>
          </div>
        </Card>
        
        <Card className="stat-card unique-species">
          <div className="stat-icon">🌿</div>
          <div className="stat-info">
            <h3>Unique Species</h3>
            <div className="stat-value">{stats?.unique_species || 0}</div>
          </div>
        </Card>
        
        <Card className="stat-card contributors">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Contributors</h3>
            <div className="stat-value">{stats?.total_observers || 0}</div>
          </div>
        </Card>
        
        <Card className="stat-card locations">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <h3>Locations</h3>
            <div className="stat-value">{stats?.unique_locations || 0}</div>
          </div>
        </Card>
      </div>

      <div className="dashboard-row">
        {/* Monthly Observations Chart */}
        <SectionContainer title="Monthly Observations" className="chart-section">
          <div className="chart-container">
            <div className="bar-chart">
              {getMonthlyData().map((item, index) => (
                <div className="bar-container" key={index}>
                  <div 
                    className="bar" 
                    style={{
                      height: `${Math.min(item.count * 5, 200)}px`,
                    }}
                  >
                    <span className="bar-value">{item.count}</span>
                  </div>
                  <div className="bar-label">{item.month}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>

        {/* Top Contributors Section */}
        <SectionContainer title="Top Contributors" className="contributors-section">
          <div className="contributors-list">
            {calculateContributions().map((contributor, index) => (
              <div className="contributor-item" key={index}>
                <div className="contributor-rank">{index + 1}</div>
                <div className="contributor-info">
                  <div className="contributor-name">{contributor.observer}</div>
                  <div className="contributor-bar-container">
                    <div 
                      className="contributor-bar"
                      style={{ width: `${contributor.percentage}%` }}
                    ></div>
                  </div>
                  <div className="contributor-stats">
                    <span className="contributor-count">{contributor.count} observations</span>
                    <span className="contributor-percentage">{contributor.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionContainer>
      </div>

      <div className="dashboard-row">
        {/* Popular Species Section */}
        <SectionContainer title="Most Observed Species" className="species-section">
          <div className="species-grid">
            {stats?.top_species?.slice(0, 6).map((species, index) => (
              <Card className="species-card" key={index}>
                <h4>{species.species}</h4>
                <div className="species-count">{species.count} observations</div>
              </Card>
            ))}
          </div>
        </SectionContainer>

        {/* Hotspot Locations Section */}
        <SectionContainer title="Biodiversity Hotspots" className="locations-section">
          <div className="locations-list">
            {stats?.top_locations?.map((location, index) => (
              <div className="location-item" key={index}>
                <div className="location-name">{location.location}</div>
                <div className="location-count">
                  <span className="count-badge">{location.count}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionContainer>
      </div>
    </div>
  );
}