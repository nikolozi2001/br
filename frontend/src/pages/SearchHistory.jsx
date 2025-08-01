import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/scrollbar.css";
import "../styles/searchHistory.scss";
import {
  API,
  fetchDocuments,
  fetchCoordinates,
  fetchRepresentatives,
  fetchPartners,
  fetchPartnersVw,
  fetchAddressWeb,
  fetchFullNameWeb,
} from "../services/api";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import {
  Download,
  ChevronDown,
  Printer,
  FileImage,
  FileText,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import toast, { Toaster } from "react-hot-toast";
import { translations } from "../translations/searchForm";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import loaderIcon from "../assets/images/equalizer.svg";

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function SearchHistory({ isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];

  // Loading component
  const LoadingSpinner = ({ message }) => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-center items-center">
        <img src={loaderIcon} alt="Loading..." className="w-12 h-12" />
        <span className="ml-3 text-gray-600 font-bpg-nino">{message}</span>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }) => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <p className="text-center text-gray-600 font-bpg-nino">{message}</p>
    </div>
  );

  const [loading, setLoading] = useState(true);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnersVwLoading, setPartnersVwLoading] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [representatives, setRepresentatives] = useState([]);
  const [partners, setPartners] = useState([]);
  const [partnersVw, setPartnersVw] = useState([]);
  const [addressWeb, setAddressWeb] = useState([]);
  const [fullNameWeb, setFullNameWeb] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [error, setError] = useState(null);
  const chartRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();

  // Get identification number from URL params or location state
  const searchParams = new URLSearchParams(location.search);
  const identificationNumber =
    searchParams.get("id") || location.state?.identificationNumber;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setRepresentatives([]); // clear before loading
        const searchParams = {
          identificationNumber: identificationNumber,
        };

        // Fetch document data
        const response = await fetchDocuments(
          searchParams,
          isEnglish ? "en" : "ge"
        );

        if (response && response.length > 0) {
          const data = response[0];
          setDocumentData(data);

          // Now fetch representatives
          if (data?.Stat_ID) {
            const reps = await fetchRepresentatives(
              data.Stat_ID,
              isEnglish ? "en" : "ge"
            );
            setRepresentatives(reps || []);
          }

          // Fetch coordinates separately
          const coordsData = await fetchCoordinates(identificationNumber);
          if (coordsData && coordsData.lat && coordsData.lng) {
            setCoordinates({
              lat: coordsData.lat,
              lng: coordsData.lng,
              region: coordsData.region,
              inactive: coordsData.inactive,
            });
          }
        } else {
          const errorMsg = isEnglish
            ? "No data found"
            : "მონაცემები ვერ მოიძებნა";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        const errorMsg = isEnglish
          ? "Error loading data"
          : "შეცდომა მონაცემების ჩატვირთვისას";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (identificationNumber) {
      fetchData();
    }
  }, [identificationNumber, isEnglish]);

  useEffect(() => {
    const fetchPartnersData = async () => {
      if (!documentData?.Stat_ID) return;

      try {
        setPartnersLoading(true);
        setPartnersVwLoading(true);

        // Fetch partners, partnersVw, addressWeb, and fullNameWeb data simultaneously
        const [partnersData, partnersVwData, addressWebData, fullNameWebData] =
          await Promise.all([
            fetchPartners(documentData.Stat_ID, isEnglish ? "en" : "ge"),
            fetchPartnersVw(documentData.Stat_ID),
            fetchAddressWeb(documentData.Stat_ID),
            fetchFullNameWeb(documentData.Stat_ID),
          ]);

        setPartners(partnersData || []);
        setPartnersVw(partnersVwData || []);
        setAddressWeb(addressWebData || []);
        setFullNameWeb(fullNameWebData || []);
      } catch (error) {
        console.error("Error fetching partners data:", error);
      } finally {
        setPartnersLoading(false);
        setPartnersVwLoading(false);
      }
    };

    if (identificationNumber && documentData?.Stat_ID) {
      fetchPartnersData();
    }
  }, [identificationNumber, documentData?.Stat_ID, isEnglish]);

  // Process data to group by date
  const processedData = useMemo(() => {
    if (!partners || partners.length === 0) return [];

    const groupedByDate = partners.reduce((acc, item) => {
      if (!acc[item.Date]) {
        acc[item.Date] = [];
      }
      acc[item.Date].push(item);
      return acc;
    }, {});

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;
    });

    return sortedDates.map((date) => ({
      date,
      data: groupedByDate[date],
    }));
  }, [partners]);

  // Processed data for partners_vw
  const processedDataVw = useMemo(() => {
    if (!partnersVw || partnersVw.length === 0) return [];

    const groupedByDate = partnersVw.reduce((acc, item) => {
      if (!acc[item.Date]) {
        acc[item.Date] = [];
      }
      acc[item.Date].push(item);
      return acc;
    }, {});

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB - dateA;
    });

    return sortedDates.map((date) => ({
      date,
      data: groupedByDate[date],
    }));
  }, [partnersVw]);

  // Chart options generator
  const getChartOption = (dateGroup) => {
    const chartData = dateGroup.data
      .map((item) => ({
        value: item.Share,
        name: `${item.Name}: ${item.Share}%`,
      }))
      .sort((a, b) => b.value - a.value);

    // Color palette - matching your existing style
    const colorPalette = [
      "#5470c6", // Blue
      "#3a3a3a", // Dark gray
      "#91cc75", // Green
      "#fac858", // Yellow
      "#ee6666", // Red
      "#73c0de", // Light blue
      "#3ba272", // Dark green
      "#fc8452", // Orange
      "#9a60b4", // Purple
      "#ea7ccc", // Pink
      "#ff9f7f", // Light orange
      "#fb7293", // Pink-red
      "#e7bcf3", // Light purple
      "#8378ea", // Purple-blue
    ];

    return {
      tooltip: {
        trigger: "item",
        formatter: "{b}",
      },
      legend: {
        show: false, // Hide legend to save space
      },
      series: [
        {
          name: "Share",
          type: "pie",
          radius: "70%",
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: true,
            position: "outside",
            fontSize: 10,
            formatter: (params) => {
              const name = params.name.split(":")[0];
              if (name.length > 15) {
                return name.substring(0, 15) + "...";
              }
              return name;
            },
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 15,
          },
          data: chartData,
          color: colorPalette,
        },
      ],
    };
  };

  // Prepare data for display
  const data = useMemo(() => {
    if (!documentData) return [];

    return [
      {
        label: isEnglish ? "Identification Number:" : "საიდენტიფიკაციო ნომერი:",
        value: documentData.identificationNumber || "-",
      },
      {
        label: isEnglish ? "Organization Name:" : "ორგანიზაციის დასახელება:",
        value: documentData.name || "-",
      },
      {
        label: isEnglish
          ? "Organizational Legal Form:"
          : "ორგანიზაციულ-სამართლებრივი ფორმა:",
        value: documentData.abbreviation || "-",
      },
      {
        label: isEnglish ? "Ownership Form:" : "საკუთრების ფორმა:",
        value: documentData.ownershipType || "-",
      },
      {
        label: isEnglish ? "Region:" : "რეგიონი:",
        value: documentData.legalAddress?.region
          ? `${documentData.legalAddress.region}${
              documentData.legalAddress.city
                ? ", " + documentData.legalAddress.city
                : ""
            }`
          : "-",
      },
      {
        label: isEnglish ? "Legal Address:" : "იურიდიული მისამართი:",
        value: documentData.legalAddress?.address || "-",
      },
      {
        label: isEnglish
          ? "Economic Activity (NACE Rev.2):"
          : "ეკონომიკური საქმიანობა (NACE Rev.2):",
        value:
          documentData.activities && documentData.activities.length > 0
            ? `${documentData.activities[0].code} - ${documentData.activities[0].name}`
            : "-",
      },
      {
        label: isEnglish
          ? "Active Economic Status:"
          : "აქტიური ეკონომიკური სტატუსი:",
        value: documentData.isActive
          ? isEnglish
            ? "Active"
            : "აქტიური"
          : isEnglish
          ? "Inactive"
          : "არააქტიური",
      },
      {
        label: isEnglish ? "Head/Director:" : "ხელმძღვანელი:",
        value: documentData.head || "-",
      },
      {
        label: isEnglish ? "Phone:" : "ტელეფონი:",
        value: documentData.phone || "-",
      },
      {
        label: isEnglish ? "Email:" : "ელ-ფოსტა:",
        value: documentData.email || "-",
      },
    ].filter((item) => item.value !== "-"); // Optionally filter out empty fields
  }, [documentData, isEnglish]);

  const exportToExcel = useCallback(async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      // First worksheet for company info
      const worksheet = workbook.addWorksheet("Company Info");

      // Add headers
      worksheet.columns = [
        { header: "Field", key: "label", width: 40 },
        { header: "Value", key: "value", width: 80 },
      ];

      // Add data
      data.forEach((item) => {
        worksheet.addRow(item);
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0080BE" },
      };
      worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

      // Second worksheet for representatives
      if (representatives.length > 0) {
        const repsWorksheet = workbook.addWorksheet("Representatives");

        repsWorksheet.columns = [
          { header: isEnglish ? "Person" : "პირი", key: "name", width: 40 },
          {
            header: isEnglish ? "Position" : "მონაწილეობა",
            key: "position",
            width: 40,
          },
          { header: isEnglish ? "Date" : "თარიღი", key: "date", width: 20 },
        ];

        representatives.forEach((rep) => {
          repsWorksheet.addRow({
            name: rep.Name || "-",
            position: rep.Position || "-",
            date: rep.Date
              ? new Date(rep.Date).toLocaleDateString(
                  isEnglish ? "en-US" : "ka-GE"
                )
              : "-",
          });
        });

        // Style the header row
        repsWorksheet.getRow(1).font = { bold: true };
        repsWorksheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0080BE" },
        };
        repsWorksheet.getRow(1).font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
        };
      }

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `company_info_${identificationNumber}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(
        isEnglish
          ? "Excel file downloaded successfully!"
          : "Excel ფაილი წარმატებით ჩამოიტვირთა!"
      );
    } catch (error) {
      toast.error(
        isEnglish ? "Error exporting to Excel" : "შეცდომა Excel-ში ექსპორტისას"
      );
      console.error("Export error:", error);
    }
  }, [data, representatives, identificationNumber, isEnglish]);

  // Chart download functions
  const downloadChart = useCallback(
    (chartRef, format, dateGroup) => {
      if (!chartRef) return;

      const echartInstance = chartRef.getEchartsInstance();
      const fileName = `partners_chart_${dateGroup.date.replace(/\//g, "_")}`;

      try {
        switch (format) {
          case "png": {
            const pngUrl = echartInstance.getDataURL({
              type: "png",
              pixelRatio: 2,
              backgroundColor: "#fff",
            });
            const pngLink = document.createElement("a");
            pngLink.download = `${fileName}.png`;
            pngLink.href = pngUrl;
            pngLink.click();
            break;
          }

          case "jpeg": {
            const jpegUrl = echartInstance.getDataURL({
              type: "jpeg",
              pixelRatio: 2,
              backgroundColor: "#fff",
            });
            const jpegLink = document.createElement("a");
            jpegLink.download = `${fileName}.jpeg`;
            jpegLink.href = jpegUrl;
            jpegLink.click();
            break;
          }

          case "svg": {
            // Convert canvas to SVG following Charts.jsx approach
            try {
              // Get chart as canvas data
              const canvasDataURL = echartInstance.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#fff",
              });

              // Create an image to get dimensions
              const img = new Image();
              img.onload = function () {
                const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${img.width}" height="${img.height}">
                <image width="${img.width}" height="${img.height}" xlink:href="${canvasDataURL}"/>
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

                toast.success(
                  isEnglish
                    ? "Chart SVG downloaded successfully!"
                    : "დიაგრამა SVG ფორმატში წარმატებით ჩამოიტვირთა!"
                );
              };

              img.onerror = function () {
                console.error("SVG creation error: Failed to load image");
                // Fallback to PNG export
                const pngUrl = echartInstance.getDataURL({
                  type: "png",
                  pixelRatio: 2,
                  backgroundColor: "#fff",
                });
                const pngLink = document.createElement("a");
                pngLink.download = `${fileName}_fallback.png`;
                pngLink.href = pngUrl;
                pngLink.click();

                toast.warning(
                  isEnglish
                    ? "SVG export failed, downloaded PNG instead"
                    : "SVG ექსპორტი ვერ მოხერხდა, ჩამოიტვირთა PNG"
                );
              };

              img.src = canvasDataURL;

              // Early return since we're handling async operation
              return;
            } catch (error) {
              console.error("SVG setup error:", error);
              // Fallback to PNG export
              const pngUrl = echartInstance.getDataURL({
                type: "png",
                pixelRatio: 2,
                backgroundColor: "#fff",
              });
              const pngLink = document.createElement("a");
              pngLink.download = `${fileName}_fallback.png`;
              pngLink.href = pngUrl;
              pngLink.click();

              toast.warning(
                isEnglish
                  ? "SVG export failed, downloaded PNG instead"
                  : "SVG ექსპორტი ვერ მოხერხდა, ჩამოიტვირთა PNG"
              );
            }
            break;
          }

          case "print": {
            // Direct print without PDF save
            const printWindow = window.open("", "_blank");
            const chartDataUrl = echartInstance.getDataURL({
              type: "png",
              pixelRatio: 2,
              backgroundColor: "#fff",
            });
            printWindow.document.write(`
            <html>
              <head>
                <title>Partners Chart - ${dateGroup.date}</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    text-align: center; 
                    font-family: Arial, sans-serif;
                  }
                  img { 
                    max-width: 100%; 
                    height: auto; 
                    border: 1px solid #ddd;
                    border-radius: 8px;
                  }
                  h1 { 
                    color: #0080BE; 
                    margin-bottom: 20px;
                    font-size: 24px;
                  }
                  .print-info {
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                  }
                  @media print {
                    body { margin: 0; padding: 10px; }
                    h1 { page-break-before: avoid; font-size: 20px; }
                    .print-info { font-size: 10px; }
                  }
                </style>
              </head>
              <body>
                <h1>პარტნიორთა წილები - ${dateGroup.date}</h1>
                <img src="${chartDataUrl}" alt="Partners Chart" />
                <div class="print-info">
                  Generated on: ${new Date().toLocaleDateString()}
                </div>
                <script>
                  window.onload = function() {
                    setTimeout(() => {
                      window.print();
                    }, 500);
                  };
                  window.onafterprint = function() {
                    window.close();
                  };
                </script>
              </body>
            </html>
          `);
            printWindow.document.close();
            break;
          }

          case "pdf": {
            import("jspdf")
              .then(({ jsPDF }) => {
                // Get chart as canvas
                const chartCanvas = document.createElement("canvas");
                const chartCtx = chartCanvas.getContext("2d");
                const img = new Image();

                img.onload = function () {
                  // Set up canvas dimensions with space for title
                  const titleHeight = 60;
                  const totalWidth = img.width;
                  const totalHeight = img.height + titleHeight;

                  chartCanvas.width = totalWidth;
                  chartCanvas.height = totalHeight;

                  // White background
                  chartCtx.fillStyle = "white";
                  chartCtx.fillRect(0, 0, totalWidth, totalHeight);

                  // Draw title with proper Georgian font support
                  chartCtx.fillStyle = "#000000";
                  chartCtx.textAlign = "center";
                  chartCtx.textBaseline = "middle";

                  // Use a Georgian-compatible font stack
                  const fontSize = Math.min(totalWidth * 0.03, 24);
                  chartCtx.font = `bold ${fontSize}px "Noto Sans Georgian", "BPG Nino Mtavruli", "Sylfaen", Arial, sans-serif`;

                  // Draw title with word wrapping if needed
                  const title = `პარტნიორთა წილები - ${dateGroup.date}`;
                  const words = title.split(" ");
                  const titleMaxWidth = totalWidth * 0.8;
                  let line = "";
                  let titleY = titleHeight / 2;
                  const lineHeight = fontSize * 1.2;

                  for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + " ";
                    const metrics = chartCtx.measureText(testLine);
                    const testWidth = metrics.width;

                    if (testWidth > titleMaxWidth && n > 0) {
                      chartCtx.fillText(line, totalWidth / 2, titleY);
                      line = words[n] + " ";
                      titleY += lineHeight;
                    } else {
                      line = testLine;
                    }
                  }
                  chartCtx.fillText(line, totalWidth / 2, titleY);

                  // Draw the chart below the title
                  chartCtx.drawImage(img, 0, titleHeight);

                  // Convert to image data
                  const imgData = chartCanvas.toDataURL("image/png");

                  const canvasWidth = chartCanvas.width;
                  const canvasHeight = chartCanvas.height;
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

                  toast.success(
                    isEnglish
                      ? "Chart PDF downloaded successfully!"
                      : "დიაგრამა PDF ფორმატში წარმატებით ჩამოიტვირთა!"
                  );
                };

                img.src = echartInstance.getDataURL({
                  type: "png",
                  pixelRatio: 2,
                  backgroundColor: "#fff",
                });
              })
              .catch((error) => {
                console.error("PDF export error:", error);
                toast.error(
                  isEnglish
                    ? "Error creating PDF"
                    : "შეცდომა PDF ფაილის შექმნისას"
                );
              });

            // Early return since we're handling async operation
            return;
          }

          default:
            break;
        }

        // Show success toast for PNG and JPEG formats only (SVG and PDF handle their own messaging)
        if (format !== "svg" && format !== "pdf") {
          toast.success(
            isEnglish
              ? `Chart ${format.toUpperCase()} downloaded successfully!`
              : `დიაგრამა ${format.toUpperCase()} ფორმატში წარმატებით ჩამოიტვირთა!`
          );
        }
      } catch (error) {
        console.error("Chart download error:", error);
        toast.error(
          isEnglish
            ? `Error downloading chart as ${format.toUpperCase()}`
            : `შეცდომა დიაგრამის ${format.toUpperCase()} ფორმატში ჩამოტვირთვისას`
        );
      }
    },
    [isEnglish]
  );

  const toggleDropdown = useCallback(
    (index) => {
      setActiveDropdown(activeDropdown === index ? null : index);
    },
    [activeDropdown]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null && !event.target.closest(".relative")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="container mx-auto py-8 pb-16">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <button
              onClick={() => navigate("/reports")}
              className="px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#0070aa] transition-colors font-bpg-nino flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={
                isEnglish ? "Go back to reports" : "უკან დაბრუნება რეპორტებზე"
              }
            >
              ← {isEnglish ? "Back to Reports" : "უკან დაბრუნება"}
            </button>
            <button
              onClick={exportToExcel}
              disabled={loading || !documentData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bpg-nino flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label={
                isEnglish
                  ? "Export data to Excel file"
                  : "მონაცემების Excel-ში ექსპორტი"
              }
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {isEnglish ? "Export to Excel" : "Excel-ში ექსპორტი"}
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {t.historyTitle}
            </h1>
          </div>

          {/* Georgian Info Table */}
          <div className="w-full mb-8">
            {loading ? (
              <LoadingSpinner
                message={isEnglish ? "Loading..." : "იტვირთება..."}
              />
            ) : error ? (
              <EmptyState message={error} />
            ) : documentData ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {data.map((item, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === data.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-2/5 font-bold font-bpg-nino">
                      {item.label}
                    </div>
                    <div className="w-3/5 font-bpg-nino">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                message={
                  isEnglish
                    ? "No data available"
                    : "მონაცემები არ არის ხელმისაწვდომი"
                }
              />
            )}
          </div>

          {/* Map Section */}
          {!loading && coordinates && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
                  {t.map ||
                    (isEnglish ? "Location Map" : "ადგილმდებარეობის რუკა")}
                </h1>
              </div>
              <div className="w-full">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
                  <MapContainer
                    center={[coordinates.lat, coordinates.lng]}
                    zoom={15}
                    style={{ height: "400px", width: "100%" }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[coordinates.lat, coordinates.lng]}>
                      <Popup>
                        <div className="font-bpg-nino">
                          <strong>{documentData.name}</strong>
                          <br />
                          {documentData.legalAddress?.address}
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                  <div className="mt-2 text-sm text-gray-600 font-bpg-nino text-center">
                    <div>
                      {isEnglish ? "Coordinates: " : "კოორდინატები: "}
                      {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </div>
                    {coordinates.region && (
                      <div className="mt-1">
                        {isEnglish ? "Region: " : "რეგიონი: "}
                        {coordinates.region}
                      </div>
                    )}
                    {coordinates.inactive && (
                      <div className="mt-1 text-red-600">
                        {isEnglish
                          ? "Note: Location marked as inactive"
                          : "შენიშვნა: მდებარეობა მონიშნულია არააქტიურად"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Show message if no coordinates available */}
          {!loading && !coordinates && documentData && (
            <div className="w-full">
              <div className="mb-6">
                <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
                  {t.map ||
                    (isEnglish ? "Location Map" : "ადგილმდებარეობის რუკა")}
                </h1>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish
                    ? "Location coordinates not available"
                    : "ადგილმდებარეობის კოორდინატები არ არის ხელმისაწვდომი"}
                </p>
              </div>
            </div>
          )}

          {/* Representatives Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {t.personsRelatedToCompany ||
                (isEnglish
                  ? "Persons Related to Company"
                  : "კომპანიასთან დაკავშირებული პირები")}
            </h1>
            {loading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center items-center">
                  <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-12 h-12"
                  />
                  <span className="ml-3 text-gray-600 font-bpg-nino">
                    {isEnglish ? "Loading..." : "იტვირთება..."}
                  </span>
                </div>
              </div>
            ) : representatives.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-2/5">{isEnglish ? "Person" : "პირი"}</div>
                  <div className="w-2/5">
                    {isEnglish ? "Position" : "მონაწილეობა"}
                  </div>
                  <div className="w-1/5">{isEnglish ? "Date" : "თარიღი"}</div>
                </div>

                {/* Table Rows */}
                {representatives.map((rep, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === representatives.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-2/5 font-bpg-nino">{rep.Name || "-"}</div>
                    <div className="w-2/5 font-bpg-nino">
                      {rep.Position || "-"}
                    </div>
                    <div className="w-1/5 font-bpg-nino">
                      {rep.Date
                        ? new Date(rep.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            { year: "numeric", month: "2-digit" }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish
                    ? "No representatives found"
                    : "წარმომადგენლები ვერ მოიძებნა"}
                </p>
              </div>
            )}
          </div>
          {/* Partnerts Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {t.partners}
            </h1>
            {/* Pie Chart - Partners */}
            {partnersLoading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center items-center">
                  <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-12 h-12"
                  />
                  <span className="ml-3 text-gray-600 font-bpg-nino">
                    {isEnglish
                      ? "Loading partners..."
                      : "პარტნიორები იტვირთება..."}
                  </span>
                </div>
              </div>
            ) : partners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedData.map((dateGroup, index) => (
                  <div
                    key={index}
                    className="rounded-xl shadow-lg overflow-hidden bg-white"
                  >
                    {/* Header */}
                    <div className="bg-[#005c9d] px-4 py-2 flex items-center justify-between">
                      <h2 className="text-white text-sm md:text-base font-semibold leading-tight">
                        პარტნიორთა წილები, {dateGroup.date}
                      </h2>
                      <div className="relative">
                        <button
                          onClick={() => toggleDropdown(index)}
                          className="flex items-center gap-1 text-white hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          <Download size={18} />
                          <ChevronDown size={14} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdown === index && (
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[200px]">
                            <div className="py-2">
                              <button
                                onClick={() => {
                                  downloadChart(
                                    chartRefs.current[index],
                                    "print",
                                    dateGroup
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
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
                                onClick={() => {
                                  downloadChart(
                                    chartRefs.current[index],
                                    "png",
                                    dateGroup
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
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
                                onClick={() => {
                                  downloadChart(
                                    chartRefs.current[index],
                                    "jpeg",
                                    dateGroup
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
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
                                onClick={() => {
                                  downloadChart(
                                    chartRefs.current[index],
                                    "pdf",
                                    dateGroup
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
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
                                onClick={() => {
                                  downloadChart(
                                    chartRefs.current[index],
                                    "svg",
                                    dateGroup
                                  );
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 cursor-pointer"
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
                                  <path
                                    d="M2.5 9.5H4.5V10.5H2.5V9.5Z"
                                    fill="white"
                                  />
                                  <path d="M5 9.5H6V10.5H5V9.5Z" fill="white" />
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
                                  <path d="M4 11H7V11.5H4V11Z" fill="white" />
                                  <path
                                    d="M7.5 11H9V11.5H7.5V11Z"
                                    fill="white"
                                  />
                                </svg>
                                {isEnglish ? "SVG" : "SVG"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart */}
                    <div className="p-2 sm:p-4">
                      <ReactECharts
                        ref={(ref) => {
                          if (ref) {
                            chartRefs.current[index] = ref;
                          }
                        }}
                        option={getChartOption(dateGroup)}
                        style={{ height: 400 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : !partnersLoading && documentData?.Stat_ID ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish ? "No partners found" : "პარტნიორები ვერ მოიძებნა"}
                </p>
              </div>
            ) : null}
          </div>
          {/* Partners-view Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {isEnglish ? "Partners Details" : "პარტნიორების დეტალები"}
            </h1>
            {partnersVwLoading ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex justify-center items-center">
                  <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-12 h-12"
                  />
                  <span className="ml-3 text-gray-600 font-bpg-nino">
                    {isEnglish
                      ? "Loading partners details..."
                      : "პარტნიორების დეტალები იტვირთება..."}
                  </span>
                </div>
              </div>
            ) : processedDataVw.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-2/5">{isEnglish ? "Person" : "პირი"}</div>
                  <div className="w-2/5">{isEnglish ? "Share" : "წილი"}</div>
                  <div className="w-1/5">{isEnglish ? "Date" : "თარიღი"}</div>
                </div>

                {/* Table Rows */}
                {processedDataVw.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Rows under this date */}
                    {group.data.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group`}
                      >
                        <div className="w-2/5 font-bpg-nino">
                          {item.Name || "-"}
                        </div>
                        <div className="w-2/5 font-bpg-nino">
                          {item.Share || "-"}
                        </div>
                        <div className="w-1/5 font-bpg-nino">
                          {group.date
                            ? new Date(group.date).toLocaleDateString(
                                isEnglish ? "en-US" : "ka-GE",
                                { year: "numeric", month: "2-digit" }
                              )
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : !partnersVwLoading && documentData?.Stat_ID ? (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish ? "No partners found" : "პარტნიორები ვერ მოიძებნა"}
                </p>
              </div>
            ) : null}
          </div>

          {/* Address Web Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {isEnglish
                ? "Company Legal Address"
                : "კომპანიის იურიდიული მისამართი"}
            </h1>
            {partnersVwLoading ? (
              <LoadingSpinner
                message={
                  isEnglish
                    ? "Loading company legal address..."
                    : "კომპანიის იურიდიული მისამართი იტვირთება..."
                }
              />
            ) : addressWeb.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-1/3">
                    {isEnglish ? "Region" : "რეგიონი"}
                  </div>

                  <div className="w-1/2">
                    {isEnglish ? "Legal Address" : "იურიდიული მისამართი"}
                  </div>

                  <div className="w-1/6 text-right">
                    {isEnglish ? "Date" : "თარიღი"}
                  </div>
                </div>

                {/* Table Rows */}
                {addressWeb.map((address, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === addressWeb.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-1/3 font-bpg-nino">
                      {address.Region_name + "; " + address.City_name || "-"}
                    </div>

                    <div className="w-1/2 font-bpg-nino">
                      {address.Address || "-"}
                    </div>

                    <div className="w-1/6 text-right font-bpg-nino">
                      {address.Date
                        ? new Date(address.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : !partnersVwLoading && documentData?.Stat_ID ? (
              <EmptyState
                message={
                  isEnglish
                    ? "No address history found"
                    : "მისამართების ისტორია ვერ მოიძებნა"
                }
              />
            ) : null}
          </div>

          {/* Full Name Web Section */}
          <div className="w-full mt-8">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {isEnglish
                ? "Company Name, Legal and Ownership Forms"
                : "კომპანიის დასახელება, სამართლებრივი და საკუთრების ფორმები"}
            </h1>
            {partnersVwLoading ? (
              <LoadingSpinner
                message={
                  isEnglish
                    ? "Loading company name history..."
                    : "კომპანიის დასახელების ისტორია იტვირთება..."
                }
              />
            ) : fullNameWeb.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex px-6 py-3 bg-[#2c7bbf] text-white font-bold font-bpg-nino text-sm sm:text-base">
                  <div className="w-1/3">
                    {isEnglish ? "Company Name" : "დასახელება"}
                  </div>

                  <div className="w-1/4">
                    {isEnglish ? "Legal Form" : "სამართლებრივი ფორმა"}
                  </div>

                  <div className="w-1/4">
                    {isEnglish ? "Ownership Form" : "საკუთრების ფორმა"}
                  </div>

                  <div className="w-1/6 text-right">
                    {isEnglish ? "Date" : "თარიღი"}
                  </div>
                </div>

                {/* Table Rows */}
                {fullNameWeb.map((item, index) => (
                  <div
                    key={index}
                    className={`flex px-6 py-4 border-b border-gray-200 hover:bg-[#0080BE] hover:text-white transition-all duration-200 cursor-pointer group ${
                      index === fullNameWeb.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <div className="w-1/3 font-bpg-nino">
                      {item.Full_Name || "-"}
                    </div>

                    <div className="w-1/4 font-bpg-nino">
                      {item.Abbreviation || "-"}
                    </div>

                    <div className="w-1/4 font-bpg-nino">
                      {item.Ownership_Type || "-"}
                    </div>

                    <div className="w-1/6 text-right font-bpg-nino">
                      {item.Date
                        ? new Date(item.Date).toLocaleDateString(
                            isEnglish ? "en-US" : "ka-GE",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            }
                          )
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ) : !partnersVwLoading && documentData?.Stat_ID ? (
              <EmptyState
                message={
                  isEnglish
                    ? "No company name history found"
                    : "კომპანიის დასახელების ისტორია ვერ მოიძებნა"
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

SearchHistory.propTypes = {
  isEnglish: PropTypes.bool.isRequired,
};

export default SearchHistory;
