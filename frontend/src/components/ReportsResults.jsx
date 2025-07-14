import { useState, useEffect, useMemo } from "react";
import "../styles/scrollbar.css";
import { useParams, useNavigate } from "react-router-dom";
import loaderIcon from "../assets/images/equalizer.svg";
import { API } from "../services/api";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import toast, { Toaster } from "react-hot-toast";

// Constants and configurations
const REPORT_CONFIGS = {
  1: {
    apiMethod: 'fetchReport1Data',
    type: 'standard',
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ეკონომიკური საქმიანობის სახეების მიხედვით (NACE Rev. 2)",
      en: "Number of registered and active organizations by economic activity (Nace Rev. 2)"
    },
    fileName: {
      ge: "ეკონომიკური_საქმიანობების_ანგარიში",
      en: "Economic_Activities_Report"
    },
    sheetName: {
      ge: "ეკონომიკური საქმიანობები",
      en: "Economic Activities"
    }
  },
  2: {
    apiMethod: 'fetchReport2Data',
    type: 'standard',
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით",
      en: "Number of registered and active organizations by organizational-legal forms"
    },
    fileName: {
      ge: "სამართლებრივი_ფორმების_ანგარიში",
      en: "Legal_Forms_Report"
    },
    sheetName: {
      ge: "სამართლებრივი ფორმები",
      en: "Legal Forms"
    }
  },
  3: {
    apiMethod: 'fetchReport3Data',
    type: 'standard',
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით",
      en: "Number of registered organizations by forms of ownership"
    },
    fileName: {
      ge: "საკუთრების_ფორმების_ანგარიში",
      en: "Ownership_Types_Report"
    },
    sheetName: {
      ge: "საკუთრების ფორმები",
      en: "Ownership Types"
    }
  },
  4: {
    apiMethod: 'fetchReport4Data',
    type: 'standard',
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა რეგიონების მიხედვით",
      en: "Number of registered and active organizations by regions"
    },
    fileName: {
      ge: "რეგიონების_ანგარიში",
      en: "Regions_Report"
    },
    sheetName: {
      ge: "რეგიონები",
      en: "Regions"
    }
  },
  5: {
    apiMethod: 'fetchReport5Data',
    type: 'standard',
    hasPercentages: true,
    title: {
      ge: "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა მუნიციპალიტეტების მიხედვით",
      en: "Number of registered and active organizations by municipalities"
    },
    fileName: {
      ge: "მუნიციპალიტეტების_ანგარიში",
      en: "Municipalities_Report"
    },
    sheetName: {
      ge: "მუნიციპალიტეტები",
      en: "Municipalities"
    }
  },
  6: {
    apiMethod: 'fetchReport6Data',
    type: 'yearly',
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - ნაზარდი ჯამი",
      en: "Number of registered organizations by organizational-legal forms and years - incremental sum"
    },
    fileName: {
      ge: "ორგანიზაციები_ფორმებით_ნაზარდი",
      en: "Organizations_Forms_Incremental"
    },
    sheetName: {
      ge: "ნაზარდი ჯამი",
      en: "Incremental Sum"
    }
  },
  7: {
    apiMethod: 'fetchReport7Data',
    type: 'yearly',
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - კონკრეტულ წელს რეგისტრირებული",
      en: "Number of registered organizations by organizational-legal forms and years - registered in a specific year"
    },
    fileName: {
      ge: "ორგანიზაციები_ფორმებით_წლიური",
      en: "Organizations_Forms_Yearly"
    },
    sheetName: {
      ge: "წლიური რეგისტრაცია",
      en: "Yearly Registration"
    }
  },
  8: {
    apiMethod: 'fetchReport8Data',
    type: 'yearly',
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - ნაზარდი ჯამი",
      en: "Number of registered organizations by type of economic activity (Nace Rev. 2.) and years - incremental sum"
    },
    fileName: {
      ge: "ორგანიზაციები_საქმიანობით_ნაზარდი",
      en: "Organizations_Activities_Incremental"
    },
    sheetName: {
      ge: "ნაზარდი ჯამი",
      en: "Incremental Sum"
    }
  },
  9: {
    apiMethod: 'fetchReport9Data',
    type: 'yearly',
    hasPercentages: false,
    title: {
      ge: "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - კონკრეტულ წელს რეგისტრირებული",
      en: "Number of registered organizations by type of economic activity (Nace Rev. 2.) and years - registered in a specific year"
    },
    fileName: {
      ge: "ორგანიზაციები_საქმიანობით_წლიური",
      en: "Organizations_Activities_Yearly"
    },
    sheetName: {
      ge: "წლიური რეგისტრაცია",
      en: "Yearly Registration"
    }
  },
  10: {
    apiMethod: 'fetchReport10Data',
    type: 'regional',
    hasPercentages: false,
    title: {
      ge: "საქართველოში რეგისტრირებულ მოქმედ ბიზნეს სუბიექტთა რაოდენობა რეგიონებისა და ეკონომიკური საქმიანობის სახეების მიხედვით (Nace Rev.2)",
      en: "The number of active business entities registered in Georgia according to regions and types of economic activity (Nace Rev.2)"
    },
    fileName: {
      ge: "რეგიონები_საქმიანობები",
      en: "Regions_Activities"
    },
    sheetName: {
      ge: "რეგიონები და საქმიანობები",
      en: "Regions and Activities"
    }
  }
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
    { key: "Legal_Form", ge: "ორგანიზაციულ-სამართლებრივი ფორმა", en: "Legal Status" },
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
    { key: "Legal_Form", ge: "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება", en: "Organizational-Legal Form" },
    // Year columns will be generated dynamically
  ],
  report7: [
    { key: "ID", ge: "კოდი", en: "Code" },
    { key: "Legal_Form", ge: "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება", en: "Organizational-Legal Form" },
    // Year columns will be generated dynamically
  ],
  report8: [
    { key: "Activity_Code", ge: "კოდი", en: "Activity Code" },
    { key: "Activity_Name", ge: "ეკონომიკური საქმიანობის სახე", en: "Economic Activity" },
    // Year columns will be generated dynamically
  ],
  report9: [
    { key: "Activity_Code", ge: "კოდი", en: "Activity Code" },
    { key: "Activity_Name", ge: "ეკონომიკური საქმიანობის სახე", en: "Economic Activity" },
    // Year columns will be generated dynamically
  ],
  report10: [
    { key: "Region", ge: "რეგიონი", en: "Region" },
    { key: "Activity_Code", ge: "საქმიანობის კოდი Nace Rev.2", en: "Activity_Code Nace Rev.2" },
    { key: "Activity_Name", ge: "საქმიანობა Nace Rev.2", en: "Activity Nace Rev.2" },
    // Year columns will be generated dynamically (2012-2023)
  ]
};

