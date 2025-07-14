// Accessibility utilities for charts
export const generateChartAltText = (data, chartType, isEnglish) => {
  const lang = isEnglish ? 'en' : 'ge';
  
  const texts = {
    en: {
      barChart: 'Bar chart showing',
      lineChart: 'Line chart displaying',
      pieChart: 'Pie chart representing',
      dataPoints: 'data points',
      from: 'from',
      to: 'to',
      highest: 'highest value',
      lowest: 'lowest value',
      total: 'total'
    },
    ge: {
      barChart: 'ბარ-დიაგრამა აჩვენებს',
      lineChart: 'ხაზოვანი დიაგრამა ასახავს',
      pieChart: 'წრიული დიაგრამა წარმოადგენს',
      dataPoints: 'მონაცემთა წერტილები',
      from: 'დან',
      to: 'მდე',
      highest: 'ყველაზე მაღალი მნიშვნელობა',
      lowest: 'ყველაზე დაბალი მნიშვნელობა',
      total: 'სულ'
    }
  };
  
  const t = texts[lang];
  
  if (!data || data.length === 0) {
    return `${t[chartType] || t.barChart} ${t.dataPoints}`;
  }
  
  const yearRange = data.length > 1 ? 
    `${t.from} ${data[0].year} ${t.to} ${data[data.length - 1].year}` : 
    data[0].year;
    
  return `${t[chartType] || t.barChart} ${t.dataPoints} ${yearRange}`;
};

export const getKeyboardNavigation = () => ({
  onKeyDown: (event) => {
    // Allow keyboard navigation through chart elements
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.target.click();
    }
  },
  tabIndex: 0,
  role: 'button'
});

export const getAriaLabel = (dataKey, value, isEnglish) => {
  const labels = {
    en: {
      birth: 'Births',
      death: 'Deaths',
      value: 'Value'
    },
    ge: {
      birth: 'დაბადებები',
      death: 'გარდაცვალებები',
      value: 'მნიშვნელობა'
    }
  };
  
  const lang = isEnglish ? 'en' : 'ge';
  const label = labels[lang][dataKey] || labels[lang].value;
  
  return `${label}: ${value}`;
};
