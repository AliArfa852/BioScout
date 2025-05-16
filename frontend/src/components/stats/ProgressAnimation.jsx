import React from 'react';

const ProgressAnimation = ({ value, maxValue, size = 100, strokeWidth = 8, color = '#2E7D32' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value / maxValue;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width={size} height={size}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />

      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dashoffset 1s ease-in-out'
        }}
      />

      {/* Text value */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size / 4}
        fontWeight="bold"
        fill="#333"
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
};

export default ProgressAnimation;
