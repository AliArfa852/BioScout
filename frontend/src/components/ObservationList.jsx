import React, { useState } from "react";

export default function ObservationList({ observations }) {
  const [showAll, setShowAll] = useState(false);

  const displayObservations = showAll ? observations : observations.slice(0, 50);

  return (
    <section aria-label="Biodiversity Observations List" style={{ marginBottom: "20px" }}>
      <h2>Observations List { !showAll && `(Showing 50 of ${observations.length})` }</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {displayObservations.map((obs) => (
          <li key={obs.observation_id} style={{ borderBottom: "1px solid #ccc", padding: "10px 0" }}>
            <strong>{obs.common_name} ({obs.species_name})</strong> — <em>{obs.date_observed}</em> at <em>{obs.location}</em><br />
            Observer: <em>{obs.observer}</em><br />
            Notes: {obs.notes}<br />
            {obs.image_url && (
              <img
                src={obs.image_url}
                alt={obs.common_name}
                style={{ maxWidth: "150px", borderRadius: "6px", marginTop: "5px" }}
              />
            )}
          </li>
        ))}
      </ul>

      {observations.length > 50 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ marginTop: "10px" }}
          aria-expanded={showAll}
        >
          {showAll ? "Show Less" : "Show All"}
        </button>
      )}
    </section>
  );
}

