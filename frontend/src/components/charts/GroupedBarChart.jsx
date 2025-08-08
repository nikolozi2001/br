import React from "react";
import ReactECharts from "echarts-for-react";
import { AlertCircle } from "lucide-react";
import ChartContainer from "./ChartContainer";
import ChartSkeleton from "../ChartSkeleton";
import { getGroupedBarChartOption } from "./chartOptions";

const GroupedBarChart = ({
  data,
  survivalData,
  loading,
  error,
  title,
  chartIndex,
  isEnglish,
  chartRefs,
  handleMaximizeChart,
  handleRetry,
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
      onMaximize={() => handleMaximizeChart(data, "groupedbar", title)}
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
          option={getGroupedBarChartOption(data, survivalData, isEnglish)}
          style={{ width: "100%", height: "300px" }}
          ref={(ref) => {
            if (ref) chartRefs.current[chartIndex] = ref;
          }}
        />
      )}
    </ChartContainer>
  );
};

export default GroupedBarChart;
