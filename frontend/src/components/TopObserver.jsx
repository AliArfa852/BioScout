import React, { useEffect, useState } from "react";

export default function TopObserver() {
  const [topObserver, setTopObserver] = useState(null);

  useEffect(() => {
    async function fetchTopObserver() {
      try {
        const res = await fetch("http://localhost:5000/api/gamification");
        const data = await res.json();
        setTopObserver(data);
      } catch {
        setTopObserver(null);
      }
    }
    fetchTopObserver();
  }, []);

  if (!topObserver) return null;

  return (
    <section
      style={{
        padding: "12px",
        backgroundColor: "#d0e8d0",
        borderRadius: "8px",
        textAlign: "center",
        marginBottom: "20px",
      }}
      aria-label="Top Observer"
    >
      <h3>🏅 Top Observer</h3>
      <p>
        <strong>{topObserver.top_observer}</strong> with{" "}
        <strong>{topObserver.submissions}</strong> submissions
      </p>
    </section>
  );
}
