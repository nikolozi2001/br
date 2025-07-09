import { useState, useEffect, useMemo } from "react";
import "../styles/scrollbar.css";



import { useParams, useNavigate } from "react-router-dom";
import { API } from "../services/api";

function ReportsResults({ isEnglish }) {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const columns = [
    { key: 'ID', ge: 'კოდი', en: 'Code' },
    { key: 'Legal_Form', ge: 'ორგანიზაციულ-სამართლებრივი ფორმა', en: 'Legal Status' },
    { key: 'Registered_Qty', ge: 'რეგისტრირებული', en: 'Registered' },
    { key: 'Active_Qty', ge: 'აქტიური', en: 'Active' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (Number(reportId) === 2) {
        setLoading(true);
        try {
          const data = await API.fetchReport2Data(isEnglish ? 'en' : 'ge');
          setReportData(data);
        } catch (error) {
          console.error('Error fetching report data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [reportId, isEnglish]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
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

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center font-bpg-nino text-[#0080BE]">
          Loading...
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="w-full bg-gray-50 py-8 flex-grow">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/reports')}
            className="mb-4 px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#0070aa] transition-colors font-bpg-nino flex items-center"
          >
            ← {isEnglish ? "Back to Reports" : "უკან დაბრუნება"}
          </button>
          <div className="mb-6">
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-gray-800">
              {Number(reportId) === 2 && (
                <>
                  2 - {isEnglish 
                    ? "Number of registered and active organizations by organizational-legal forms"
                    : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით"
                  }
                </>
              )}
            </h1>
            <div className="text-right font-bpg-nino text-gray-600">
              1 {isEnglish ? "July" : "ივლისი"} 2025
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="overflow-y-auto max-h-[calc(100vh-450px)]">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-[#0080BE] text-white sticky top-0">
                      <tr>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            onClick={() => handleSort(column.key)}
                            className="px-4 py-2 text-left font-bpg-nino whitespace-nowrap cursor-pointer hover:bg-[#0070aa] transition-colors"
                          >
                            <div className="flex items-center">
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
                        <tr key={row.ID} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 font-bpg-nino">{row.ID}</td>
                          <td className="px-4 py-2 font-bpg-nino">{row.Legal_Form}</td>
                          <td className="px-4 py-2 font-bpg-nino">{row.Registered_Qty}</td>
                          <td className="px-4 py-2 font-bpg-nino">{row.Active_Qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsResults;
