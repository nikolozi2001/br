// Chart configuration options for ECharts
import { getColorForSection } from './chartUtils';

export const getBarChartOption = (data, currentTexts, hiddenDataKeys, isEnglish = true) => ({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
    formatter: function (params) {
      let result = params[0].name + "<br/>";
      params.forEach((param) => {
        if (!hiddenDataKeys.has(param.seriesName.toLowerCase())) {
          result += `${param.marker}${param.seriesName}: ${param.value}<br/>`;
        }
      });
      return result;
    },
  },
  legend: {
    data: [currentTexts.birth, currentTexts.death],
    selected: {
      [currentTexts.birth]: !hiddenDataKeys.has("birth"),
      [currentTexts.death]: !hiddenDataKeys.has("death"),
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    top: "8%",
    containLabel: true,
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
    name: isEnglish ? "Thousand" : "ათასი",
    nameLocation: "end",
    nameGap: 10,
    nameTextStyle: {
      fontSize: 12,
      color: "#666"
    },
    axisLabel: {
      formatter: function (value) {
        if (value >= 1000) {
          return (value / 1000).toFixed(0);
        }
        return value;
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
});

export const getLineChartOption = (data) => ({
  tooltip: {
    trigger: "axis",
  },
  legend: {
    orient: "vertical",
    right: "10%",
    top: "center",
    data: [
      "Manufacturing",
      "Construction",
      "Retail",
      "Transport",
      "Finance",
      "Other",
    ],
  },
  grid: {
    left: "3%",
    right: "20%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: data.map((item) => item.year),
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "Manufacturing",
      type: "line",
      data: data.map((item) => item.manufacturing),
      lineStyle: { color: "#2563eb", width: 2 },
      itemStyle: { color: "#2563eb" },
    },
    {
      name: "Construction",
      type: "line",
      data: data.map((item) => item.construction),
      lineStyle: { color: "#dc2626", width: 2 },
      itemStyle: { color: "#dc2626" },
    },
    {
      name: "Retail",
      type: "line",
      data: data.map((item) => item.retail),
      lineStyle: { color: "#16a34a", width: 2 },
      itemStyle: { color: "#16a34a" },
    },
    {
      name: "Transport",
      type: "line",
      data: data.map((item) => item.transport),
      lineStyle: { color: "#ca8a04", width: 2 },
      itemStyle: { color: "#ca8a04" },
    },
    {
      name: "Finance",
      type: "line",
      data: data.map((item) => item.finance),
      lineStyle: { color: "#7c3aed", width: 2 },
      itemStyle: { color: "#7c3aed" },
    },
    {
      name: "Other",
      type: "line",
      data: data.map((item) => item.other),
      lineStyle: { color: "#db2777", width: 2 },
      itemStyle: { color: "#db2777" },
    },
  ],
});

export const getStackedLineChartOption = (
  data,
  allDataKeys,
  currentPage = 0,
  itemsPerPage = 12,
  isEnglish = true
) => {
  const allSeries = allDataKeys.map((key) => ({
    name: key,
    dataKey: key,
    color: getColorForSection(key),
  }));

  // Calculate pagination for legend only
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageLegend = allSeries.slice(startIndex, endIndex);

  return {
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985",
        },
      },
      formatter: function (params) {
        return `${params.name}<br/>${params.marker}${params.seriesName}: ${params.value}`;
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
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.year),
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      name: isEnglish ? "" : "ათასი",
      nameLocation: "end",
      nameGap: 10,
      nameTextStyle: {
        fontSize: 12,
        color: "#666"
      },
      axisLabel: {
        formatter: function (value) {
          if (value >= 1000) {
            return (value / 1000).toFixed(0);
          }
          return value;
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

export const getStackedBarChartOption = (data, isEnglish) => {
  // If no data, return empty chart configuration
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

  // Get all available data keys from the first item (excluding 'year')
  const sampleItem = data[0] || {};
  const allDataKeys = Object.keys(sampleItem).filter((key) => key !== "year");

  // Translation mapping for Georgian region names
  const regionTranslations = {
    Tbilisi: isEnglish ? "Tbilisi" : "თბილისი",
    Abkhazia_A_R: isEnglish ? "Abkhazia A.R." : "აფხაზეთის ა.რ.",
    Adjara: isEnglish ? "Adjara" : "აჭარის ა.რ.",
    Guria: isEnglish ? "Guria" : "გურია",
    Imereti: isEnglish ? "Imereti" : "იმერეთი",
    Kakheti: isEnglish ? "Kakheti" : "კახეთი",
    Mtskheta_Mtianeti: isEnglish ? "Mtskheta-Mtianeti" : "მცხეთა-მთიანეთი",
    Racha_Lechkhumi_and_Kvemo_Svaneti: isEnglish
      ? "Racha-Lechkhumi and Kvemo Svaneti"
      : "რაჭა-ლეჩხუმი და ქვემო სვანეთი",
    Samegrelo_Zemo_Svaneti: isEnglish
      ? "Samegrelo-Zemo Svaneti"
      : "სამეგრელო-ზემო სვანეთი",
    Samtskhe_Javakheti: isEnglish ? "Samtskhe-Javakheti" : "სამცხე-ჯავახეთი",
    Kvemo_Kartli: isEnglish ? "Kvemo Kartli" : "ქვემო ქართლი",
    Shida_Kartli: isEnglish ? "Shida Kartli" : "შიდა ქართლი",
    Unknown: isEnglish ? "Unknown" : "უცნობი",
  };

  // Define colors for Georgian regions - mapping API field names
  const regionColors = {
    Tbilisi: "#2563eb",
    Abkhazia_A_R: "#dc2626",
    Adjara: "#16a34a",
    Guria: "#ca8a04",
    Imereti: "#7c3aed",
    Kakheti: "#db2777",
    Mtskheta_Mtianeti: "#f59e0b",
    Racha_Lechkhumi_and_Kvemo_Svaneti: "#84cc16",
    Samegrelo_Zemo_Svaneti: "#06b6d4",
    Samtskhe_Javakheti: "#8b5cf6",
    Kvemo_Kartli: "#f97316",
    Shida_Kartli: "#ef4444",
    Unknown: "#64748b",
  };

  return {
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        return `${params.name}<br/>${params.marker}${params.seriesName}: ${params.value}`;
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
        fontSize: 11,
        color: "#333",
        width: 120,
        overflow: "truncate",
      },
      data: allDataKeys.map((key) => regionTranslations[key] || key),
    },
    grid: {
      left: "3%",
      right: "25%",
      bottom: "3%",
      top: "8%",
      containLabel: true,
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
      name: isEnglish ? "" : "ათასი",
      nameLocation: "end",
      nameGap: 10,
      nameTextStyle: {
        fontSize: 12,
        color: "#666"
      },
      axisLabel: {
        formatter: function (value) {
          if (value >= 1000) {
            return (value / 1000).toFixed(0);
          }
          return value;
        },
      },
    },
    series: allDataKeys.map((key) => ({
      name: regionTranslations[key] || key,
      type: "bar",
      stack: "Total",
      emphasis: {
        focus: "series",
      },
      data: data.map((item) => item[key] || 0),
      itemStyle: {
        color: regionColors[key] || "#64748b",
      },
    })),
  };
};

export const getHorizontalBarChartOption = (data) => ({
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "shadow",
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "value",
  },
  yAxis: {
    type: "category",
    data: data.map((item) => item.year),
  },
  series: [
    {
      type: "bar",
      data: data.map((item) => item.total),
      itemStyle: {
        color: "#2563eb",
      },
    },
  ],
});

export const getAreaChartOption = (data) => ({
  tooltip: {
    trigger: "axis",
  },
  legend: {
    data: [
      "Manufacturing",
      "Construction",
      "Retail",
      "Transport",
      "Finance",
      "Other",
    ],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: data.map((item) => item.year),
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "Manufacturing",
      type: "line",
      stack: "Total",
      areaStyle: {},
      data: data.map((item) => item.manufacturing),
      itemStyle: { color: "#2563eb" },
    },
    {
      name: "Construction",
      type: "line",
      stack: "Total",
      areaStyle: {},
      data: data.map((item) => item.construction),
      itemStyle: { color: "#dc2626" },
    },
    {
      name: "Retail",
      type: "line",
      stack: "Total",
      areaStyle: {},
      data: data.map((item) => item.retail),
      itemStyle: { color: "#16a34a" },
    },
    {
      name: "Transport",
      type: "line",
      stack: "Total",
      areaStyle: {},
      data: data.map((item) => item.transport),
      itemStyle: { color: "#ca8a04" },
    },
    {
      name: "Finance",
      type: "line",
      stack: "Total",
      areaStyle: {},
      data: data.map((item) => item.finance),
      itemStyle: { color: "#7c3aed" },
    },
    {
      name: "Other",
      type: "line",
      stack: "Total",
      areaStyle: {},
      data: data.map((item) => item.other),
      itemStyle: { color: "#db2777" },
    },
  ],
});

