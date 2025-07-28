import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/scrollbar.css";
import "../styles/searchHistory.scss";
import { API, fetchDocuments, fetchCoordinates } from "../services/api";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import toast, { Toaster } from "react-hot-toast";
import { translations } from "../translations/searchForm";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import georgianFont from "../fonts/NotoSansGeorgian_ExtraCondensed-Bold.ttf";
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
  const navigate = useNavigate();
  const location = useLocation();

  // Get identification number from URL params or location state
  const searchParams = new URLSearchParams(location.search);
  const identificationNumber =
    searchParams.get("id") ||
    location.state?.identificationNumber ||
    "209456104";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
        </div>
      </div>
    </div>
  );
}

export default SearchHistory;
