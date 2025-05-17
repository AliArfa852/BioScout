import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { LoadingSpinner, SectionContainer, Card, Badge } from "../components/common/UIComponents";
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

// Known Islamabad location coordinates
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

// Custom marker icons for different species categories
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: `custom-icon-${color}`,
    // We can add a style tag in the component to color these icons
  });
};

// Icons for different categories
const plantIcon = createCustomIcon('green');
const birdIcon = createCustomIcon('blue');
const mammalIcon = createCustomIcon('red');
const reptileIcon = createCustomIcon('orange');
const insectIcon = createCustomIcon('purple');
const otherIcon = createCustomIcon('gray');

export default function MapViewPage({ observations, isLoading }) {
  const [mapCenter, setMapCenter] = useState([33.7, 73.05]); // Default center for Islamabad
  const [mapZoom, setMapZoom] = useState(12);
  const [activeSpeciesFilter, setActiveSpeciesFilter] = useState('all');
  const [activeTimeFilter, setActiveTimeFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Get markers based on known locations
  const markers = useMemo(() => {
    if (!observations) return [];
    
    return observations
      .map((obs) => {
        // Try to find location in our known coordinates
        for (const key in locationCoords) {
          if (obs.location && obs.location.toLowerCase().includes(key.toLowerCase())) {
            // Add some randomness to prevent markers from stacking exactly on top of each other
            const jitter = () => (Math.random() - 0.5) * 0.005;
            const latLng = [
              locationCoords[key][0] + jitter(), 
              locationCoords[key][1] + jitter()
            ];
            
            // Determine icon based on species name (simplified logic)
            let icon = otherIcon;
            const speciesLower = (obs.species_name || "").toLowerCase();
            
            if (speciesLower.includes("pinus") || 
                speciesLower.includes("quercus") || 
                speciesLower.includes("plant") ||
                speciesLower.includes("tree") ||
                speciesLower.includes("flower")) {
              icon = plantIcon;
              obs.category = "plant";
            } else if (speciesLower.includes("bird") || 
                       speciesLower.includes("aves") ||
                       speciesLower.includes("eagle") ||
                       speciesLower.includes("sparrow")) {
              icon = birdIcon;
              obs.category = "bird";
            } else if (speciesLower.includes("mammal") ||
                       speciesLower.includes("cat") ||
                       speciesLower.includes("fox") ||
                       speciesLower.includes("monkey")) {
              icon = mammalIcon; 
              obs.category = "mammal";
            } else if (speciesLower.includes("reptile") ||
                       speciesLower.includes("snake") ||
                       speciesLower.includes("lizard")) {
              icon = reptileIcon;
              obs.category = "reptile";
            } else if (speciesLower.includes("insect") ||
                       speciesLower.includes("butterfly") ||
                       speciesLower.includes("beetle")) {
              icon = insectIcon;
              obs.category = "insect";
            } else {
              obs.category = "other";
            }
            
            // Add date category for filtering
            const obsDate = new Date(obs.date_observed);
            const now = new Date();
            const daysDiff = Math.floor((now - obsDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 7) {
              obs.timeCategory = "week";
            } else if (daysDiff <= 30) {
              obs.timeCategory = "month";
            } else if (daysDiff <= 90) {
              obs.timeCategory = "quarter";
            } else {
              obs.timeCategory = "older";
            }
            
            return { ...obs, latLng, icon };
          }
        }
        return null;
      })
      .filter(Boolean);
  }, [observations]);

  // Apply filters to markers
  const filteredMarkers = useMemo(() => {
    if (!markers) return [];
    
    return markers.filter(marker => {
      // Filter by species category
      const matchesCategory = activeSpeciesFilter === 'all' || marker.category === activeSpeciesFilter;
      
      // Filter by time period
      const matchesTime = activeTimeFilter === 'all' || marker.timeCategory === activeTimeFilter;
      
      return matchesCategory && matchesTime;
    });
  }, [markers, activeSpeciesFilter, activeTimeFilter]);

  // Generate heatmap data based on observations
  const heatmapData = useMemo(() => {
    const locationCounts = {};
    
    // Count observations per location
    filteredMarkers.forEach(marker => {
      const locKey = marker.location;
      locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;
    });
    
    // Create circle markers for heatmap
    return Object.entries(locationCounts).map(([location, count]) => {
      // Find the coordinates for this location
      let coords = null;
      for (const key in locationCoords) {
        if (location.toLowerCase().includes(key.toLowerCase())) {
          coords = locationCoords[key];
          break;
        }
      }
      
      if (!coords) return null;
      
      // Scale the circle size and color based on count
      const radius = Math.min(Math.max(count * 5, 20), 100);
      const intensity = Math.min(count / 10, 1); // 0-1 scale for color intensity
      
      return {
        location,
        coords,
        count,
        radius,
        intensity
      };
    }).filter(Boolean);
  }, [filteredMarkers]);

  // Handle location selection for filtering
  const handleLocationSelect = (location) => {
    if (selectedLocation === location) {
      setSelectedLocation(null); // Toggle off if already selected
    } else {
      setSelectedLocation(location);
      
      // Center map on selected location
      for (const key in locationCoords) {
        if (location.toLowerCase().includes(key.toLowerCase())) {
          setMapCenter(locationCoords[key]);
          setMapZoom(14); // Zoom in
          break;
        }
      }
    }
  };

  // Format date for display
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  if (isLoading) {
    return <LoadingSpinner size="large" message="Loading map data..." />;
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Biodiversity Map</h1>
        <p className="map-subtitle">
          Explore {filteredMarkers.length} biodiversity observations across Islamabad
        </p>
      </div>
      
      <div className="map-controls">
        <div className="filter-section">
          <h3>Filters</h3>
          
          <div className="filter-buttons species-filters">
            <button 
              className={`filter-button ${activeSpeciesFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('all')}
            >
              All Species
            </button>
            <button 
              className={`filter-button plant ${activeSpeciesFilter === 'plant' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('plant')}
            >
              Plants
            </button>
            <button 
              className={`filter-button bird ${activeSpeciesFilter === 'bird' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('bird')}
            >
              Birds
            </button>
            <button 
              className={`filter-button mammal ${activeSpeciesFilter === 'mammal' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('mammal')}
            >
              Mammals
            </button>
            <button 
              className={`filter-button reptile ${activeSpeciesFilter === 'reptile' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('reptile')}
            >
              Reptiles
            </button>
            <button 
              className={`filter-button insect ${activeSpeciesFilter === 'insect' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('insect')}
            >
              Insects
            </button>
            <button 
              className={`filter-button other ${activeSpeciesFilter === 'other' ? 'active' : ''}`}
              onClick={() => setActiveSpeciesFilter('other')}
            >
              Other
            </button>
          </div>
          
          <div className="filter-buttons time-filters">
            <button 
              className={`filter-button ${activeTimeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTimeFilter('all')}
            >
              All Time
            </button>
            <button 
              className={`filter-button ${activeTimeFilter === 'week' ? 'active' : ''}`}
              onClick={() => setActiveTimeFilter('week')}
            >
              Last Week
            </button>
            <button 
              className={`filter-button ${activeTimeFilter === 'month' ? 'active' : ''}`}
              onClick={() => setActiveTimeFilter('month')}
            >
              Last Month
            </button>
            <button 
              className={`filter-button ${activeTimeFilter === 'quarter' ? 'active' : ''}`}
              onClick={() => setActiveTimeFilter('quarter')}
            >
              Last 3 Months
            </button>
          </div>
          
          <div className="map-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={() => setShowHeatmap(!showHeatmap)}
              />
              <span className="slider round"></span>
              <span className="toggle-label">Show Biodiversity Heatmap</span>
            </label>
          </div>
        </div>
        
        <div className="location-filter">
          <h3>Locations</h3>
          <div className="location-buttons">
            {Object.keys(locationCoords).map((location, index) => (
              <button
                key={index}
                className={`location-button ${selectedLocation && selectedLocation.includes(location) ? 'active' : ''}`}
                onClick={() => handleLocationSelect(location)}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "600px", width: "100%" }}
          whenCreated={(map) => {
            map.on('zoom', () => setMapZoom(map.getZoom()));
            map.on('moveend', () => setMapCenter(map.getCenter()));
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Standard markers when not showing heatmap */}
          {!showHeatmap && filteredMarkers.map((obs) => (
            <Marker
              key={obs.observation_id}
              position={obs.latLng}
              icon={obs.icon}
            >
              <Popup>
                <div className="map-popup">
                  <h3>{obs.common_name}</h3>
                  <p className="scientific-name">({obs.species_name})</p>
                  <div className="popup-details">
                    <p><strong>Date:</strong> {formatDate(obs.date_observed)}</p>
                    <p><strong>Location:</strong> {obs.location}</p>
                    <p><strong>Observer:</strong> {obs.observer || "Anonymous"}</p>
                    {obs.notes && <p><strong>Notes:</strong> {obs.notes}</p>}
                  </div>
                  {obs.image_url && (
                    <img
                      src={obs.image_url}
                      alt={obs.common_name}
                      className="popup-image"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Heatmap layer */}
          {showHeatmap && (
            <LayerGroup>
              {heatmapData.map((item, index) => (
                <CircleMarker
                  key={index}
                  center={item.coords}
                  radius={item.radius}
                  pathOptions={{
                    fillColor: `rgba(255, 0, 0, ${item.intensity})`, 
                    color: 'rgba(0, 0, 0, 0.3)',
                    fillOpacity: 0.5,
                    weight: 1
                  }}
                >
                  <Popup>
                    <div className="heatmap-popup">
                      <h3>{item.location}</h3>
                      <p><strong>{item.count}</strong> observations in this area</p>
                      <p>Click to see details of specific observations</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </LayerGroup>
          )}
        </MapContainer>
      </div>
      
      <div className="map-stats">
        <Card className="stats-card">
          <h3>Map Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{filteredMarkers.length}</div>
              <div className="stat-label">Observations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {new Set(filteredMarkers.map(m => m.species_name)).size}
              </div>
              <div className="stat-label">Species</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {new Set(filteredMarkers.map(m => m.location)).size}
              </div>
              <div className="stat-label">Locations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {new Set(filteredMarkers.map(m => m.observer).filter(Boolean)).size}
              </div>
              <div className="stat-label">Observers</div>
            </div>
          </div>
        </Card>
      </div>
      
      <style jsx>{`
        /* Custom icon styles */
        .custom-icon-green {
          filter: hue-rotate(120deg);
        }
        .custom-icon-blue {
          filter: hue-rotate(240deg);
        }
        .custom-icon-red {
          filter: hue-rotate(0deg);
        }
        .custom-icon-orange {
          filter: hue-rotate(30deg);
        }
        .custom-icon-purple {
          filter: hue-rotate(270deg);
        }
        .custom-icon-gray {
          filter: saturate(0);
        }
      `}</style>
    </div>
  );
}