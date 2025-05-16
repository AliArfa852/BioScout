import React, { useState } from "react";

const ChallengeTracker = ({ challenges }) => {
  const [expandedChallenge, setExpandedChallenge] = useState(null);
  
  const toggleChallenge = (index) => {
    if (expandedChallenge === index) {
      setExpandedChallenge(null);
    } else {
      setExpandedChallenge(index);
    }
  };
  
  // Helper function to get progress percentage
  const getProgressPercentage = (current, target) => {
    return Math.min(100, Math.round((current / target) * 100));
  };
  
  return (
    <section className="challenge-tracker paper">
      <h3>Active Challenges</h3>
      <p className="challenge-intro">Complete challenges to earn additional rewards and boost your rank!</p>
      
      <div className="challenges-list">
        {challenges.map((challenge, index) => (
          <div 
            key={index} 
            className={`challenge-card ${expandedChallenge === index ? 'expanded' : ''}`}
            onClick={() => toggleChallenge(index)}
          >
            <div className="challenge-header">
              <div className="challenge-icon">{challenge.icon}</div>
              <div className="challenge-title">
                <h4>{challenge.title}</h4>
                <div className="challenge-progress-container">
                  <div className="challenge-progress-bar">
                    <div 
                      className="challenge-progress-fill"
                      style={{ width: `${getProgressPercentage(challenge.progress, challenge.target)}%` }}
                    ></div>
                  </div>
                  <span className="challenge-progress-text">
                    {challenge.progress} / {challenge.target}
                  </span>
                </div>
              </div>
              <div className="challenge-expand">
                {expandedChallenge === index ? '▼' : '▶'}
              </div>
            </div>
            
            {expandedChallenge === index && (
              <div className="challenge-details">
                <p className="challenge-description">{challenge.description}</p>
                <div className="challenge-rewards">
                  <h5>Rewards:</h5>
                  <ul>
                    {challenge.rewards.map((reward, rewardIndex) => (
                      <li key={rewardIndex}>{reward}</li>
                    ))}
                  </ul>
                </div>
                <div className="challenge-expires">
                  Expires in: <span className="expiry-time">{challenge.expiresIn}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ChallengeTracker;