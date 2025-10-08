import { useState, useEffect, useMemo, useCallback, memo } from "react";
import "../styles/scrollbar.css";
import { useParams, useNavigate } from "react-router-dom";
import loaderIcon from "../assets/images/equalizer.svg";
import { API } from "../services/api";
import useDocumentTitle from "../hooks/useDocumentTitle";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import toast, { Toaster } from "react-hot-toast";
import { formatNumberWithLocale } from "./charts/chartUtils";

// Constants and configurations
const REPORT_CONFIGS = {
  1: {
    apiMethod: "fetchReport1Data",
    type: "standard",
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ეკონომიკური საქმიანობის სახეების მიხედვით (NACE Rev. 2)",
      en: "Number of registered and active organizations by economic activity (Nace Rev. 2)",
    },
    fileName: {
      ge: "ეკონომიკური_საქმიანობების_ანგარიში",
      en: "Economic_Activities_Report",
    },
    sheetName: {
      ge: "ეკონომიკური საქმიანობები",
      en: "Economic Activities",
    },
  },
  2: {
    apiMethod: "fetchReport2Data",
    type: "standard",
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით",
      en: "Number of registered and active organizations by organizational-legal forms",
    },
    fileName: {
      ge: "სამართლებრივი_ფორმების_ანგარიში",
      en: "Legal_Forms_Report",
    },
    sheetName: {
      ge: "სამართლებრივი ფორმები",
      en: "Legal Forms",
    },
  },
  3: {
    apiMethod: "fetchReport3Data",
    type: "standard",
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით",
      en: "Number of registered organizations by forms of ownership",
    },
    fileName: {
      ge: "საკუთრების_ფორმების_ანგარიში",
      en: "Ownership_Types_Report",
    },
    sheetName: {
      ge: "საკუთრების ფორმები",
      en: "Ownership Types",
    },
  },
  4: {
    apiMethod: "fetchReport4Data",
    type: "standard",
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა რეგიონების მიხედვით",
      en: "Number of registered and active organizations by regions",
    },
    fileName: {
      ge: "რეგიონების_ანგარიში",
      en: "Regions_Report",
    },
    sheetName: {
      ge: "რეგიონები",
      en: "Regions",
    },
  },
  5: {
    apiMethod: "fetchReport5Data",
    type: "standard",
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა მუნიციპალიტეტების მიხედვით",
      en: "Number of registered and active organizations by municipalities",
    },
    fileName: {
      ge: "მუნიციპალიტეტების_ანგარიში",
      en: "Municipalities_Report",
    },
    sheetName: {
      ge: "მუნიციპალიტეტები",
      en: "Municipalities",
    },
  },
  6: {
    apiMethod: "fetchReport6Data",
    type: "yearly",
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - ნაზარდი ჯამი",
      en: "Number of registered organizations by organizational-legal forms and years - incremental sum",
    },
    fileName: {
      ge: "ორგანიზაციები_ფორმებით_ნაზარდი",
      en: "Organizations_Forms_Incremental",
    },
    sheetName: {
      ge: "ნაზარდი ჯამი",
      en: "Incremental Sum",
    },
  },
  7: {
    apiMethod: "fetchReport7Data",
    type: "yearly",
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - კონკრეტულ წელს რეგისტრირებული",
      en: "Number of registered organizations by organizational-legal forms and years - registered in a specific year",
    },
    fileName: {
      ge: "ორგანიზაციები_ფორმებით_წლიური",
      en: "Organizations_Forms_Yearly",
    },
    sheetName: {
      ge: "წლიური რეგისტრაცია",
      en: "Yearly Registration",
    },
  },
  8: {
    apiMethod: "fetchReport8Data",
    type: "yearly",
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - ნაზარდი ჯამი",
      en: "Number of registered organizations by type of economic activity (Nace Rev. 2.) and years - incremental sum",
    },
    fileName: {
      ge: "ორგანიზაციები_საქმიანობით_ნაზარდი",
      en: "Organizations_Activities_Incremental",
    },
    sheetName: {
      ge: "ნაზარდი ჯამი",
      en: "Incremental Sum",
    },
  },
  9: {
    apiMethod: "fetchReport9Data",
    type: "yearly",
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - კონკრეტულ წელს რეგისტრირებული",
      en: "Number of registered organizations by type of economic activity (Nace Rev. 2.) and years - registered in a specific year",
    },
    fileName: {
      ge: "ორგანიზაციები_საქმიანობით_წლიური",
      en: "Organizations_Activities_Yearly",
    },
    sheetName: {
      ge: "წლიური რეგისტრაცია",
      en: "Yearly Registration",
    },
  },
  10: {
    apiMethod: "fetchReport10Data",
    type: "regional",
    hasPercentages: false,
    title: {
      ge: "საქართველოში რეგისტრირებულ მოქმედ ბიზნეს სუბიექტთა რაოდენობა რეგიონებისა და ეკონომიკური საქმიანობის სახეების მიხედვით (Nace Rev.2)",
      en: "The number of active business entities registered in Georgia according to regions and types of economic activity (Nace Rev.2)",
    },
    fileName: {
      ge: "რეგიონები_საქმიანობები",
      en: "Regions_Activities",
    },
    sheetName: {
      ge: "რეგიონები და საქმიანობები",
      en: "Regions and Activities",
    },
  },
};

