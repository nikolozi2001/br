import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  Download,
  Maximize2,
  Printer,
  ChevronDown,
  FileText,
  RefreshCw,
  AlertCircle,
  ListRestart,
} from "lucide-react";
import {
  fetchEnterpriseBirthDeath,
  fetchEnterpriseNace,
  fetchEnterpriseDeathNace,
  fetchEnterpriseBirthRegion,
  fetchEnterpriseDeathRegion,
  fetchEnterpriseBirthSector,
  fetchEnterpriseDeathSector,
  fetchEnterpriseSurvivalYear,
  fetchEnterpriseBirthDistribution,
  fetchEnterpriseDeathDistribution,
  getSectionColorMapping,
} from "../services/api";
import ChartSkeleton from "./ChartSkeleton";
import "../styles/Charts.scss";

const Charts = ({ isEnglish }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [maximizedChart, setMaximizedChart] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [organizationsByYear, setOrganizationsByYear] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [activityDataDeath, setActivityDataDeath] = useState([]);
  const [regionalData, setRegionalData] = useState([]);
  const [regionalDataDeath, setRegionalDataDeath] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [sectorDataDeath, setSectorDataDeath] = useState([]);
  const [survivalData, setSurvivalData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [distributionDataDeath, setDistributionDataDeath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [legendPage, setLegendPage] = useState(0);
  const [legendItemsPerPage] = useState(12);

  const [chartToggleStates, setChartToggleStates] = useState({
    activityChart: false,
    regionalChart: false,
    sectorChart: false,
    distributionChart: false,
  });

  // Initialize hiddenDataKeys from localStorage or empty Set
  const [hiddenDataKeys, setHiddenDataKeys] = useState(() => {
    try {
      const saved = localStorage.getItem("chartHiddenDataKeys");
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.log("Failed to load hidden data keys from localStorage:", error);
    }
    return new Set();
  });

  const toggleActivityChart = () => {
    setChartToggleStates((prev) => ({
      ...prev,
      activityChart: !prev.activityChart,
    }));
    setLegendPage(0);
    setHiddenDataKeys(new Set());
  };

  const toggleRegionalChart = () => {
    setChartToggleStates((prev) => ({
      ...prev,
      regionalChart: !prev.regionalChart,
    }));
    setLegendPage(0);
    setHiddenDataKeys(new Set());
  };

  const toggleSectorChart = () => {
    setChartToggleStates((prev) => ({
      ...prev,
      sectorChart: !prev.sectorChart,
    }));
    setLegendPage(0);
    setHiddenDataKeys(new Set());
  };

  const toggleDistributionChart = () => {
    setChartToggleStates((prev) => ({
      ...prev,
      distributionChart: !prev.distributionChart,
    }));
    setLegendPage(0);
    setHiddenDataKeys(new Set());
  };

  // Add cache for API responses
  const [dataCache, setDataCache] = useState(new Map());

  // Save hiddenDataKeys to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "chartHiddenDataKeys",
        JSON.stringify([...hiddenDataKeys])
      );
    } catch (error) {
      console.log("Failed to save hidden data keys to localStorage:", error);
    }
  }, [hiddenDataKeys]);

  useEffect(() => {
    setIsFlipped(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = `${isEnglish ? "en" : "ge"}-${retryCount}`;

        // Check cache first
        if (dataCache.has(cacheKey)) {
          const cachedData = dataCache.get(cacheKey);
          setOrganizationsByYear(cachedData.birthDeathData);
          setActivityData(cachedData.naçeData);
          setActivityDataDeath(cachedData.deathNaçeData);
          setRegionalData(cachedData.birthRegionData);
          setRegionalDataDeath(cachedData.deathRegionData);
          setSectorData(cachedData.birthSectorData);
          setSectorDataDeath(cachedData.deathSectorData);
          setSurvivalData(cachedData.survivalYearData);
          setDistributionData(cachedData.birthDistributionData);
          setDistributionDataDeath(cachedData.deathDistributionData);
          setLoading(false);
          return;
        }

        // Fetch all datasets in parallel
        const [
          birthDeathData,
          naçeData,
          deathNaçeData,
          birthRegionData,
          deathRegionData,
          birthSectorData,
          deathSectorData,
          survivalYearData,
          birthDistributionData,
          deathDistributionData,
        ] = await Promise.all([
          fetchEnterpriseBirthDeath(isEnglish ? "en" : "ge"),
          fetchEnterpriseNace(isEnglish ? "en" : "ge"),
          fetchEnterpriseDeathNace(isEnglish ? "en" : "ge"),
          fetchEnterpriseBirthRegion(isEnglish ? "en" : "ge"),
          fetchEnterpriseDeathRegion(isEnglish ? "en" : "ge"),
          fetchEnterpriseBirthSector(isEnglish ? "en" : "ge"),
          fetchEnterpriseDeathSector(isEnglish ? "en" : "ge"),
          fetchEnterpriseSurvivalYear(isEnglish ? "en" : "ge"),
          fetchEnterpriseBirthDistribution(isEnglish ? "en" : "ge"),
          fetchEnterpriseDeathDistribution(isEnglish ? "en" : "ge"),
        ]);

        // Cache the results
        const cacheData = {
          birthDeathData,
          naçeData,
          deathNaçeData,
          birthRegionData,
          deathRegionData,
          birthSectorData,
          deathSectorData,
          survivalYearData,
          birthDistributionData,
          deathDistributionData,
        };

        setDataCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, cacheData);
          // Keep only last 4 cache entries to prevent memory leaks
          if (newCache.size > 4) {
            const firstKey = newCache.keys().next().value;
            newCache.delete(firstKey);
          }
          return newCache;
        });

        setOrganizationsByYear(birthDeathData);
        setActivityData(naçeData);
        setActivityDataDeath(deathNaçeData);
        setRegionalData(birthRegionData);
        setRegionalDataDeath(deathRegionData);
        setSectorData(birthSectorData);
        setSectorDataDeath(deathSectorData);
        setSurvivalData(survivalYearData);
        setDistributionData(birthDistributionData);
        setDistributionDataDeath(deathDistributionData);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message || "Failed to load data");
        setOrganizationsByYear([]);
        setActivityData([]);
        setActivityDataDeath([]);
        setRegionalData([]);
        setRegionalDataDeath([]);
        setSectorData([]);
        setSectorDataDeath([]);
        setSurvivalData([]);
        setDistributionData([]);
        setDistributionDataDeath([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isEnglish, retryCount, dataCache]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // console.log("survivalData:", survivalData);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".chart-action-dropdown")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleMaximizeChart = (chartData, chartType, title) => {
    setMaximizedChart({ data: chartData, type: chartType, title });
  };

  const handleCloseMaximized = () => {
    setMaximizedChart(null);
    setLegendPage(0); // Reset legend page when closing maximized chart
  };

  const toggleDropdown = (chartIndex) => {
    setActiveDropdown(activeDropdown === chartIndex ? null : chartIndex);
  };

  const activityChart = chartToggleStates.activityChart
    ? isEnglish
      ? " Deaths"
      : " გარდაცვალება"
    : isEnglish
    ? " Births"
    : " დაბადება";

  const regionalChart = chartToggleStates.regionalChart
    ? isEnglish
      ? " Deaths"
      : " გარდაცვალება"
    : isEnglish
    ? " Births"
    : " დაბადება";

  const sectorChart = chartToggleStates.sectorChart
    ? isEnglish
      ? " Deaths"
      : " გარდაცვალება"
    : isEnglish
    ? " Births"
    : " დაბადება";

  const distributionChart = chartToggleStates.distributionChart
    ? isEnglish
      ? " Deaths"
      : " გადრაცვლილ"
    : isEnglish
    ? " Born in"
    : " დაბადებულ";

  const texts = {
    georgian: {
      title: "სტატისტიკური ანგარიშგება",
      organizationsByYear:
        "საწარმოთა დაბადება და გარდაცვალება 2014-2023 წლებში",
      regionalDistribution: `საწარმოთა ${regionalChart} რეგიონების მიხედვით`,
      activitySectors: `საწარმოთა ${activityChart} ეკონომიკური საქმიანობის სახეების მიხედვით`,
      ownershipTypes: `2023 წელს ${distributionChart} საწარმოთა განაწილება რეგიონების მიხედვით`,
      enterpriceSectors: `საწარმოთა ${sectorChart} დარგების მიხედვით`,
      organizationSurvival: "საწარმოთა გადარჩენა წლების მიხედვით (%)",
      birth: "დაბადება",
      death: "გარდაცვალება",
    },
    english: {
      title: "Statistical Reports",
      organizationsByYear: "Organizations Birth and Death 2014-2023",
      regionalDistribution: `Organizations ${regionalChart} by Regions`,
      activitySectors: `Organizations ${activityChart} by Economic Activity Sectors`,
      ownershipTypes: `Distribution of enterprises ${distributionChart} by region in 2023`,
      enterpriceSectors: `Organizations ${sectorChart} by Sectors`,
      organizationSurvival: "Organization Survival by Year (%)",
      birth: "Birth",
      death: "Death",
    },
  };

  const currentTexts = isEnglish ? texts.english : texts.georgian;

  // Dynamic titles that show current data type
  const getActivitySectorsTitle = () => {
    const baseTitle = currentTexts.activitySectors;
    return baseTitle;
  };

  const getLegalFormsTitle = () => {
    const baseTitle = currentTexts.enterpriceSectors;

    return baseTitle;
  };

  const getRegionalDistributionTitle = () => {
    const baseTitle = currentTexts.regionalDistribution;

    return baseTitle;
  };

  const handleLegendClick = React.useCallback((dataKey) => {
    setHiddenDataKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey); // UNHIDE: Remove from hidden set
      } else {
        newSet.add(dataKey); // HIDE: Add to hidden set
      }
      return newSet;
    });
  }, []);

  const getCurrentActivityData = React.useCallback(() => {
    return chartToggleStates.activityChart ? activityDataDeath : activityData;
  }, [chartToggleStates.activityChart, activityData, activityDataDeath]);

  const getCurrentRegionalData = React.useCallback(() => {
    return chartToggleStates.regionalChart ? regionalDataDeath : regionalData;
  }, [chartToggleStates.regionalChart, regionalData, regionalDataDeath]);

  const getCurrentSectorData = React.useCallback(() => {
    return chartToggleStates.sectorChart ? sectorDataDeath : sectorData;
  }, [chartToggleStates.sectorChart, sectorData, sectorDataDeath]);

  const getCurrentDistributionData = React.useCallback(() => {
    return chartToggleStates.distributionChart
      ? distributionDataDeath
      : distributionData;
  }, [
    chartToggleStates.distributionChart,
    distributionData,
    distributionDataDeath,
  ]);

  const onEChartsLegendSelectChanged = React.useCallback(
    (params) => {
      const { name } = params;
      const key =
        name === currentTexts.birth
          ? "birth"
          : name === currentTexts.death
          ? "death"
          : name.toLowerCase();
      handleLegendClick(key);
    },
    [handleLegendClick, currentTexts]
  );

  const handlePrintChart = (chartElement, title) => {
    // Close dropdown first
    setActiveDropdown(null);

    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      const chartContent = chartElement.querySelector(".chart-content");

      if (!chartContent) {
        console.error("Chart content not found");
        return;
      }

      // Get the SVG element
      const svgElement = chartContent.querySelector("svg");
      if (!svgElement) {
        console.error("SVG element not found");
        return;
      }

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);
      const svgRect = svgElement.getBoundingClientRect();

      // Set explicit dimensions
      svgClone.setAttribute("width", svgRect.width || 800);
      svgClone.setAttribute("height", svgRect.height || 400);

      printWindow.document.write(`
        <html>
          <head>
            <title>Print Chart - ${title}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;700&display=swap');
              body { 
                margin: 20px; 
                font-family: "Noto Sans Georgian", "BPG Nino Mtavruli", "Sylfaen", Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                line-height: 1.4;
              }
              .chart-title { 
                font-size: 16px; 
                font-weight: bold; 
                margin-bottom: 25px;
                text-align: center;
                max-width: 80%;
                word-spacing: 2px;
                letter-spacing: 0.5px;
                line-height: 1.6;
              }
              .chart-content { 
                display: flex;
                justify-content: center;
                align-items: center;
              }
              svg {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body { margin: 15px; }
                .chart-title { 
                  margin-bottom: 20px; 
                  font-size: 14px;
                  line-height: 1.5;
                }
              }
            </style>
          </head>
          <body>
            <div class="chart-title">${title}</div>
            <div class="chart-content">${svgClone.outerHTML}</div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }, 100);
  };

  // Simple fallback download method using HTML5 canvas
  const fallbackDownload = React.useCallback(
    (format, chartContainer, title) => {
      try {
        const svgElement = chartContainer.querySelector(".chart-content svg");
        if (!svgElement) {
          alert(
            isEnglish
              ? "Unable to download chart. SVG not found."
              : "გრაფიკის ჩამოტვირთვა შეუძლებელია. SVG ვერ მოიძებნა."
          );
          return;
        }

        // Wait a bit to ensure SVG is fully rendered
        setTimeout(() => {
          try {
            // Check if SVG has content by looking for actual chart elements
            const hasChartElements =
              svgElement.querySelector(
                "g[clip-path], path, rect, circle, line, text"
              ) !== null;
            if (!hasChartElements) {
              alert(
                isEnglish
                  ? "Chart appears to be empty. Please wait for data to load completely."
                  : "გრაფიკი ცარიელია. გთხოვთ, დაელოდოთ მონაცემების სრულ ჩატვირთვას."
              );
              return;
            }

            // Get the bounding box more reliably
            let bbox;
            try {
              bbox = svgElement.getBBox();
            } catch (error) {
              // Fallback if getBBox fails
              console.warn("getBBox failed:", error);
              const rect = svgElement.getBoundingClientRect();
              bbox = { width: rect.width || 800, height: rect.height || 600 };
            }

            if (bbox.width === 0 || bbox.height === 0) {
              alert(
                isEnglish
                  ? "Chart appears to be empty. Please wait for data to load."
                  : "გრაფიკი ცარიელია. გთხოვთ, დაელოდოთ მონაცემების ჩატვირთვას."
              );
              return;
            }

            // Clone and prepare SVG for export
            const svgClone = svgElement.cloneNode(true);

            // Ensure SVG has proper dimensions
            svgClone.setAttribute("width", bbox.width || 800);
            svgClone.setAttribute("height", bbox.height || 600);
            svgClone.setAttribute(
              "viewBox",
              `0 0 ${bbox.width || 800} ${bbox.height || 600}`
            );

            const svgData = new XMLSerializer().serializeToString(svgClone);

            // Create filename
            const fileName =
              title
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "_")
                .toLowerCase() || "chart";

            if (format === "svg") {
              // Direct SVG download
              const svgBlob = new Blob([svgData], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(svgBlob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${fileName}.svg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              return;
            }

            // For raster formats, convert SVG to canvas with higher quality
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            // Use higher resolution for better quality
            const scale = Math.max(window.devicePixelRatio || 1, 2);
            canvas.width = (bbox.width || 800) * scale;
            canvas.height = (bbox.height || 600) * scale;
            canvas.style.width = (bbox.width || 800) + "px";
            canvas.style.height = (bbox.height || 600) + "px";
            ctx.scale(scale, scale);

            const svgBlob = new Blob([svgData], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
              // White background
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

              // Draw image
              ctx.drawImage(img, 0, 0);

              if (format === "png" || format === "jpeg") {
                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      const downloadUrl = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = downloadUrl;
                      a.download = `${fileName}.${
                        format === "jpeg" ? "jpg" : format
                      }`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(downloadUrl);
                    } else {
                      alert(
                        isEnglish
                          ? "Failed to create image file."
                          : "გამოსახულების ფაილის შექმნა ვერ მოხერხდა."
                      );
                    }
                  },
                  format === "jpeg" ? "image/jpeg" : "image/png",
                  format === "jpeg" ? 0.95 : 1.0
                );
              }

              URL.revokeObjectURL(url);
            };

            img.onerror = () => {
              URL.revokeObjectURL(url);
              alert(
                isEnglish
                  ? "Failed to process chart image."
                  : "გრაფიკის გამოსახულების დამუშავება ვერ მოხერხდა."
              );
            };

            img.src = url;
          } catch (innerError) {
            console.error("Inner fallback download failed:", innerError);
            alert(
              isEnglish
                ? "Download failed. Please try again later."
                : "ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, მოგვიანებით სცადოთ."
            );
          }
        }, 100); // Wait 100ms for SVG to fully render
      } catch (error) {
        console.error("Fallback download failed:", error);
        alert(
          isEnglish
            ? "Download failed. Please try again later."
            : "ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, მოგვიანებით სცადოთ."
        );
      }
    },
    [isEnglish]
  );

  // Store chart refs for download access
  const chartRefs = React.useRef({});

  // Alternative download method using stored chart references
  const downloadChartFromECharts = React.useCallback(
    async (format, chartContainer, title, chartIndex) => {
      try {
        setActiveDropdown(null);

        // Wait longer for chart to fully render and for data to be processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try to get ECharts instance using stored ref
        const chartRef = chartRefs.current[chartIndex];
        let echartsInstance = null;

        if (chartRef) {
          echartsInstance = chartRef.getEchartsInstance?.();
        }

        // Fallback: try to find instance through DOM
        if (!echartsInstance) {
          const chartDiv = chartContainer.querySelector(".chart-content > div");
          if (chartDiv) {
            // Check multiple possible ways to get the instance
            echartsInstance =
              chartDiv._echarts_instance_ ||
              echarts?.getInstanceByDom(chartDiv) ||
              (window.echarts && window.echarts.getInstanceByDom(chartDiv));
          }
        }

        if (!echartsInstance) {
          console.error(
            "ECharts instance not accessible, falling back to SVG method"
          );
          return fallbackDownload(format, chartContainer, title);
        }

        // Verify that the chart has data and is rendered
        const option = echartsInstance.getOption();
        if (!option || !option.series || option.series.length === 0) {
          alert(
            isEnglish
              ? "Chart has no data to export. Please wait for data to load."
              : "გრაფიკს ექსპორტისთვის მონაცემები არ აქვს. გთხოვთ, დაელოდოთ მონაცემების ჩატვირთვას."
          );
          return;
        }

        // Check if any series has actual data
        const hasData = option.series.some(
          (series) =>
            series.data &&
            series.data.length > 0 &&
            series.data.some(
              (dataItem) =>
                dataItem !== null && dataItem !== undefined && dataItem !== 0
            )
        );

        if (!hasData) {
          alert(
            isEnglish
              ? "Chart appears to have no data. Please wait for data to load completely."
              : "გრაფიკში მონაცემები არ არის. გთხოვთ, დაელოდოთ მონაცემების სრულ ჩატვირთვას."
          );
          return;
        }

        // Force chart to re-render to ensure all data is displayed
        echartsInstance.resize();
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Create clean filename
        let cleanFileName = title
          .replace(/[^\w\s-_.]/g, "")
          .replace(/\s+/g, "_")
          .toLowerCase();

        if (!cleanFileName || cleanFileName.length < 3) {
          cleanFileName = `chart_${Date.now()}`;
        }

        const fileName = `${cleanFileName}_chart`;

        if (format === "svg") {
          // Check if ECharts is using SVG renderer before attempting direct SVG export
          const rendererType = echartsInstance.getZr().painter.getType();

          if (rendererType === "svg") {
            // Try SVG export only if using SVG renderer
            try {
              const svgStr = echartsInstance.renderToSVGString();
              const svgBlob = new Blob([svgStr], {
                type: "image/svg+xml;charset=utf-8",
              });
              const url = URL.createObjectURL(svgBlob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${fileName}.svg`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              return;
            } catch (error) {
              console.warn(
                "SVG direct export failed despite SVG renderer:",
                error
              );
              // Continue to canvas method below
            }
          } else {
            // Skip direct SVG export for canvas renderer, go straight to canvas conversion
            console.log(
              "Using canvas renderer, converting canvas to SVG format"
            );
          }
        }

        // For all formats (including SVG fallback), use ECharts canvas export
        let canvas;
        try {
          // Try the new method first with higher quality settings
          canvas = echartsInstance.renderToCanvas({
            pixelRatio: Math.max(window.devicePixelRatio || 1, 3), // Higher quality
            backgroundColor: "#ffffff",
            excludeComponents: ["toolbox"], // Exclude toolbox if present
          });
        } catch (error) {
          console.warn(
            "renderToCanvas failed, trying deprecated getRenderedCanvas:",
            error
          );
          try {
            // Fallback to deprecated method with higher quality
            canvas = echartsInstance.getRenderedCanvas({
              pixelRatio: Math.max(window.devicePixelRatio || 1, 3), // Higher quality
              backgroundColor: "#ffffff",
            });
          } catch (error2) {
            console.error(
              "Both canvas methods failed, trying alternative approach:",
              error2
            );
            // Last resort: try to get canvas with minimal options
            try {
              canvas = echartsInstance.getRenderedCanvas();
            } catch (error3) {
              console.error("All canvas methods failed:", error3);
              canvas = null;
            }
          }
        }

        if (!canvas) {
          console.error("Failed to get canvas from ECharts, using fallback");
          return fallbackDownload(format, chartContainer, title);
        }

        // Verify canvas has content
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((pixel, index) => {
          // Check for non-transparent pixels that aren't pure white
          if (index % 4 === 3) {
            // Alpha channel
            return pixel > 0; // Has some opacity
          }
          return false;
        });

        if (!hasContent) {
          console.warn("Canvas appears to be empty, using fallback method");
          return fallbackDownload(format, chartContainer, title);
        }

        switch (format) {
          case "svg": {
            // Convert canvas to SVG
            const canvasDataURL = canvas.toDataURL("image/png");
            const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}">
              <image width="${canvas.width}" height="${canvas.height}" xlink:href="${canvasDataURL}"/>
            </svg>`;
            const svgBlob = new Blob([svgContent], {
              type: "image/svg+xml;charset=utf-8",
            });
            const url = URL.createObjectURL(svgBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${fileName}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            break;
          }

          case "png": {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${fileName}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } else {
                  console.error("Failed to create PNG blob");
                  fallbackDownload(format, chartContainer, title);
                }
              },
              "image/png",
              1.0
            );
            break;
          }

          case "jpeg": {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${fileName}.jpg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } else {
                  console.error("Failed to create JPEG blob");
                  fallbackDownload(format, chartContainer, title);
                }
              },
              "image/jpeg",
              0.95
            );
            break;
          }

          case "pdf": {
            const { jsPDF } = await import("jspdf");

            // Create a canvas that includes both title and chart
            const titleCanvas = document.createElement("canvas");
            const titleCtx = titleCanvas.getContext("2d");

            // Set up canvas dimensions with space for title
            const titleHeight = 60; // Space for title
            const totalWidth = canvas.width;
            const totalHeight = canvas.height + titleHeight;

            titleCanvas.width = totalWidth;
            titleCanvas.height = totalHeight;

            // White background
            titleCtx.fillStyle = "white";
            titleCtx.fillRect(0, 0, totalWidth, totalHeight);

            // Draw title with proper Georgian font support
            titleCtx.fillStyle = "#000000";
            titleCtx.textAlign = "center";
            titleCtx.textBaseline = "middle";

            // Use a Georgian-compatible font stack
            const fontSize = Math.min(totalWidth * 0.03, 24);
            titleCtx.font = `bold ${fontSize}px "Noto Sans Georgian", "BPG Nino Mtavruli", "Sylfaen", Arial, sans-serif`;

            // Draw title with word wrapping if needed
            const words = title.split(" ");
            const titleMaxWidth = totalWidth * 0.8;
            let line = "";
            let titleY = titleHeight / 2;
            const lineHeight = fontSize * 1.2;

            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + " ";
              const metrics = titleCtx.measureText(testLine);
              const testWidth = metrics.width;

              if (testWidth > titleMaxWidth && n > 0) {
                titleCtx.fillText(line, totalWidth / 2, titleY);
                line = words[n] + " ";
                titleY += lineHeight;
              } else {
                line = testLine;
              }
            }
            titleCtx.fillText(line, totalWidth / 2, titleY);

            // Draw the chart below the title
            titleCtx.drawImage(canvas, 0, titleHeight);

            // Convert to image data
            const imgData = titleCanvas.toDataURL("image/png");

            const canvasWidth = titleCanvas.width;
            const canvasHeight = titleCanvas.height;
            const ratio = canvasWidth / canvasHeight;

            const orientation = ratio > 1 ? "landscape" : "portrait";
            const pdf = new jsPDF({
              orientation,
              unit: "mm",
              format: "a4",
            });

            const a4Width = orientation === "landscape" ? 297 : 210;
            const a4Height = orientation === "landscape" ? 210 : 297;
            const margin = 10;

            // Calculate dimensions to fit page
            const pdfMaxWidth = a4Width - margin * 2;
            const pdfMaxHeight = a4Height - margin * 2;

            let imgWidth, imgHeight;
            if (ratio > pdfMaxWidth / pdfMaxHeight) {
              imgWidth = pdfMaxWidth;
              imgHeight = pdfMaxWidth / ratio;
            } else {
              imgHeight = pdfMaxHeight;
              imgWidth = pdfMaxHeight * ratio;
            }

            const pdfX = (a4Width - imgWidth) / 2;
            const pdfY = (a4Height - imgHeight) / 2;

            // Add the complete image (title + chart)
            pdf.addImage(imgData, "PNG", pdfX, pdfY, imgWidth, imgHeight);
            pdf.save(`${fileName}.pdf`);
            break;
          }
        }
      } catch (error) {
        console.error("ECharts download failed:", error);
        // Fallback to simple download method
        fallbackDownload(format, chartContainer, title);
      }
    },
    [fallbackDownload, isEnglish]
  );

  // ECharts configuration helpers
  const getBarChartOption = (data) => ({
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
  });

  const getLineChartOption = (data) => ({
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

  // Helper function to check if there are more legend pages
  const hasMoreLegendPages = (currentPage, itemsPerPage = 12) => {
    const currentData = getCurrentActivityData();
    if (!currentData || currentData.length === 0) return false;

    // Get total number of series from activity data (excluding 'year' key)
    const sampleItem = currentData[0] || {};
    const totalSeries = Object.keys(sampleItem).filter(
      (key) => key !== "year"
    ).length;
    const endIndex = (currentPage + 1) * itemsPerPage;
    return endIndex < totalSeries;
  };

  const getStackedLineChartOption = (
    data,
    currentPage = 0,
    itemsPerPage = 12
  ) => {
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

    // Get color mapping from API
    const colorMapping = getSectionColorMapping();

    // Create a function to get color based on section name
    const getColorForSection = (sectionName) => {
      // Map section names back to codes to find the right color
      const sectionMappings = {
        "სამთომომპოვებელი მრე...": "B",
        "დამამუშავებელი მრეწვე...": "C",
        "ელექტროენერგია მიწო...": "D",
        "წყალმომარაგება ნარჩე...": "E",
        მშენებლობა: "F",
        "ვაჭრობა რემონტი": "G",
        "ტრანსპორტირება დასა...": "H",
        "განთავსება საკვები": "I",
        "ინფორმაცია კომუნიკ...": "J",
        "ფინანსური საქმიანო...": "K",
        "უძრავი ქონება": "L",
        "პროფესიული საქმია...": "M",
        "ადმინისტრაციული მომ...": "N",
        განათლება: "P",
        "ჯანდაცვა სოციალუ...": "Q",
        "ხელოვნება გართობა": "R",
        "სხვა მომსახურება": "S",
        "უცნობი საქმიანობა": "unknown",
        // English mappings
        "Mining and Quarrying": "B",
        Manufacturing: "C",
        "Electricity Supply": "D",
        "Water Supply Waste...": "E",
        Construction: "F",
        "Trade Repair": "G",
        "Transportation Stor...": "H",
        "Accommodation Food...": "I",
        "Information Comm...": "J",
        "Financial Activities": "K",
        "Real Estate Activities": "L",
        "Professional Activ...": "M",
        "Administrative Sup...": "N",
        Education: "P",
        "Health Social Work": "Q",
        "Arts Entertainment": "R",
        "Other Services": "S",
        "Unknown Activity": "unknown",
      };

      const sectionCode = sectionMappings[sectionName];
      const colorInfo = colorMapping.find((cm) => cm.section === sectionCode);
      return colorInfo ? colorInfo.color : "#000000"; // Default to black if not found
    };

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
          return `<strong>${params.name}</strong><br/>${params.marker}${
            params.seriesName
          }: ${params.value.toLocaleString()}`;
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

  const getStackedBarChartOption = (data) => {
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
      // English API field names
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
          const year = params.name;
          const seriesName = params.seriesName;
          const value = params.value;

          // Find the original key for this series to get the full translated name
          const originalKey = allDataKeys.find((key) => {
            const translatedName = regionTranslations[key] || key;
            const displayName =
              translatedName.length > 15
                ? translatedName.substring(0, 12) + "..."
                : translatedName;
            return displayName === seriesName;
          });

          // Get the full region name (not truncated)
          const fullRegionName = originalKey
            ? regionTranslations[originalKey] || originalKey
            : seriesName;

          // Calculate total for the year by summing all region values
          const yearData = data.find(
            (item) => String(item.year) === String(year)
          );
          let yearTotal = 0;
          if (yearData) {
            allDataKeys.forEach((key) => {
              const regionValue = yearData[key];
              if (regionValue !== undefined && regionValue !== null) {
                yearTotal += Number(regionValue) || 0;
              }
            });
          }

          return `
            <div style="padding: 8px; font-size: 12px; line-height: 1.5;">
              <div style="margin-bottom: 4px;"><strong>${
                isEnglish ? "Year" : "წელი"
              }:</strong> ${year}</div>
              <div style="margin-bottom: 4px;"><strong>${
                isEnglish ? "Region" : "რეგიონი"
              }:</strong> ${fullRegionName}: ${value.toLocaleString()}</div>
              <div><strong>${
                isEnglish ? "Total" : "სულ"
              }:</strong> ${yearTotal.toLocaleString()}</div>
            </div>
          `;
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
        data: allDataKeys.map((key) => {
          // Get translated name and truncate if necessary
          const translatedName = regionTranslations[key] || key;
          if (translatedName.length > 15) {
            return translatedName.substring(0, 12) + "...";
          }
          return translatedName;
        }),
      },
      grid: {
        left: "3%",
        right: "25%",
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
          formatter: function (value) {
            return value.toLocaleString();
          },
        },
      },
      series: allDataKeys.map((key) => {
        // Get translated name and truncate if necessary
        const translatedName = regionTranslations[key] || key;
        const displayName =
          translatedName.length > 15
            ? translatedName.substring(0, 12) + "..."
            : translatedName;

        return {
          name: displayName, // Use translated and truncated name to match legend
          type: "bar",
          stack: "Total", // This makes it a stacked bar chart
          emphasis: {
            focus: "series",
          },
          data: data.map((item) => item[key] || 0),
          itemStyle: {
            color: regionColors[key] || "#64748b", // Default color if region not found
          },
        };
      }),
    };
  };

  const getHorizontalBarChartOption = (data) => ({
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

  const getAreaChartOption = (data) => ({
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

  const getNormalizedStackedBarChartOption = (data) => {
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
              const sectorValue = yearData[key];
              if (sectorValue !== undefined && sectorValue !== null) {
                yearTotal += Number(sectorValue) || 0;
              }
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
            const value = Number(item[key]) || 0;
            return value; // The API already returns percentages
          }),
          itemStyle: {
            color: sectorColors[index % sectorColors.length],
          },
        };
      }),
    };
  };

  const getGrowthChartOption = (data) => ({
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

  const getGroupedBarChartOption = (data) => {
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
        if (key.startsWith("Born_in_")) {
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
        const yearData = apiData.find((item) => item.year.toString() === year);
        return yearData && yearData[survivalKey] ? yearData[survivalKey] : null;
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
            if (param.value !== null && param.value !== undefined) {
              result += `${param.marker}${
                param.seriesName
              }: ${param.value.toFixed(1)}%<br/>`;
            }
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

  const getPieChartOption = (data) => {
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
        right: "5%",
        top: "middle",
        itemGap: 10,
        textStyle: {
          fontSize: 12,
          color: "#333",
        },
        data: chartData.map((item) => item.name),
      },
      series: [
        {
          name: currentTexts.ownershipTypes,
          type: "pie",
          radius: "65%",
          center: ["40%", "50%"],
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

  const ChartContainer = ({
    title,
    children,
    onMaximize,
    chartIndex,
    onToggle,
  }) => {
    // Show ListRestart button only for charts 2, 3, 4, and 6 (using 1-based indexing)
    const showListRestart = [1, 2, 3, 5].includes(chartIndex);

    return (
      <div
        className="chart-container"
        ref={(el) =>
          el && (window.chartRefs = { ...window.chartRefs, [chartIndex]: el })
        }
      >
        <div className="chart-header">
          <h3 className="chart-title">{title}</h3>
          <div className="chart-actions">
            {showListRestart && onToggle && (
              <button
                className="chart-list-restart"
                onClick={onToggle}
                title={
                  isEnglish
                    ? `Toggle to ${
                        chartToggleStates[chartIndex] ? "birth" : "death"
                      } data`
                    : `გადართვა ${
                        chartToggleStates[chartIndex]
                          ? "დაბადების"
                          : "გარდაცვალების"
                      } მონაცემებზე`
                }
              >
                <ListRestart size={16} />
              </button>
            )}
            <div className="chart-action-dropdown">
              <button
                className="chart-action-btn dropdown-trigger"
                onClick={() => toggleDropdown(chartIndex)}
              >
                <Download size={16} />
                <ChevronDown size={12} />
              </button>
              {activeDropdown === chartIndex && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const container = e.target.closest(".chart-container");
                      setActiveDropdown(null);
                      setTimeout(() => {
                        handlePrintChart(container, title);
                      }, 100);
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 4V1C3 0.447715 3.44772 0 4 0H12C12.5523 0 13 0.447715 13 1V4H14.5C15.3284 4 16 4.67157 16 5.5V11.5C16 12.3284 15.3284 13 14.5 13H13V15C13 15.5523 12.5523 16 12 16H4C3.44772 16 3 15.5523 3 15V13H1.5C0.671573 13 0 12.3284 0 11.5V5.5C0 4.67157 0.671573 4 1.5 4H3Z"
                        fill="#4A5568"
                      />
                      <path d="M4 1V4H12V1H4Z" fill="#E2E8F0" />
                      <path
                        d="M1.5 5C1.22386 5 1 5.22386 1 5.5V11.5C1 11.7761 1.22386 12 1.5 12H3V10H13V12H14.5C14.7761 12 15 11.7761 15 11.5V5.5C15 5.22386 14.7761 5 14.5 5H1.5Z"
                        fill="#A0AEC0"
                      />
                      <path d="M4 10V15H12V10H4Z" fill="#E2E8F0" />
                      <path d="M5 11H11V12H5V11Z" fill="#CBD5E0" />
                      <path d="M5 13H9V14H5V13Z" fill="#CBD5E0" />
                      <circle cx="13" cy="7" r="1" fill="#68D391" />
                    </svg>
                    {isEnglish ? "Print Chart" : "ბეჭდვა"}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const container = e.target.closest(".chart-container");
                      setActiveDropdown(null);
                      setTimeout(async () => {
                        try {
                          await downloadChartFromECharts(
                            "png",
                            container,
                            title,
                            chartIndex
                          );
                        } catch (error) {
                          console.error("Download failed:", error);
                          alert(
                            isEnglish
                              ? "Download failed. Please try again."
                              : "ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან."
                          );
                        }
                      }, 100);
                    }}
                  >
                    <svg
                      width="16"
                      height="18"
                      viewBox="0 0 16 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.07433 0H10.8764L15.9998 5.12345V14.962C15.9998 16.1567 15.0216 17.135 13.8269 17.135H5.07433C3.87963 17.135 2.90137 16.1567 2.90137 14.962V2.17296C2.90137 0.978265 3.87967 0 5.07433 0Z"
                        fill="#0AC963"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.876 0L15.9994 5.12345H11.4292C11.1247 5.12345 10.876 4.87473 10.876 4.57018V0Z"
                        fill="#08A14F"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.476901 7.29639H12.2779C12.5393 7.29639 12.7548 7.51084 12.7548 7.77329V12.1025C12.7548 12.365 12.5393 12.5794 12.2779 12.5794H0.476901C0.214455 12.5794 3.91584e-09 12.365 3.91584e-09 12.1025V7.77329C-3.34628e-05 7.51084 0.214455 7.29639 0.476901 7.29639Z"
                        fill="#08A14F"
                      />
                    </svg>
                    {isEnglish ? "PNG" : "PNG"}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const container = e.target.closest(".chart-container");
                      setActiveDropdown(null);
                      setTimeout(async () => {
                        try {
                          await downloadChartFromECharts(
                            "jpeg",
                            container,
                            title,
                            chartIndex
                          );
                        } catch (error) {
                          console.error("Download failed:", error);
                          alert(
                            isEnglish
                              ? "Download failed. Please try again."
                              : "ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან."
                          );
                        }
                      }, 100);
                    }}
                  >
                    <svg
                      width="16"
                      height="19"
                      viewBox="0 0 16 19"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.64726 0H2.82682C2.17012 0 1.63477 0.535356 1.63477 1.19563V17.0814C1.63477 17.7417 2.17012 18.2735 2.83039 18.277H14.8045C15.4648 18.277 15.9966 17.7417 16.0001 17.0814L15.9645 5.28218L9.64726 0Z"
                        fill="#4EB3F2"
                      />
                      <path
                        d="M9.64675 0L9.62891 5.15726C9.62891 5.15726 9.64675 5.28218 9.75382 5.28218H15.964L9.64675 0Z"
                        fill="#0077CC"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.485389 8.80444H12.5345C12.8021 8.80444 13.0199 9.02215 13.0199 9.28983V14.6719C13.0199 14.9396 12.8021 15.1573 12.5345 15.1573H0.485389C0.217711 15.1573 0 14.9396 0 14.6719V9.28983C0 9.02215 0.217711 8.80444 0.485389 8.80444Z"
                        fill="#0077CC"
                      />
                      <path
                        d="M3.8225 10.675H4.65051V12.1276C4.65051 12.431 4.62196 12.6666 4.56843 12.8236C4.50775 12.9914 4.39354 13.1341 4.24364 13.2269C4.07947 13.3376 3.87246 13.3911 3.61549 13.3911C3.34425 13.3911 3.13724 13.3554 2.98734 13.2804C2.84458 13.2091 2.72323 13.0984 2.64471 12.9592C2.55906 12.7986 2.50909 12.6202 2.50195 12.4382L3.29071 12.3311C3.28714 12.4203 3.29785 12.5095 3.32283 12.5952C3.34068 12.6487 3.37637 12.6987 3.42277 12.7344C3.46202 12.7594 3.50842 12.7736 3.55839 12.7701C3.64048 12.7772 3.719 12.7344 3.76182 12.6666C3.80465 12.5988 3.82607 12.481 3.82607 12.3204L3.8225 10.675Z"
                        fill="white"
                      />
                      <path
                        d="M5.19727 10.675H6.57135C6.87114 10.675 7.09599 10.7464 7.24233 10.8892C7.39222 11.032 7.46717 11.2354 7.46717 11.4959C7.46717 11.7672 7.38509 11.9777 7.22448 12.1276C7.06387 12.2775 6.81404 12.3561 6.48212 12.3561H6.02885V13.3483H5.20083V10.675H5.19727ZM6.02885 11.8171H6.23229C6.39289 11.8171 6.50353 11.7886 6.56778 11.7351C6.63202 11.6815 6.66771 11.603 6.66414 11.5209C6.66771 11.4424 6.63559 11.3639 6.57848 11.3068C6.52138 11.2497 6.41788 11.2175 6.26441 11.2175H6.02885V11.8171Z"
                        fill="white"
                      />
                      <path
                        d="M9.24034 12.3812V11.8244H10.5181V12.9629C10.2754 13.1307 10.0576 13.2413 9.86849 13.302C9.65078 13.3662 9.42593 13.3983 9.20108 13.3912C8.88344 13.3912 8.62646 13.3377 8.4266 13.2306C8.22673 13.1199 8.06256 12.9522 7.96262 12.7488C7.84841 12.5203 7.79131 12.2669 7.79845 12.0135C7.79845 11.7209 7.85912 11.4675 7.9769 11.2533C8.09825 11.0392 8.28384 10.8643 8.50512 10.7608C8.68714 10.6752 8.92983 10.6323 9.23677 10.6323C9.533 10.6323 9.75428 10.6609 9.90061 10.7108C10.0434 10.7608 10.1683 10.8465 10.2647 10.9607C10.3682 11.0856 10.4431 11.2319 10.4824 11.389L9.68647 11.5317C9.65792 11.4389 9.60081 11.3568 9.51872 11.2997C9.4295 11.2426 9.326 11.2141 9.21893 11.2212C9.05475 11.2141 8.89414 11.2855 8.78707 11.4104C8.68 11.5353 8.62647 11.7352 8.62647 12.0064C8.62647 12.2955 8.68 12.5025 8.79064 12.6274C8.89771 12.7523 9.05118 12.813 9.24748 12.813C9.3367 12.813 9.42593 12.7987 9.51159 12.7737C9.61152 12.7381 9.70788 12.6917 9.80068 12.6381V12.3883L9.24034 12.3812Z"
                        fill="white"
                      />
                    </svg>
                    {isEnglish ? "JPEG" : "JPEG"}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const container = e.target.closest(".chart-container");
                      setActiveDropdown(null);
                      setTimeout(async () => {
                        try {
                          await downloadChartFromECharts(
                            "pdf",
                            container,
                            title,
                            chartIndex
                          );
                        } catch (error) {
                          console.error("Download failed:", error);
                          alert(
                            isEnglish
                              ? "Download failed. Please try again."
                              : "ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან."
                          );
                        }
                      }, 100);
                    }}
                  >
                    <svg
                      width="16"
                      height="18"
                      viewBox="0 0 16 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.0743 0H10.8773L15.9998 5.12344V14.962C15.9998 16.1567 15.0225 17.1349 13.8269 17.1349H5.07433C3.87964 17.1349 2.90234 16.1567 2.90234 14.962V2.17296C2.90234 0.978263 3.87964 0 5.0743 0Z"
                        fill="#E5252A"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.8779 0L16.0004 5.12344H11.4302C11.1257 5.12344 10.8779 4.87472 10.8779 4.57017V0Z"
                        fill="#B71D21"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.4769 7.29639H12.2778C12.5403 7.29639 12.7547 7.51084 12.7547 7.77329V12.1025C12.7547 12.365 12.5403 12.5794 12.2778 12.5794H0.4769C0.214454 12.5794 0 12.365 0 12.1025V7.77329C0 7.51084 0.214488 7.29639 0.4769 7.29639Z"
                        fill="#B71D21"
                      />
                    </svg>
                    {isEnglish ? "PDF" : "PDF"}
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const container = e.target.closest(".chart-container");
                      setActiveDropdown(null);
                      setTimeout(async () => {
                        try {
                          await downloadChartFromECharts(
                            "svg",
                            container,
                            title,
                            chartIndex
                          );
                        } catch (error) {
                          console.error("Download failed:", error);
                          alert(
                            isEnglish
                              ? "Download failed. Please try again."
                              : "ჩამოტვირთვა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან."
                          );
                        }
                      }, 100);
                    }}
                  >
                    <svg
                      width="16"
                      height="18"
                      viewBox="0 0 16 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.07433 0H10.8764L15.9998 5.12345V14.962C15.9998 16.1567 15.0216 17.135 13.8269 17.135H5.07433C3.87963 17.135 2.90137 16.1567 2.90137 14.962V2.17296C2.90137 0.978265 3.87967 0 5.07433 0Z"
                        fill="#9F7AEA"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.876 0L15.9994 5.12345H11.4292C11.1247 5.12345 10.876 4.87473 10.876 4.57018V0Z"
                        fill="#805AD5"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.476901 7.29639H12.2779C12.5393 7.29639 12.7548 7.51084 12.7548 7.77329V12.1025C12.7548 12.365 12.5393 12.5794 12.2779 12.5794H0.476901C0.214455 12.5794 3.91584e-09 12.365 3.91584e-09 12.1025V7.77329C-3.34628e-05 7.51084 0.214455 7.29639 0.476901 7.29639Z"
                        fill="#805AD5"
                      />
                      <path d="M2.5 9.5H4.5V10.5H2.5V9.5Z" fill="white" />
                      <path d="M5 9.5H6V10.5H5V9.5Z" fill="white" />
                      <path d="M6.5 9.5H9.5V10.5H6.5V9.5Z" fill="white" />
                      <path d="M10 9.5H11V10.5H10V9.5Z" fill="white" />
                      <path d="M2.5 11H3.5V11.5H2.5V11Z" fill="white" />
                      <path d="M4 11H7V11.5H4V11Z" fill="white" />
                      <path d="M7.5 11H9V11.5H7.5V11Z" fill="white" />
                    </svg>
                    {isEnglish ? "SVG" : "SVG"}
                  </button>
                </div>
              )}
            </div>
            <button className="chart-action-btn" onClick={onMaximize}>
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        <div className="chart-content">{children}</div>
      </div>
    );
  };

  const MaximizedChartModal = () => {
    if (!maximizedChart) return null;

    const renderChart = () => {
      switch (maximizedChart.type) {
        case "bar":
          return (
            <ReactECharts
              option={getBarChartOption(maximizedChart.data)}
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
            <div
              style={{ position: "relative", height: "100%", width: "100%" }}
            >
              <ReactECharts
                option={getStackedLineChartOption(
                  maximizedChart.data,
                  legendPage,
                  legendItemsPerPage
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
                    transform: hasMoreLegendPages(
                      legendPage,
                      legendItemsPerPage
                    )
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
                      transform: hasMoreLegendPages(
                        legendPage,
                        legendItemsPerPage
                      )
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
              option={getStackedBarChartOption(maximizedChart.data)}
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
              option={getGrowthChartOption(maximizedChart.data)}
              style={{ height: "100%", width: "100%" }}
            />
          );
        case "pie":
          return (
            <ReactECharts
              option={getPieChartOption(maximizedChart.data)}
              style={{ height: "100%", width: "100%" }}
            />
          );
        case "normalizedStackedBar":
          return (
            <ReactECharts
              option={getNormalizedStackedBarChartOption(maximizedChart.data)}
              style={{ height: "100%", width: "100%" }}
            />
          );
        case "groupedbar":
          return (
            <ReactECharts
              option={getGroupedBarChartOption(maximizedChart.data)}
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

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className={`flipper-container ${isFlipped ? "flipped" : ""}`}>
            <div className="flipper">
              <div className="border border-[#0080BE] rounded-[0_5px_5px_5px] bg-[#fafafa] p-4">
                <div className="charts-grid">
                  {/* Bar Chart - Births and Deaths */}
                  <ChartContainer
                    title={currentTexts.organizationsByYear}
                    onMaximize={() =>
                      handleMaximizeChart(
                        organizationsByYear,
                        "bar",
                        currentTexts.organizationsByYear
                      )
                    }
                    chartIndex={0}
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
                          if (ref) chartRefs.current[0] = ref;
                        }}
                        option={getBarChartOption(organizationsByYear)}
                        style={{ width: "100%", height: "300px" }}
                        onEvents={{
                          legendselectchanged: onEChartsLegendSelectChanged,
                        }}
                      />
                    )}
                  </ChartContainer>

                  {/* Stacked Line Chart - Activity Trends */}
                  <ChartContainer
                    title={getActivitySectorsTitle()}
                    onMaximize={() =>
                      handleMaximizeChart(
                        getCurrentActivityData(),
                        "stackedLine",
                        getActivitySectorsTitle()
                      )
                    }
                    chartIndex={1}
                    onToggle={toggleActivityChart}
                  >
                    <div style={{ position: "relative" }}>
                      <ReactECharts
                        ref={(ref) => {
                          if (ref) chartRefs.current[1] = ref;
                        }}
                        option={getStackedLineChartOption(
                          getCurrentActivityData(),
                          legendPage,
                          legendItemsPerPage
                        )}
                        style={{ width: "100%", height: "300px" }}
                      />
                      {(legendPage > 0 ||
                        hasMoreLegendPages(legendPage, legendItemsPerPage)) && (
                        <button
                          onClick={() => {
                            if (
                              hasMoreLegendPages(legendPage, legendItemsPerPage)
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
                              legendItemsPerPage
                            )
                              ? "none"
                              : "rotate(180deg)",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background =
                              "rgba(255, 255, 255, 1)";
                            e.target.style.boxShadow =
                              "0 2px 8px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background =
                              "rgba(255, 255, 255, 0.95)";
                            e.target.style.boxShadow =
                              "0 1px 3px rgba(0, 0, 0, 0.1)";
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "600",
                              color: "#6b7280",
                              transform: hasMoreLegendPages(
                                legendPage,
                                legendItemsPerPage
                              )
                                ? "rotate(0deg)"
                                : "rotate(180deg)",
                              display: "inline-block",
                            }}
                          >
                            {legendPage + 1}/
                            {Math.ceil(
                              (getCurrentActivityData() &&
                              getCurrentActivityData().length > 0
                                ? Object.keys(
                                    getCurrentActivityData()[0]
                                  ).filter((key) => key !== "year").length
                                : 0) / legendItemsPerPage
                            )}
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

                  {/* Stacked Bar Chart - Regional Distribution */}
                  <ChartContainer
                    title={getRegionalDistributionTitle()}
                    onMaximize={() =>
                      handleMaximizeChart(
                        getCurrentRegionalData(),
                        "stackedBar",
                        getRegionalDistributionTitle()
                      )
                    }
                    chartIndex={2}
                    onToggle={toggleRegionalChart}
                  >
                    <ReactECharts
                      ref={(ref) => {
                        if (ref) chartRefs.current[2] = ref;
                      }}
                      option={getStackedBarChartOption(
                        getCurrentRegionalData()
                      )}
                      style={{ width: "100%", height: "300px" }}
                    />
                  </ChartContainer>

                  {/* Normalized Stacked Bar Chart */}
                  <ChartContainer
                    title={getLegalFormsTitle()}
                    onMaximize={() =>
                      handleMaximizeChart(
                        getCurrentSectorData(),
                        "normalizedStackedBar",
                        getLegalFormsTitle()
                      )
                    }
                    chartIndex={3}
                    onToggle={toggleSectorChart}
                  >
                    <ReactECharts
                      ref={(ref) => {
                        if (ref) chartRefs.current[3] = ref;
                      }}
                      option={getNormalizedStackedBarChartOption(
                        getCurrentSectorData()
                      )}
                      style={{ width: "100%", height: "300px" }}
                    />
                  </ChartContainer>

                  {/* Growth Percentage Chart */}
                  <ChartContainer
                    title={currentTexts.organizationSurvival}
                    onMaximize={() =>
                      handleMaximizeChart(
                        survivalData,
                        "groupedbar",
                        currentTexts.organizationSurvival
                      )
                    }
                    chartIndex={4}
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
                        option={getGroupedBarChartOption(survivalData)}
                        style={{ width: "100%", height: "300px" }}
                        ref={(ref) => {
                          if (ref) chartRefs.current[4] = ref;
                        }}
                      />
                    )}
                  </ChartContainer>

                  {/* Pie Chart - Enterprise Distribution */}
                  <ChartContainer
                    title={currentTexts.ownershipTypes}
                    onMaximize={() =>
                      handleMaximizeChart(
                        getCurrentDistributionData(),
                        "pie",
                        currentTexts.ownershipTypes
                      )
                    }
                    chartIndex={5}
                    onToggle={toggleDistributionChart}
                  >
                    <ReactECharts
                      option={getPieChartOption(getCurrentDistributionData())}
                      style={{ width: "100%", height: "300px" }}
                      ref={(ref) => {
                        if (ref) chartRefs.current[5] = ref;
                      }}
                    />
                  </ChartContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MaximizedChartModal />
    </div>
  );
};

export default Charts;
