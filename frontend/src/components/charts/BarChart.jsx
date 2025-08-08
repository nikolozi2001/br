import React from "react";
import ReactECharts from "echarts-for-react";
import { AlertCircle } from "lucide-react";
import ChartContainer from "./ChartContainer";
import ChartSkeleton from "../ChartSkeleton";
import { getBarChartOption } from "./chartOptions";

const BarChart = ({
  data,
  loading,
  error,
  title,
  chartIndex,
  isEnglish,
  currentTexts,
  hiddenDataKeys,
  chartRefs,
  handleMaximizeChart,
  handleRetry,
  onEChartsLegendSelectChanged,
  // Chart container props
  chartToggleStates,
  activeDropdown,
  toggleDropdown,
  setActiveDropdown,
  handlePrintChart,
  downloadChartFromECharts,
}) => {
  return (
    <ChartContainer
      title={title}
      onMaximize={() => handleMaximizeChart(data, "bar", title)}
      chartIndex={chartIndex}
      isEnglish={isEnglish}
      chartToggleStates={chartToggleStates}
      activeDropdown={activeDropdown}
      toggleDropdown={toggleDropdown}
      setActiveDropdown={setActiveDropdown}
      handlePrintChart={handlePrintChart}
      downloadChartFromECharts={downloadChartFromECharts}
    >
      {loading ? (
        <div
          style={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChartSkeleton />
        </div>
      ) : error ? (
        <div
          style={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <AlertCircle size={24} color="#e53e3e" />
          <div className="mt-2 text-center text-sm text-gray-600">
            {isEnglish
              ? "Failed to load data. Please try again."
              : "მონაცემების დატვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან."}
          </div>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
          >
            {isEnglish ? "Retry" : "მეორე ცდა"}
          </button>
        </div>
      ) : (
        <ReactECharts
          ref={(ref) => {
            if (ref) chartRefs.current[chartIndex] = ref;
          }}
          option={getBarChartOption(data, currentTexts, hiddenDataKeys, isEnglish)}
          style={{ width: "100%", height: "300px" }}
          onEvents={{
            legendselectchanged: onEChartsLegendSelectChanged,
          }}
        />
      )}
    </ChartContainer>
  );
};

export default BarChart;
