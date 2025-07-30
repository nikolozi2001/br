import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/scrollbar.css";
import "../styles/searchHistory.scss";
import {
  API,
  fetchDocuments,
  fetchCoordinates,
  fetchRepresentatives,
  fetchPartners,
} from "../services/api";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
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
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [representatives, setRepresentatives] = useState([]);
  const [partners, setPartners] = useState([]);
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
          toast.error(isEnglish ? "No data found" : "მონაცემები ვერ მოიძებნა");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          isEnglish ? "Error loading data" : "შეცდომა მონაცემების ჩატვირთვისას"
        );
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
      try {
        const partners = await fetchPartners(documentData?.Stat_ID);
        setPartners(partners || []);
      } catch (error) {
        console.error("Error fetching partners data:", error);
      }
    };

    if (identificationNumber && documentData?.Stat_ID) {
      fetchPartnersData();
    }
  }, [identificationNumber, documentData?.Stat_ID]);

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
      title: {
        text: `პარტნიორთა წილები, ${dateGroup.date}`,
        left: "center",
        top: 10,
        textStyle: {
          fontSize: 14,
          fontWeight: "normal",
        },
      },
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
          center: ["50%", "55%"],
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

  const exportToExcel = async () => {
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
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-right" />
      <div className="container mx-auto py-8 pb-16">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <button
              onClick={() => navigate("/reports")}
              className="px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#0070aa] transition-colors font-bpg-nino flex items-center cursor-pointer"
            >
              ← {isEnglish ? "Back to Reports" : "უკან დაბრუნება"}
            </button>
            <button
              onClick={exportToExcel}
              disabled={loading || !documentData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bpg-nino flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish
                    ? "No data available"
                    : "მონაცემები არ არის ხელმისაწვდომი"}
                </p>
              </div>
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
            ) : partners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedData.map((dateGroup, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-lg p-4"
                  >
                    <ReactECharts
                      option={getChartOption(dateGroup)}
                      style={{ height: "350px", width: "100%" }}
                      opts={{ renderer: "svg" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <p className="text-center text-gray-600 font-bpg-nino">
                  {isEnglish ? "No partners found" : "პარტნიორები ვერ მოიძებნა"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchHistory;