// Utility functions
const formatNumber = (num) => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const getReportConfig = (reportId) => REPORT_CONFIGS[Number(reportId)];
const getColumnConfig = (reportId) => COLUMN_CONFIGS[`report${reportId}`];

// Data processing utilities
const calculatePercentages = (dataArray, totalRegisteredKey = 'Registered_Qty', totalActiveKey = 'Active_Qty') => {
  const totalRegistered = dataArray.reduce((sum, row) => sum + Number(row[totalRegisteredKey]), 0);
  const totalActive = dataArray.reduce((sum, row) => sum + Number(row[totalActiveKey]), 0);
  
  return dataArray.map(row => ({
    ...row,
    Registered_Percent: totalRegistered > 0 ? (Number(row[totalRegisteredKey]) / totalRegistered) * 100 : 0,
    Active_Percent: totalActive > 0 ? (Number(row[totalActiveKey]) / totalActive) * 100 : 0,
  }));
};

const sortDataByReportType = (dataArray, reportNum) => {
  switch (reportNum) {
    case 6:
    case 7:
      return [...dataArray].sort((a, b) => String(a.ID || "").localeCompare(String(b.ID || "")));
    
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
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(row.pct)}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(row.pct_act)}%`,
        })),
        totals: {
          registered: sortedData.reduce((sum, row) => sum + Number(row.Registered_Qty), 0),
          active: sortedData.reduce((sum, row) => sum + Number(row.Active_Qty), 0),
          registeredPct: sortedData.reduce((sum, row) => sum + Number(row.pct), 0),
          activePct: sortedData.reduce((sum, row) => sum + Number(row.pct_act), 0),
        }
      };
    
    case 2:
      return {
        data: sortedData.map((row) => ({
          [isEnglish ? "Code" : "კოდი"]: row.ID,
          [isEnglish ? "Legal Status" : "ორგანიზაციულ-სამართლებრივი ფორმა"]: row.Legal_Form,
          [isEnglish ? "Registered" : "რეგისტრირებული"]: row.Registered_Qty,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(row.Registered_Percent)}%`,
          [isEnglish ? "Active" : "აქტიური"]: row.Active_Qty,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(row.Active_Percent)}%`,
        })),
        totals: {
          registered: sortedData.reduce((sum, row) => sum + Number(row.Registered_Qty), 0),
          active: sortedData.reduce((sum, row) => sum + Number(row.Active_Qty), 0),
          registeredPct: sortedData.reduce((sum, row) => sum + Number(row.Registered_Percent), 0),
          activePct: sortedData.reduce((sum, row) => sum + Number(row.Active_Percent), 0),
        }
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
  return {
    title: config.title[isEnglish ? 'en' : 'ge'],
    fileName: `${config.fileName[isEnglish ? 'en' : 'ge']}_${dateStr}.xlsx`,
    sheetName: config.sheetName[isEnglish ? 'en' : 'ge']
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

// Custom hook for sorting functionality
const useSortedData = (reportData) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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

  return { sortedData, sortConfig, handleSort };
};

// Custom hook for scroll functionality
const useScrollToTop = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { showScrollTop, scrollToTop };
};

// Custom hook for fetching report data
const useFetchReportData = (reportId, isEnglish) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const reportNum = Number(reportId);
      if (reportNum < 1 || reportNum > 10) return;

      setLoading(true);
      try {
        const config = getReportConfig(reportId);
        if (!config) return;

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
    };

    fetchData();
  }, [reportId, isEnglish]);

  return { reportData, loading };
};

function ReportsResults({ isEnglish }) {
  const { reportId } = useParams();
  const navigate = useNavigate();

  // Get current report configuration
  const reportConfig = getReportConfig(reportId);
  const columns = getColumnConfig(reportId) || [];
  
  // Use custom hooks
  const { reportData, loading } = useFetchReportData(reportId, isEnglish);
  const { sortedData, sortConfig, handleSort } = useSortedData(reportData);
  const { showScrollTop, scrollToTop } = useScrollToTop();

  // Get title from config
  const getReportTitle = () => {
    if (!reportConfig) return "";
    return `${reportId} - ${reportConfig.title[isEnglish ? 'en' : 'ge']}`;
  };

  const exportToExcel = async () => {
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
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            totalRegisteredPct
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            totalActivePct
          )}%`,
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
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            totalRegisteredPct
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            totalActivePct
          )}%`,
        });

        title = isEnglish
          ? "Number of registered and active organizations by organizational-legal forms"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა ორგანიზაციულ-სამართლებრივი ფორმების მიხედვით";

        fileName = isEnglish
          ? `Legal_Forms_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `სამართლებრივი_ფორმების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish ? "Legal Forms" : "სამართლებრივი ფორმები";
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
          [isEnglish ? "Ownership Type" : "საკუთრების ფორმა"]: isEnglish
            ? "Total"
            : "ჯამი",
          [isEnglish ? "Registered" : "რეგისტრირებული"]: totalRegistered,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            totalRegisteredPct
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            totalActivePct
          )}%`,
        });

        title = isEnglish
          ? "Number of registered organizations by forms of ownership"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა საკუთრების ფორმების მიხედვით";

        fileName = isEnglish
          ? `Ownership_Types_Report_${
              new Date().toISOString().split("T")[0]
            }.xlsx`
          : `საკუთრების_ფორმების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish ? "Ownership Types" : "საკუთრების ფორმები";
      } else if (Number(reportId) === 4) {
        // Report 4: Regions
        excelData = sortedData.map((row) => ({
          [isEnglish ? "Code" : "კოდი"]: row.Location_Code,
          [isEnglish ? "Region" : "რეგიონი"]: row.Location_Name,
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
          [isEnglish ? "Region" : "რეგიონი"]: isEnglish ? "Total" : "ჯამი",
          [isEnglish ? "Registered" : "რეგისტრირებული"]: totalRegistered,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            totalRegisteredPct
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            totalActivePct
          )}%`,
        });

        title = isEnglish
          ? "Number of registered and active organizations by regions"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა რეგიონების მიხედვით";

        fileName = isEnglish
          ? `Regions_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `რეგიონების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish ? "Regions" : "რეგიონები";
      } else if (Number(reportId) === 5) {
        // Report 5: Municipalities
        excelData = sortedData.map((row) => ({
          [isEnglish ? "Code" : "კოდი"]: row.Location_Code,
          [isEnglish ? "Municipality" : "მუნიციპალიტეტი"]: row.Location_Name,
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
          [isEnglish ? "Municipality" : "მუნიციპალიტეტი"]: isEnglish
            ? "Total"
            : "ჯამი",
          [isEnglish ? "Registered" : "რეგისტრირებული"]: totalRegistered,
          [isEnglish ? "Registered %" : "რეგისტრირებული %"]: `${formatNumber(
            totalRegisteredPct
          )}%`,
          [isEnglish ? "Active" : "აქტიური"]: totalActive,
          [isEnglish ? "Active %" : "აქტიური %"]: `${formatNumber(
            totalActivePct
          )}%`,
        });

        title = isEnglish
          ? "Number of registered and active organizations by municipalities"
          : "რეგისტრირებულ და აქტიურ ორგანიზაციათა რაოდენობა მუნიციპალიტეტების მიხედვით";

        fileName = isEnglish
          ? `Municipalities_Report_${
              new Date().toISOString().split("T")[0]
            }.xlsx`
          : `მუნიციპალიტეტების_ანგარიში_${
              new Date().toISOString().split("T")[0]
            }.xlsx`;

        sheetName = isEnglish ? "Municipalities" : "მუნიციპალიტეტები";
      } else if (Number(reportId) === 6) {
        // Report 6: Organizational-Legal Forms and Years
        // Use ExcelJS for advanced styling to match frontend table
        
        const title = isEnglish
          ? "Number of registered organizations by organizational-legal forms and years - incremental sum"
          : "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - ნაზარდი ჯამი";

        const fileName = isEnglish
          ? `Organizational_Legal_Forms_Years_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `ორგანიზაციულ_სამართლებრივი_ფორმები_წლები_ანგარიში_${new Date().toISOString().split("T")[0]}.xlsx`;

        const sheetName = isEnglish
          ? "Legal Forms by Years"
          : "სამართლებრივი ფორმები წლები";

        // Create workbook and worksheet using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
          { width: 8 },   // Code
          { width: 40 },  // Legal Form
          { width: 8 },   // <1995
          ...Array.from({ length: 30 }, () => ({ width: 8 })), // Year columns
          { width: 8 },   // >2024
        ];

        // Add title row
        const titleRow = worksheet.addRow([`Report ${reportId} - ${title}`]);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add date row
        const dateRow = worksheet.addRow([isEnglish ? "Date: 10 July 2025" : "თარიღი: 10 ივლისი 2025"]);
        dateRow.font = { size: 12 };
        dateRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add empty row
        worksheet.addRow([]);

        // Add header row 1 (mimicking the table structure)
        const headerRow1 = worksheet.addRow([
          isEnglish ? "Code" : "კოდი",
          isEnglish ? "Organizational-Legal Form" : "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება",
          isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
          ...Array.from({ length: 30 }, () => ""), // Empty cells for merged header
        ]);

        // Style header row 1
        headerRow1.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0080BE' }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          };
        });

        // Merge cells for header structure
        worksheet.mergeCells('A4:A5'); // Code column (rowspan)
        worksheet.mergeCells('B4:B5'); // Legal Form column (rowspan)
        worksheet.mergeCells('C4:AH4'); // Number of Organizations (colspan)

        // Add header row 2 (year columns)
        const yearHeaders = [
          "", "", // Empty for merged cells above
          "<1995",
          ...Array.from({ length: 30 }, (_, i) => (1995 + i).toString()),
          ">2024"
        ];
        const headerRow2 = worksheet.addRow(yearHeaders);

        // Style header row 2
        headerRow2.eachCell((cell, colNumber) => {
          if (colNumber > 2) { // Skip merged cells
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0080BE' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            };
          }
        });

        // Add data rows
        sortedData.forEach((row) => {
          const dataRowValues = [
            row.ID,
            row.Legal_Form,
            row["<1995"] || 0,
            ...Array.from({ length: 30 }, (_, i) => row[(1995 + i).toString()] || 0),
            row[">2024"] || 0
          ];
          
          const dataRow = worksheet.addRow(dataRowValues);
          
          // Style data row
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = { 
              horizontal: colNumber <= 2 ? 'left' : 'right', 
              vertical: 'middle' 
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });

        // Save the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        // Show success message and return early for report 6
        toast.success(
          isEnglish
            ? "Excel file exported successfully!"
            : "Excel ფაილი წარმატებით ექსპორტირებულია!"
        );
        return;
      } else if (Number(reportId) === 7) {
        // Report 7: Organizational-Legal Forms and Years (similar to report 6)
        // Use ExcelJS for advanced styling to match frontend table
        
        const title = isEnglish
          ? "Number of registered organizations by organizational-legal forms and years - registered in a specific year"
          : "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ორგანიზაციულ-სამართლებრივი ფორმების ჭრილში - კონკრეტულ წელს რეგისტრირებული";

        const fileName = isEnglish
          ? `Report_7_Legal_Forms_Specific_Year_${new Date().toISOString().split("T")[0]}.xlsx`
          : `ანგარიში_7_სამართლებრივი_ფორმები_კონკრეტული_წელი_${new Date().toISOString().split("T")[0]}.xlsx`;

        const sheetName = isEnglish
          ? "Legal Forms Specific Year"
          : "სამართლებრივი ფორმები კონკრეტული წელი";

        // Create workbook and worksheet using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
          { width: 8 },   // Code
          { width: 40 },  // Legal Form
          { width: 8 },   // <1995
          ...Array.from({ length: 30 }, () => ({ width: 8 })), // Year columns
          { width: 8 },   // >2024
        ];

        // Add title row
        const titleRow = worksheet.addRow([`Report ${reportId} - ${title}`]);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add date row
        const dateRow = worksheet.addRow([isEnglish ? "Date: 10 July 2025" : "თარიღი: 10 ივლისი 2025"]);
        dateRow.font = { size: 12 };
        dateRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add empty row
        worksheet.addRow([]);

        // Add header row 1 (mimicking the table structure)
        const headerRow1 = worksheet.addRow([
          isEnglish ? "Code" : "კოდი",
          isEnglish ? "Organizational-Legal Form" : "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება",
          isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
          ...Array.from({ length: 30 }, () => ""), // Empty cells for merged header
        ]);

        // Style header row 1
        headerRow1.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0080BE' }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          };
        });

        // Merge cells for header structure
        worksheet.mergeCells('A4:A5'); // Code column (rowspan)
        worksheet.mergeCells('B4:B5'); // Legal Form column (rowspan)
        worksheet.mergeCells('C4:AH4'); // Number of Organizations (colspan)

        // Add header row 2 (year columns)
        const yearHeaders = [
          "", "", // Empty for merged cells above
          "<1995",
          ...Array.from({ length: 30 }, (_, i) => (1995 + i).toString()),
          ">2024"
        ];
        const headerRow2 = worksheet.addRow(yearHeaders);

        // Style header row 2
        headerRow2.eachCell((cell, colNumber) => {
          if (colNumber > 2) { // Skip merged cells
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0080BE' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            };
          }
        });

        // Add data rows
        sortedData.forEach((row) => {
          const dataRowValues = [
            row.ID,
            row.Legal_Form,
            row["<1995"] || 0,
            ...Array.from({ length: 30 }, (_, i) => row[(1995 + i).toString()] || 0),
            row[">2024"] || 0
          ];
          
          const dataRow = worksheet.addRow(dataRowValues);
          
          // Style data row
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = { 
              horizontal: colNumber <= 2 ? 'left' : 'right', 
              vertical: 'middle' 
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });

        // Save the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        // Show success message and return early for report 7
        toast.success(
          isEnglish
            ? "Excel file exported successfully!"
            : "Excel ფაილი წარმატებით ექსპორტირებულია!"
        );
        return;
      } else if (Number(reportId) === 8) {
        // Report 8: Economic Activities by Years
        // Use ExcelJS for advanced styling to match frontend table
        
        const title = isEnglish
          ? "Number of registered organizations by type of economic activity (Nace Rev. 2.) and years - incremental sum"
          : "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - ნაზარდი ჯამი";

        const fileName = isEnglish
          ? `Report_8_Economic_Activities_Years_${new Date().toISOString().split("T")[0]}.xlsx`
          : `ანგარიში_8_ეკონომიკური_საქმიანობები_წლები_${new Date().toISOString().split("T")[0]}.xlsx`;

        const sheetName = isEnglish
          ? "Economic Activities by Years"
          : "ეკონომიკური საქმიანობები წლები";

        // Create workbook and worksheet using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
          { width: 12 },   // Activity Code
          { width: 50 },   // Activity Name
          { width: 8 },    // <1995
          ...Array.from({ length: 30 }, () => ({ width: 8 })), // Year columns
          { width: 8 },    // >2024
        ];

        // Add title row
        const titleRow = worksheet.addRow([`Report ${reportId} - ${title}`]);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add date row
        const dateRow = worksheet.addRow([isEnglish ? "Date: 11 July 2025" : "თარიღი: 11 ივლისი 2025"]);
        dateRow.font = { size: 12 };
        dateRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add empty row
        worksheet.addRow([]);

        // Add header row 1 (mimicking the table structure)
        const headerRow1 = worksheet.addRow([
          isEnglish ? "Activity Code" : "კოდი",
          isEnglish ? "Economic Activity" : "ეკონომიკური საქმიანობის სახე",
          isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
          ...Array.from({ length: 30 }, () => ""), // Empty cells for merged header
        ]);

        // Style header row 1
        headerRow1.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0080BE' }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          };
        });

        // Merge cells for header structure
        worksheet.mergeCells('A4:A5'); // Activity Code column (rowspan)
        worksheet.mergeCells('B4:B5'); // Activity Name column (rowspan)
        worksheet.mergeCells('C4:AH4'); // Number of Organizations (colspan)

        // Add header row 2 (year columns)
        const yearHeaders = [
          "", "", // Empty for merged cells above
          "<1995",
          ...Array.from({ length: 30 }, (_, i) => (1995 + i).toString()),
          ">2024"
        ];
        const headerRow2 = worksheet.addRow(yearHeaders);

        // Style header row 2
        headerRow2.eachCell((cell, colNumber) => {
          if (colNumber > 2) { // Skip merged cells
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0080BE' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            };
          }
        });

        // Add data rows
        sortedData.forEach((row) => {
          const dataRowValues = [
            row.Activity_Code,
            row.Activity_Name,
            row["<1995"] || 0,
            ...Array.from({ length: 30 }, (_, i) => row[(1995 + i).toString()] || 0),
            row[">2024"] || 0
          ];
          
          const dataRow = worksheet.addRow(dataRowValues);
          
          // Style data row
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = { 
              horizontal: colNumber <= 2 ? 'left' : 'right', 
              vertical: 'middle' 
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });

        // Save the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        // Show success message and return early for report 8
        toast.success(
          isEnglish
            ? "Excel file exported successfully!"
            : "Excel ფაილი წარმატებით ექსპორტირებულია!"
        );
        return;
      } else if (Number(reportId) === 9) {
        // Report 9: Economic Activities and Years (similar to report 8)
        // Use ExcelJS for advanced styling to match frontend table
        
        const title = isEnglish
          ? "Number of registered organizations by type of economic activity (Nace Rev. 2.) and years - registered in a specific year"
          : "რეგისტრირებულ ორგანიზაციათა რაოდენობა წლების მიხედვით ეკონომიკური საქმიანობის სახეების ჭრილში (Nace Rev.2) - კონკრეტულ წელს რეგისტრირებული";

        const fileName = isEnglish
          ? `Economic_Activities_Years_Specific_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `ეკონომიკური_საქმიანობები_წლები_კონკრეტული_ანგარიში_${new Date().toISOString().split("T")[0]}.xlsx`;

        const sheetName = isEnglish
          ? "Economic Activities by Years"
          : "ეკონომიკური საქმიანობები წლები";

        // Create workbook and worksheet using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
          { width: 12 },  // Activity Code
          { width: 50 },  // Activity Name
          { width: 8 },   // <1995
          ...Array.from({ length: 30 }, () => ({ width: 8 })), // Year columns
          { width: 8 },   // >2024
        ];

        // Add title row
        const titleRow = worksheet.addRow([`Report ${reportId} - ${title}`]);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add date row
        const dateRow = worksheet.addRow([isEnglish ? "Date: 11 July 2025" : "თარიღი: 11 ივლისი 2025"]);
        dateRow.font = { size: 12 };
        dateRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add empty row
        worksheet.addRow([]);

        // Add header row 1 (mimicking the table structure)
        const headerRow1 = worksheet.addRow([
          isEnglish ? "Activity Code" : "კოდი",
          isEnglish ? "Economic Activity" : "ეკონომიკური საქმიანობის სახე",
          isEnglish ? "Number of Organizations" : "ორგანიზაციათა რაოდენობა",
          ...Array.from({ length: 30 }, () => ""), // Empty cells for merged header
        ]);

        // Style header row 1
        headerRow1.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0080BE' }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          };
        });

        // Merge cells for header structure
        worksheet.mergeCells('A4:A5'); // Activity Code column (rowspan)
        worksheet.mergeCells('B4:B5'); // Activity Name column (rowspan)
        worksheet.mergeCells('C4:AH4'); // Number of Organizations (colspan)

        // Add header row 2 (year columns)
        const yearHeaders = [
          "", "", // Empty for merged cells above
          "<1995",
          ...Array.from({ length: 30 }, (_, i) => (1995 + i).toString()),
          ">2024"
        ];
        const headerRow2 = worksheet.addRow(yearHeaders);

        // Style header row 2
        headerRow2.eachCell((cell, colNumber) => {
          if (colNumber > 2) { // Skip merged cells
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0080BE' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            };
          }
        });

        // Add data rows
        sortedData.forEach((row) => {
          const dataRowValues = [
            row.Activity_Code,
            row.Activity_Name,
            row["<1995"] || 0,
            ...Array.from({ length: 30 }, (_, i) => row[(1995 + i).toString()] || 0),
            row[">2024"] || 0
          ];
          
          const dataRow = worksheet.addRow(dataRowValues);
          
          // Style data row
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = { 
              horizontal: colNumber <= 2 ? 'left' : 'right', 
              vertical: 'middle' 
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });

        // Save the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        // Show success message and return early for report 9
        toast.success(
          isEnglish
            ? "Excel file exported successfully!"
            : "Excel ფაილი წარმატებით ექსპორტირებულია!"
        );
        return;
      } else if (Number(reportId) === 10) {
        // Report 10: Regions and Economic Activities (2012-2023)
        // Use ExcelJS for advanced styling to match frontend table
        
        const title = isEnglish
          ? "The number of active business entities registered in Georgia according to regions and types of economic activity (Nace Rev.2)"
          : "საქართველოში რეგისტრირებულ მოქმედ ბიზნეს სუბიექტთა რაოდენობა რეგიონებისა და ეკონომიკური საქმიანობის სახეების მიხედვით (Nace Rev.2)";

        const fileName = isEnglish
          ? `Regions_Activities_Report_${new Date().toISOString().split("T")[0]}.xlsx`
          : `რეგიონები_საქმიანობები_ანგარიში_${new Date().toISOString().split("T")[0]}.xlsx`;

        const sheetName = isEnglish
          ? "Regions and Activities"
          : "რეგიონები და საქმიანობები";

        // Create workbook and worksheet using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Set column widths
        worksheet.columns = [
          { width: 10 },  // Region Code
          { width: 20 },  // Region
          { width: 12 },  // Activity Code
          { width: 40 },  // Activity Name
          ...Array.from({ length: 12 }, () => ({ width: 8 })), // Year columns (2012-2023)
        ];

        // Add title row
        const titleRow = worksheet.addRow([`Report ${reportId} - ${title}`]);
        titleRow.font = { bold: true, size: 14 };
        titleRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add date row
        const dateRow = worksheet.addRow([isEnglish ? "Date: 11 July 2025" : "თარიღი: 11 ივლისი 2025"]);
        dateRow.font = { size: 12 };
        dateRow.alignment = { horizontal: 'left', vertical: 'middle' };

        // Add empty row
        worksheet.addRow([]);

        // Add header row 1 (mimicking the table structure)
        const headerRow1 = worksheet.addRow([
          isEnglish ? "Region" : "რეგიონი",
          isEnglish ? "Activity_Code Nace Rev.2" : "საქმიანობის კოდი Nace Rev.2",
          isEnglish ? "Activity Nace Rev.2" : "საქმიანობა Nace Rev.2",
          isEnglish ? "Number of Active Business Entities" : "მოქმედ ბიზნეს სუბიექტთა რაოდენობა",
          ...Array.from({ length: 11 }, () => ""), // Empty cells for merged header
        ]);

        // Style header row 1
        headerRow1.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0080BE' }
          };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          };
        });

        // Merge cells for header structure
        worksheet.mergeCells('A4:A5'); // Region column (rowspan)
        worksheet.mergeCells('B4:B5'); // Activity Code column (rowspan)
        worksheet.mergeCells('C4:C5'); // Activity Name column (rowspan)
        worksheet.mergeCells('D4:O4'); // Number of Active Business Entities (colspan)

        // Add header row 2 (year columns)
        const yearHeaders = [
          "", "", "", // Empty for merged cells above (Region, Activity Code, Activity Name)
          ...Array.from({ length: 12 }, (_, i) => (2012 + i).toString())
        ];
        const headerRow2 = worksheet.addRow(yearHeaders);

        // Style header row 2
        headerRow2.eachCell((cell, colNumber) => {
          if (colNumber > 3) { // Skip merged cells (Region, Activity Code, Activity Name)
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0080BE' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
              right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            };
          }
        });

        // Add data rows
        sortedData.forEach((row) => {
          const dataRowValues = [
            row.Region,
            row.Activity_Code,
            row.Activity_Name,
            ...Array.from({ length: 12 }, (_, i) => row[(2012 + i).toString()] || 0)
          ];
          
          const dataRow = worksheet.addRow(dataRowValues);
          
          // Style data row
          dataRow.eachCell((cell, colNumber) => {
            cell.alignment = { 
              horizontal: colNumber <= 3 ? 'left' : 'right', 
              vertical: 'middle' 
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
              right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
          });
        });

        // Save the file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        // Show success message and return early for report 10
        toast.success(
          isEnglish
            ? "Excel file exported successfully!"
            : "Excel ფაილი წარმატებით ექსპორტირებულია!"
        );
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      let colWidths;
      if (Number(reportId) === 6) {
        // Report 6 has many year columns
        colWidths = [
          { wch: 8 }, // Code
          { wch: 40 }, // Legal Form
          { wch: 8 }, // <1995
          ...Array.from({ length: 30 }, () => ({ wch: 8 })), // Year columns
          { wch: 8 }, // >2024
        ];
      } else if (Number(reportId) === 7) {
        // Report 7 has similar structure to report 6
        colWidths = [
          { wch: 8 }, // Code
          { wch: 40 }, // Legal Form
          { wch: 8 }, // <1995
          ...Array.from({ length: 30 }, () => ({ wch: 8 })), // Year columns
          { wch: 8 }, // >2024
        ];
      } else if (Number(reportId) === 8) {
        // Report 8 has similar structure to report 6 but with activity codes
        colWidths = [
          { wch: 12 }, // Activity Code
          { wch: 50 }, // Activity Name
          { wch: 8 }, // <1995
          ...Array.from({ length: 30 }, () => ({ wch: 8 })), // Year columns
          { wch: 8 }, // >2024
        ];
      } else if (Number(reportId) === 9) {
        // Report 9 has similar structure to report 8
        colWidths = [
          { wch: 12 }, // Activity Code
          { wch: 50 }, // Activity Name
          { wch: 8 }, // <1995
          ...Array.from({ length: 30 }, () => ({ wch: 8 })), // Year columns
          { wch: 8 }, // >2024
        ];
      } else if (Number(reportId) === 10) {
        // Report 10 has region and activity structure with 2012-2023 years
        colWidths = [
          { wch: 10 }, // Region Code
          { wch: 20 }, // Region
          { wch: 12 }, // Activity Code
          { wch: 40 }, // Activity Name
          ...Array.from({ length: 12 }, () => ({ wch: 8 })), // Year columns (2012-2023)
        ];
      } else {
        colWidths = [
          { wch: Number(reportId) === 1 ? 15 : 8 }, // Code/Activity Code
          { wch: 40 }, // Name/Legal Status
          { wch: 15 }, // Registered
          { wch: 15 }, // Registered %
          { wch: 15 }, // Active
          { wch: 15 }, // Active %
        ];
      }
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

      // Note: Standard xlsx library has limited styling support
      // For advanced styling, consider using a different library or server-side generation

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
              {getReportTitle()}
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
                    {Number(reportId) === 6 || Number(reportId) === 7 || Number(reportId) === 8 || Number(reportId) === 9 || Number(reportId) === 10 ? (
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
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
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
                                  {isEnglish ? "Activity_Code Nace Rev.2" : "საქმიანობის კოდი Nace Rev.2"}
                                  {sortConfig.key === "Activity_Code" && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
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
                                  {isEnglish ? "Activity_Name Nace Rev.2" : "საქმიანობა Nace Rev.2"}
                                  {sortConfig.key === "Activity_Name" && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
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
                              {Array.from({ length: 12 }, (_, i) => 2012 + i).map(
                                (year) => (
                                  <th
                                    key={year}
                                    className="px-2 py-2 font-bpg-nino text-center text-xs"
                                  >
                                    {year}
                                  </th>
                                )
                              )}
                            </tr>
                          </>
                        ) : (
                          // Standard header for Reports 6, 7, 8, 9
                          <>
                            <tr>
                              <th
                                rowSpan="2"
                                className="px-4 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() => handleSort(Number(reportId) === 8 || Number(reportId) === 9 ? "Activity_Code" : "ID")}
                              >
                                <div className="flex items-center justify-center">
                                  {isEnglish ? "Code" : "კოდი"}
                                  {sortConfig.key === (Number(reportId) === 8 || Number(reportId) === 9 ? "Activity_Code" : "ID") && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th
                                rowSpan="2"
                                className="px-4 py-3 font-bpg-nino text-center cursor-pointer hover:bg-[#0070aa] transition-colors"
                                onClick={() => handleSort(Number(reportId) === 8 || Number(reportId) === 9 ? "Activity_Name" : "Legal_Form")}
                              >
                                <div className="flex items-center justify-center">
                                  {Number(reportId) === 8 || Number(reportId) === 9
                                    ? (isEnglish ? "Economic Activity" : "ეკონომიკური საქმიანობის სახე")
                                    : (isEnglish ? "Organizational-Legal Form" : "ორგანიზაციულ-სამართლებრივი ფორმის დასახელება")
                                  }
                                  {sortConfig.key === (Number(reportId) === 8 || Number(reportId) === 9 ? "Activity_Name" : "Legal_Form") && (
                                    <span className="ml-1">
                                      {sortConfig.direction === "asc" ? "↑" : "↓"}
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
                              {Array.from({ length: 30 }, (_, i) => 1995 + i).map(
                                (year) => (
                                  <th
                                    key={year}
                                    className="px-2 py-2 font-bpg-nino text-center text-xs"
                                  >
                                    {year}
                                  </th>
                                )
                              )}
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
                            Number(reportId) === 1 || Number(reportId) === 8 || Number(reportId) === 9
                              ? row.Activity_Code || index
                              : Number(reportId) === 10
                              ? (row.Region && row.Activity_Code ? `${row.Region}-${row.Activity_Code}` : index)
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
                                {formatNumber(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.Active_Percent)}
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
                                {formatNumber(row.Registered_Percent)}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {row.Active_Qty}
                              </td>
                              <td className="px-4 py-3 font-bpg-nino text-right">
                                {formatNumber(row.Active_Percent)}
                              </td>
                            </>
                          ) : Number(reportId) === 6 || Number(reportId) === 7 || Number(reportId) === 8 || Number(reportId) === 9 || Number(reportId) === 10 ? (
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
                                    {Number(reportId) === 8 || Number(reportId) === 9 ? row.Activity_Code : row.ID}
                                  </td>
                                  <td className="px-4 py-3 font-bpg-nino">
                                    {Number(reportId) === 8 || Number(reportId) === 9 ? row.Activity_Name : row.Legal_Form}
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
                            {formatNumber(
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
                            {formatNumber(
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

export default ReportsResults;
