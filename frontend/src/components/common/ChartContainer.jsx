import React, { memo } from 'react';

const ChartContainer = memo(({ 
  title, 
  children, 
  onMaximize, 
  onPrint, 
  onDownload,
  chartRef,
  isLoading = false,
  error = null 
}) => {
  if (error) {
    return (
      <div className="chart-container error">
        <div className="chart-header">
          <h3>{title}</h3>
        </div>
        <div className="chart-content error-content">
          <p>Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="chart-container loading">
        <div className="chart-header">
          <h3>{title}</h3>
        </div>
        <div className="chart-content loading-content">
          <div className="chart-skeleton">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container" ref={chartRef}>
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="chart-actions">
          <button onClick={onMaximize} className="chart-action-btn">
            ⛶
          </button>
          <button onClick={onPrint} className="chart-action-btn">
            🖨
          </button>
          <button onClick={() => onDownload('png')} className="chart-action-btn">
            ⬇
          </button>
        </div>
      </div>
      <div className="chart-content">
        {children}
      </div>
    </div>
  );
});

ChartContainer.displayName = 'ChartContainer';

export default ChartContainer;
