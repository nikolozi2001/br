import React, { useState, useEffect } from "react";
import * as echarts from "echarts";
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
} from "../services/api";
import SEO from "./SEO";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getPageTitle } from "../utils/pageTitles";
import { useNavigation } from "../hooks/useNavigation";
import "../styles/Charts.scss";

// Import modular chart components
import {
  BarChart,
  StackedLineChart,
  StackedBarChart,
  NormalizedStackedBarChart,
  GroupedBarChart,
  PieChart,
  MaximizedChartModal,
  getAllDataKeys,
} from "./charts/index";

const Charts = ({ isEnglish }) => {
  // Set page-specific title
  useDocumentTitle(isEnglish, getPageTitle("charts", isEnglish));

  const [isFlipped, setIsFlipped] = useState(false);
  const { navigationDirection, isNavigating } = useNavigation();
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
    // Reset flip state when navigating
    if (isNavigating) {
      setIsFlipped(false);
    }
    
    // Trigger flip animation
    const timer = setTimeout(() => {
      setIsFlipped(true);
    }, isNavigating ? 200 : 100);
    
    return () => clearTimeout(timer);
  }, [isNavigating]);

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

  const getOwnershipTypesTitle = () => {
    const baseTitle = currentTexts.ownershipTypes;
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

        // Create clean filename
        let cleanFileName = title
          .replace(/[^\w\s-_.]/g, "")
          .replace(/\s+/g, "_")
          .toLowerCase();

        if (!cleanFileName || cleanFileName.length < 3) {
          cleanFileName = `chart_${Date.now()}`;
        }

        // Use fallback method for all formats since ECharts export is unreliable
        return fallbackDownload(format, chartContainer, title);
      } catch (error) {
        console.error("Download failed:", error);
        return fallbackDownload(format, chartContainer, title);
      }
    },
    [fallbackDownload]
  );

  // Common props for chart container
  const getChartContainerProps = () => ({
    isEnglish,
    chartToggleStates,
    activeDropdown,
    toggleDropdown,
    setActiveDropdown,
    handlePrintChart,
    downloadChartFromECharts,
  });

  const chartsStructuredData = {
    "@context": "https://schema.org",
    "@type": "DataVisualization",
    "name": isEnglish ? "Business Register Charts and Analytics" : "ბიზნეს რეგისტრის დიაგრამები და ანალიტიკა",
    "description": isEnglish 
      ? "Interactive charts and visualizations showing Georgian business statistics, enterprise birth and death rates, regional distribution, and economic activity analysis"
      : "ინტერაქტიული დიაგრამები და ვიზუალიზაციები, რომლებიც აჩვენებს ქართული ბიზნესის სტატისტიკას, საწარმოების დაბადებისა და სიკვდილის მაჩვენებლებს, რეგიონულ განაწილებას და ეკონომიკური საქმიანობის ანალიზს",
    "about": {
      "@type": "Dataset",
      "name": isEnglish ? "Georgian Business Statistics" : "ქართული ბიზნესის სტატისტიკა"
    }
  };

  return (
    <div className="w-full">
      <SEO 
        title={isEnglish ? "Business Charts - Data Visualization and Analytics" : "ბიზნეს დიაგრამები - მონაცემთა ვიზუალიზაცია და ანალიტიკა"}
        description={isEnglish 
          ? "Explore interactive charts and data visualizations of Georgian business statistics. Analyze enterprise birth and death rates, regional distribution, and economic activities through comprehensive visual analytics."
          : "დაათვალიერეთ ინტერაქტიული დიაგრამები და ქართული ბიზნესის სტატისტიკის მონაცემთა ვიზუალიზაცია. გაანალიზეთ საწარმოების დაბადებისა და სიკვდილის მაჩვენებლები, რეგიონული განაწილება და ეკონომიკური საქმიანობა ყრმა ვიზუალური ანალიტიკის მეშვეობით."
        }
        keywords={isEnglish 
          ? "business charts, data visualization, economic analytics, enterprise statistics, regional analysis, business intelligence, georgian market data"
          : "ბიზნეს დიაგრამები, მონაცემთა ვიზუალიზაცია, ეკონომიკური ანალიტიკა, საწარმოო სტატისტიკა, რეგიონული ანალიზი, ბიზნეს ინტელექტი, ქართული ბაზრის მონაცემები"
        }
        isEnglish={isEnglish}
        type="website"
        structuredData={chartsStructuredData}
      />
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className={`flipper-container ${isFlipped ? "flipped" : ""} ${navigationDirection === 'left' ? 'flip-left' : 'flip-right'}`}>
            <div className="flipper">
              <div className="border border-[#0080BE] rounded-[0_5px_5px_5px] bg-[#fafafa] p-4">
                <div className="charts-grid">
                  {/* Bar Chart - Births and Deaths */}
                  <BarChart
                    data={organizationsByYear}
                    loading={loading}
                    error={error}
                    title={currentTexts.organizationsByYear}
                    chartIndex={0}
                    isEnglish={isEnglish}
                    currentTexts={currentTexts}
                    hiddenDataKeys={hiddenDataKeys}
                    chartRefs={chartRefs}
                    handleMaximizeChart={handleMaximizeChart}
                    handleRetry={handleRetry}
                    onEChartsLegendSelectChanged={onEChartsLegendSelectChanged}
                    {...getChartContainerProps()}
                  />

                  {/* Stacked Line Chart - Activity Trends */}
                  <StackedLineChart
                    data={getCurrentActivityData()}
                    title={getActivitySectorsTitle()}
                    chartIndex={1}
                    isEnglish={isEnglish}
                    chartRefs={chartRefs}
                    handleMaximizeChart={handleMaximizeChart}
                    onToggle={toggleActivityChart}
                    legendPage={legendPage}
                    setLegendPage={setLegendPage}
                    legendItemsPerPage={legendItemsPerPage}
                    {...getChartContainerProps()}
                  />

                  {/* Stacked Bar Chart - Regional Distribution */}
                  <StackedBarChart
                    data={getCurrentRegionalData()}
                    loading={loading}
                    error={error}
                    title={getRegionalDistributionTitle()}
                    chartIndex={2}
                    isEnglish={isEnglish}
                    chartRefs={chartRefs}
                    handleMaximizeChart={handleMaximizeChart}
                    onToggle={toggleRegionalChart}
                    handleRetry={handleRetry}
                    {...getChartContainerProps()}
                  />

                  {/* Normalized Stacked Bar Chart */}
                  <NormalizedStackedBarChart
                    data={getCurrentSectorData()}
                    loading={loading}
                    error={error}
                    title={getLegalFormsTitle()}
                    chartIndex={3}
                    isEnglish={isEnglish}
                    chartRefs={chartRefs}
                    handleMaximizeChart={handleMaximizeChart}
                    onToggle={toggleSectorChart}
                    handleRetry={handleRetry}
                    {...getChartContainerProps()}
                  />

                  {/* Grouped Bar Chart - Survival */}
                  <GroupedBarChart
                    data={survivalData}
                    survivalData={survivalData}
                    loading={loading}
                    error={error}
                    title={currentTexts.organizationSurvival}
                    chartIndex={4}
                    isEnglish={isEnglish}
                    chartRefs={chartRefs}
                    handleMaximizeChart={handleMaximizeChart}
                    handleRetry={handleRetry}
                    {...getChartContainerProps()}
                  />

                  {/* Pie Chart - Enterprise Distribution */}
                  <PieChart
                    data={getCurrentDistributionData()}
                    loading={loading}
                    error={error}
                    title={getOwnershipTypesTitle()}
                    chartIndex={5}
                    isEnglish={isEnglish}
                    currentTexts={currentTexts}
                    chartRefs={chartRefs}
                    handleMaximizeChart={handleMaximizeChart}
                    onToggle={toggleDistributionChart}
                    handleRetry={handleRetry}
                    {...getChartContainerProps()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MaximizedChartModal
        maximizedChart={maximizedChart}
        handleCloseMaximized={handleCloseMaximized}
        legendPage={legendPage}
        setLegendPage={setLegendPage}
        legendItemsPerPage={legendItemsPerPage}
        hasMoreLegendPages={(legendPage, itemsPerPage) => {
          const totalItems = maximizedChart?.data
            ? getAllDataKeys(maximizedChart.data).length
            : 0;
          return (legendPage + 1) * itemsPerPage < totalItems;
        }}
        allDataKeys={
          maximizedChart?.data ? getAllDataKeys(maximizedChart.data) : []
        }
        survivalData={survivalData}
        currentTexts={currentTexts}
        isEnglish={isEnglish}
        hiddenDataKeys={hiddenDataKeys}
      />
    </div>
  );
};

export default Charts;
