import React from "react";
import ReactECharts from "echarts-for-react";
import { ChevronDown } from "lucide-react";
import {
  getBarChartOption,
  getLineChartOption,
  getStackedLineChartOption,
  getHorizontalBarChartOption,
  getStackedBarChartOption,
  getAreaChartOption,
  getGrowthChartOption,
  getPieChartOption,
  getNormalizedStackedBarChartOption,
  getGroupedBarChartOption,
} from "./chartOptions";

const MaximizedChartModal = ({
  maximizedChart,
  handleCloseMaximized,
  legendPage,
  setLegendPage,
  legendItemsPerPage,
  hasMoreLegendPages,
  allDataKeys,
  survivalData,
  currentTexts,
  isEnglish,
  hiddenDataKeys,
}) => {
  if (!maximizedChart) return null;

  const renderChart = () => {
    switch (maximizedChart.type) {
      case "bar":
        return (
          <ReactECharts
            option={getBarChartOption(
              maximizedChart.data,
              currentTexts,
              hiddenDataKeys,
              isEnglish
            )}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "line":
        return (
          <ReactECharts
            option={getLineChartOption(maximizedChart.data)}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "stackedLine":
        return (
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <ReactECharts
              option={getStackedLineChartOption(
                maximizedChart.data,
                allDataKeys,
                legendPage,
                legendItemsPerPage,
                isEnglish
              )}
              style={{ height: "100%", width: "100%" }}
            />
            {(legendPage > 0 ||
              hasMoreLegendPages(legendPage, legendItemsPerPage)) && (
              <button
                onClick={() => {
                  if (hasMoreLegendPages(legendPage, legendItemsPerPage)) {
                    setLegendPage((prev) => prev + 1);
                  } else {
                    setLegendPage(0);
                  }
                }}
                style={{
                  position: "absolute",
                  right: "7%",
                  bottom: "40px",
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#374151",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.2s ease",
                  backdropFilter: "blur(12px)",
                  transform: hasMoreLegendPages(legendPage, legendItemsPerPage)
                    ? "none"
                    : "rotate(180deg)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 1)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                  e.target.style.transform = hasMoreLegendPages(
                    legendPage,
                    legendItemsPerPage
                  )
                    ? "translateY(-1px)"
                    : "rotate(180deg) translateY(1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.95)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                  e.target.style.transform = hasMoreLegendPages(
                    legendPage,
                    legendItemsPerPage
                  )
                    ? "translateY(0)"
                    : "rotate(180deg) translateY(0)";
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#6b7280",
                    transform: hasMoreLegendPages(legendPage, legendItemsPerPage)
                      ? "rotate(0deg)"
                      : "rotate(180deg)",
                    display: "inline-block",
                  }}
                >
                  {legendPage + 1}/{Math.ceil(14 / legendItemsPerPage)}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  style={{ color: "#9ca3af" }}
                />
              </button>
            )}
          </div>
        );
      case "horizontalBar":
        return (
          <ReactECharts
            option={getHorizontalBarChartOption(maximizedChart.data)}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "stackedBar":
        return (
          <ReactECharts
            option={getStackedBarChartOption(maximizedChart.data, isEnglish)}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "area":
        return (
          <ReactECharts
            option={getAreaChartOption(maximizedChart.data)}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "growth":
        return (
          <ReactECharts
            option={getGrowthChartOption(maximizedChart.data, isEnglish)}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "pie":
        return (
          <ReactECharts
            option={getPieChartOption(
              maximizedChart.data,
              currentTexts,
              isEnglish
            )}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "normalizedStackedBar":
        return (
          <ReactECharts
            option={getNormalizedStackedBarChartOption(
              maximizedChart.data,
              isEnglish
            )}
            style={{ height: "100%", width: "100%" }}
          />
        );
      case "groupedbar":
        return (
          <ReactECharts
            option={getGroupedBarChartOption(
              maximizedChart.data,
              survivalData,
              isEnglish
            )}
            style={{ height: "100%", width: "100%" }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="maximize-modal-overlay" onClick={handleCloseMaximized}>
      <div
        className="maximize-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="maximize-modal-header">
          <h2 className="maximize-modal-title">{maximizedChart.title}</h2>
          <button
            className="maximize-modal-close"
            onClick={handleCloseMaximized}
          >
            ✕
          </button>
        </div>
        <div
          className="maximize-modal-chart"
          style={{ width: "100%", height: "600px" }}
        >
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default MaximizedChartModal;