export const getNormalizedStackedBarChartOption = (data, isEnglish) => {
  // If no data, return empty chart configuration
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

  // Get all available data keys from the first item (excluding 'year')
  const sampleItem = data[0] || {};
  const allDataKeys = Object.keys(sampleItem).filter((key) => key !== "year");

  // Define colors for different sectors
  const sectorColors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#ca8a04",
    "#7c3aed",
    "#f59e0b",
    "#f59e0b",
    "#84cc16",
    "#06b6d4",
    "#8b5cf6",
    "#f97316",
    "#ef4444",
    "#10b981",
    "#db2777",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  return {
    tooltip: {
      trigger: "item",
      axisPointer: {
        type: "shadow",
      },
      position: "top",
      textStyle: {
        textAlign: "center",
      },
      formatter: function (params) {
        const year = params.name;
        const seriesName = params.seriesName;
        const value = params.value;
        const percentage = value.toFixed(1);

        // Calculate total for the year by summing all sector percentages
        const yearData = data.find(
          (item) => String(item.year) === String(year)
        );
        let yearTotal = 0;
        if (yearData) {
          allDataKeys.forEach((key) => {
            yearTotal += yearData[key] || 0;
          });
        }

        return `
          <div style="padding: 8px; font-size: 12px; line-height: 1.5; text-align: center;">
            <div style="margin-bottom: 4px;"><strong>${
              isEnglish ? "Year" : "წელი"
            }:</strong> ${year}</div>
            <div style="margin-bottom: 4px;"><strong>${
              isEnglish ? "Sector" : "სექტორი"
            }:</strong> ${seriesName}</div>
            <div style="margin-bottom: 4px;"><strong>${
              isEnglish ? "Percentage" : "პროცენტი"
            }:</strong> ${percentage}%</div>
            <div style="margin-bottom: 4px;"><strong>${
              isEnglish ? "Total" : "სულ"
            }:</strong> ${yearTotal.toFixed(1)}%</div>
          </div>
        `;
      },
    },
    legend: {
      orient: "vertical",
      right: "2%",
      top: "middle",
      align: "left",
      itemGap: 6,
      itemWidth: 18,
      itemHeight: 14,
      textStyle: {
        fontSize: 9,
        color: "#333",
        width: 140,
        overflow: "truncate",
      },
      data: allDataKeys,
    },
    grid: {
      left: "3%",
      right: "32%",
      bottom: "3%",
      top: "5%",
      containLabel: true,
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
        formatter: "{value}%",
      },
      max: 100,
    },
    series: allDataKeys.map((key, index) => {
      return {
        name: key,
        type: "bar",
        stack: "Total",
        emphasis: {
          focus: "series",
        },
        data: data.map((item) => {
          const totalForYear = allDataKeys.reduce(
            (sum, k) => sum + (item[k] || 0),
            0
          );
          const percentage = totalForYear > 0 ? ((item[key] || 0) / totalForYear) * 100 : 0;
          return percentage;
        }),
        itemStyle: {
          color: sectorColors[index % sectorColors.length],
        },
      };
    }),
  };
};

