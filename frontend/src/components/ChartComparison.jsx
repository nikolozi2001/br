import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

const ChartComparison = ({ charts, onClose, isEnglish }) => {
  const [selectedCharts, setSelectedCharts] = useState([]);
  
  const texts = {
    en: {
      title: 'Chart Comparison',
      selectCharts: 'Select charts to compare',
      noData: 'No data to compare',
      close: 'Close'
    },
    ge: {
      title: 'დიაგრამების შედარება',
      selectCharts: 'აირჩიეთ შესადარებელი დიაგრამები',
      noData: 'შესადარებელი მონაცემები არ არის',
      close: 'დახურვა'
    }
  };
  
  const t = isEnglish ? texts.en : texts.ge;
  
  const toggleChart = (chartId) => {
    setSelectedCharts(prev => 
      prev.includes(chartId) 
        ? prev.filter(id => id !== chartId)
        : [...prev, chartId]
    );
  };
  
  const getComparisonData = () => {
    if (selectedCharts.length === 0) return [];
    
    // Combine data from selected charts
    return charts
      .filter(chart => selectedCharts.includes(chart.id))
      .reduce((acc, chart) => {
        chart.data.forEach(item => {
          const existing = acc.find(a => a.year === item.year);
          if (existing) {
            existing[chart.name] = item.value || item.birth || item.total;
          } else {
            acc.push({
              year: item.year,
              [chart.name]: item.value || item.birth || item.total
            });
          }
        });
        return acc;
      }, []);
  };
  
  return (
    <div className="comparison-modal-overlay" onClick={onClose}>
      <div className="comparison-modal-content" onClick={e => e.stopPropagation()}>
        <div className="comparison-header">
          <h2>{t.title}</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        
        <div className="chart-selector">
          <h3>{t.selectCharts}</h3>
          <div className="chart-options">
            {charts.map(chart => (
              <label key={chart.id} className="chart-option">
                <input
                  type="checkbox"
                  checked={selectedCharts.includes(chart.id)}
                  onChange={() => toggleChart(chart.id)}
                />
                <span>{chart.title}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="comparison-chart">
          {selectedCharts.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                {charts
                  .filter(chart => selectedCharts.includes(chart.id))
                  .map((chart, index) => (
                    <Bar
                      key={chart.id}
                      dataKey={chart.name}
                      fill={chart.color || `hsl(${index * 60}, 70%, 50%)`}
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">{t.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartComparison;
