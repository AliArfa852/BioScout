import React from "react";

const ContributionMap = ({ locations }) => {
  // Location coordinates (hardcoded for Islamabad area)
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
    "Trail 1, Margalla Hills": [33.7351, 73.0455],
    "Trail 2, Margalla Hills": [33.7373, 73.0543],
    "Trail 3, Margalla Hills": [33.7392, 73.0601],
    "Trail 4, Margalla Hills": [33.7410, 73.0655],
    "Trail 5, Margalla Hills": [33.7424, 73.0699],
  };
  
  // Find the locations on the map and get their coordinates
  const mapLocations = locations.map(loc => {
    // Find matching location in coordinates
    const matchingLocation = Object.keys(locationCoords).find(key => 
      loc.name.toLowerCase().includes(key.toLowerCase())
    );
    
    if (matchingLocation) {
      return {
        name: loc.name,
        count: loc.count,
        coords: locationCoords[matchingLocation]
      };
    }
    return null;
  }).filter(Boolean);
  
  // Find maximum observation count for scaling marker sizes
  const maxCount = Math.max(...mapLocations.map(loc => loc.count), 1);
  
  return (
    <div className="contribution-map">
      <div className="sketch-map-container">
        <svg
          viewBox="0 0 800 500"
          className="map-svg"
        >
          {/* Map outline - sketchy style */}
          <path
            d="M120,100 Q150,80 200,90 Q250,95 300,80 Q350,70 400,85 Q450,95 500,90 Q550,85 600,100 Q650,110 700,105 Q720,130 730,170 Q735,220 720,270 Q710,320 720,370 Q715,420 690,450 Q650,470 600,460 Q550,465 500,455 Q450,460 400,450 Q350,455 300,445 Q250,450 200,440 Q150,445 100,430 Q80,400 70,350 Q65,300 80,250 Q70,200 80,150 Q90,120 120,100"
            fill="#f5f9f5"
            stroke="#2E7D32"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5,5"
          />
          
          {/* Water bodies */}
          <path
            d="M300,250 Q320,240 340,245 Q360,255 380,250 Q400,240 420,250 Q440,260 460,255 Q440,270 420,280 Q400,290 380,285 Q360,275 340,280 Q320,290 300,280 Q280,270 300,250"
            fill="#a8dadc"
            stroke="#457b9d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="5,3"
          />
          
          {/* Roads - sketchy lines */}
          <path
            d="M150,150 Q250,180 350,170 Q450,160 550,190 Q650,220 720,210"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10,5"
          />
          
          <path
            d="M200,100 Q220,180 210,260 Q205,340 220,420"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10,5"
          />
          
          <path
            d="M400,90 Q410,180 400,270 Q390,360 410,450"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10,5"
          />
          
          <path
            d="M600,100 Q590,180 600,260 Q610,340 590,430"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="10,5"
          />
          
          {/* Margalla Hills - sketchy mountains */}
          <path
            d="M100,120 L150,80 L200,120 L250,70 L300,120 L350,80 L400,130 L450,70 L500,110 L550,80 L600,120 L650,90 L700,130"
            fill="none"
            stroke="#2E7D32"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Location markers with observation counts */}
          {mapLocations.map((location, index) => {
            // Convert lat/lng to SVG coordinates (simple transformation)
            const [lat, lng] = location.coords;
            const x = ((lng - 72.9) / 0.3) * 600 + 100;
            const y = ((33.8 - lat) / 0.2) * 350 + 50;
            
            // Scale size based on observation count
            const count = location.count;
            const sizeRatio = count / maxCount;
            const size = 20 + (sizeRatio * 30);
            
            return (
              <g key={index} className="map-marker">
                <circle
                  cx={x}
                  cy={y}
                  r={size / 2}
                  fill="#2a9d8f"
                  stroke="#264653"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  className="marker-circle"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {count}
                </text>
                <text
                  x={x}
                  y={y + size/2 + 15}
                  textAnchor="middle"
                  fill="#264653"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {location.name.length > 20 ? location.name.substring(0, 18) + '...' : location.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker"></div>
          <span>Number indicates observations at location</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker size-small"></div>
          <span>Fewer observations</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker size-large"></div>
          <span>More observations</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionMap;