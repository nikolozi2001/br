import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Menu, Download, Maximize2, Printer, ChevronDown } from "lucide-react";
import "../styles/Charts.scss";

const Charts = ({ isEnglish }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [maximizedChart, setMaximizedChart] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    setIsFlipped(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.chart-action-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMaximizeChart = (chartData, chartType, title) => {
    setMaximizedChart({ data: chartData, type: chartType, title });
  };

  const handleCloseMaximized = () => {
    setMaximizedChart(null);
  };

  const toggleDropdown = (chartIndex) => {
    setActiveDropdown(activeDropdown === chartIndex ? null : chartIndex);
  };

  const handlePrintChart = (chartElement, title) => {
    // Close dropdown first
    setActiveDropdown(null);
    
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      const chartContent = chartElement.querySelector('.chart-content');
      
      if (!chartContent) {
        console.error('Chart content not found');
        return;
      }
      
      // Get the SVG element
      const svgElement = chartContent.querySelector('svg');
      if (!svgElement) {
        console.error('SVG element not found');
        return;
      }
      
      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);
      const svgRect = svgElement.getBoundingClientRect();
      
      // Set explicit dimensions
      svgClone.setAttribute('width', svgRect.width || 800);
      svgClone.setAttribute('height', svgRect.height || 400);
      
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

  const downloadChart = async (format, chartElement, title) => {
    // Close dropdown first to avoid capturing it
    setActiveDropdown(null);
    
    // Wait a bit for dropdown to close
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get the chart content area specifically, not the whole container
    const chartContent = chartElement.querySelector('.chart-content');
    const svgElement = chartContent?.querySelector('svg');
    
    if (!svgElement) {
      console.error('No SVG element found in chart');
      return;
    }

    // Get the actual rendered dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = svgRect.width || 800;
    const svgHeight = svgRect.height || 400;

    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true);
    
    // Set explicit dimensions on the clone
    svgClone.setAttribute('width', svgWidth);
    svgClone.setAttribute('height', svgHeight);
    svgClone.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    
    // Create a clean filename that works with Georgian text
    let cleanFileName = title;
    // Replace Georgian characters and special characters with safe alternatives
    cleanFileName = cleanFileName
      .replace(/[^\w\s-_.]/g, '') // Remove special characters except word chars, spaces, hyphens, underscores, dots
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();
    
    // Fallback if filename becomes empty
    if (!cleanFileName || cleanFileName.length < 3) {
      cleanFileName = `chart_${Date.now()}`;
    }
    
    const fileName = `${cleanFileName}_chart`;

    if (format === 'svg') {
      // Direct SVG download
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // For raster formats, convert SVG to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with high DPI for better quality (ensure 100% data capture)
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // At least 2x for high quality
    canvas.width = svgWidth * dpr;
    canvas.height = svgHeight * dpr;
    canvas.style.width = svgWidth + 'px';
    canvas.style.height = svgHeight + 'px';
    ctx.scale(dpr, dpr);
    
    // Improve rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, svgWidth, svgHeight);
        
        // Draw the chart
        ctx.drawImage(img, 0, 0, svgWidth, svgHeight);

        switch (format) {
          case 'png': {
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              resolve();
            }, 'image/png', 1.0); // Maximum quality
            break;
          }

          case 'jpeg': {
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${fileName}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              resolve();
            }, 'image/jpeg', 1.0); // Maximum quality
            break;
          }

          case 'pdf': {
            // For PDF, we'll use the canvas to create a simple PDF
            import('jspdf').then(({ jsPDF }) => {
              const orientation = svgWidth > svgHeight ? 'landscape' : 'portrait';
              const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format: 'a4'
              });
              
              // Calculate dimensions to fit A4
              const a4Width = orientation === 'landscape' ? 297 : 210;
              const a4Height = orientation === 'landscape' ? 210 : 297;
              const margin = 20;
              
              const maxWidth = a4Width - (margin * 2);
              const maxHeight = a4Height - (margin * 3); // Extra margin for title
              
              // Calculate scale to fit
              const scaleX = maxWidth / (svgWidth * 0.264583); // Convert px to mm
              const scaleY = maxHeight / (svgHeight * 0.264583);
              const scale = Math.min(scaleX, scaleY);
              
              const finalWidth = (svgWidth * 0.264583) * scale;
              const finalHeight = (svgHeight * 0.264583) * scale;
              
              // Center the image
              const x = (a4Width - finalWidth) / 2;
              const y = margin + 15; // Space for title
              
              // Handle Georgian text properly by converting to image
              // Create a temporary canvas for the title
              const titleCanvas = document.createElement('canvas');
              const titleCtx = titleCanvas.getContext('2d');
              
              // Set canvas size for title (higher resolution for better quality)
              const titleDpr = 2;
              titleCanvas.width = (a4Width * 3.779) * titleDpr; // Convert mm to px (72 DPI) with high resolution
              titleCanvas.height = 100 * titleDpr; // Increased height for better spacing
              titleCtx.scale(titleDpr, titleDpr);
              
              // Set font for title (use system fonts that support Georgian)
              titleCtx.fillStyle = 'white';
              titleCtx.fillRect(0, 0, titleCanvas.width / titleDpr, titleCanvas.height / titleDpr);
              titleCtx.fillStyle = '#1f2937'; // Dark gray for better readability
              
              // Try to load web fonts first, fallback to system fonts
              titleCtx.font = 'bold 28px "Noto Sans Georgian", "BPG Nino Mtavruli", "Sylfaen", "Segoe UI", "Arial Unicode MS", sans-serif';
              titleCtx.textAlign = 'center';
              titleCtx.textBaseline = 'middle';
              titleCtx.imageSmoothingEnabled = true;
              titleCtx.imageSmoothingQuality = 'high';
              
              // Draw title text with better positioning
              const titleWidth = titleCanvas.width / titleDpr;
              const titleHeight = titleCanvas.height / titleDpr;
              
              // Split long titles into multiple lines if needed
              const words = title.split(' ');
              const titleMaxWidth = titleWidth - 60; // Increased margin for better spacing
              let line = '';
              const lines = [];
              
              for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const metrics = titleCtx.measureText(testLine);
                const testWidth = metrics.width;
                
                if (testWidth > titleMaxWidth && line !== '') {
                  lines.push(line.trim());
                  line = words[i] + ' ';
                } else {
                  line = testLine;
                }
              }
              lines.push(line.trim());
              
              // Draw each line with better spacing
              const lineHeight = 24; // Increased line height for better readability
              const startY = (titleHeight / 2) - ((lines.length - 1) * lineHeight / 2);
              
              lines.forEach((line, index) => {
                titleCtx.fillText(line, titleWidth / 2, startY + (index * lineHeight));
              });
              
              // Add title as image to PDF with proper sizing
              const titleImageData = titleCanvas.toDataURL('image/png');
              const titleHeightMm = Math.min(25, lines.length * 10); // Adjusted height calculation
              
              pdf.addImage(
                titleImageData,
                'PNG',
                margin,
                margin - 5,
                maxWidth,
                titleHeightMm
              );
              
              // Adjust chart position based on title height
              const adjustedY = margin + titleHeightMm + 8; // Increased spacing
              
              // Add chart with adjusted position
              pdf.addImage(
                canvas.toDataURL('image/png'),
                'PNG',
                x,
                Math.max(adjustedY, y), // Use either adjusted position or original, whichever is lower
                finalWidth,
                finalHeight
              );
              
              // Clean filename for Georgian text
              const cleanFileName = fileName.replace(/[^\w\s-]/g, '').trim() || 'chart';
              pdf.save(`${cleanFileName}.pdf`);
              resolve();
            }).catch((error) => {
              console.error('PDF generation failed:', error);
              // Fallback: download as PNG
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${fileName}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
                resolve();
              }, 'image/png');
            });
            break;
          }

          default:
            resolve();
        }
      };

      img.onerror = () => {
        console.error('Failed to load SVG as image');
        resolve();
      };

      // Convert SVG to data URL
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      img.src = svgDataUrl;
    });
  };

  // Sample data for charts - replace with real data from your API
  const organizationsByYear = [
    { year: "2014", birth: 27323, death: 29662 },
    { year: "2015", birth: 51984, death: 24061 },
    { year: "2016", birth: 32000, death: 23992 },
    { year: "2017", birth: 30796, death: 24695 },
    { year: "2018", birth: 29458, death: 28790 },
    { year: "2019", birth: 38584, death: 32429 },
    { year: "2020", birth: 29340, death: 27555 },
    { year: "2021", birth: 37760, death: 30653 },
    { year: "2022", birth: 57583, death: 30913 },
    { year: "2023", birth: 55146, death: 29435 },
  ];

  const activityData = [
    {
      year: "2012",
      manufacturing: 8,
      construction: 4,
      retail: 15,
      transport: 3,
      finance: 2,
      other: 10,
    },
    {
      year: "2013",
      manufacturing: 9,
      construction: 5,
      retail: 16,
      transport: 4,
      finance: 3,
      other: 11,
    },
    {
      year: "2014",
      manufacturing: 12,
      construction: 6,
      retail: 18,
      transport: 5,
      finance: 4,
      other: 13,
    },
    {
      year: "2015",
      manufacturing: 14,
      construction: 8,
      retail: 20,
      transport: 6,
      finance: 5,
      other: 15,
    },
    {
      year: "2016",
      manufacturing: 16,
      construction: 9,
      retail: 22,
      transport: 7,
      finance: 6,
      other: 17,
    },
    {
      year: "2017",
      manufacturing: 18,
      construction: 10,
      retail: 24,
      transport: 8,
      finance: 7,
      other: 19,
    },
    {
      year: "2018",
      manufacturing: 20,
      construction: 12,
      retail: 26,
      transport: 9,
      finance: 8,
      other: 21,
    },
    {
      year: "2019",
      manufacturing: 22,
      construction: 14,
      retail: 28,
      transport: 10,
      finance: 9,
      other: 23,
    },
    {
      year: "2020",
      manufacturing: 18,
      construction: 10,
      retail: 24,
      transport: 8,
      finance: 7,
      other: 19,
    },
    {
      year: "2021",
      manufacturing: 25,
      construction: 16,
      retail: 30,
      transport: 12,
      finance: 10,
      other: 25,
    },
    {
      year: "2022",
      manufacturing: 28,
      construction: 18,
      retail: 32,
      transport: 14,
      finance: 12,
      other: 27,
    },
    {
      year: "2023",
      manufacturing: 30,
      construction: 20,
      retail: 35,
      transport: 16,
      finance: 14,
      other: 30,
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

  const ChartContainer = ({ title, children, onMaximize, chartIndex }) => (
    <div className="chart-container" ref={(el) => el && (window.chartRefs = { ...window.chartRefs, [chartIndex]: el })}>
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
                    const container = e.target.closest('.chart-container');
                    setActiveDropdown(null);
                    setTimeout(() => {
                      handlePrintChart(container, title);
                    }, 100);
                  }}
                >
                  <Printer size={16} />
                  Print Chart
                </button>
                <button 
                  className="dropdown-item"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const container = e.target.closest('.chart-container');
                    await downloadChart('png', container, title);
                  }}
                >
                  <Download size={16} />
                  Download PNG
                </button>
                <button 
                  className="dropdown-item"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const container = e.target.closest('.chart-container');
                    await downloadChart('jpeg', container, title);
                  }}
                >
                  <Download size={16} />
                  Download JPEG
                </button>
                <button 
                  className="dropdown-item"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const container = e.target.closest('.chart-container');
                    await downloadChart('pdf', container, title);
                  }}
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button 
                  className="dropdown-item"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const container = e.target.closest('.chart-container');
                    await downloadChart('svg', container, title);
                  }}
                >
                  <Download size={16} />
                  Download SVG
                </button>
              </div>
            )}
          </div>
          <button className="chart-action-btn" onClick={onMaximize}>
            <Maximize2 size={16} />
          </button>
          <button className="chart-action-btn">
            <Menu size={16} />
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
        case 'bar':
          return (
            <BarChart data={maximizedChart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} />
              <Legend />
              <Bar dataKey="birth" fill="#2563eb" name={currentTexts.birth} />
              <Bar dataKey="death" fill="#dc2626" name={currentTexts.death} />
            </BarChart>
          );
        case 'line':
          return (
            <LineChart data={maximizedChart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="manufacturing" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="construction" stroke="#dc2626" strokeWidth={2} />
              <Line type="monotone" dataKey="retail" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="transport" stroke="#ca8a04" strokeWidth={2} />
              <Line type="monotone" dataKey="finance" stroke="#7c3aed" strokeWidth={2} />
              <Line type="monotone" dataKey="other" stroke="#db2777" strokeWidth={2} />
            </LineChart>
          );
        case 'horizontalBar':
          return (
            <BarChart data={maximizedChart.data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="year" type="category" />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" />
            </BarChart>
          );
        case 'area':
          return (
            <AreaChart data={maximizedChart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="manufacturing" stackId="1" stroke="#2563eb" fill="#2563eb" />
              <Area type="monotone" dataKey="construction" stackId="1" stroke="#dc2626" fill="#dc2626" />
              <Area type="monotone" dataKey="retail" stackId="1" stroke="#16a34a" fill="#16a34a" />
              <Area type="monotone" dataKey="transport" stackId="1" stroke="#ca8a04" fill="#ca8a04" />
              <Area type="monotone" dataKey="finance" stackId="1" stroke="#7c3aed" fill="#7c3aed" />
              <Area type="monotone" dataKey="other" stackId="1" stroke="#db2777" fill="#db2777" />
            </AreaChart>
          );
        case 'growth':
          return (
            <BarChart data={maximizedChart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, "ზრდა"]} />
              <Bar dataKey="growth" fill="#16a34a" />
            </BarChart>
          );
        case 'pie':
          return (
            <PieChart>
              <Pie
                data={maximizedChart.data}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {maximizedChart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          );
        default:
          return null;
      }
    };

    return (
      <div className="maximize-modal-overlay" onClick={handleCloseMaximized}>
        <div className="maximize-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="maximize-modal-header">
            <h2 className="maximize-modal-title">{maximizedChart.title}</h2>
            <button className="maximize-modal-close" onClick={handleCloseMaximized}>
              ✕
            </button>
          </div>
          <div className="maximize-modal-chart">
            <ResponsiveContainer width="100%" height={600}>
              {renderChart()}
            </ResponsiveContainer>
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
                    onMaximize={() => handleMaximizeChart(organizationsByYear, 'bar', currentTexts.organizationsByYear)}
                    chartIndex={0}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={organizationsByYear}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis 
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            value.toLocaleString(), 
                            name
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="birth"
                          fill="#2563eb"
                          name={currentTexts.birth}
                        />
                        <Bar
                          dataKey="death"
                          fill="#dc2626"
                          name={currentTexts.death}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Line Chart - Activity Trends */}
                  <ChartContainer
                    title={currentTexts.activitySectors}
                    onMaximize={() => handleMaximizeChart(activityData, 'line', currentTexts.activitySectors)}
                    chartIndex={1}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="manufacturing"
                          stroke="#2563eb"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="construction"
                          stroke="#dc2626"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="retail"
                          stroke="#16a34a"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="transport"
                          stroke="#ca8a04"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="finance"
                          stroke="#7c3aed"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="other"
                          stroke="#db2777"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Stacked Bar Chart - Regional Distribution */}
                  <ChartContainer
                    title={currentTexts.regionalDistribution}
                    onMaximize={() => handleMaximizeChart(organizationGrowthData, 'horizontalBar', currentTexts.regionalDistribution)}
                    chartIndex={2}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={organizationGrowthData}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="year" type="category" />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Stacked Area Chart */}
                  <ChartContainer
                    title={
                      isEnglish
                        ? "Organizations by Legal Forms"
                        : "ორგანიზაციები სამართლებრივი ფორმების მიხედვით"
                    }
                    onMaximize={() => handleMaximizeChart(activityData, 'area', isEnglish ? "Organizations by Legal Forms" : "ორგანიზაციები სამართლებრივი ფორმების მიხედვით")}
                    chartIndex={3}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="manufacturing"
                          stackId="1"
                          stroke="#2563eb"
                          fill="#2563eb"
                        />
                        <Area
                          type="monotone"
                          dataKey="construction"
                          stackId="1"
                          stroke="#dc2626"
                          fill="#dc2626"
                        />
                        <Area
                          type="monotone"
                          dataKey="retail"
                          stackId="1"
                          stroke="#16a34a"
                          fill="#16a34a"
                        />
                        <Area
                          type="monotone"
                          dataKey="transport"
                          stackId="1"
                          stroke="#ca8a04"
                          fill="#ca8a04"
                        />
                        <Area
                          type="monotone"
                          dataKey="finance"
                          stackId="1"
                          stroke="#7c3aed"
                          fill="#7c3aed"
                        />
                        <Area
                          type="monotone"
                          dataKey="other"
                          stackId="1"
                          stroke="#db2777"
                          fill="#db2777"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Growth Percentage Chart */}
                  <ChartContainer
                    title={currentTexts.organizationGrowth}
                    onMaximize={() => handleMaximizeChart(
                      organizationsByYear.map((item, index) => ({
                        year: item.year,
                        growth: index > 0 ? (((item.birth - organizationsByYear[index - 1].birth) / organizationsByYear[index - 1].birth) * 100).toFixed(1) : 0,
                      })),
                      'growth',
                      currentTexts.organizationGrowth
                    )}
                    chartIndex={4}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={organizationsByYear.map((item, index) => ({
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
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, "ზრდა"]} />
                        <Bar dataKey="growth" fill="#16a34a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Pie Chart - Ownership Types */}
                  <ChartContainer
                    title={currentTexts.ownershipTypes}
                    onMaximize={() => handleMaximizeChart(ownershipData, 'pie', currentTexts.ownershipTypes)}
                    chartIndex={5}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ownershipData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {ownershipData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
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