// Column configurations
const COLUMN_CONFIGS = {
  report1: [
    { key: "Activity_Code", ge: "კოდი", en: "Activity Code" },
    { key: "Activity_Name", ge: "სექციის დასახელება", en: "Activity Name" },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "pct_act", ge: "%", en: "%" },
  ],
  report2: [
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
  ],
  report3: [
    { key: "ID", ge: "კოდი", en: "Code" },
    { key: "Ownership_Type", ge: "საკუთრების ფორმა", en: "Ownership Type" },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "Registered_Pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "Active_Pct", ge: "%", en: "%" },
  ],
  report4: [
    { key: "Location_Code", ge: "კოდი", en: "Code" },
    { key: "Location_Name", ge: "რეგიონის დასახელება", en: "Region Name" },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "Registered_Pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "Active_Pct", ge: "%", en: "%" },
  ],
  report5: [
    { key: "Location_Code", ge: "კოდი", en: "Code" },
    { key: "Location_Name", ge: "მუნიციპალიტეტი", en: "Municipality" },
    { key: "Registered_Qty", ge: "რეგისტრირებული", en: "Registered" },
    { key: "Registered_Pct", ge: "%", en: "%" },
    { key: "Active_Qty", ge: "აქტიური", en: "Active" },
    { key: "Active_Pct", ge: "%", en: "%" },
  ],
  report6: [
    { key: "ID", ge: "კოდი", en: "Code" },
    {
      key: "Legal_Form",
      ge: "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება",
      en: "Organizational-Legal Form",
    },
    // Year columns will be generated dynamically
  ],
  report7: [
    { key: "ID", ge: "კოდი", en: "Code" },
    {
      key: "Legal_Form",
      ge: "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება",
      en: "Organizational-Legal Form",
    },
    // Year columns will be generated dynamically
  ],
  report8: [
    { key: "Activity_Code", ge: "კოდი", en: "Activity Code" },
    {
      key: "Activity_Name",
      ge: "ეკონომიკური საქმიანობის სახე",
      en: "Economic Activity",
    },
    // Year columns will be generated dynamically
  ],
  report9: [
    { key: "Activity_Code", ge: "კოდი", en: "Activity Code" },
    {
      key: "Activity_Name",
      ge: "ეკონომიკური საქმიანობის სახე",
      en: "Economic Activity",
    },
    // Year columns will be generated dynamically
  ],
  report10: [
    { key: "Region", ge: "რეგიონი", en: "Region" },
    {
      key: "Activity_Code",
      ge: "საქმიანობის კოდი Nace Rev.2",
      en: "Activity_Code Nace Rev.2",
    },
    {
      key: "Activity_Name",
      ge: "საქმიანობა Nace Rev.2",
      en: "Activity Nace Rev.2",
    },
    // Year columns will be generated dynamically (2012-2023)
  ],
};

// Memoized getters for better performance
const getReportConfig = (reportId) => REPORT_CONFIGS[Number(reportId)];
const getColumnConfig = (reportId) => COLUMN_CONFIGS[`report${reportId}`];

// Memoized data processing utilities
const calculatePercentages = (
  dataArray,
  totalRegisteredKey = "Registered_Qty",
  totalActiveKey = "Active_Qty"
) => {
  const totalRegistered = dataArray.reduce(
    (sum, row) => sum + Number(row[totalRegisteredKey]),
    0
  );
  const totalActive = dataArray.reduce(
    (sum, row) => sum + Number(row[totalActiveKey]),
    0
  );

  return dataArray.map((row) => ({
    ...row,
    Registered_Percent:
      totalRegistered > 0
        ? (Number(row[totalRegisteredKey]) / totalRegistered) * 100
        : 0,
    Active_Percent:
      totalActive > 0 ? (Number(row[totalActiveKey]) / totalActive) * 100 : 0,
  }));
};

