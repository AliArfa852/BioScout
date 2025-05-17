import React, { createContext, useContext, useState, useEffect } from "react";
import { HashRouter  as Router, Routes, Route, Navigate } from "react-router-dom";
import EnhancedBanner from "./components/EnhancedBanner";
import LandingPage from "./components/LandingPage";
import ObservationForm from "./components/ObservationForm";
import ObservationList from "./components/ObservationList";
import MapPage from "./components/MapPage";
import EnhancedQASection from "./components/EnhancedQASection";
import TopObserver from "./components/TopObserver";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AboutUs from "./components/AboutUs";
import StatsPage from "./StatsPage";
import "./styles.css";

// Create Auth Context
export const AuthContext = createContext();

// Create useAuth hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Login Page component
const LoginPage = () => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Simulated login
    const user = {
      id: Date.now().toString(),
      name: formData.email.split('@')[0],
      email: formData.email,
    };

    updateUser(user);
  };

  return (
    <div className="auth-page">
      <div className="paper auth-container">
        <h2>Login to BioScout</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn primary full-width">
            Login
          </button>
        </form>
        
        <p className="auth-switch">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

// Register Page component
const RegisterPage = () => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const user = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
    };

    updateUser(user);
  };

  return (
    <div className="auth-page">
      <div className="paper auth-container">
        <h2>Register for BioScout</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="btn primary full-width">
            Register
          </button>
        </form>
        
        <p className="auth-switch">
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

// Navigation component
const Navigation = () => {
  const { user, updateUser } = useAuth();

  const handleLogout = () => {
    updateUser(null);
  };

  return (
    <nav className="navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/observations">Observations</a></li>
        {user && <li><a href="/submit">Submit</a></li>}
        <li><a href="/map">Map</a></li>
        <li><a href="/qa">Q&A</a></li>
        <li><a href="/analytics">Analytics</a></li>
        {user && <li><a href="/stats">My Stats</a></li>}
        <li><a href="/about">About</a></li>
      </ul>

      <div className="auth-controls">
        {user ? (
          <>
            <span className="user-greeting">Welcome, {user.name}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        ) : (
          <>
            <a href="/login" className="login-link">Login</a>
            <a href="/register" className="register-link">Register</a>
          </>
        )}
      </div>
    </nav>
  );
};

// Main App component
export default function App() {
  const [observations, setObservations] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bioscout_user'));
    } catch {
      return null;
    }
  });

  const updateUser = useCallback((userData) => {
    try {
      if (userData) localStorage.setItem('bioscout_user', JSON.stringify(userData));
      else localStorage.removeItem('bioscout_user');
      setUser(userData);
    } catch (err) {
      console.error("localStorage error:", err);
    }
  }, []);

  const fetchObservations = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/observations");
      const data = await res.json();
      setObservations(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      const data = await fetchObservations();
      if (isActive) setObservations(data);
    };
    loadData();
    return () => { isActive = false; };
  }, [fetchObservations]);

  const handleSubmit = useCallback(async (obs) => {
    const formData = new FormData();
    // Append all fields...
    try {
      await fetch("http://localhost:5000/api/submit", { method: "POST", body: formData });
      await fetchObservations(); // Re-fetch only after success
    } catch (err) {
      console.error("Submit error:", err);
      throw err;
    }
  }, [fetchObservations]);

//   return (
//     <AuthContext.Provider value={{ user, updateUser }}>
//       <Router>
//         <EnhancedBanner />
//         <Navigation />
//         <main style={{ maxWidth: "900px", margin: "auto", padding: "10px" }}>
//           <Routes>
//             <Route path="/" element={<LandingPage />} />
//             {/* Other routes... */}
//           </Routes>
//         </main>
//       </Router>
//     </AuthContext.Provider>
//   );
// }
  return (
    <AuthContext.Provider value={{ user, updateUser }}>
      <Router>
        <EnhancedBanner />
        <Navigation />
        <main style={{ maxWidth: "900px", margin: "auto", padding: "10px" }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/submit" element={<ProtectedRoute><ObservationForm onSubmit={handleSubmit} /></ProtectedRoute>} />
            <Route path="/observations" element={<ObservationList observations={observations} />} />
            <Route path="/map" element={<MapPage observations={observations} />} />
            <Route path="/qa" element={<EnhancedQASection />} />
            <Route path="/analytics" element={<AnalyticsPanel />} />
            <Route path="/about" element={<AboutUs />} />
          </Routes>
        </main>
      </Router>
    </AuthContext.Provider>
  );
}