import React from "react";

const StatsGraph = ({ data, title, fullSize = false }) => {
  // Find the maximum value to scale the graph
  const maxValue = Math.max(...data.map(item => item.count), 5);
  
  // Format month names
  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };
  
  return (
    <div className={`stats-graph ${fullSize ? 'full-size' : ''}`}>
      {title && <h4 className="graph-title">{title}</h4>}
      
      <div className="graph-container">
        <div className="graph-bars">
          {data.map((item, index) => (
            <div key={index} className="graph-bar-container">
              <div 
                className="graph-bar"
                style={{ 
                  height: `${(item.count / maxValue) * 100}%`,
                  backgroundColor: `hsl(145, 70%, ${45 + (index * 5)}%)`
                }}
                title={`${item.count} observations in ${formatMonth(item.month)}`}
              >
                {item.count > 0 && (
                  <span className="bar-value">{item.count}</span>
                )}
              </div>
              <div className="bar-label">{formatMonth(item.month)}</div>
            </div>
          ))}
        </div>
        
        <div className="graph-axis">
          <div className="axis-label">{maxValue}</div>
          <div className="axis-label">{Math.round(maxValue / 2)}</div>
          <div className="axis-label">0</div>
        </div>
      </div>
    </div>
  );
};

export default StatsGraph;