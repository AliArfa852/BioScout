import React from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../components/common/UIComponents";

export default function HomePage() {
  const features = [
    {
      title: "AI-Powered Species Identification",
      description: "Upload images of plants and animals for instant AI identification",
      icon: "🔬",
      link: "/classify",
      color: "#1b5e20",
    },
    {
      title: "Interactive Biodiversity Map",
      description: "Explore species observations throughout Islamabad on our interactive map",
      icon: "🗺️",
      link: "/map",
      color: "#00695c",
    },
    {
      title: "Community Observations",
      description: "Browse and search through community-submitted biodiversity observations",
      icon: "👁️",
      link: "/observations",
      color: "#004d40",
    },
    {
      title: "Submit Your Observations",
      description: "Contribute to our biodiversity database by submitting your own observations",
      icon: "📝",
      link: "/submit",
      color: "#2e7d32",
    },
    {
      title: "Biodiversity Q&A",
      description: "Ask questions about local species, ecosystems, and conservation",
      icon: "❓",
      link: "/qa",
      color: "#00796b",
    },
    {
      title: "Data Dashboard",
      description: "View analytics and insights about Islamabad's biodiversity",
      icon: "📊",
      link: "/dashboard",
      color: "#388e3c",
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Discover & Protect Islamabad's Biodiversity</h1>
          <p>
            Join our community science initiative to document, analyze, and
            preserve the rich ecosystem of Pakistan's capital city.
          </p>
          <div className="hero-buttons">
            <Button 
              type="primary" 
              size="large"
              icon="🔬"
              onClick={() => window.location.href = '/classify'}
            >
              Identify Species
            </Button>
            <Button 
              type="secondary" 
              size="large"
              icon="📝"
              onClick={() => window.location.href = '/submit'}
            >
              Submit Observation
            </Button>
          </div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Explore BioScout Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <Link to={feature.link} key={index} className="feature-link">
              <Card
                className="feature-card"
                hoverable={true}
              >
                <div className="feature-icon" style={{ backgroundColor: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section">
        <h2>Making a Difference</h2>
        <div className="impact-stats">
          <div className="stat-card">
            <div className="stat-number">500+</div>
            <div className="stat-label">Species Documented</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1,200+</div>
            <div className="stat-label">Community Observations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10+</div>
            <div className="stat-label">Conservation Initiatives</div>
          </div>
        </div>
        <p className="impact-description">
          Every observation contributes to our understanding of Islamabad's
          ecosystem health and biodiversity patterns, informing conservation
          efforts and environmental policy.
        </p>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Get Involved Today</h2>
        <p>
          Join hundreds of citizen scientists documenting and protecting
          Islamabad's natural heritage.
        </p>
        <Button 
          type="primary" 
          size="large"
          onClick={() => window.location.href = '/about'}
        >
          Learn More About Our Mission
        </Button>
      </section>
    </div>
  );
}