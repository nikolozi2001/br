import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
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

  const getEChartsOption = () => {
    const data = getComparisonData();
    if (data.length === 0) return {};

    const selectedChartObjects = charts.filter(chart => selectedCharts.includes(chart.id));
    const years = [...new Set(data.map(item => item.year))].sort();
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: function(params) {
          let result = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(param => {
            const value = typeof param.value === 'number' ? param.value.toLocaleString() : param.value;
            result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: selectedChartObjects.map(chart => chart.name || chart.title),
        top: '5%',
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: years,
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        }
      },
      series: selectedChartObjects.map((chart, index) => ({
        name: chart.name || chart.title,
        type: 'bar',
        data: years.map(year => {
          const dataPoint = data.find(d => d.year === year);
          return dataPoint ? (dataPoint[chart.name] || 0) : 0;
        }),
        itemStyle: {
          color: chart.color || `hsl(${index * 60}, 70%, 50%)`
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      })),
      animation: true,
      animationDuration: 1000
    };
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
            <ReactECharts
              option={getEChartsOption()}
              style={{ height: '400px', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          ) : (
            <div className="no-data">{t.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartComparison;
