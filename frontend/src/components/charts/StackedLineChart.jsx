import React from "react";
import ReactECharts from "echarts-for-react";
import { ChevronDown } from "lucide-react";
import ChartContainer from "./ChartContainer";
import { getStackedLineChartOption } from "./chartOptions";
import { hasMoreLegendPages, getAllDataKeys } from "./chartUtils";

const StackedLineChart = ({
  data,
  title,
  chartIndex,
  isEnglish,
  chartRefs,
  handleMaximizeChart,
  onToggle,
  legendPage,
  setLegendPage,
  legendItemsPerPage,
  // Chart container props
  chartToggleStates,
  activeDropdown,
  toggleDropdown,
  setActiveDropdown,
  handlePrintChart,
  downloadChartFromECharts,
}) => {
  const allDataKeys = getAllDataKeys(data);

  return (
    <ChartContainer
      title={title}
      onMaximize={() => handleMaximizeChart(data, "stackedLine", title)}
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
      <div style={{ position: "relative" }}>
        <ReactECharts
          ref={(ref) => {
            if (ref) chartRefs.current[chartIndex] = ref;
          }}
          option={getStackedLineChartOption(
            data,
            allDataKeys,
            legendPage,
            legendItemsPerPage
          )}
          style={{ width: "100%", height: "300px" }}
        />
        {(legendPage > 0 ||
          hasMoreLegendPages(legendPage, legendItemsPerPage, allDataKeys.length)) && (
          <button
            onClick={() => {
              if (
                hasMoreLegendPages(legendPage, legendItemsPerPage, allDataKeys.length)
              ) {
                setLegendPage((prev) => prev + 1);
              } else {
                setLegendPage(0);
              }
            }}
            style={{
              position: "absolute",
              right: "14%",
              bottom: "0px",
              background: "rgba(255, 255, 255, 0.95)",
              color: "#374151",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "11px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              zIndex: 10,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              transition: "all 0.15s ease",
              backdropFilter: "blur(8px)",
              transform: hasMoreLegendPages(
                legendPage,
                legendItemsPerPage,
                allDataKeys.length
              )
                ? "none"
                : "rotate(180deg)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 1)";
              e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.95)";
              e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "600",
                color: "#6b7280",
                transform: hasMoreLegendPages(
                  legendPage,
                  legendItemsPerPage,
                  allDataKeys.length
                )
                  ? "rotate(0deg)"
                  : "rotate(180deg)",
                display: "inline-block",
              }}
            >
              {legendPage + 1}/
              {Math.ceil(allDataKeys.length / legendItemsPerPage)}
            </span>
            <ChevronDown
              size={12}
              strokeWidth={2}
              style={{ color: "#9ca3af" }}
            />
          </button>
        )}
      </div>
    </ChartContainer>
  );
};

export default StackedLineChart;
