import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Download, Maximize2, Printer, ChevronDown, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { fetchEnterpriseBirthDeath } from "../services/api";
import ChartSkeleton from "./ChartSkeleton";
import "../styles/Charts.scss";

const Charts = ({ isEnglish }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [maximizedChart, setMaximizedChart] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [organizationsByYear, setOrganizationsByYear] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [legendPage, setLegendPage] = useState(0);
  const [legendItemsPerPage] = useState(12);
  
  // Initialize hiddenDataKeys from localStorage or empty Set
  const [hiddenDataKeys, setHiddenDataKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('chartHiddenDataKeys');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Failed to load hidden data keys from localStorage:', error);
    }
    return new Set();
  });

  // Save hiddenDataKeys to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chartHiddenDataKeys', JSON.stringify([...hiddenDataKeys]));
    } catch (error) {
      console.log('Failed to save hidden data keys to localStorage:', error);
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
        const data = await fetchEnterpriseBirthDeath(isEnglish ? "en" : "ge");
        setOrganizationsByYear(data);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Error loading enterprise birth-death data:", error);
        setError(error.message || "Failed to load data");
        setOrganizationsByYear([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isEnglish, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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

  const texts = {
    georgian: {
      title: "სტატისტიკური ანგარიშგება",
      organizationsByYear:
        "საწარმოთა დაბადება და გარდაცვალება 2014-2023 წლებში",
      regionalDistribution: "რეგისტრირებული ორგანიზაციები რეგიონების მიხედვით",
      activitySectors: "ორგანიზაციები ეკონომიკური საქმიანობის მიხედვით",
      ownershipTypes: "ორგანიზაციები საკუთრების ფორმების მიხედვით",
      legalForms: "2023 წლის ორგანიზაციები სამართლებრივი ფორმების მიხედვით",
      organizationGrowth: "ორგანიზაციების ზრდის დინამიკა (%)",
      birth: "დაბადება",
      death: "გარდაცვალება",
    },
    english: {
      title: "Statistical Reports",
      organizationsByYear: "Organizations Birth and Death 2014-2023",
      regionalDistribution: "Organizations by Regions",
      activitySectors: "Organizations by Economic Activity",
      ownershipTypes: "Organizations by Ownership Types",
      legalForms: "2023 Organizations by Legal Forms",
      organizationGrowth: "Organization Growth Dynamics (%)",
      birth: "Birth",
      death: "Death",
    },
  };

  const currentTexts = isEnglish ? texts.english : texts.georgian;

  const handleLegendClick = React.useCallback((dataKey) => {
    setHiddenDataKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);  // UNHIDE: Remove from hidden set
      } else {
        newSet.add(dataKey);     // HIDE: Add to hidden set
      }
      return newSet;
    });
  }, []);

  const onEChartsLegendSelectChanged = React.useCallback((params) => {
    const { name } = params;
    const key = name === currentTexts.birth ? 'birth' : name === currentTexts.death ? 'death' : name.toLowerCase();
    handleLegendClick(key);
  }, [handleLegendClick, currentTexts]);

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

  const downloadChart = React.useCallback(async (format, chartElement, title) => {
    // Close dropdown first to avoid capturing it
    setActiveDropdown(null);

    // Wait a bit for dropdown to close
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get the chart content area specifically, not the whole container
    const chartContent = chartElement.querySelector(".chart-content");
    const svgElement = chartContent?.querySelector("svg");

    if (!svgElement) {
      console.error("No SVG element found in chart");
      return;
    }

    // Get the actual rendered dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = svgRect.width || 800;
    const svgHeight = svgRect.height || 400;

    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true);

    // Set explicit dimensions on the clone
    svgClone.setAttribute("width", svgWidth);
    svgClone.setAttribute("height", svgHeight);
    svgClone.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    const svgData = new XMLSerializer().serializeToString(svgClone);

    // Create a clean filename that works with Georgian text
    let cleanFileName = title;
    // Replace Georgian characters and special characters with safe alternatives
    cleanFileName = cleanFileName
      .replace(/[^\w\s-_.]/g, "") // Remove special characters except word chars, spaces, hyphens, underscores, dots
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .toLowerCase();

    // Fallback if filename becomes empty
    if (!cleanFileName || cleanFileName.length < 3) {
      cleanFileName = `chart_${Date.now()}`;
    }

    const fileName = `${cleanFileName}_chart`;

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

    // For raster formats, convert SVG to canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size with high DPI for better quality (ensure 100% data capture)
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // At least 2x for high quality
    canvas.width = svgWidth * dpr;
    canvas.height = svgHeight * dpr;
    canvas.style.width = svgWidth + "px";
    canvas.style.height = svgHeight + "px";
    ctx.scale(dpr, dpr);

    // Improve rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        // Fill with white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, svgWidth, svgHeight);

        // Draw the chart
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

        switch (format) {
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
                }
                resolve();
              },
              "image/png",
              1.0
            ); // Maximum quality
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
                }
                resolve();
              },
              "image/jpeg",
              1.0
            ); // Maximum quality
            break;
          }

          case "pdf": {
            // For PDF, we'll use the canvas to create a simple PDF
            import("jspdf")
              .then(({ jsPDF }) => {
                const orientation =
                  svgWidth > svgHeight ? "landscape" : "portrait";
                const pdf = new jsPDF({
                  orientation,
                  unit: "mm",
                  format: "a4",
                });

                // Calculate dimensions to fit A4
                const a4Width = orientation === "landscape" ? 297 : 210;
                const a4Height = orientation === "landscape" ? 210 : 297;
                const margin = 20;

                const maxWidth = a4Width - margin * 2;
                const maxHeight = a4Height - margin * 3; // Extra margin for title

                // Calculate scale to fit
                const scaleX = maxWidth / (svgWidth * 0.264583); // Convert px to mm
                const scaleY = maxHeight / (svgHeight * 0.264583);
                const scale = Math.min(scaleX, scaleY);

                const finalWidth = svgWidth * 0.264583 * scale;
                const finalHeight = svgHeight * 0.264583 * scale;

                // Center the image
                const x = (a4Width - finalWidth) / 2;
                const y = margin + 15; // Space for title

                // Handle Georgian text properly by converting to image
                // Create a temporary canvas for the title
                const titleCanvas = document.createElement("canvas");
                const titleCtx = titleCanvas.getContext("2d");

                // Set canvas size for title (higher resolution for better quality)
                const titleDpr = 2;
                titleCanvas.width = a4Width * 3.779 * titleDpr; // Convert mm to px (72 DPI) with high resolution
                titleCanvas.height = 100 * titleDpr; // Increased height for better spacing
                titleCtx.scale(titleDpr, titleDpr);

                // Set font for title (use system fonts that support Georgian)
                titleCtx.fillStyle = "white";
                titleCtx.fillRect(
                  0,
                  0,
                  titleCanvas.width / titleDpr,
                  titleCanvas.height / titleDpr
                );
                titleCtx.fillStyle = "#1f2937"; // Dark gray for better readability

                // Try to load web fonts first, fallback to system fonts
                titleCtx.font =
                  'bold 28px "Noto Sans Georgian", "BPG Nino Mtavruli", "Sylfaen", "Segoe UI", "Arial Unicode MS", sans-serif';
                titleCtx.textAlign = "center";
                titleCtx.textBaseline = "middle";
                titleCtx.imageSmoothingEnabled = true;
                titleCtx.imageSmoothingQuality = "high";

                // Draw title text with better positioning
                const titleWidth = titleCanvas.width / titleDpr;
                const titleHeight = titleCanvas.height / titleDpr;

                // Split long titles into multiple lines if needed
                const words = title.split(" ");
                const titleMaxWidth = titleWidth - 60; // Increased margin for better spacing
                let line = "";
                const lines = [];

                for (let i = 0; i < words.length; i++) {
                  const testLine = line + words[i] + " ";
                  const metrics = titleCtx.measureText(testLine);
                  const testWidth = metrics.width;

                  if (testWidth > titleMaxWidth && line !== "") {
                    lines.push(line.trim());
                    line = words[i] + " ";
                  } else {
                    line = testLine;
                  }
                }
                lines.push(line.trim());

                // Draw each line with better spacing
                const lineHeight = 24; // Increased line height for better readability
                const startY =
                  titleHeight / 2 - ((lines.length - 1) * lineHeight) / 2;

                lines.forEach((line, index) => {
                  titleCtx.fillText(
                    line,
                    titleWidth / 2,
                    startY + index * lineHeight
                  );
                });

                // Add title as image to PDF with proper sizing
                const titleImageData = titleCanvas.toDataURL("image/png");
                const titleHeightMm = Math.min(25, lines.length * 10); // Adjusted height calculation

                pdf.addImage(
                  titleImageData,
                  "PNG",
                  margin,
                  margin - 5,
                  maxWidth,
                  titleHeightMm
                );

                // Adjust chart position based on title height
                const adjustedY = margin + titleHeightMm + 8; // Increased spacing

                // Add chart with adjusted position
                pdf.addImage(
                  canvas.toDataURL("image/png"),
                  "PNG",
                  x,
                  Math.max(adjustedY, y), // Use either adjusted position or original, whichever is lower
                  finalWidth,
                  finalHeight
                );

                // Clean filename for Georgian text
                const cleanFileName =
                  fileName.replace(/[^\w\s-]/g, "").trim() || "chart";
                pdf.save(`${cleanFileName}.pdf`);
                resolve();
              })
              .catch((error) => {
                console.error("PDF generation failed:", error);
                // Fallback: download as PNG
                canvas.toBlob((blob) => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${fileName}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                  resolve();
                }, "image/png");
              });
            break;
          }

          default:
            resolve();
        }
      };

      img.onerror = () => {
        console.error("Failed to load SVG as image");
        resolve();
      };

      // Convert SVG to data URL
      const svgDataUrl =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
      img.src = svgDataUrl;
    });
  }, []);

  // Sample data for charts - replace with real data from your API
  const activityData = [
    {
      year: "2012",
      manufacturing: 8,
      construction: 4,
      retail: 15,
      transport: 3,
      finance: 2,
      other: 10,
      test: 15,
      test2: 20,
      test3: 25,
      test4: 30,
      test5: 35,
      test6: 40,
      test7: 45,
      test8: 50
    },
    {
      year: "2013",
      manufacturing: 9,
      construction: 5,
      retail: 16,
      transport: 4,
      finance: 3,
      other: 11,
      test: 16,
      test2: 21,
      test3: 26,
      test4: 31,
      test5: 36,
      test6: 41,
      test7: 46,
      test8: 51
    },
    {
      year: "2014",
      manufacturing: 12,
      construction: 6,
      retail: 18,
      transport: 5,
      finance: 4,
      other: 13,
      test: 17,
      test2: 22,
      test3: 27,
      test4: 32,
      test5: 37,
      test6: 42,
      test7: 47,
      test8: 52
    },
    {
      year: "2015",
      manufacturing: 14,
      construction: 8,
      retail: 20,
      transport: 6,
      finance: 5,
      other: 15,
      test: 18,
      test2: 23,
      test3: 28,
      test4: 33,
      test5: 38,
      test6: 43,
      test7: 48,
      test8: 53
    },
    {
      year: "2016",
      manufacturing: 16,
      construction: 9,
      retail: 22,
      transport: 7,
      finance: 6,
      other: 17,
      test: 18,
      test2: 23,
      test3: 28,
      test4: 33,
      test5: 38,
      test6: 43,
      test7: 48,
      test8: 53
    },
    {
      year: "2017",
      manufacturing: 18,
      construction: 10,
      retail: 24,
      transport: 8,
      finance: 7,
      other: 19,
      test: 17,
      test2: 22,
      test3: 27,
      test4: 32,
      test5: 37,
      test6: 42,
      test7: 47,
      test8: 52
    },
    {
      year: "2018",
      manufacturing: 20,
      construction: 12,
      retail: 26,
      transport: 9,
      finance: 8,
      other: 21,
      test: 18,
      test2: 23,
      test3: 28,
      test4: 33,
      test5: 38,
      test6: 43,
      test7: 48,
      test8: 53
    },
    {
      year: "2019",
      manufacturing: 22,
      construction: 14,
      retail: 28,
      transport: 10,
      finance: 9,
      other: 23,
      test: 18,
      test2: 23,
      test3: 28,
      test4: 33,
      test5: 38,
      test6: 43,
      test7: 48,
      test8: 53
    },
    {
      year: "2020",
      manufacturing: 18,
      construction: 10,
      retail: 24,
      transport: 8,
      finance: 7,
      other: 19,
      test: 17,
      test2: 22,
      test3: 27,
      test4: 32,
      test5: 37,
      test6: 42,
      test7: 47,
      test8: 52
    },
    {
      year: "2021",
      manufacturing: 25,
      construction: 16,
      retail: 30,
      transport: 12,
      finance: 10,
      other: 25,
      test: 19,
      test2: 24,
      test3: 29,
      test4: 34,
      test5: 39,
      test6: 44,
      test7: 49,
      test8: 54
    },
    {
      year: "2022",
      manufacturing: 28,
      construction: 18,
      retail: 32,
      transport: 14,
      finance: 12,
      other: 27,
      test: 20,
      test2: 25,
      test3: 30,
      test4: 35,
      test5: 40,
      test6: 45,
      test7: 50,
      test8: 55
    },
    {
      year: "2023",
      manufacturing: 30,
      construction: 20,
      retail: 35,
      transport: 16,
      finance: 14,
      other: 30,
      test: 21,
      test2: 26,
      test3: 31,
      test4: 36,
      test5: 41,
      test6: 46,
      test7: 51,
      test8: 56
    },
  ];

  const ownershipData = [
    { name: "კერძო", value: 87, color: "#2563eb" },
    { name: "სახელმწიფო", value: 8, color: "#dc2626" },
    { name: "მუნიციპალური", value: 3, color: "#16a34a" },
    { name: "საერთაშორისო", value: 2, color: "#ca8a04" },
  ];

  const organizationGrowthData = [
    { year: "2014", total: 27328 },
    { year: "2015", total: 32060 },
    { year: "2016", total: 30708 },
    { year: "2017", total: 31211 },
    { year: "2018", total: 38583 },
    { year: "2019", total: 37742 },
    { year: "2020", total: 34298 },
    { year: "2021", total: 55132 },
    { year: "2022", total: 57580 },
    { year: "2023", total: 55132 },
  ];

  // ECharts configuration helpers
  const getBarChartOption = (data) => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params) {
        let result = params[0].name + '<br/>';
        params.forEach(param => {
          result += `${param.marker}${param.seriesName}: ${param.value.toLocaleString()}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: [currentTexts.birth, currentTexts.death],
      selected: {
        [currentTexts.birth]: !hiddenDataKeys.has('birth'),
        [currentTexts.death]: !hiddenDataKeys.has('death')
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.year),
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function(value) {
          return value.toLocaleString();
        }
      }
    },
    series: [
      {
        name: currentTexts.birth,
        type: 'bar',
        data: data.map(item => item.birth),
        itemStyle: {
          color: '#2563eb'
        }
      },
      {
        name: currentTexts.death,
        type: 'bar',
        data: data.map(item => item.death),
        itemStyle: {
          color: '#dc2626'
        }
      }
    ]
  });

  const getLineChartOption = (data) => ({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      data: ['Manufacturing', 'Construction', 'Retail', 'Transport', 'Finance', 'Other']
    },
    grid: {
      left: '3%',
      right: '20%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.year)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Manufacturing',
        type: 'line',
        data: data.map(item => item.manufacturing),
        lineStyle: { color: '#2563eb', width: 2 },
        itemStyle: { color: '#2563eb' }
      },
      {
        name: 'Construction',
        type: 'line',
        data: data.map(item => item.construction),
        lineStyle: { color: '#dc2626', width: 2 },
        itemStyle: { color: '#dc2626' }
      },
      {
        name: 'Retail',
        type: 'line',
        data: data.map(item => item.retail),
        lineStyle: { color: '#16a34a', width: 2 },
        itemStyle: { color: '#16a34a' }
      },
      {
        name: 'Transport',
        type: 'line',
        data: data.map(item => item.transport),
        lineStyle: { color: '#ca8a04', width: 2 },
        itemStyle: { color: '#ca8a04' }
      },
      {
        name: 'Finance',
        type: 'line',
        data: data.map(item => item.finance),
        lineStyle: { color: '#7c3aed', width: 2 },
        itemStyle: { color: '#7c3aed' }
      },
      {
        name: 'Other',
        type: 'line',
        data: data.map(item => item.other),
        lineStyle: { color: '#db2777', width: 2 },
        itemStyle: { color: '#db2777' }
      }
    ]
  });

  // Helper function to check if there are more legend pages
  const hasMoreLegendPages = (currentPage, itemsPerPage = 12) => {
    const totalSeries = 14; // Total number of series (Manufacturing, Construction, etc.)
    const endIndex = (currentPage + 1) * itemsPerPage;
    return endIndex < totalSeries;
  };

  const getStackedLineChartOption = (data, currentPage = 0, itemsPerPage = 12) => {
    // Define all series
    const allSeries = [
      { name: 'Manufacturing', dataKey: 'manufacturing', color: '#2563eb' },
      { name: 'Construction', dataKey: 'construction', color: '#dc2626' },
      { name: 'Retail', dataKey: 'retail', color: '#16a34a' },
      { name: 'Transport', dataKey: 'transport', color: '#ca8a04' },
      { name: 'Finance', dataKey: 'finance', color: '#7c3aed' },
      { name: 'Other', dataKey: 'other', color: '#db2777' },
      { name: 'Test', dataKey: 'test', color: '#f97316' },
      { name: 'Test2', dataKey: 'test2', color: '#f59e0b' },
      { name: 'Test3', dataKey: 'test3', color: '#facc15' },
      { name: 'Test4', dataKey: 'test4', color: '#a3e635' },
      { name: 'Test5', dataKey: 'test5', color: '#84cc16' },
      { name: 'Test6', dataKey: 'test6', color: '#22c55e' },
      { name: 'Test7', dataKey: 'test7', color: '#16a34a' },
      { name: 'Test8', dataKey: 'test8', color: '#15803d' }
    ];

    // Calculate pagination for legend only
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageLegend = allSeries.slice(startIndex, endIndex);

    return {
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params) {
          return `<strong>${params.name}</strong><br/>${params.marker}${params.seriesName}: ${params.value.toLocaleString()}`;
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'middle',
        align: 'left',
        itemGap: 8,
        itemWidth: 18,
        itemHeight: 14,
        textStyle: {
          fontSize: 12,
          color: '#333'
        },
        data: currentPageLegend.map(s => s.name)
      },
      grid: {
        left: '3%',
        right: '25%',
        bottom: '3%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.year),
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: function(value) {
            return value.toLocaleString();
          }
        }
      },
      series: allSeries.map(seriesConfig => ({
        name: seriesConfig.name,
        type: 'line',
        stack: 'Total',
        emphasis: {
          focus: 'series'
        },
        data: data.map(item => item[seriesConfig.dataKey]),
        lineStyle: { color: seriesConfig.color, width: 2 },
        itemStyle: { color: seriesConfig.color }
      }))
    };
  };

  const getHorizontalBarChartOption = (data) => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.year)
    },
    series: [{
      type: 'bar',
      data: data.map(item => item.total),
      itemStyle: {
        color: '#2563eb'
      }
    }]
  });

  const getAreaChartOption = (data) => ({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Manufacturing', 'Construction', 'Retail', 'Transport', 'Finance', 'Other']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.year)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Manufacturing',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        data: data.map(item => item.manufacturing),
        itemStyle: { color: '#2563eb' }
      },
      {
        name: 'Construction',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        data: data.map(item => item.construction),
        itemStyle: { color: '#dc2626' }
      },
      {
        name: 'Retail',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        data: data.map(item => item.retail),
        itemStyle: { color: '#16a34a' }
      },
      {
        name: 'Transport',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        data: data.map(item => item.transport),
        itemStyle: { color: '#ca8a04' }
      },
      {
        name: 'Finance',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        data: data.map(item => item.finance),
        itemStyle: { color: '#7c3aed' }
      },
      {
        name: 'Other',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        data: data.map(item => item.other),
        itemStyle: { color: '#db2777' }
      }
    ]
  });

  const getGrowthChartOption = (data) => ({
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}<br/>${params[0].marker}${isEnglish ? 'Growth' : 'ზრდა'}: ${params[0].value}%`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.year)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      type: 'bar',
      data: data.map(item => item.growth),
      itemStyle: {
        color: '#16a34a'
      }
    }]
  });

  const getPieChartOption = (data) => ({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [{
      name: currentTexts.ownershipTypes,
      type: 'pie',
      radius: '50%',
      data: data.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: { color: item.color }
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  });

  const ChartContainer = ({ title, children, onMaximize, chartIndex }) => (
    <div
      className="chart-container"
      ref={(el) =>
        el && (window.chartRefs = { ...window.chartRefs, [chartIndex]: el })
      }
    >
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-actions">
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
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 4V1C3 0.447715 3.44772 0 4 0H12C12.5523 0 13 0.447715 13 1V4H14.5C15.3284 4 16 4.67157 16 5.5V11.5C16 12.3284 15.3284 13 14.5 13H13V15C13 15.5523 12.5523 16 12 16H4C3.44772 16 3 15.5523 3 15V13H1.5C0.671573 13 0 12.3284 0 11.5V5.5C0 4.67157 0.671573 4 1.5 4H3Z"
                      fill="#4A5568"
                    />
                    <path
                      d="M4 1V4H12V1H4Z"
                      fill="#E2E8F0"
                    />
                    <path
                      d="M1.5 5C1.22386 5 1 5.22386 1 5.5V11.5C1 11.7761 1.22386 12 1.5 12H3V10H13V12H14.5C14.7761 12 15 11.7761 15 11.5V5.5C15 5.22386 14.7761 5 14.5 5H1.5Z"
                      fill="#A0AEC0"
                    />
                    <path
                      d="M4 10V15H12V10H4Z"
                      fill="#E2E8F0"
                    />
                    <path
                      d="M5 11H11V12H5V11Z"
                      fill="#CBD5E0"
                    />
                    <path
                      d="M5 13H9V14H5V13Z"
                      fill="#CBD5E0"
                    />
                    <circle
                      cx="13"
                      cy="7"
                      r="1"
                      fill="#68D391"
                    />
                  </svg>
                  {isEnglish ? "Print Chart" : "ბეჭდვა"}
                </button>
                <button
                  className="dropdown-item"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const container = e.target.closest(".chart-container");
                    await downloadChart("png", container, title);
                  }}
                >
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
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
                    await downloadChart("jpeg", container, title);
                  }}
                >
                  <svg
                    width="16"
                    height="19"
                    viewBox="0 0 16 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
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
                    await downloadChart("pdf", container, title);
                  }}
                >
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
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
                    await downloadChart("svg", container, title);
                  }}
                >
                  <svg
                    width="16"
                    height="18"
                    viewBox="0 0 16 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
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
                    <path
                      d="M2.5 9.5H4.5V10.5H2.5V9.5Z"
                      fill="white"
                    />
                    <path
                      d="M5 9.5H6V10.5H5V9.5Z"
                      fill="white"
                    />
                    <path
                      d="M6.5 9.5H9.5V10.5H6.5V9.5Z"
                      fill="white"
                    />
                    <path
                      d="M10 9.5H11V10.5H10V9.5Z"
                      fill="white"
                    />
                    <path
                      d="M2.5 11H3.5V11.5H2.5V11Z"
                      fill="white"
                    />
                    <path
                      d="M4 11H7V11.5H4V11Z"
                      fill="white"
                    />
                    <path
                      d="M7.5 11H9V11.5H7.5V11Z"
                      fill="white"
                    />
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

  const MaximizedChartModal = () => {
    if (!maximizedChart) return null;

    const renderChart = () => {
      switch (maximizedChart.type) {
        case "bar":
          return (
            <ReactECharts
              option={getBarChartOption(maximizedChart.data)}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case "line":
          return (
            <ReactECharts
              option={getLineChartOption(maximizedChart.data)}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case "stackedLine":
          return (
            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
              <ReactECharts
                option={getStackedLineChartOption(maximizedChart.data, legendPage, legendItemsPerPage)}
                style={{ height: '100%', width: '100%' }}
              />
              {hasMoreLegendPages(legendPage, legendItemsPerPage) && (
                <button
                  onClick={() => setLegendPage(prev => prev + 1)}
                  style={{
                    position: 'absolute',
                    right: '7%',
                    bottom: '40px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <ChevronDown size={16} />
                  {isEnglish ? 'More' : 'მეტი'}
                </button>
              )}
              {legendPage > 0 && (
                <button
                  onClick={() => setLegendPage(prev => prev - 1)}
                  style={{
                    position: 'absolute',
                    right: '7%',
                    bottom: '80px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transform: 'rotate(180deg)'
                  }}
                >
                  <ChevronDown size={16} />
                </button>
              )}
              {(legendPage > 0 || hasMoreLegendPages(legendPage, legendItemsPerPage)) && (
                <div
                  style={{
                    position: 'absolute',
                    right: '7%',
                    bottom: '120px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {isEnglish ? 'Page' : 'გვერდი'} {legendPage + 1}/{Math.ceil(14 / legendItemsPerPage)}
                </div>
              )}
            </div>
          );
        case "horizontalBar":
          return (
            <ReactECharts
              option={getHorizontalBarChartOption(maximizedChart.data)}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case "area":
          return (
            <ReactECharts
              option={getAreaChartOption(maximizedChart.data)}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case "growth":
          return (
            <ReactECharts
              option={getGrowthChartOption(maximizedChart.data)}
              style={{ height: '100%', width: '100%' }}
            />
          );
        case "pie":
          return (
            <ReactECharts
              option={getPieChartOption(maximizedChart.data)}
              style={{ height: '100%', width: '100%' }}
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
          <div className="maximize-modal-chart" style={{ width: '100%', height: '600px' }}>
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
                      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChartSkeleton />
                      </div>
                    ) : error ? (
                      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
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
                        option={getBarChartOption(organizationsByYear)}
                        style={{ width: '100%', height: '300px' }}
                        onEvents={{
                          'legendselectchanged': onEChartsLegendSelectChanged
                        }}
                      />
                    )}
                  </ChartContainer>

                  {/* Stacked Line Chart - Activity Trends */}
                  <ChartContainer
                    title={currentTexts.activitySectors}
                    onMaximize={() =>
                      handleMaximizeChart(
                        activityData,
                        "stackedLine",
                        currentTexts.activitySectors
                      )
                    }
                    chartIndex={1}
                  >
                    <div style={{ position: 'relative' }}>
                      <ReactECharts
                        option={getStackedLineChartOption(activityData, legendPage, legendItemsPerPage)}
                        style={{ width: '100%', height: '300px' }}
                      />
                      {hasMoreLegendPages(legendPage, legendItemsPerPage) && (
                        <button
                          onClick={() => setLegendPage(prev => prev + 1)}
                          style={{
                            position: 'absolute',
                            right: '7%',
                            bottom: '20px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 10
                          }}
                        >
                          <ChevronDown size={14} />
                        </button>
                      )}
                      {legendPage > 0 && (
                        <button
                          onClick={() => setLegendPage(prev => prev - 1)}
                          style={{
                            position: 'absolute',
                            right: '7%',
                            bottom: '50px',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            zIndex: 10,
                            transform: 'rotate(180deg)'
                          }}
                        >
                          <ChevronDown size={14} />
                        </button>
                      )}
                      {(legendPage > 0 || hasMoreLegendPages(legendPage, legendItemsPerPage)) && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '7%',
                            bottom: '80px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            zIndex: 10
                          }}
                        >
                          {legendPage + 1}/{Math.ceil(14 / legendItemsPerPage)}
                        </div>
                      )}
                    </div>
                  </ChartContainer>

                  {/* Stacked Bar Chart - Regional Distribution */}
                  <ChartContainer
                    title={currentTexts.regionalDistribution}
                    onMaximize={() =>
                      handleMaximizeChart(
                        organizationGrowthData,
                        "horizontalBar",
                        currentTexts.regionalDistribution
                      )
                    }
                    chartIndex={2}
                  >
                    <ReactECharts
                      option={getHorizontalBarChartOption(organizationGrowthData)}
                      style={{ width: '100%', height: '300px' }}
                    />
                  </ChartContainer>

                  {/* Stacked Area Chart */}
                  <ChartContainer
                    title={
                      isEnglish
                        ? "Organizations by Legal Forms"
                        : "ორგანიზაციები სამართლებრივი ფორმების მიხედვით"
                    }
                    onMaximize={() =>
                      handleMaximizeChart(
                        activityData,
                        "area",
                        isEnglish
                          ? "Organizations by Legal Forms"
                          : "ორგანიზაციები სამართლებრივი ფორმების მიხედვით"
                      )
                    }
                    chartIndex={3}
                  >
                    <ReactECharts
                      option={getAreaChartOption(activityData)}
                      style={{ width: '100%', height: '300px' }}
                    />
                  </ChartContainer>

                  {/* Growth Percentage Chart */}
                  <ChartContainer
                    title={currentTexts.organizationGrowth}
                    onMaximize={() =>
                      handleMaximizeChart(
                        organizationsByYear.map((item, index) => ({
                          year: item.year,
                          growth:
                            index > 0
                              ? (
                                  ((item.birth -
                                    organizationsByYear[index - 1].birth) /
                                    organizationsByYear[index - 1].birth) *
                                  100
                                ).toFixed(1)
                              : 0,
                        })),
                        "growth",
                        currentTexts.organizationGrowth
                      )
                    }
                    chartIndex={4}
                  >
                    {loading ? (
                      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChartSkeleton />
                      </div>
                    ) : error ? (
                      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
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
                        option={getGrowthChartOption(organizationsByYear.map((item, index) => ({
                          year: item.year,
                          growth:
                            index > 0
                              ? (
                                  ((item.birth -
                                    organizationsByYear[index - 1].birth) /
                                    organizationsByYear[index - 1].birth) *
                                  100
                                ).toFixed(1)
                              : 0,
                        })))}
                        style={{ width: '100%', height: '300px' }}
                      />
                    )}
                  </ChartContainer>

                  {/* Pie Chart - Ownership Types */}
                  <ChartContainer
                    title={currentTexts.ownershipTypes}
                    onMaximize={() =>
                      handleMaximizeChart(
                        ownershipData,
                        "pie",
                        currentTexts.ownershipTypes
                      )
                    }
                    chartIndex={5}
                  >
                    <ReactECharts
                      option={getPieChartOption(ownershipData)}
                      style={{ width: '100%', height: '300px' }}
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
