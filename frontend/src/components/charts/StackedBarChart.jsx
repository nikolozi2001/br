import React from "react";
import ReactECharts from "echarts-for-react";
import ChartContainer from "./ChartContainer";
import { getStackedBarChartOption } from "./chartOptions";

const StackedBarChart = ({
  data,
  loading,
  title,
  chartIndex,
  isEnglish,
  chartRefs,
  handleMaximizeChart,
  onToggle,
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
        onMaximize={() => handleMaximizeChart(data, "stackedBar", title)}
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
      onMaximize={() => handleMaximizeChart(data, "stackedBar", title)}
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
        option={getStackedBarChartOption(data, isEnglish)}
        style={{ width: "100%", height: "300px" }}
      />
    </ChartContainer>
  );
};

export default StackedBarChart;