export const getGrowthChartOption = (data, isEnglish) => ({
  tooltip: {
    trigger: "axis",
    formatter: function (params) {
      return `${params[0].name}<br/>${params[0].marker}${
        isEnglish ? "Growth" : "ზრდა"
      }: ${params[0].value}%`;
    },
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: data.map((item) => item.year),
  },
  yAxis: {
    type: "value",
    axisLabel: {
      formatter: "{value}%",
    },
  },
  series: [
    {
      type: "bar",
      data: data.map((item) => item.growth),
      itemStyle: {
        color: "#16a34a",
      },
    },
  ],
});

export const getGroupedBarChartOption = (data, survivalData, isEnglish) => {
  // Use API data from survivalData state
  const apiData = data || survivalData;

  // If no data, return empty chart configuration
  if (!apiData || apiData.length === 0) {
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

  // Dynamically extract years from the data
  const years = apiData.map((item) => item.year.toString()).sort();

  // Dynamically extract all survival keys from the data
  const allSurvivalKeys = new Set();
  apiData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key.startsWith("Born_in_") && key !== "year") {
        allSurvivalKeys.add(key);
      }
    });
  });

  // Sort survival keys by year for consistent ordering (big to small)
  const survivalYears = Array.from(allSurvivalKeys).sort((a, b) => {
    const yearA = parseInt(a.split("_")[2], 10); // Extract year from Born_in_YYYY
    const yearB = parseInt(b.split("_")[2], 10); // Extract year from Born_in_YYYY
    return yearB - yearA; // Reverse order: big to small (newest to oldest)
  });

  const colors = [
    "#2f7ed8",
    "#0d233a",
    "#8bbc21",
    "#910000",
    "#1aadce",
    "#492970",
    "#f28f43",
    "#77a1e5",
    "#c42525",
    "#a6c96a",
    "#f45b5b",
  ];

  const series = survivalYears.map((survivalKey, index) => {
    // Extract year from Born_in_YYYY format
    const yearNum = survivalKey.split("_")[2]; // Get the year directly from Born_in_YYYY
    const name = isEnglish
      ? `Born in ${yearNum}`
      : `დაბადებული ${yearNum} წელს`;

    // Extract data for this survival year from API data
    const data = years.map((year) => {
      const yearData = apiData.find(
        (item) => String(item.year) === String(year)
      );
      return yearData ? yearData[survivalKey] || 0 : 0;
    });

    return {
      name: name,
      type: "bar",
      barGap: "10%",
      emphasis: {
        focus: "series",
      },
      itemStyle: {
        color: colors[index % colors.length],
      },
      data: data,
    };
  });

  const options = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: function (params) {
        let result = params[0].name + "<br/>";
        params.forEach((param) => {
          result += `${param.marker}${param.seriesName}: ${param.value}%<br/>`;
        });
        return result;
      },
    },
    legend: {
      bottom: "2%",
      type: "scroll",
      pageButtonItemGap: 10,
      textStyle: {
        fontSize: 11,
        color: "#333",
      },
      itemStyle: {
        borderWidth: 0,
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      top: "15%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: years,
    },
    yAxis: {
      type: "value",
      name: "%",
      axisLabel: {
        formatter: "{value}%",
      },
    },
    series,
  };

  return options;
};

