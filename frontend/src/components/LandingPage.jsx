import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import AboutUs from './AboutUs';

const LandingPage = () => {
  // State management
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [recentObservations, setRecentObservations] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [stats, setStats] = useState({
    totalObservations: 0,
    uniqueSpecies: 0,
    uniqueLocations: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState({
    observations: true,
    stats: true
  });
  const [error, setError] = useState({
    observations: null,
    stats: null
  });

  // Data fetching using useCallback for memoization
  const fetchObservations = useCallback(async () => {
    setLoading(prev => ({ ...prev, observations: true }));
    setError(prev => ({ ...prev, observations: null }));
    
    try {
      const response = await fetch("http://localhost:5000/api/observations");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch observations: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort by date (newest first) and take only the most recent 10
      const sortedData = data
        .sort((a, b) => new Date(b.date_observed) - new Date(a.date_observed))
        .slice(0, 10);
      
      setRecentObservations(sortedData);
      
      // Calculate statistics from observations data
      const uniqueSpecies = new Set(data.map(obs => obs.species_name)).size;
      const uniqueLocations = new Set(data.map(obs => obs.location)).size;
      const uniqueUsers = new Set(data.map(obs => obs.observer)).size;
      
      setStats(prev => ({
        ...prev,
        uniqueSpecies,
        uniqueLocations,
        totalUsers: uniqueUsers
      }));
      
      return data; // Return data for potential chaining
    } catch (err) {
      console.error("Error fetching observations:", err);
      setError(prev => ({ ...prev, observations: err.message }));
      return []; // Return empty array on error
    } finally {
      setLoading(prev => ({ ...prev, observations: false }));
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    setError(prev => ({ ...prev, stats: null }));
    
    try {
      const response = await fetch("http://localhost:5000/api/analytics");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }
      
      const data = await response.json();
      
      setStats(prev => ({
        ...prev,
        totalObservations: data.total_observations
      }));
      
      return data;
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(prev => ({ ...prev, stats: err.message }));
      return null;
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch observations and analytics in parallel
      await Promise.all([
        fetchObservations(),
        fetchAnalytics()
      ]);
    };
    
    fetchData();
  }, [fetchObservations, fetchAnalytics]);

  // Form handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Form validation
    if (!loginForm.email || !loginForm.password) {
      setLoginError('Email and password are required');
      return;
    }
    
    // Here you would typically integrate with your authentication service
    // For this example, we're using a simulated login
    const { updateUser } = useAuth();
    
    // Simulated login - replace with actual auth logic
    try {
      const user = {
        id: Date.now().toString(),
        name: loginForm.email.split('@')[0],
        email: loginForm.email,
      };
      
      updateUser(user);
      setShowLogin(false);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setLoginError('Login failed. Please try again.');
      console.error("Login error:", err);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegisterError('');
    
    // Form validation
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      setRegisterError('All fields are required');
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }
    
    // Here you would typically integrate with your registration service
    // For this example, we're using a simulated registration
    const { updateUser } = useAuth();
    
    // Simulated registration - replace with actual auth logic
    try {
      const user = {
        id: Date.now().toString(),
        name: registerForm.name,
        email: registerForm.email,
      };
      
      updateUser(user);
      setShowLogin(false);
      setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setRegisterError('Registration failed. Please try again.');
      console.error("Registration error:", err);
    }
  };

  // Retry logic for failed data fetches
  const handleRetryObservations = () => {
    fetchObservations();
  };

  const handleRetryStats = () => {
    fetchAnalytics();
  };

  // Loading status computations
  const isLoadingAny = loading.observations || loading.stats;
  const hasErrorAny = error.observations || error.stats;

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <h1>Discover and Protect Islamabad's Natural Heritage</h1>
          <p>Join our community of citizen scientists documenting and preserving the rich biodiversity of Islamabad and surrounding ecological areas.</p>
          <div className="hero-cta">
            {user ? (
              <Link to="/submit" className="cta-button primary">Submit Observation</Link>
            ) : (
              <button onClick={() => setShowLogin(true)} className="cta-button primary">Join BioScout</button>
            )}
            <Link to="/map" className="cta-button secondary">Explore Biodiversity Map</Link>
          </div>
        </div>
        <div className="hero-image-container">
          <div className="hero-image"></div>
        </div>
      </section>

      {/* Stats Dashboard - New Section */}
      <section className="stats-dashboard">
        <h2 className="section-title">Our Biodiversity Impact</h2>
        {loading.stats ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading community statistics...</p>
          </div>
        ) : error.stats ? (
          <div className="error-container">
            <p>Failed to load statistics: {error.stats}</p>
            <button onClick={handleRetryStats} className="btn primary">Retry</button>
          </div>
        ) : (
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">🔍</div>
              <div className="stat-value">{stats.totalObservations}</div>
              <div className="stat-label">Observations</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🦉</div>
              <div className="stat-value">{stats.uniqueSpecies}</div>
              <div className="stat-label">Species</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🗺️</div>
              <div className="stat-value">{stats.uniqueLocations}</div>
              <div className="stat-label">Locations</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Contributors</div>
            </div>
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="about-section">
        <h2 className="section-title">About BioScout Islamabad</h2>
        <AboutUs />
      </section>

      {/* Recent Observations Section */}
      <section className="recent-observations">
        <h2 className="section-title">Recent Biodiversity Sightings</h2>
        
        {loading.observations ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading recent observations...</p>
          </div>
        ) : error.observations ? (
          <div className="error-container">
            <p>Failed to load observations: {error.observations}</p>
            <button onClick={handleRetryObservations} className="btn primary">Retry</button>
          </div>
        ) : recentObservations.length === 0 ? (
          <div className="empty-state">
            <p>No observations found. Be the first to submit one!</p>
            {user ? (
              <Link to="/submit" className="btn primary">Submit Observation</Link>
            ) : (
              <button onClick={() => setShowLogin(true)} className="btn primary">Join to Submit</button>
            )}
          </div>
        ) : (
          <>
            <div className="observation-cards">
              {recentObservations.map(obs => (
                <div key={obs.observation_id} className="observation-card">
                  {obs.image_url && (
                    <div className="card-image-container">
                      <img 
                        src={obs.image_url} 
                        alt={obs.common_name} 
                        className="observation-image"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = '/placeholder-image.jpg';
                        }} 
                      />
                    </div>
                  )}
                  <div className="observation-details">
                    <h3>{obs.common_name} 
                      <span className="scientific-name">({obs.species_name})</span>
                    </h3>
                    <div className="observation-meta">
                      <span className="location">
                        <i className="location-icon"></i> {obs.location}
                      </span>
                      <span className="date">
                        <i className="date-icon"></i> {obs.date_observed}
                      </span>
                    </div>
                    <p className="observer">Observed by: {obs.observer}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="view-all">
              <Link to="/observations" className="view-all-link">View All Observations</Link>
            </div>
          </>
        )}
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How BioScout Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📱</div>
            <h3>Observe & Document</h3>
            <p>Spot wildlife or plants in Islamabad and take photos.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">🔍</div>
            <h3>AI Identification</h3>
            <p>Our AI helps identify species from your photos.</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">📊</div>
            <h3>Contribute to Science</h3>
            <p>Your data helps track biodiversity changes.</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-icon">🌍</div>
            <h3>Support Conservation</h3>
            <p>Insights drive protection of threatened species.</p>
          </div>
        </div>
      </section>

      {/* Login/Register Modal */}
      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-container" onClick={e => e.stopPropagation()}>
            <div className="login-tabs">
              <button 
                className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button 
                className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
              <button className="close-btn" onClick={() => setShowLogin(false)}>×</button>
            </div>
            
            <div className="login-content">
              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit}>
                  {loginError && <div className="error-message">{loginError}</div>}
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input 
                      type="password" 
                      id="password" 
                      name="password" 
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn primary full-width">Login</button>
                  <p className="auth-switch">
                    Don't have an account? <a href="#" onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('register');
                    }}>Register</a>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  {registerError && <div className="error-message">{registerError}</div>}
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-email">Email</label>
                    <input 
                      type="email" 
                      id="register-email" 
                      name="email" 
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="register-password">Password</label>
                    <input 
                      type="password" 
                      id="register-password" 
                      name="password" 
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input 
                      type="password" 
                      id="confirm-password" 
                      name="confirmPassword" 
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn primary full-width">Register</button>
                  <p className="auth-switch">
                    Already have an account? <a href="#" onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('login');
                    }}>Login</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;