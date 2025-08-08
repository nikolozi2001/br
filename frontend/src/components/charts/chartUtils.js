// Helper function to check if there are more legend pages
export const hasMoreLegendPages = (currentPage, itemsPerPage = 12, totalItems = 14) => {
  return (currentPage + 1) * itemsPerPage < totalItems;
};

// Helper function to get all data keys from data
export const getAllDataKeys = (data) => {
  if (!data || data.length === 0) return [];
  const sampleItem = data[0] || {};
  return Object.keys(sampleItem).filter((key) => key !== "year");
};

// Helper function to format large numbers
export const formatNumber = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + "M";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + "k";
  }
  return value.toString();
};

// Helper function to get color for sections
export const getColorForSection = (sectionName) => {
  const colors = {
    Manufacturing: "#2563eb",
    Construction: "#dc2626",
    Retail: "#16a34a",
    Transport: "#ca8a04",
    Finance: "#7c3aed",
    Other: "#db2777",
    Agriculture: "#f59e0b",
    Mining: "#84cc16",
    Utilities: "#06b6d4",
    Information: "#8b5cf6",
    Professional: "#f97316",
    Education: "#ef4444",
    Health: "#10b981",
    Arts: "#db2777",
  };
  return colors[sectionName] || "#64748b";
};

// Helper function to generate consistent colors for pie charts
export const getPieColors = () => [
  "rgb(0, 128, 190)", // Blue
  "rgb(25, 194, 25)", // Green
  "rgb(234, 30, 48)", // Red
  "rgb(22, 163, 74)", // Dark Green
  "rgb(242, 116, 31)", // Orange
  "rgb(91, 33, 164)", // Purple
  "rgb(242, 207, 31)", // Yellow
  "rgb(20, 153, 131)", // Teal
  "rgb(194, 25, 121)", // Pink
  "rgb(27, 109, 154)", // Dark Blue
  "rgb(143, 222, 29)", // Light Green
];

// Helper function to generate consistent colors for grouped bar charts
export const getGroupedBarColors = () => [
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

// Helper function to generate sector colors for stacked charts
export const getSectorColors = () => [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ca8a04",
  "#7c3aed",
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

// Helper function for region translations
export const getRegionTranslations = (isEnglish) => ({
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
});

// Helper function for region colors
export const getRegionColors = () => ({
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
});

// Helper function to merge and filter pie chart data
export const processPieChartData = (data) => {
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
  return Object.entries(mergedData)
    .filter(([, share]) => share >= 0.1)
    .map(([name, share]) => ({ name, share }));
};