export const getPieChartOption = (data, currentTexts, isEnglish) => {
  // If no data, return empty chart configuration
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

  // Define colors for pie chart segments
  const pieColors = [
    "rgb(0, 128, 190)", // თბილისი
    "rgb(25, 194, 25)", // აჭარა
    "rgb(234, 30, 48)", // გურია
    "rgb(22, 163, 74)", // იმერეთი
    "rgb(242, 116, 31)", // კახეთი
    "rgb(91, 33, 164)", // მცხეთა-მთიანეთი
    "rgb(242, 207, 31)", // რაჭა-ლეჩხუმი და ქვემო სვანეთი
    "rgb(20, 153, 131)", // სამეგრელო
    "rgb(194, 25, 121)", // სამხრე-ჯავახეთი
    "rgb(27, 109, 154)", // ქვემო სვანეთი
    "rgb(143, 222, 29)", // შიდა ქართლი
  ];

  // Merge duplicate entries and filter very small values
  const mergedData = {};
  data.forEach((item) => {
    const name = item.name || "Unknown";
    const share = item.share || item.value || item.count || 0;

    if (mergedData[name]) {
      mergedData[name] += share;
    } else {
      mergedData[name] = share;
    }
  });

  // Convert back to array and filter out very small values (less than 0.1%)
  const filteredData = Object.entries(mergedData)
    .filter(([, share]) => share >= 0.1)
    .map(([name, share]) => ({ name, share }));

  // Transform API data to expected format
  const chartData = filteredData.map((item, index) => ({
    value: item.share,
    name: item.name,
    itemStyle: {
      color: pieColors[index % pieColors.length],
    },
  }));

  return {
    tooltip: {
      trigger: "item",
      position: "center",
      textStyle: {
        textAlign: "center",
      },
      formatter: function (params) {
        return `${params.seriesName}<br/>${params.marker}${
          params.name
        }: ${params.value.toFixed(2)}% (${params.percent}%)`;
      },
    },
    legend: {
      orient: "vertical",
      right: "2%",
      top: "middle",
      itemGap: 5,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: isEnglish ? 9 : 9,
        color: "#333",
        width: 150,
        lineHeight: 13
      },
      formatter: function(name) {
        // Remove spaces from English text to make it more compact like Georgian
        if (isEnglish) {
          return name.replace(/\s+/g, '');
        }
        return name;
      },
      data: chartData.map((item) => item.name),
    },
    series: [
      {
        name: currentTexts.ownershipTypes,
        type: "pie",
        radius: ["70%"],
        center: ["35%", "50%"],
        data: chartData,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };
};
