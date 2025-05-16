import React, { useState, useEffect } from 'react';

const PullToRefresh = ({ onRefresh }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        setIsPulling(true);
        setStartY(e.touches[0].clientY);
      }
    };
    
    const handleTouchMove = (e) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 100) {
        setRefreshing(true);
        setIsPulling(false);
      }
    };
    
    const handleTouchEnd = () => {
      if (refreshing) {
        onRefresh().finally(() => {
          setTimeout(() => setRefreshing(false), 1000);
        });
      }
      setIsPulling(false);
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, startY, refreshing, onRefresh]);
  
  if (!refreshing) return null;
  
  return (
    
      
      Refreshing
    
  );
};

export default PullToRefresh;