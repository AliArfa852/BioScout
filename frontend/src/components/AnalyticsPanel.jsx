import React, { useEffect, useState } from "react";

export default function AnalyticsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("http://localhost:5000/api/analytics");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (!stats) return <p>Failed to load analytics.</p>;

  return (
    <section
      aria-label="Analytics Panel"
      style={{
        backgroundColor: "#d7f0d9",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 6px rgba(58, 90, 64, 0.3)",
      }}
    >
      <h2>Community Analytics</h2>

      <p><strong>Total Observations:</strong> {stats.total_observations}</p>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 45%", marginBottom: "15px" }}>
          <h3>Top Observers</h3>
          <ol>
            {stats.top_observers.map(({ observer, count }) => (
              <li key={observer}>
                {observer} — {count} submissions
              </li>
            ))}
          </ol>
        </div>

        <div style={{ flex: "1 1 45%", marginBottom: "15px" }}>
          <h3>Most Observed Species</h3>
          <ol>
            {stats.top_species.map(({ species, count }) => (
              <li key={species}>
                {species} — {count} observations
              </li>
            ))}
          </ol>
        </div>

        <div style={{ flex: "1 1 100%" }}>
          <h3>Popular Locations</h3>
          <ol>
            {stats.top_locations.map(({ location, count }) => (
              <li key={location}>
                {location} — {count} observations
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}