import React from "react";

const RewardsGallery = ({ rewards }) => {
  // Group rewards by level
  const groupedRewards = {
    3: rewards.filter(reward => reward.level === 3),
    2: rewards.filter(reward => reward.level === 2),
    1: rewards.filter(reward => reward.level === 1)
  };
  
  // Count total rewards
  const totalRewards = rewards.length;
  
  // Count total possible rewards (placeholder - would come from backend in a real app)
  const totalPossibleRewards = 15;
  
  // Calculate reward progress
  const rewardProgress = Math.round((totalRewards / totalPossibleRewards) * 100);
  
  return (
    <div className="rewards-gallery">
      <section className="rewards-header paper">
        <h3>Your Rewards & Badges</h3>
        <div className="rewards-progress">
          <div className="progress-text">
            <span className="earned-text">Earned {totalRewards} of {totalPossibleRewards} possible rewards</span>
            <span className="progress-percentage">{rewardProgress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${rewardProgress}%` }}></div>
          </div>
        </div>
      </section>
      
      {groupedRewards[3].length > 0 && (
        <section className="rewards-section paper">
          <h3 className="reward-level-title">
            <span className="level-indicator gold">●●●</span> Gold Rewards
          </h3>
          <div className="rewards-grid">
            {groupedRewards[3].map((reward, index) => (
              <div key={index} className="reward-card gold">
                <div className="reward-icon">{reward.icon}</div>
                <div className="reward-details">
                  <h4>{reward.name}</h4>
                  <p>{reward.description}</p>
                </div>
              </div>
            ))}
            
            {/* Add placeholder for unearned gold rewards */}
            {Array.from({ length: Math.max(0, 5 - groupedRewards[3].length) }).map((_, index) => (
              <div key={`placeholder-${index}`} className="reward-card locked">
                <div className="reward-icon">🔒</div>
                <div className="reward-details">
                  <h4>Gold Reward</h4>
                  <p>Keep contributing to unlock this reward!</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {groupedRewards[2].length > 0 && (
        <section className="rewards-section paper">
          <h3 className="reward-level-title">
            <span className="level-indicator silver">●●</span> Silver Rewards
          </h3>
          <div className="rewards-grid">
            {groupedRewards[2].map((reward, index) => (
              <div key={index} className="reward-card silver">
                <div className="reward-icon">{reward.icon}</div>
                <div className="reward-details">
                  <h4>{reward.name}</h4>
                  <p>{reward.description}</p>
                </div>
              </div>
            ))}
            
            {/* Add placeholder for unearned silver rewards */}
            {Array.from({ length: Math.max(0, 5 - groupedRewards[2].length) }).map((_, index) => (
              <div key={`placeholder-${index}`} className="reward-card locked">
                <div className="reward-icon">🔒</div>
                <div className="reward-details">
                  <h4>Silver Reward</h4>
                  <p>Keep contributing to unlock this reward!</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {groupedRewards[1].length > 0 && (
        <section className="rewards-section paper">
          <h3 className="reward-level-title">
            <span className="level-indicator bronze">●</span> Bronze Rewards
          </h3>
          <div className="rewards-grid">
            {groupedRewards[1].map((reward, index) => (
              <div key={index} className="reward-card bronze">
                <div className="reward-icon">{reward.icon}</div>
                <div className="reward-details">
                  <h4>{reward.name}</h4>
                  <p>{reward.description}</p>
                </div>
              </div>
            ))}
            
            {/* Add placeholder for unearned bronze rewards */}
            {Array.from({ length: Math.max(0, 5 - groupedRewards[1].length) }).map((_, index) => (
              <div key={`placeholder-${index}`} className="reward-card locked">
                <div className="reward-icon">🔒</div>
                <div className="reward-details">
                  <h4>Bronze Reward</h4>
                  <p>Keep contributing to unlock this reward!</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      
      <section className="next-rewards paper">
        <h3>Next Rewards to Unlock</h3>
        <div className="reward-paths">
          <div className="reward-path">
            <div className="path-progress">
              <div className="path-icon">🔍</div>
              <div className="path-bar">
                <div className="path-fill" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="path-info">
              <h4>Observer Path</h4>
              <p>Submit 25 more observations to reach the next level</p>
            </div>
          </div>
          
          <div className="reward-path">
            <div className="path-progress">
              <div className="path-icon">🦉</div>
              <div className="path-bar">
                <div className="path-fill" style={{ width: '35%' }}></div>
              </div>
            </div>
            <div className="path-info">
              <h4>Species Diversity Path</h4>
              <p>Document 10 more unique species to reach the next level</p>
            </div>
          </div>
          
          <div className="reward-path">
            <div className="path-progress">
              <div className="path-icon">🗺️</div>
              <div className="path-bar">
                <div className="path-fill" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div className="path-info">
              <h4>Explorer Path</h4>
              <p>Visit 2 more locations to reach the next level</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RewardsGallery;