const sortDataByReportType = (dataArray, reportNum) => {
  switch (reportNum) {
    case 6:
    case 7:
      return [...dataArray].sort((a, b) =>
        String(a.ID || "").localeCompare(String(b.ID || ""))
      );

    case 8:
    case 9:
      return [...dataArray].sort((a, b) => {
        const aCode = String(a.Activity_Code || "");
        const bCode = String(b.Activity_Code || "");
        if (!aCode && !bCode) return 0;
        if (!aCode) return 1;
        if (!bCode) return -1;
        return aCode.localeCompare(bCode);
      });

    default:
      return dataArray;
  }
};

// Excel export utilities (for future refactoring)
// eslint-disable-next-line no-unused-vars
const createExcelData = (reportId, sortedData, isEnglish) => {
  const reportNum = Number(reportId);
  // eslint-disable-next-line no-unused-vars
  const config = getReportConfig(reportId);

  switch (reportNum) {
    case 1:
      return {
        data: sortedData.map((row) => ({
          [isEnglish ? "Activity Code" : "კოდი"]: row.Activity_Code,
          [isEnglish ? "Activity Name" : "საქმიანობის სახე"]: row.Activity_Name,
          [isEnglish ? "Registered" : "რეგისტრირებული"]: row.Registered_Qty,
          [isEnglish
            ? "Registered %"
            : "რეგისტრირებული %"]: `${formatNumberWithLocale(row.pct)}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumberWithLocale(
            row.pct_act
          )}%`,
        })),
        totals: {
          registered: sortedData.reduce(
            (sum, row) => sum + Number(row.Registered_Qty),
            0
          ),
          active: sortedData.reduce(
            (sum, row) => sum + Number(row.Active_Qty),
            0
          ),
          registeredPct: sortedData.reduce(
            (sum, row) => sum + Number(row.pct),
            0
          ),
          activePct: sortedData.reduce(
            (sum, row) => sum + Number(row.pct_act),
            0
          ),
        },
      };

    case 2:
      return {
        data: sortedData.map((row) => ({
          [isEnglish ? "Code" : "კოდი"]: row.ID,
          [isEnglish ? "Legal Status" : "ორგანიზაციულ-სამართლებრივი ფორმა"]:
            row.Legal_Form,
          [isEnglish ? "Registered" : "რეგისტრირებული"]: row.Registered_Qty,
          [isEnglish
            ? "Registered %"
            : "რეგისტრირებული %"]: `${formatNumberWithLocale(
            row.Registered_Percent
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumberWithLocale(
            row.Active_Percent
          )}%`,
        })),
        totals: {
          registered: sortedData.reduce(
            (sum, row) => sum + Number(row.Registered_Qty),
            0
          ),
          active: sortedData.reduce(
            (sum, row) => sum + Number(row.Active_Qty),
            0
          ),
          registeredPct: sortedData.reduce(
            (sum, row) => sum + Number(row.Registered_Percent),
            0
          ),
          activePct: sortedData.reduce(
            (sum, row) => sum + Number(row.Active_Percent),
            0
          ),
        },
      };

    default:
      return { data: [], totals: {} };
  }
};

// eslint-disable-next-line no-unused-vars
const getExcelFileInfo = (reportId, isEnglish) => {
  const config = getReportConfig(reportId);
  if (!config) return { title: "", fileName: "", sheetName: "" };

  const dateStr = new Date().toISOString().split("T")[0];
  const title = config.title[isEnglish ? "en" : "ge"];
  return {
    title: title,
    fileName: `${title}_${dateStr}.xlsx`,
    sheetName: config.sheetName[isEnglish ? "en" : "ge"],
  };
};

const processReportData = (dataArray, reportNum) => {
  let processedData = [...dataArray];

  // Calculate percentages for reports that need them
  if ([3, 4, 5].includes(reportNum) && processedData.length > 0) {
    processedData = calculatePercentages(processedData);
  }

  // Sort data based on report type
  processedData = sortDataByReportType(processedData, reportNum);

  return processedData;
};

