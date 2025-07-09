import { useState, useEffect, useMemo } from "react";
import "../styles/scrollbar.css";
import { useParams, useNavigate } from "react-router-dom";
import loaderIcon from "../assets/images/equalizer.svg";
import { API } from "../services/api";

function ReportsResults({ isEnglish }) {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const columns = [
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

  useEffect(() => {
    const fetchData = async () => {
      if (Number(reportId) === 2) {
        setLoading(true);
        try {
          const response = await API.fetchReport2Data(isEnglish ? "en" : "ge");
          const dataArray = Array.isArray(response.rows) ? response.rows : [];
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
          <button
            onClick={() => navigate("/reports")}
            className="mb-4 px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#0070aa] transition-colors font-bpg-nino flex items-center cursor-pointer"
          >
            ← {isEnglish ? "Back to Reports" : "უკან დაბრუნება"}
          </button>
          <div className="mb-6">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-gray-800">
              {Number(reportId) === 2 && (
                <>
                  2 -{" "}
                  {isEnglish
                    ? "Number of registered and active organizations by organizational-legal forms"
                    : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით"}
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
                              column.key === "ID" || column.key === "Legal_Form"
                                ? "text-left"
                                : "text-right"
                            }`}
                          >
                            <div
                              className={`flex items-center ${
                                column.key === "ID" ||
                                column.key === "Legal_Form"
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
                      {sortedData.map((row) => (
                        <tr
                          key={row.ID}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-bpg-nino">{row.ID}</td>
                          <td className="px-4 py-3 font-bpg-nino">
                            {row.Legal_Form}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {row.Registered_Qty}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {formatNumber(row.Registered_Percent)}%
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {row.Active_Qty}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {formatNumber(row.Active_Percent)}%
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-4 py-3 font-bpg-nino">-</td>
                        <td className="px-4 py-3 font-bpg-nino">
                          {isEnglish ? "Total" : "ჯამი"}
                        </td>
                        <td className="px-4 py-3 font-bpg-nino text-right">
                          {sortedData.reduce(
                            (sum, row) => sum + Number(row.Registered_Qty),
                            0
                          )}
                        </td>
                        <td className="px-4 py-3 font-bpg-nino text-right">
                          100.0%
                        </td>
                        <td className="px-4 py-3 font-bpg-nino text-right">
                          {sortedData.reduce(
                            (sum, row) => sum + Number(row.Active_Qty),
                            0
                          )}
                        </td>
                        <td className="px-4 py-3 font-bpg-nino text-right">
                          100.0%
                        </td>
                      </tr>
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
    </div>
  );
}

export default ReportsResults;
