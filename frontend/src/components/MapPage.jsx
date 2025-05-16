import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths for React apps (CRA etc)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const locationCoords = {
  "Margalla Hills": [33.7294, 73.0551],
  "Rawal Lake": [33.6844, 73.0780],
  "Shakarparian": [33.7060, 73.0479],
  "Pir Sohawa": [33.7430, 73.0571],
  "Daman-e-Koh": [33.7351, 73.0504],
  "Islamabad University Forest Area": [33.7000, 73.0750],
  "Faisal Mosque": [33.7296, 73.0371],
  "Rawal Dam": [33.6844, 73.0780],
  "Saidpur Village": [33.7247, 73.0491],
  "Shah Allah Ditta Caves": [33.7340, 72.9399],
  "Zoo vicinity": [33.7166, 73.0654],
};

export default function MapPage({ observations }) {
  // Map markers based on known locations
  const markers = observations
    .map((obs) => {
      for (const key in locationCoords) {
        if (obs.location && obs.location.toLowerCase().includes(key.toLowerCase())) {
          return { ...obs, latLng: locationCoords[key] };
        }
      }
      return null;
    })
    .filter(Boolean);

  return (
    <section aria-label="Observation Map" style={{ height: "450px", marginBottom: "20px" }}>
      <h2>Observation Map</h2>
      <MapContainer center={[33.7, 73.05]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((obs) => (
          <Marker key={obs.observation_id} position={obs.latLng}>
            <Popup>
              <strong>{obs.common_name} ({obs.species_name})</strong><br />
              {obs.date_observed} at {obs.location}<br />
              Observer: {obs.observer}<br />
              Notes: {obs.notes}<br />
              {obs.image_url && (
                <img
                  src={obs.image_url}
                  alt={obs.common_name}
                  style={{ width: "100%", marginTop: "5px", borderRadius: "6px" }}
                />
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