// Helper function for generating standard report Excel data
const generateStandardReportExcelData = (
  sortedData,
  reportNum,
  isEnglish,
  totals
) => {
  const getColumnHeaders = (reportNum, isEnglish) => {
    const baseHeaders = {
      1: isEnglish
        ? [
            "Activity Code",
            "Activity Name",
            "Registered",
            "Registered %",
            "Active",
            "Active %",
          ]
        : [
            "კოდი",
            "საქმიანობის სახე",
            "რეგისტრირებული",
            "რეგისტრირებული %",
            "აქტიური",
            "აქტიური %",
          ],
      2: isEnglish
        ? [
            "Code",
            "Legal Status",
            "Registered",
            "Registered %",
            "Active",
            "Active %",
          ]
        : [
            "კოდი",
            "ორგანიზაციულ-სამართლებრივი ფორმა",
            "რეგისტრირებული",
            "რეგისტრირებული %",
            "აქტიური",
            "აქტიური %",
          ],
      3: isEnglish
        ? [
            "Code",
            "Ownership Type",
            "Registered",
            "Registered %",
            "Active",
            "Active %",
          ]
        : [
            "კოდი",
            "საკუთრების ფორმა",
            "რეგისტრირებული",
            "რეგისტრირებული %",
            "აქტიური",
            "აქტიური %",
          ],
      4: isEnglish
        ? ["Code", "Region", "Registered", "Registered %", "Active", "Active %"]
        : [
            "კოდი",
            "რეგიონი",
            "რეგისტრირებული",
            "რეგისტრირებული %",
            "აქტიური",
            "აქტიური %",
          ],
      5: isEnglish
        ? [
            "Code",
            "Municipality",
            "Registered",
            "Registered %",
            "Active",
            "Active %",
          ]
        : [
            "კოდი",
            "მუნიციპალიტეტი",
            "რეგისტრირებული",
            "რეგისტრირებული %",
            "აქტიური",
            "აქტიური %",
          ],
    };
    return baseHeaders[reportNum] || [];
  };

  const headers = getColumnHeaders(reportNum, isEnglish);
  const excelData = sortedData.map((row) => {
    const rowData = {};

    switch (reportNum) {
      case 1:
        rowData[headers[0]] = row.Activity_Code;
        rowData[headers[1]] = row.Activity_Name;
        rowData[headers[2]] = row.Registered_Qty;
        rowData[headers[3]] = `${formatNumberWithLocale(row.pct)}%`;
        rowData[headers[4]] = row.Active_Qty;
        rowData[headers[5]] = `${formatNumberWithLocale(row.pct_act)}%`;
        break;
      case 2:
      case 3:
        rowData[headers[0]] = row.ID;
        rowData[headers[1]] = row.Legal_Form || row.Ownership_Type;
        rowData[headers[2]] = row.Registered_Qty;
        rowData[headers[3]] = `${formatNumberWithLocale(
          row.Registered_Percent
        )}%`;
        rowData[headers[4]] = row.Active_Qty;
        rowData[headers[5]] = `${formatNumberWithLocale(row.Active_Percent)}%`;
        break;
      case 4:
      case 5:
        rowData[headers[0]] = row.Location_Code;
        rowData[headers[1]] = row.Location_Name;
        rowData[headers[2]] = row.Registered_Qty;
        rowData[headers[3]] = `${formatNumberWithLocale(
          row.Registered_Percent
        )}%`;
        rowData[headers[4]] = row.Active_Qty;
        rowData[headers[5]] = `${formatNumberWithLocale(row.Active_Percent)}%`;
        break;
    }

    return rowData;
  });

  // Add totals row
  const totalRow = {};
  totalRow[headers[0]] = "-";
  totalRow[headers[1]] = isEnglish ? "Total" : "ჯამი";
  totalRow[headers[2]] = totals.registered;
  totalRow[headers[3]] = `${formatNumberWithLocale(totals.registeredPercent)}%`;
  totalRow[headers[4]] = totals.active;
  totalRow[headers[5]] = `${formatNumberWithLocale(totals.activePercent)}%`;

  excelData.push(totalRow);
  return excelData;
};

