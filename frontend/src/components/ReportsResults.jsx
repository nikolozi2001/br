import { useState, useEffect, useMemo } from "react";
import "../styles/scrollbar.css";
import { useParams, useNavigate } from "react-router-dom";
import loaderIcon from "../assets/images/equalizer.svg";
import { API } from "../services/api";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";

function ReportsResults({ isEnglish }) {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const report1Columns = [
    { key: "Activity_Code", ge: "კოდი", en: "Activity Code" },
    { key: "Activity_Name", ge: "სექციის დასახელება", en: "Activity Name" },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "pct_act", ge: "%", en: "%" },
  ];

  const report2Columns = [
    { key: "ID", ge: "კოდი", en: "Code" },
    {
      key: "Legal_Form",
      ge: "ორგანიზაციულ-სამართლებრივი ფორმა",
      en: "Legal Status",
    },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "Registered_Pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "Active_Pct", ge: "%", en: "%" },
  ];

  const report3Columns = [
    { key: "ID", ge: "კოდი", en: "Code" },
    {
      key: "Ownership_Type",
      ge: "საკუთრების ფორმა",
      en: "Ownership Type",
    },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "Registered_Pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "Active_Pct", ge: "%", en: "%" },
  ];

  const columns = Number(reportId) === 1 ? report1Columns : Number(reportId) === 2 ? report2Columns : report3Columns;

  useEffect(() => {
    const fetchData = async () => {
      if (Number(reportId) === 1 || Number(reportId) === 2 || Number(reportId) === 3) {
        setLoading(true);
        try {
          let response;
          if (Number(reportId) === 1) {
            response = await API.fetchReport1Data(isEnglish ? "en" : "ge");
          } else if (Number(reportId) === 2) {
            response = await API.fetchReport2Data(isEnglish ? "en" : "ge");
          } else if (Number(reportId) === 3) {
            response = await API.fetchReport3Data(isEnglish ? "en" : "ge");
          }
          
          let dataArray = Array.isArray(response.rows)
            ? response.rows
            : Array.isArray(response)
            ? response
            : [];

          // Calculate percentages for report 3
          if (Number(reportId) === 3 && dataArray.length > 0) {
            const totalRegistered = dataArray.reduce((sum, row) => sum + Number(row.Registered_Qty), 0);
            const totalActive = dataArray.reduce((sum, row) => sum + Number(row.Active_Qty), 0);
            
            dataArray = dataArray.map(row => ({
              ...row,
              Registered_Percent: totalRegistered > 0 ? (Number(row.Registered_Qty) / totalRegistered) * 100 : 0,
              Active_Percent: totalActive > 0 ? (Number(row.Active_Qty) / totalActive) * 100 : 0
            }));
            
            // Sort by ID ascending for report 3
            dataArray.sort((a, b) => Number(a.ID) - Number(b.ID));
          }
          
          setReportData(dataArray);
        } catch (error) {
          console.error("Error fetching report data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [reportId, isEnglish]);

  // Handle scroll visibility for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const sortedData = useMemo(() => {
    if (!reportData) return [];
    const sortedArray = [...reportData];
    if (sortConfig.key) {
      sortedArray.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortedArray;
  }, [reportData, sortConfig]);

  const formatNumber = (num) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) {
      toast.error(
        isEnglish
          ? "No data available to export."
          : "ექსპორტისთვის მონაცემები არ არის ხელმისაწვდომი."
      );
      return;
    }

    try {
      let excelData, totalRegistered, totalActive, title, fileName, sheetName;

      if (Number(reportId) === 1) {
        // Report 1: Activities
        excelData = sortedData.map((row) => ({
          [isEnglish ? "Activity Code" : "კოდი"]: row.Activity_Code,
          [isEnglish ? "Activity Name" : "საქმიანობის სახე"]: row.Activity_Name,
          [isEnglish ? "Registered" : "რეგისტრირებული"]: row.Registered_Qty,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            row.pct
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            row.pct_act
          )}%`,
        }));

        totalRegistered = sortedData.reduce(
          (sum, row) => sum + Number(row.Registered_Qty),
          0
        );
        totalActive = sortedData.reduce(
          (sum, row) => sum + Number(row.Active_Qty),
          0
        );

        const totalRegisteredPct = sortedData.reduce(
          (sum, row) => sum + Number(row.pct),
          0
        );
        const totalActivePct = sortedData.reduce(
          (sum, row) => sum + Number(row.pct_act),
          0
        );

        excelData.push({
          [isEnglish ? "Activity Code" : "კოდი"]: "-",
          [isEnglish ? "Activity Name" : "საქმიანობის სახე"]: isEnglish
            ? "Total"
            : "ჯამი",
          [isEnglish ? "Registered" : "რეგისტრირებული"]: totalRegistered,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(totalRegisteredPct)}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(totalActivePct)}%`,
        });

        title = isEnglish
          ? "Number of registered and active organizations by economic activities"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ეკონომიკური საქმიანობების მიხედვით";

        fileName = isEnglish
          ? `Economic_Activities_Report_${
              new Date().toISOString().split("T")[0]
            }.xlsx`
          : `ეკონომიკური_საქმიანობების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish
          ? "Economic Activities"
          : "ეკონომიკური საქმიანობები";
      } else if (Number(reportId) === 2) {
        // Report 2: Legal Forms
        excelData = sortedData.map((row) => ({
          [isEnglish ? "Code" : "კოდი"]: row.ID,
          [isEnglish ? "Legal Status" : "ორგანიზაციულ-სამართლებრივი ფორმა"]:
            row.Legal_Form,
          [isEnglish ? "Registered" : "რეგისტრირებული"]: row.Registered_Qty,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            row.Registered_Percent
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            row.Active_Percent
          )}%`,
        }));

        totalRegistered = sortedData.reduce(
          (sum, row) => sum + Number(row.Registered_Qty),
          0
        );
        totalActive = sortedData.reduce(
          (sum, row) => sum + Number(row.Active_Qty),
          0
        );

        const totalRegisteredPct = sortedData.reduce(
          (sum, row) => sum + Number(row.Registered_Percent),
          0
        );
        const totalActivePct = sortedData.reduce(
          (sum, row) => sum + Number(row.Active_Percent),
          0
        );

        excelData.push({
          [isEnglish ? "Code" : "კოდი"]: "-",
          [isEnglish ? "Legal Status" : "ორგანიზაციულ-სამართლებრივი ფორმა"]:
            isEnglish ? "Total" : "ჯამი",
          [isEnglish ? "Registered" : "რეგისტრირებული"]: totalRegistered,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(totalRegisteredPct)}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(totalActivePct)}%`,
        });

        title = isEnglish
          ? "Number of registered and active organizations by organizational-legal forms"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით";

        fileName = isEnglish
          ? `Legal_Forms_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `სამართლებრივი_ფორმების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish
          ? "Legal Forms"
          : "სამართლებრივი ფორმები";
      } else if (Number(reportId) === 3) {
        // Report 3: Ownership Types
        excelData = sortedData.map((row) => ({
          [isEnglish ? "Code" : "კოდი"]: row.ID,
          [isEnglish ? "Ownership Type" : "საკუთრების ფორმა"]:
            row.Ownership_Type,
          [isEnglish ? "Registered" : "რეგისტრირებული"]: row.Registered_Qty,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            row.Registered_Percent
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            row.Active_Percent
          )}%`,
        }));

        totalRegistered = sortedData.reduce(
          (sum, row) => sum + Number(row.Registered_Qty),
          0
        );
        totalActive = sortedData.reduce(
          (sum, row) => sum + Number(row.Active_Qty),
          0
        );

        const totalRegisteredPct = sortedData.reduce(
          (sum, row) => sum + Number(row.Registered_Percent),
          0
        );
        const totalActivePct = sortedData.reduce(
          (sum, row) => sum + Number(row.Active_Percent),
          0
        );

        excelData.push({
          [isEnglish ? "Code" : "კოდი"]: "-",
          [isEnglish ? "Ownership Type" : "საკუთრების ფორმა"]:
            isEnglish ? "Total" : "ჯამი",
          [isEnglish ? "Registered" : "რეგისტრირებული"]: totalRegistered,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(totalRegisteredPct)}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(totalActivePct)}%`,
        });

        title = isEnglish
          ? "Number of registered organizations by forms of ownership"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით";

        fileName = isEnglish
          ? `Ownership_Types_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `საკუთრების_ფორმების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish
          ? "Ownership Types"
          : "საკუთრების ფორმები";
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: Number(reportId) === 1 ? 15 : 8 }, // Code/Activity Code
        { wch: 40 }, // Name/Legal Status
        { wch: 15 }, // Registered
        { wch: 15 }, // Registered %
        { wch: 15 }, // Active
        { wch: 15 }, // Active %
      ];
      ws["!cols"] = colWidths;

      // Insert title row at the beginning
      XLSX.utils.sheet_add_aoa(ws, [[`Report ${reportId} - ${title}`]], {
        origin: "A1",
      });
      XLSX.utils.sheet_add_aoa(
        ws,
        [[`${isEnglish ? "Date: 1 July 2025" : "თარიღი: 1 ივლისი 2025"}`]],
        { origin: "A2" }
      );
      XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: "A3" }); // Empty row

      // Adjust the data range
      const range = XLSX.utils.decode_range(ws["!ref"]);
      range.e.r += 3; // Extend range to include title rows
      ws["!ref"] = XLSX.utils.encode_range(range);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Save the file
      XLSX.writeFile(wb, fileName);

      // Show success message
      toast.success(
        isEnglish
          ? "Excel file exported successfully!"
          : "Excel ფაილი წარმატებით ექსპორტირებულია!"
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error(
        isEnglish
          ? "Error exporting to Excel. Please try again."
          : "Excel-ში ექსპორტის შეცდომა. გთხოვთ, სცადოთ ხელახლა."
      );
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="geostat-loader">
          <img src={loaderIcon} alt="Loading..." className="w-25 h-25" />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="bg-gray-50">
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
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bpg-nino flex items-center cursor-pointer"
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
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-gray-800">
              {Number(reportId) === 1 && (
                <>
                  1 -{" "}
                  {isEnglish
                    ? "Number of registered and active organizations by economic activity (Nace Rev. 2)"
                    : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ეკონომიკური საქმიანობის სახეების მიხედვით (NACE Rev. 2)"}
                </>
              )}
              {Number(reportId) === 2 && (
                <>
                  2 -{" "}
                  {isEnglish
                    ? "Number of registered and active organizations by organizational-legal forms"
                    : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით"}
                </>
              )}
              {Number(reportId) === 3 && (
                <>
                  3 -{" "}
                  {isEnglish
                    ? "Number of registered organizations by forms of ownership"
                    : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით"}
                </>
              )}
            </h1>
            <div className="text-right font-bpg-nino text-gray-600">
              1 {isEnglish ? "July" : "ივლისი"} 2025
            </div>
          </div>
          <div>
            <div className="relative">
              {/* Table container with responsive scroll */}
              <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-[#0080BE] text-white">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            onClick={() => handleSort(column.key)}
                            className={`px-4 py-3 font-bpg-nino whitespace-nowrap cursor-pointer hover:bg-[#0070aa] transition-colors ${
                              column.key === "ID" ||
                              column.key === "Legal_Form" ||
                              column.key === "Activity_Code" ||
                              column.key === "Activity_Name" ||
                              column.key === "Ownership_Type"
                                ? "text-left"
                                : "text-right"
                            }`}
                          >
                            <div
                              className={`flex items-center ${
                                column.key === "ID" ||
                                column.key === "Legal_Form" ||
                                column.key === "Activity_Code" ||
                                column.key === "Activity_Name" ||
                                column.key === "Ownership_Type"
                                  ? "justify-start"
                                  : "justify-end"
                              }`}
                            >
                              {isEnglish ? column.en : column.ge}
                              {sortConfig.key === column.key && (
                                <span className="ml-1">
                                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedData.map((row, index) => (
                        <tr
                          key={
                            Number(reportId) === 1
                              ? row.Activity_Code || index
                              : row.ID || index
                          }
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          {Number(reportId) === 1 ? (
                            // Report 1: Economic Activities
                            <>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Activity_Code}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Activity_Name}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Registered_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.pct)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.pct_act)}
                              </td>
                            </>
                          ) : Number(reportId) === 2 ? (
                            // Report 2: Legal Forms
                            <>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.ID}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Legal_Form}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Registered_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.Active_Percent)}
                              </td>
                            </>
                          ) : (
                            // Report 3: Ownership Types
                            <>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.ID}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Ownership_Type}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Registered_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.Active_Percent)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {/* Total row - only show for Report 2 and 3 */}
                      {(Number(reportId) === 2 || Number(reportId) === 3) && (
                        <tr className="bg-gray-100 font-bold">
                          <td className="px-4 py-3 font-bpg-nino">-</td>
                          <td className="px-4 py-3 font-bpg-nino">
                            {isEnglish ? "Total" : "სულ"}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {sortedData.reduce(
                              (sum, row) => sum + Number(row.Registered_Qty),
                              0
                            )}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {formatNumber(
                              sortedData.reduce((sum, row) => sum + Number(row.Registered_Percent), 0)
                            )}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {sortedData.reduce(
                              (sum, row) => sum + Number(row.Active_Qty),
                              0
                            )}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {formatNumber(
                              sortedData.reduce((sum, row) => sum + Number(row.Active_Percent), 0)
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 text-sm text-gray-600 font-bpg-nino mb-10">
            {isEnglish ? (
              <div>
                <p className="mb-2">
                  * An entity is active if it meets one of the following
                  criteria:
                </p>
                <ol className="list-decimal list-inside pl-4 space-y-1">
                  <li>
                    Turnover {`>`} 0 (VAT, monthly income and other
                    declarations);
                  </li>
                  <li>
                    Salary or number of employees {`>`} 0 (monthly income or
                    other declarations);
                  </li>
                  <li>Has a profit or loss (profit declaration);</li>
                  <li>Paid any kind of tax, except property tax.</li>
                </ol>
              </div>
            ) : (
              <div>
                <p className="mb-2">
                  * ეკონომიკური ერთეული აქტიურია, თუ იგი აკმაყოფილებს ქვემოთ
                  ჩამოთვლილი კრიტერიუმებიდან ერთ-ერთს:
                </p>
                <ol className="list-decimal list-inside pl-4 space-y-1">
                  <li>
                    ბრუნვა{`>`}0 (დღგ-ს, ყოველთვიური საშემოსავლო და სხვა
                    დეკლარაციები);
                  </li>
                  <li>
                    ხელფასი ან დასაქმებულთა რაოდენობა{`>`}0 (ყოველთვიური
                    საშემოსავლო და სხვა დეკლარაციები);
                  </li>
                  <li>აქვს მოგება ან ზარალი (მოგების დეკლარაცია);</li>
                  <li>
                    გადაიხადა ნებისმიერი სახის გადასახადი, გარდა მხოლოდ ქონების
                    გადასახადისა
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-[#0080BE] text-white rounded-full shadow-lg hover:bg-[#0070aa] transition-all duration-300 flex items-center justify-center z-50 cursor-pointer"
          aria-label={isEnglish ? "Scroll to top" : "გადაახვიეთ ზემოთ"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontFamily: 'bpg-nino',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default ReportsResults;
