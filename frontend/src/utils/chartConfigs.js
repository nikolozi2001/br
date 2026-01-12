import { getColorForSection } from '../components/charts/chartUtils';

export const createBaseChartConfig = () => ({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter: function (params) {
      let result = params[0].name + "<br/>";
      params.forEach((param) => {
        result += `${param.marker}${
          param.seriesName
        }: ${param.value.toLocaleString()}<br/>`;
      });
      return result;
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
});

export const createBarChartOption = (data, currentTexts, hiddenDataKeys) => {
  // Add array validation
  if (!Array.isArray(data)) {
    console.error('Chart data must be an array');
    return {
      ...createBaseChartConfig(),
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: []
    };
  }

  return {
    ...createBaseChartConfig(),
    legend: {
      data: [currentTexts.birth, currentTexts.death],
      selected: {
        [currentTexts.birth]: !hiddenDataKeys.has("birth"),
        [currentTexts.death]: !hiddenDataKeys.has("death"),
      },
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.year),
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: function (value) {
          return value.toLocaleString();
        },
      },
    },
    series: [
      {
        name: currentTexts.birth,
        type: "bar",
        data: data.map((item) => item.birth),
        itemStyle: {
          color: "#2563eb",
        },
      },
      {
        name: currentTexts.death,
        type: "bar",
        data: data.map((item) => item.death),
        itemStyle: {
          color: "#dc2626",
        },
      },
    ],
  };
};

export const createStackedLineChartOption = (
  data,
  currentPage = 0,
  itemsPerPage = 12,
  isEnglish = false
) => {
  if (!data || data.length === 0) {
    return {
      title: {
        text: isEnglish
          ? "No data available"
          : "მონაცემები არ არის ხელმისაწვდომი",
        left: "center",
        top: "middle",
      },
    };
  }

  const sampleItem = data[0] || {};
  const allDataKeys = Object.keys(sampleItem).filter((key) => key !== "year");

  const allSeries = allDataKeys.map((key) => ({
    name: key,
    dataKey: key,
    color: getColorForSection(key),
  }));

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLegend = allSeries.slice(startIndex, endIndex);

  return {
    ...createBaseChartConfig(isEnglish),
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
      formatter: function (params) {
        return `${params.name}<br/>${params.marker}${params.seriesName}: ${params.value.toLocaleString()}`;
      },
    },
    legend: {
      orient: "vertical",
      right: "2%",
      top: "middle",
      align: "left",
      itemGap: 8,
      itemWidth: 18,
      itemHeight: 14,
      textStyle: {
        fontSize: 10,
        color: "#333",
        width: 120,
        overflow: "truncate",
      },
      data: currentPageLegend.map((s) => s.name),
    },
    grid: {
      left: "3%",
      right: "28%",
      bottom: "3%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.year),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: function (value) {
          return value.toLocaleString();
        },
      },
    },
    series: allSeries.map((seriesConfig) => ({
      name: seriesConfig.name,
      type: "line",
      emphasis: {
        focus: "series",
      },
      data: data.map((item) => item[seriesConfig.dataKey] || 0),
      lineStyle: { color: seriesConfig.color, width: 2 },
      itemStyle: { color: seriesConfig.color },
    })),
  };
};