// Helper function for generating complex report Excel files
const generateComplexReportExcel = async (
  sortedData,
  reportNum,
  isEnglish,
  title,
  fileName,
  sheetName
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Configure columns based on report type
  if ([6, 7].includes(reportNum)) {
    worksheet.columns = [
      { width: 8 }, // Code
      { width: 40 }, // Legal Form
      { width: 8 }, // <1995
      ...Array.from({ length: 30 }, () => ({ width: 8 })), // Year columns
      { width: 8 }, // >2024
    ];
  } else if ([8, 9].includes(reportNum)) {
    worksheet.columns = [
      { width: 12 }, // Activity Code
      { width: 50 }, // Activity Name
      { width: 8 }, // <1995
      ...Array.from({ length: 30 }, () => ({ width: 8 })), // Year columns
      { width: 8 }, // >2024
    ];
  } else if (reportNum === 10) {
    worksheet.columns = [
      { width: 15 }, // Region
      { width: 12 }, // Activity Code
      { width: 50 }, // Activity Name
      ...Array.from({ length: 12 }, () => ({ width: 8 })), // Year columns (2012-2023)
    ];
  }

  // Add title and headers
  const titleRow = worksheet.addRow([`Report ${reportNum} - ${title}`]);
  titleRow.font = { bold: true, size: 14 };

  const dateRow = worksheet.addRow([
    isEnglish ? "Date: 22 July 2025" : "თარიღი: 22 ივლისი 2025",
  ]);
  dateRow.font = { size: 12 };

  worksheet.addRow([]);

  // Add headers based on report type
  if ([6, 7].includes(reportNum)) {
    // Add structured headers for Report 6 and 7
    const headerRow1 = [
      isEnglish ? "Code" : "კოდი",
      isEnglish
        ? "Organizational-Legal Form"
        : "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება",
      isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
      ...Array.from({ length: 30 }, () => ""), // Empty cells for year column spanning
    ];

    const headerRow2 = [
      "", // Empty for Code
      "", // Empty for Legal Form
      "<1995",
      ...Array.from({ length: 30 }, (_, i) => (1995 + i).toString()),
      ">2024",
    ];

    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);
  } else if ([8, 9].includes(reportNum)) {
    // Add structured headers for Report 8 and 9
    const headerRow1 = [
      isEnglish ? "Activity Code" : "კოდი",
      isEnglish ? "Economic Activity" : "ეკონომიკური საქმიანობის სახე",
      isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
      ...Array.from({ length: 30 }, () => ""), // Empty cells for year column spanning
    ];

    const headerRow2 = [
      "", // Empty for Activity Code
      "", // Empty for Activity Name
      "<1995",
      ...Array.from({ length: 30 }, (_, i) => (1995 + i).toString()),
      ">2024",
    ];

    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);
  } else if (reportNum === 10) {
    // Add structured headers for Report 10
    const headerRow1 = [
      isEnglish ? "Region" : "რეგიონი",
      isEnglish ? "Activity_Code Nace Rev.2" : "საქმიანობის კოდი Nace Rev.2",
      isEnglish ? "Activity Nace Rev.2" : "საქმიანობა Nace Rev.2",
      isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
      ...Array.from({ length: 11 }, () => ""), // Empty cells for year column spanning
    ];

    const headerRow2 = [
      "", // Empty for Region
      "", // Empty for Activity Code
      "", // Empty for Activity Name
      ...Array.from({ length: 12 }, (_, i) => (2012 + i).toString()), // Years 2012-2023
    ];

    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);
  }

  // Add data rows with proper structure
  sortedData.forEach((row) => {
    if ([6, 7].includes(reportNum)) {
      // For Report 6 and 7, maintain proper column order
      const dataRowValues = [
        row.ID,
        row.Legal_Form,
        row["<1995"] || row.Lt1995 || "",
        // Year columns 1995-2024
        ...Array.from({ length: 30 }, (_, i) => {
          const year = (1995 + i).toString();
          return row[`Y${year}`] || row[year] || "";
        }),
        row[">2024"] || row.Gt2024 || "",
      ];
      worksheet.addRow(dataRowValues);
    } else if ([8, 9].includes(reportNum)) {
      // For Report 8 and 9, maintain proper column order
      const dataRowValues = [
        row.Activity_Code,
        row.Activity_Name,
        row["<1995"] || row.Lt1995 || "",
        // Year columns 1995-2024
        ...Array.from({ length: 30 }, (_, i) => {
          const year = (1995 + i).toString();
          return row[`Y${year}`] || row[year] || "";
        }),
        row[">2024"] || row.Gt2024 || "",
      ];
      worksheet.addRow(dataRowValues);
    } else if (reportNum === 10) {
      // For Report 10, maintain proper column order
      const dataRowValues = [
        row.Region,
        row.Activity_Code,
        row.Activity_Name,
        // Year columns 2012-2023
        ...Array.from({ length: 12 }, (_, i) => {
          const year = (2012 + i).toString();
          return row[`Y${year}`] || row[year] || "";
        }),
      ];
      worksheet.addRow(dataRowValues);
    } else {
      // For other complex reports, use original method
      const dataRowValues = Object.values(row);
      worksheet.addRow(dataRowValues);
    }
  });

  // Save and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Custom hook for sorting functionality - optimized
const useSortedData = (reportData) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = useCallback((key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }, []);

  const sortedData = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];

    if (!sortConfig.key) return reportData;

    const sortedArray = [...reportData];
    sortedArray.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison for numbers
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sortedArray;
  }, [reportData, sortConfig]);

  return { sortedData, sortConfig, handleSort };
};

// Custom hook for scroll functionality - optimized
const useScrollToTop = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    setShowScrollTop(scrollTop > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Throttle scroll events for better performance
    let timeoutId = null;
    const throttledHandleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 100);
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return { showScrollTop, scrollToTop };
};

