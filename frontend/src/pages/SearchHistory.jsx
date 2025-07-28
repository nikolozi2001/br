import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/scrollbar.css";
import "../styles/searchHistory.scss";
import { API } from "../services/api";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import toast, { Toaster } from "react-hot-toast";
import { translations } from "../translations/searchForm";

import georgianFont from "../fonts/NotoSansGeorgian_ExtraCondensed-Bold.ttf";
import loaderIcon from "../assets/images/equalizer.svg";

function SearchHistory({ isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];
  const [searchHistory, setSearchHistory] = useState([]);
  const navigate = useNavigate();

  const data = [
    {
      label: "საიდენტიფიკაციო ნომერი:",
      value: "209456104",
    },
    {
      label: "ორგანიზაციის დასახელება:",
      value: "მ3ს კარიბჭე",
    },
    {
      label: "ორგანიზაციულ-სამართლებრივი ფორმა:",
      value: "მ3ს",
    },
    {
      label: "საკუთრების ფორმა:",
      value: "კერძო აღვილობრივი საკუთრება",
    },
    {
      label: "რეგიონი:",
      value: "ქ. თბილისი,გლდანის რაიონი",
    },
    {
      label: "იურიდიული მისამართი:",
      value:
        "საქართველო, ქ. თბილისი, გლდანის რაიონი, მუხიანი IV ბ მ/რ., კორპ. №26, ბ. 13",
    },
    {
      label: "ეკონომიკური საქმიანობა (NACE Rev.2):",
      value:
        "68.20.2 - საკუთარი ან იჯარით აღებული არასაცხოვრებელი შენობების გაქირავება და მართვა",
    },
    {
      label: "აქტიური ეკონომიკური სეხმეტე:",
      value: "აქტიური",
    },
  ];

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
      a.download = "company_info.xlsx";
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
            <h1 className="text-xl font-bpg-nino mb-2 text-center text-[#0080BE] font-bold">
              {t.historyTitle}
            </h1>
          </div>

          {/* Georgian Info Table */}
          <div className="w-full">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchHistory;
