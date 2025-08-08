import React from "react";
import ReactECharts from "echarts-for-react";
import ChartContainer from "./ChartContainer";
import { getNormalizedStackedBarChartOption } from "./chartOptions";

const NormalizedStackedBarChart = ({
  data,
  loading,
  error,
  title,
  chartIndex,
  isEnglish,
  chartRefs,
  handleMaximizeChart,
  onToggle,
  handleRetry,
  // Chart container props
  chartToggleStates,
  activeDropdown,
  toggleDropdown,
  setActiveDropdown,
  handlePrintChart,
  downloadChartFromECharts,
}) => {
  // Don't render chart if loading
  if (loading) {
    return (
      <ChartContainer
        title={title}
        onMaximize={() => handleMaximizeChart(data, "normalizedStackedBar", title)}
        chartIndex={chartIndex}
        onToggle={onToggle}
        isEnglish={isEnglish}
        chartToggleStates={chartToggleStates}
        activeDropdown={activeDropdown}
        toggleDropdown={toggleDropdown}
        setActiveDropdown={setActiveDropdown}
        handlePrintChart={handlePrintChart}
        downloadChartFromECharts={downloadChartFromECharts}
      >
        <div style={{ width: "100%", height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>{isEnglish ? "Loading..." : "იტვირთება..."}</div>
        </div>
      </ChartContainer>
    );
  }
  return (
    <ChartContainer
      title={title}
      onMaximize={() => handleMaximizeChart(data, "normalizedStackedBar", title)}
      chartIndex={chartIndex}
      onToggle={onToggle}
      isEnglish={isEnglish}
      chartToggleStates={chartToggleStates}
      activeDropdown={activeDropdown}
      toggleDropdown={toggleDropdown}
      setActiveDropdown={setActiveDropdown}
      handlePrintChart={handlePrintChart}
      downloadChartFromECharts={downloadChartFromECharts}
    >
      <ReactECharts
        ref={(ref) => {
          if (ref) chartRefs.current[chartIndex] = ref;
        }}
        option={getNormalizedStackedBarChartOption(data, isEnglish)}
        style={{ width: "100%", height: "300px" }}
      />
    </ChartContainer>
  );
};

export default NormalizedStackedBarChart;