const useFetchReportData = (reportId, isEnglish) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    const reportNum = Number(reportId);
    if (reportNum < 1 || reportNum > 10) {
      setReportData([]);
      return;
    }

    setLoading(true);

    try {
      const config = getReportConfig(reportId);
      if (!config) {
        setReportData([]);
        return;
      }

      const language = isEnglish ? "en" : "ge";
      const response = await API[config.apiMethod](language);

      let dataArray = Array.isArray(response.rows)
        ? response.rows
        : Array.isArray(response)
        ? response
        : [];

      // Process the data using utility functions
      dataArray = processReportData(dataArray, reportNum);

      setReportData(dataArray);
    } catch (error) {
      console.error("Error fetching report data:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [reportId, isEnglish]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { reportData, loading };
};

function ReportsResults({ isEnglish }) {
  const { reportId } = useParams();
  const navigate = useNavigate();

  // Memoize report configuration to prevent recalculation
  const reportConfig = useMemo(() => getReportConfig(reportId), [reportId]);
  const columns = useMemo(() => getColumnConfig(reportId) || [], [reportId]);

  // Use custom hooks
  const { reportData, loading } = useFetchReportData(reportId, isEnglish);
  const { sortedData, sortConfig, handleSort } = useSortedData(reportData);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  // Memoize title calculation
  const reportTitle = useMemo(() => {
    if (!reportConfig) return "";
    return `${reportId} - ${reportConfig.title[isEnglish ? "en" : "ge"]}`;
  }, [reportId, reportConfig, isEnglish]);

  // Set dynamic page title for the specific report
  useDocumentTitle(
    isEnglish,
    `${isEnglish ? "Report" : "რეპორტი"} ${reportId}`
  );

  // Memoize totals calculation for better performance
  const totals = useMemo(() => {
    if (!sortedData || sortedData.length === 0) return null;

    const hasRegistered = sortedData.some(
      (row) => row.Registered_Qty !== undefined
    );
    const hasActive = sortedData.some((row) => row.Active_Qty !== undefined);

    if (!hasRegistered && !hasActive) return null;

    return {
      registered: hasRegistered
        ? sortedData.reduce(
            (sum, row) => sum + Number(row.Registered_Qty || 0),
            0
          )
        : 0,
      active: hasActive
        ? sortedData.reduce((sum, row) => sum + Number(row.Active_Qty || 0), 0)
        : 0,
      registeredPercent: sortedData.reduce((sum, row) => {
        if (row.Registered_Percent !== undefined)
          return sum + Number(row.Registered_Percent);
        if (row.pct !== undefined) return sum + Number(row.pct);
        return sum;
      }, 0),
      activePercent: sortedData.reduce((sum, row) => {
        if (row.Active_Percent !== undefined)
          return sum + Number(row.Active_Percent);
        if (row.pct_act !== undefined) return sum + Number(row.pct_act);
        return sum;
      }, 0),
    };
  }, [sortedData]);

  // Memoized Excel export function for better performance
  const exportToExcel = useCallback(async () => {
    if (!reportData || reportData.length === 0) {
      toast.error(
        isEnglish
          ? "No data available to export."
          : "ექსპორტისთვის მონაცემები არ არის ხელმისაწვდომი."
      );
      return;
    }

    try {
      const reportNum = Number(reportId);
      const config = reportConfig;
      if (!config) return;

      // Use the precomputed totals for better performance
      const excelTotals = totals || {
        registered: sortedData.reduce(
          (sum, row) => sum + Number(row.Registered_Qty || 0),
          0
        ),
        active: sortedData.reduce(
          (sum, row) => sum + Number(row.Active_Qty || 0),
          0
        ),
      };

      const dateStr = new Date().toISOString().split("T")[0];
      const title = config.title[isEnglish ? "en" : "ge"];
      const fileName = `${title}_${dateStr}.xlsx`;
      const sheetName = config.sheetName[isEnglish ? "en" : "ge"];

      // Generate Excel data based on report type
      let excelData;

      if ([1, 2, 3, 4, 5].includes(reportNum)) {
        // Standard reports - use a common function for better maintainability
        excelData = generateStandardReportExcelData(
          sortedData,
          reportNum,
          isEnglish,
          excelTotals
        );
      } else if ([6, 7, 8, 9, 10].includes(reportNum)) {
        // Complex reports - create with ExcelJS for better formatting
        await generateComplexReportExcel(
          sortedData,
          reportNum,
          isEnglish,
          title,
          fileName,
          sheetName
        );
        return;
      }

      // Create and download Excel file for standard reports
      if (excelData) {
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
      }

      toast.success(
        isEnglish
          ? "Excel file exported successfully!"
          : "Excel ფაილი წარმატებით ექსპორტირებულია!"
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(
        isEnglish
          ? "Failed to export Excel file."
          : "Excel ფაილის ექსპორტი ვერ მოხერხდა."
      );
    }
  }, [reportData, sortedData, reportId, reportConfig, isEnglish, totals]);

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
              {reportTitle}
            </h1>
          </div>
          <div>
            <div className="relative">
              {/* Table container with responsive scroll */}
              <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    {Number(reportId) === 6 ||
                    Number(reportId) === 7 ||
                    Number(reportId) === 8 ||
                    Number(reportId) === 9 ||
                    Number(reportId) === 10 ? (
                      // Special table structure for Report 6, 7, 8, 9 and 10
                      <thead className="bg-[#0080BE] text-white">
                        {Number(reportId) === 10 ? (
                          // Special header for Report 10 with Region and Activity columns
                          <>
                            <tr>
                              <th
                                rowSpan="2"
                                className="px-3 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() => handleSort("Region")}
                              >
                                <div className="flex items-center justify-center">
                                  {isEnglish ? "Region" : "რეგიონი"}
                                  {sortConfig.key === "Region" && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                rowSpan="2"
                                className="px-3 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() => handleSort("Activity_Code")}
                              >
                                <div className="flex items-center justify-center">
                                  {isEnglish
                                    ? "Activity_Code Nace Rev.2"
                                    : "საქმიანობის კოდი Nace Rev.2"}
                                  {sortConfig.key === "Activity_Code" && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                rowSpan="2"
                                className="px-3 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() => handleSort("Activity_Name")}
                              >
                                <div className="flex items-center justify-center">
                                  {isEnglish
                                    ? "Activity_Name Nace Rev.2"
                                    : "საქმიანობა Nace Rev.2"}
                                  {sortConfig.key === "Activity_Name" && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                colSpan="12"
                                className="px-4 py-3 font-bpg-nino text-center border-b border-gray-300"
                              >
                                {isEnglish
                                  ? "Number of Organizations"
                                  : "ორგანიზაციათა რაოდენობა"}
                              </th>
                            </tr>
                            <tr>
                              {Array.from(
                                { length: 12 },
                                (_, i) => 2012 + i
                              ).map((year) => (
                                <th
                                  key={year}
                                  className="px-2 py-2 font-bpg-nino text-center text-xs"
                                >
                                  {year}
                                </th>
                              ))}
                            </tr>
                          </>
                        ) : (
                          // Standard header for Reports 6, 7, 8, 9
                          <>
                            <tr>
                              <th
                                rowSpan="2"
                                className="px-4 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() =>
                                  handleSort(
                                    Number(reportId) === 8 ||
                                      Number(reportId) === 9
                                      ? "Activity_Code"
                                      : "ID"
                                  )
                                }
                              >
                                <div className="flex items-center justify-center">
                                  {isEnglish ? "Code" : "კოდი"}
                                  {sortConfig.key ===
                                    (Number(reportId) === 8 ||
                                    Number(reportId) === 9
                                      ? "Activity_Code"
                                      : "ID") && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                rowSpan="2"
                                className="px-4 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() =>
                                  handleSort(
                                    Number(reportId) === 8 ||
                                      Number(reportId) === 9
                                      ? "Activity_Name"
                                      : "Legal_Form"
                                  )
                                }
                              >
                                <div className="flex items-center justify-center">
                                  {Number(reportId) === 8 ||
                                  Number(reportId) === 9
                                    ? isEnglish
                                      ? "Economic Activity"
                                      : "ეკონომიკური საქმიანობის სახე"
                                    : isEnglish
                                    ? "Organizational-Legal Form"
                                    : "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება"}
                                  {sortConfig.key ===
                                    (Number(reportId) === 8 ||
                                    Number(reportId) === 9
                                      ? "Activity_Name"
                                      : "Legal_Form") && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                colSpan="32"
                                className="px-4 py-3 font-bpg-nino text-center border-b border-gray-300"
                              >
                                {isEnglish
                                  ? "Number of Organizations"
                                  : "ორგანიზაციათა რაოდენობა"}
                              </th>
                            </tr>
                            <tr>
                              <th className="px-2 py-2 font-bpg-nino text-center text-xs">
                                &lt;1995
                              </th>
                              {Array.from(
                                { length: 30 },
                                (_, i) => 1995 + i
                              ).map((year) => (
                                <th
                                  key={year}
                                  className="px-2 py-2 font-bpg-nino text-center text-xs"
                                >
                                  {year}
                                </th>
                              ))}
                              <th className="px-2 py-2 font-bpg-nino text-center text-xs">
                                &gt;2024
                              </th>
                            </tr>
                          </>
                        )}
                      </thead>
                    ) : (
                      // Regular table structure for other reports
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
                                column.key === "Ownership_Type" ||
                                column.key === "Location_Code" ||
                                column.key === "Location_Name"
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
                                  column.key === "Ownership_Type" ||
                                  column.key === "Location_Code" ||
                                  column.key === "Location_Name"
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
                    )}
                    <tbody className="divide-y divide-gray-200">
                      {sortedData.map((row, index) => (
                        <tr
                          key={
                            Number(reportId) === 1 ||
                            Number(reportId) === 8 ||
                            Number(reportId) === 9
                              ? row.Activity_Code || index
                              : Number(reportId) === 10
                              ? row.Region && row.Activity_Code
                                ? `${row.Region}-${row.Activity_Code}`
                                : index
                              : Number(reportId) === 4 || Number(reportId) === 5
                              ? row.Location_Code || index
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
                                {formatNumberWithLocale(row.pct)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.pct_act)}
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
                                {formatNumberWithLocale(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.Active_Percent)}
                              </td>
                            </>
                          ) : Number(reportId) === 3 ? (
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
                                {formatNumberWithLocale(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.Active_Percent)}
                              </td>
                            </>
                          ) : Number(reportId) === 4 ||
                            Number(reportId) === 5 ? (
                            // Report 4: Regions / Report 5: Municipalities
                            <>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Location_Code}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Location_Name}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Registered_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.Active_Percent)}
                              </td>
                            </>
                          ) : Number(reportId) === 6 ||
                            Number(reportId) === 7 ||
                            Number(reportId) === 8 ||
                            Number(reportId) === 9 ||
                            Number(reportId) === 10 ? (
                            // Report 6, 7, 8, 9 and 10: Year-based reports
                            <>
                              {Number(reportId) === 10 ? (
                                // Report 10: Region + Activity structure
                                <>
                                  <td className="px-3 py-3 font-bpg-nino">
                                    {row.Region}
                                  </td>
                                  <td className="px-3 py-3 font-bpg-nino text-center">
                                    {row.Activity_Code}
                                  </td>
                                  <td className="px-3 py-3 font-bpg-nino">
                                    {row.Activity_Name}
                                  </td>
                                  {/* Year columns: 2012-2023 */}
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => 2012 + i
                                  ).map((year) => (
                                    <td
                                      key={year}
                                      className="px-2 py-3 text-right text-xs"
                                    >
                                      {row[`${year}`] || 0}
                                    </td>
                                  ))}
                                </>
                              ) : (
                                // Reports 6, 7, 8, 9: Standard structure
                                <>
                                  <td className="px-4 py-3 font-bpg-nino">
                                    {Number(reportId) === 8 ||
                                    Number(reportId) === 9
                                      ? row.Activity_Code
                                      : row.ID}
                                  </td>
                                  <td className="px-4 py-3 font-bpg-nino">
                                    {Number(reportId) === 8 ||
                                    Number(reportId) === 9
                                      ? row.Activity_Name
                                      : row.Legal_Form}
                                  </td>
                                  {/* Year columns: <1995, 1995-2024, >2024 */}
                                  <td className="px-2 py-3 text-right text-xs">
                                    {row["<1995"] || 0}
                                  </td>
                                  {Array.from(
                                    { length: 30 },
                                    (_, i) => 1995 + i
                                  ).map((year) => (
                                    <td
                                      key={year}
                                      className="px-2 py-3 text-right text-xs"
                                    >
                                      {row[`${year}`] || 0}
                                    </td>
                                  ))}
                                  <td className="px-2 py-3 text-right text-xs">
                                    {row[">2024"] || 0}
                                  </td>
                                </>
                              )}
                            </>
                          ) : (
                            // Fallback for other reports
                            <>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.ID || row.Location_Code}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino">
                                {row.Location_Name || "N/A"}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Registered_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumberWithLocale(row.Active_Percent)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {/* Total row - only show for Report 2, 3, 4 and 5 */}
                      {(Number(reportId) === 2 ||
                        Number(reportId) === 3 ||
                        Number(reportId) === 4 ||
                        Number(reportId) === 5) && (
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
                            {formatNumberWithLocale(
                              sortedData.reduce(
                                (sum, row) =>
                                  sum + Number(row.Registered_Percent),
                                0
                              )
                            )}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {sortedData.reduce(
                              (sum, row) => sum + Number(row.Active_Qty),
                              0
                            )}
                          </td>
                          <td className="px-4 py-3 font-bpg-nino text-right">
                            {formatNumberWithLocale(
                              sortedData.reduce(
                                (sum, row) => sum + Number(row.Active_Percent),
                                0
                              )
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
            background: "#363636",
            color: "#fff",
            fontFamily: "bpg-nino",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}

export default memo(ReportsResults);
