import React from 'react';
import '../styles/ChartSkeleton.scss';

const ChartSkeleton = () => {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-actions">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
      <div className="skeleton-chart">
        <div className="skeleton-bars">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-bar" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChartSkeleton;
