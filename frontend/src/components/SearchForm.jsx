import "../styles/SearchForm.scss";
import React, { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { translations } from "../translations/searchForm";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { ActiveFilterCheckbox } from "./common/ActiveFilterCheckbox";
import { useSearchForm } from "../hooks/useSearchForm";
import { AddressSection } from "./AddressSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { EconomicActivitySection } from "./EconomicActivitySection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { FormActions } from "./FormActions";
import SearchResults from "./SearchResults";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getPageTitle } from "../utils/pageTitles";
import { useNavigation } from "../hooks/useNavigation";
import { fetchLegalFormsRaw, fetchDocuments, fetchExportStream } from "../services/api";
import georgianFont from "../fonts/NotoSansGeorgian_ExtraCondensed-Bold.ttf";
import loaderIcon from "../assets/images/equalizer.svg";
import SEO from "./SEO";

function SearchForm({ isEnglish }) {
  // Set page-specific title
  useDocumentTitle(isEnglish, getPageTitle("home", isEnglish));

  const t = translations[isEnglish ? "en" : "ge"];
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isStopped, setIsStopped] = useState(false);
  const [legalFormsMap, setLegalFormsMap] = useState({});
  const [lastSearchParams, setLastSearchParams] = useState(null); // Store last successful search params
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(''); // 'excel' or 'access'
  const { navigationDirection, isNavigating } = useNavigation();
  const {
    formData,
    setFormData,
    organizationalLegalFormOptions,
    regionOptions,
    personalMunicipalityOptions,
    legalMunicipalityOptions,
    handleInputChange,
    handleReset,
    handleSubmit,
  } = useSearchForm(isEnglish);

  // Fetch legal forms for mapping
  useEffect(() => {
    const loadLegalForms = async () => {
      try {
        const legalForms = await fetchLegalFormsRaw();
        const formsMap = {};
        
        // Ensure legalForms is an array before calling forEach
        if (Array.isArray(legalForms)) {
          legalForms.forEach((form) => {
            formsMap[form.Legal_Form_ID] = form.Legal_Form;
          });
        } else {
          console.error('Legal forms data is not an array:', legalForms);
        }
        
        setLegalFormsMap(formsMap);
      } catch (error) {
        console.error("Error loading legal forms:", error);
      }
    };

    loadLegalForms();
  }, []);

  useEffect(() => {
    // Reset flip state when navigating
    if (isNavigating) {
      setIsFlipped(false);
    }

    // Trigger flip animation
    const timer = setTimeout(
      () => {
        setIsFlipped(true);
      },
      isNavigating ? 200 : 100
    );

    return () => clearTimeout(timer);
  }, [isNavigating]);

  // Check for URL parameters on component mount and auto-search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const identificationNumber = urlParams.get("identificationNumber");

    if (identificationNumber) {
      // Set the form data with the URL parameter and ensure activities is an array
      setFormData((prev) => ({
        ...prev,
        identificationNumber: identificationNumber,
        activities: Array.isArray(prev.activities) ? prev.activities : [{
          code: "",
          name: ""
        }],
      }));
    }
  }, []); // Run only on mount

  // Auto-search when formData is updated from URL parameters
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const identificationNumber = urlParams.get("identificationNumber");

  if (
    identificationNumber &&
    formData.identificationNumber === identificationNumber &&
    !showResults
  ) {
    const controller = new AbortController();
    setAbortController(controller);

    const autoSearch = async () => {
      // Reset states same as normal submit
      setIsStopped(false);
      setShowResults(false);
      setSearchResults([]);
      setPagination(null);
      setIsLoading(true);

      try {
        const response = await handleSubmit(controller.signal);

        if (response && !controller.signal.aborted) {
          setSearchResults(response.results || []);
          setPagination(response.pagination || null);
          setLastSearchParams(formData);
          setShowResults(true);

          if (!response.results || response.results.length === 0) {
            alert(isEnglish ? "No results found." : "შედეგები არ მოიძებნა.");
          }
        }
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Auto-search was cancelled");
        } else {
          console.error("Error fetching results from URL:", error);
          alert(
            isEnglish
              ? "An error occurred. Please try again."
              : "დაფიქსირდა შეცდომა. სცადეთ ხელახლა."
          );
        }
      } finally {
        setIsLoading(false);
        setAbortController(null);
      }
    };

    autoSearch();

    // Cleanup if user navigates away fast / component unmounts
    return () => controller.abort();
  }
}, [formData.identificationNumber, showResults, isEnglish]); // keep deps minimal


  const handleBackToSearch = () => {
    setShowResults(false);
    setSearchResults([]);
    setPagination(null);

    // Clear URL parameters when going back to search
    const url = new URL(window.location);
    url.searchParams.delete("identificationNumber");
    window.history.replaceState({}, "", url.toString());
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Reset states
    setIsStopped(false);
    setShowResults(false);
    setSearchResults([]);
    setPagination(null);
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // We wrap this in a try/catch to catch any unexpected logic errors
      const response = await handleSubmit(controller.signal);

      // If we have a response and it wasn't aborted
      if (response && !controller.signal?.aborted) {
        setSearchResults(response.results || []);
        setPagination(response.pagination);
        setLastSearchParams(formData);
        setShowResults(true);

        if (!response.results || response.results.length === 0) {
          alert(isEnglish ? "No results found." : "შედეგები არ მოიძებნა.");
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Search was cancelled");
      } else {
        console.error("Critical Search Error:", error);
        alert(isEnglish ? "An error occurred. Please try again." : "დაფიქსირდა შეცდომა. სცადეთ ხელახლა.");
      }
    } finally {
      // THIS IS THE KEY: This always runs regardless of success or crash
      setIsLoading(false); 
      setAbortController(null);
    }
};

  const handleStopSearch = () => {
    console.log("Stop search called - setting isStopped to true");
    // Set flag to indicate search was intentionally stopped
    setIsStopped(true);

    if (abortController) {
      console.log("Aborting current request");
      abortController.abort();
      setAbortController(null);
    }

    // Use setTimeout to ensure state updates are processed correctly
    setTimeout(() => {
      console.log("Stop search cleanup - resetting states");
      // Reset all states immediately to ensure proper navigation
      setIsLoading(false);
      setIsExporting(false);
      setExportProgress(0);
      setExportType('');
      setShowResults(false);
      setSearchResults([]);
      setPagination(null);

      // Clear URL parameters
      const url = new URL(window.location);
      url.searchParams.delete("identificationNumber");
      window.history.replaceState({}, "", url.toString());
    }, 0);
  };

  // Recovery function to reset all states when component gets stuck
  const resetAllStates = () => {
    console.log("Resetting all states - manual recovery");
    setIsLoading(false);
    setIsExporting(false);
    setExportProgress(0);
    setExportType('');
    setShowResults(false);
    setSearchResults([]);
    setPagination(null);
    setIsStopped(false);
    setIsFlipped(false);
    
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.searchParams.delete("identificationNumber");
    window.history.replaceState({}, "", url.toString());
  };

  const exportToExcel = async () => {
  try {
    if (!pagination?.total || !lastSearchParams) {
      alert(isEnglish ? "No data to export" : "ექსპორტისთვის მონაცემები არ არის");
      return;
    }

    const totalRecords = pagination.total;
    const XLSX_LIMIT = 200000; // Below this: use .xlsx; above: use streaming CSV+ZIP
    const CHUNK_SIZE = 50000;
    const CONCURRENCY = 5;
    
    setIsLoading(true);
    setIsExporting(true);
    setExportType('excel');
    setExportProgress(0);

    // Shared headers definition
    const headers = [
      { label: "identificationNumber", path: "identificationNumber" },
      { label: "personalNumber", path: "personalNumber" },
      { label: "organizationalLegalForm", path: "legalFormId" },
      { label: "organizationName", path: "name" },
      { label: "legalRegion", path: "legalAddress.region" },
      { label: "legalCity", path: "legalAddress.city" },
      { label: "legalAddress", path: "legalAddress.address" },
      { label: "factualRegion", path: "factualAddress.region" },
      { label: "factualCity", path: "factualAddress.city" },
      { label: "factualAddress", path: "factualAddress.address" },
      { label: "activityCode", path: "activities[0].code" },
      { label: "activityDescription", path: "activities[0].name" },
      { label: "head", path: "head" },
      { label: "partner", path: "partner" },
      { label: "phone", path: "phone" },
      { label: "email", path: "email" },
      { label: "web", path: "web" },
      { label: "ownershipForm", path: "ownershipType" },
      { label: "activeSubject", path: "isActive" },
      { label: "businessSize", path: "Zoma" },
      { label: "initRegDate", path: "Init_Reg_date" },
    ];
    const headerLabels = headers.map(h => t[h.label] || h.label);

    // ─── LARGE EXPORT: Server-side streaming CSV → ZIP ───
    // Uses a dedicated backend endpoint that streams all rows in a SINGLE
    // SQL query (no OFFSET pagination). This is 5-10x faster than the
    // paginated approach because there's no repeated scanning of skipped rows.
    if (totalRecords > XLSX_LIMIT) {
      console.log(`Large export (${totalRecords} records) — using streaming CSV+ZIP`);
      
      const controller = new AbortController();
      setAbortController(controller);
      
      // Start the streaming fetch (single HTTP request, server streams CSV)
      const { body, totalCount } = await fetchExportStream(lastSearchParams, controller.signal);
      
      if (!body) throw new Error('No response body from export stream');
      
      const reader = body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      const zip = new JSZip();
      const MAX_ROWS_PER_CSV = 500000;
      
      // We'll collect CSV text in chunks and split into files for the ZIP
      let csvParts = [];
      let currentFileRowCount = 0;
      let csvFileIndex = 1;
      let totalRowsReceived = 0;
      let isFirstChunk = true;
      let leftover = ''; // Partial line from previous chunk
      const totalForProgress = totalCount || totalRecords;
      
      // Read the stream in chunks
      while (true) {
        if (isStopped) {
          reader.cancel();
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the binary chunk to text
        const text = leftover + decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        
        // Last element might be incomplete — save for next chunk
        leftover = lines.pop() || '';
        
        if (isFirstChunk && lines.length > 0) {
          // First line is the server's CSV header — replace with translated headers
          lines.shift(); // Remove server header (raw column names)
          // Also skip BOM if present in first line
          const translatedHeader = headerLabels.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
          csvParts.push('\ufeff' + translatedHeader); // Add BOM + translated header
          isFirstChunk = false;
        }
        
        // Filter out empty lines and add to current CSV
        const dataLines = lines.filter(l => l.trim().length > 0);
        if (dataLines.length > 0) {
          csvParts.push(dataLines.join('\n'));
          currentFileRowCount += dataLines.length;
          totalRowsReceived += dataLines.length;
        }
        
        // If current CSV file has enough rows, flush to ZIP
        if (currentFileRowCount >= MAX_ROWS_PER_CSV) {
          const totalFiles = Math.ceil(totalForProgress / MAX_ROWS_PER_CSV);
          const fileName = totalFiles > 1
            ? `business_registry_part${csvFileIndex}.csv`
            : `business_registry.csv`;
          zip.file(fileName, csvParts.join('\n') + '\n');
          console.log(`Added ${fileName} to ZIP (${currentFileRowCount} rows)`);
          
          csvFileIndex++;
          const translatedHeader = headerLabels.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
          csvParts = ['\ufeff' + translatedHeader]; // Reset with BOM + header
          currentFileRowCount = 0;
        }
        
        // Update progress based on rows received
        const progressPercent = Math.min(90, Math.round((totalRowsReceived / totalForProgress) * 90));
        flushSync(() => {
          setExportProgress(progressPercent);
        });
      }
      
      if (isStopped) return;
      
      // Handle any remaining partial line
      if (leftover.trim().length > 0) {
        csvParts.push(leftover);
        currentFileRowCount++;
        totalRowsReceived++;
      }
      
      // Flush remaining rows to ZIP
      if (currentFileRowCount > 0) {
        const totalFiles = Math.ceil(totalForProgress / MAX_ROWS_PER_CSV);
        const fileName = totalFiles > 1
          ? `business_registry_part${csvFileIndex}.csv`
          : `business_registry.csv`;
        zip.file(fileName, csvParts.join('\n') + '\n');
        console.log(`Added ${fileName} to ZIP (${currentFileRowCount} rows)`);
      }
      
      console.log(`Stream complete: ${totalRowsReceived} rows received. Generating ZIP...`);
      flushSync(() => {
        setExportProgress(92);
      });
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 3 }, // Fast compression — still reduces size ~60%
      }, (metadata) => {
        const zipProgress = 92 + Math.round(metadata.percent * 0.08);
        flushSync(() => {
          setExportProgress(zipProgress);
        });
      });
      
      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `business_registry_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`ZIP export complete: ${totalRowsReceived} rows in ${csvFileIndex} file(s)`);

    } else {
      // ─── SMALL EXPORT: Standard XLSX (≤200K records) ───
      console.log(`Standard export (${totalRecords} records) — using XLSX`);

      const getters = headers.map(header => {
        const pathParts = header.path.split(/[.[\]]/).filter(Boolean);
        return {
          getter: row => {
            let val = row;
            for (const key of pathParts) {
              val = val?.[key];
              if (val === undefined) break;
            }
            return val;
          },
          path: header.path
        };
      });

      const formatField = (val, headerPath, row) => {
        if (headerPath === "legalFormId") return legalFormsMap[val] || row?.abbreviation || "";
        if (headerPath === "isActive") return val ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
        if (headerPath === "Init_Reg_date" && val) {
          try { return new Date(val).toISOString().split('T')[0]; } catch { return String(val || ""); }
        }
        return val !== undefined && val !== null ? String(val) : "";
      };

      const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
      let allResults = [];
      let fetchErrors = 0;

      for (let i = 0; i < totalChunks; i += CONCURRENCY) {
        if (isStopped) break;
        const batch = Array.from(
          { length: Math.min(CONCURRENCY, totalChunks - i) },
          (_, j) => i + j + 1
        );
        const responses = await Promise.all(
          batch.map(async page => {
            try {
              return await fetchDocuments(lastSearchParams, isEnglish ? "en" : "ge", [], null, { page, limit: CHUNK_SIZE });
            } catch (error) {
              console.error(`Error fetching page ${page}:`, error);
              fetchErrors++;
              return { results: [] };
            }
          })
        );
        responses.forEach(response => {
          if (response?.results?.length) allResults.push(...response.results);
        });
        const pagesCompleted = Math.min(i + CONCURRENCY, totalChunks);
        flushSync(() => { setExportProgress(Math.round((pagesCompleted / totalChunks) * 80)); });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (isStopped) return;
      if (fetchErrors > 0 && allResults.length === 0) throw new Error(`All ${fetchErrors} fetch requests failed`);

      console.log(`Building Excel workbook with ${allResults.length} rows...`);
      flushSync(() => { setExportProgress(85); });

      const wsData = new Array(allResults.length + 1);
      wsData[0] = headerLabels;
      for (let i = 0; i < allResults.length; i++) {
        const row = allResults[i];
        wsData[i + 1] = getters.map(({ getter, path }) => formatField(getter(row), path, row));
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData, { dense: true });
      ws['!cols'] = headerLabels.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "Business Registry");

      flushSync(() => { setExportProgress(95); });

      XLSX.writeFile(wb, `business_registry_${new Date().toISOString().split('T')[0]}.xlsx`, {
        bookType: 'xlsx',
        cellStyles: false,
      });

      console.log(`XLSX export complete: ${allResults.length} records`);
    }

  } catch (error) {
    console.error("Export Error:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    
    let errorMessage;
    if (error.name === "AbortError") {
      errorMessage = isEnglish ? "Export was cancelled" : "ექსპორტი გაუქმდა";
    } else if (error.message?.includes("memory") || error.message?.includes("heap") || error.message?.includes("RangeError")) {
      errorMessage = isEnglish 
        ? "Export failed due to memory limitations. Try exporting fewer records."
        : "ექსპორტი ვერ მოხერხდა მეხსიერების შეზღუდვის გამო. სცადეთ ნაკლები ჩანაწერების ექსპორტი.";
    } else if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      errorMessage = isEnglish 
        ? "Export timed out. Try exporting fewer records."
        : "ექსპორტის დრო ამოიწურა. სცადეთ ნაკლები ჩანაწერების ექსპორტი.";
    } else {
      errorMessage = isEnglish 
        ? `Error during export: ${error.message || 'Unknown error'}. Please try again.`
        : `ექსპორტის შეცდომა: ${error.message || 'უცნობი შეცდომა'}. გთხოვთ, სცადოთ ხელახლა.`;
    }
    
    alert(errorMessage);
    setIsStopped(false);
  } finally {
    setIsLoading(false);
    setIsExporting(false);
    setExportType('');
    setTimeout(() => setExportProgress(0), 1500);
  }
};

  const exportToAccess = async () => {
    try {
      if (!pagination?.total || !lastSearchParams) {
        alert(isEnglish ? "No data to export" : "ექსპორტისთვის მონაცემები არ არის");
        return;
      }

      const totalRecords = pagination.total;
      const CHUNK_SIZE = 100000;
      const CONCURRENCY = 5; // Optimal concurrency for API requests
      
      setIsLoading(true);
      setIsExporting(true);
      setExportType('access');
      setExportProgress(0);

      // Helper function to fetch data in parallel batches
      const fetchInBatches = async () => {
        const totalChunks = Math.ceil(totalRecords / CHUNK_SIZE);
        const pages = Array.from({ length: totalChunks }, (_, i) => i + 1);
        const totalPages = pages.length;
        
        let allResults = [];
        
        for (let i = 0; i < pages.length; i += CONCURRENCY) {
          if (isStopped) break;

          const batch = pages.slice(i, i + CONCURRENCY);
          const responses = await Promise.all(
            batch.map(async page => {
              try {
                return await fetchDocuments(
                  lastSearchParams,
                  isEnglish ? "en" : "ge",
                  [],
                  null,
                  { page, limit: CHUNK_SIZE }
                );
              } catch (error) {
                console.warn(`Error fetching page ${page}:`, error);
                return { results: [] }; // Return empty results on error
              }
            })
          );

          responses.forEach(response => {
            if (response && response.results && Array.isArray(response.results)) {
              allResults.push(...response.results);
            }
          });

          // Calculate progress based on pages completed
          const pagesCompleted = Math.min(i + CONCURRENCY, totalPages);
          const progressPercent = Math.round((pagesCompleted / totalPages) * 100);
          console.log(`Access Progress: ${progressPercent}% (${pagesCompleted}/${totalPages} pages)`);
          
          // Use flushSync to force synchronous state update and UI repaint
          flushSync(() => {
            setExportProgress(progressPercent);
          });

          // Small delay to ensure UI repaints
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return allResults;
      };

      // Prepare headers for Access (using semicolon separator)
      const headers = [
        { label: "identificationNumber", path: "identificationNumber" },
        { label: "personalNumber", path: "personalNumber" },
        { label: "organizationalLegalForm", path: "legalFormId" },
        { label: "organizationName", path: "name" },
        { label: "legalRegion", path: "legalAddress.region" },
        { label: "legalCity", path: "legalAddress.city" },
        { label: "legalAddress", path: "legalAddress.address" },
        { label: "factualRegion", path: "factualAddress.region" },
        { label: "factualCity", path: "factualAddress.city" },
        { label: "factualAddress", path: "factualAddress.address" },
        { label: "activityCode", path: "activities[0].code" },
        { label: "activityDescription", path: "activities[0].name" },
        { label: "head", path: "head" },
        { label: "partner", path: "partner" },
        { label: "phone", path: "phone" },
        { label: "email", path: "email" },
        { label: "web", path: "web" },
        { label: "ownershipForm", path: "ownershipType" },
        { label: "activeSubject", path: "isActive" },
        { label: "businessSize", path: "Zoma" },
        { label: "initRegDate", path: "Init_Reg_date" },
      ];

      // Access-compatible CSV with UTF-8 BOM and semicolon separator
      let csvContent = "\ufeff";
      csvContent += headers.map(h => `"${(t[h.label] || h.label).replace(/"/g, '""')}"`).join(";") + "\n";

      // Loop through pages in parallel batches
      const allResults = await fetchInBatches();
      
      if (isStopped) return;

      // Process all results into CSV string with semicolon separator
      const allRows = allResults.map(row => {
        const getValue = (path) => {
          const keys = path.split(/[.[\]]/).filter(key => key && key !== '0');
          let value = row;
          
          for (const key of keys) {
            if (value && typeof value === 'object') {
              if (Array.isArray(value)) {
                // For arrays, get first element and then access the key
                value = value[0];
                if (value && typeof value === 'object' && key) {
                  value = value[key];
                }
              } else {
                value = value[key];
              }
            } else {
              break;
            }
          }
          
          return value || "";
        };

        return headers.map(header => {
          let value = getValue(header.path);
          
          // Handle special fields
          if (header.path === "legalFormId") {
            value = legalFormsMap[value] || row.abbreviation || "";
          } else if (header.path === "isActive") {
            value = value ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
          } else if (header.path === "Init_Reg_date") {
            value = formatDate(value);
          } else if (typeof value === 'boolean') {
            value = value ? (isEnglish ? "Active" : "აქტიური") : (isEnglish ? "Inactive" : "არააქტიური");
          }
          
          // Escape quotes and wrap in quotes for Access compatibility
          return `"${String(value || "").replace(/"/g, '""')}"`;
        }).join(";");
      }).join("\n");

      csvContent += allRows + "\n";

      if (isStopped) return;

      // Trigger Download with .csv extension but Access-compatible format
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `business_registry_access_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Access Export Error:", error);
      
      // More specific error messages
      const errorMessage = error.name === "AbortError" 
        ? (isEnglish ? "Export was cancelled" : "ექსპორტი გაუქმდა")
        : (isEnglish ? "Error during Access export. Please try again." : "Access ექსპორტის შეცდომა. გთხოვთ, სცადოთ ხელახლა.");
      
      alert(errorMessage);
      
      // Reset states to prevent stuck state
      setIsStopped(false);
    } finally {
      setIsLoading(false);
      setIsExporting(false);
      setExportType('');
      // Delay progress reset so user can see 100% completion
      setTimeout(() => setExportProgress(0), 1500);
    }
  };

  // console.log("Search Results:", searchResults);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Format as DD.MM.YYYY
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return dateString; // Return original if formatting fails
    }
  };

  const generateTableContent = (searchResults, t) => {
    return `
      <table>
        <thead>
          <tr>
            <th>${t.identificationNumber}</th>
            <th>${t.personalNumber}</th>
            <th>${t.organizationalLegalForm}</th>
            <th>${t.organizationName}</th>
            <th>${t.region} (${t.legalAddress})</th>
            <th>${t.city} (${t.legalAddress})</th>
            <th>${t.legalAddress}</th>
            <th>${t.region} (${t.factualAddress})</th>
            <th>${t.city} (${t.factualAddress})</th>
            <th>${t.factualAddress}</th>
            <th>NACE 2</th>
            <th>${t.activityDescription}</th>
            <th>${t.head}</th>
            <th>${t.partner}</th>
            <th>${t.phone}</th>
            <th>${t.email}</th>
            <th>${t.web || "Web"}</th>
            <th>${t.ownershipForm}</th>
            <th>${t.activeSubject}</th>
            <th>${t.businessSize}</th>
            <th>${t.initRegDate}</th>
          </tr>
        </thead>
        <tbody>
          ${searchResults
            .map(
              (result) => `
            <tr>
              <td>${result.identificationNumber || ""}</td>
              <td>${result.personalNumber || ""}</td>
              <td>${
                legalFormsMap[result.legalFormId] || result.abbreviation || ""
              }</td>
              <td>${result.name || ""}</td>
              <td>${result.legalAddress?.region || ""}</td>
              <td>${result.legalAddress?.city || ""}</td>
              <td>${result.legalAddress?.address || ""}</td>
              <td>${result.factualAddress?.region || ""}</td>
              <td>${result.factualAddress?.city || ""}</td>
              <td>${result.factualAddress?.address || ""}</td>
              <td>${result.activities?.[0]?.code || ""}</td>
              <td>${result.activities?.[0]?.name || ""}</td>
              <td>${result.head || ""}</td>
              <td>${result.partner || ""}</td>
              <td>${result.phone || ""}</td>
              <td>${result.email || ""}</td>
              <td>${result.web || ""}</td>
              <td>${result.ownershipType || ""}</td>
              <td>${result.isActive ? "აქტიური" : "არააქტიური"}</td>
              <td>${result.Zoma || ""}</td>
              <td>${formatDate(result.Init_Reg_date) || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  };

  const getStyles = () => {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
      @font-face {
        font-family: 'BPG Nino Mtavruli';
        src: url('/fonts/bpg-nino-mtavruli/fonts/bpg-nino-mtavruli-webfont.woff2') format('woff2'),
             url('/fonts/bpg-nino-mtavruli/fonts/bpg-nino-mtavruli-webfont.woff') format('woff');
        font-weight: normal;
        font-style: normal;
      }
      
      @media print {
        @page { size: landscape; }
        
        body { 
          padding: 20px;
          font-family: Arial, sans-serif;
          margin: 0;
        }
        
        table { 
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        th, td { 
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 11px;
        }
        
        th { 
          background-color: #f8f8f8;
          font-weight: bold;
        }
        
        tr:nth-child(even) {
          background-color: #fafafa;
        }
      }
    `;
  };

  const handlePrint = (printWindow) => {
    return new Promise((resolve) => {
      const checkPrintDialogClosed = () => {
        if (printWindow.closed) {
          resolve();
        } else {
          setTimeout(checkPrintDialogClosed, 500);
        }
      };

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          resolve();
        };
        checkPrintDialogClosed();
      }, 1000);
    });
  };

  const printResults = async () => {
    const printWindow = window.open("", "_blank", "height=600,width=800");

    if (!printWindow) {
      alert("Please allow pop-ups to print the results.");
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Business Registry Results</title>
          <style>${getStyles()}</style>
        </head>
        <body>
          <div id="printableContent">
            ${generateTableContent(searchResults, t)}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();

    try {
      await handlePrint(printWindow);
    } catch (error) {
      console.error("Print failed:", error);
      if (!printWindow.closed) {
        printWindow.close();
      }
    }
  };

  const handleLegalFormChange = (options) => {
    setFormData((prev) => ({
      ...prev,
      organizationalLegalForm: (options && Array.isArray(options))
        ? options.map((option) => option.value)
        : [],
    }));
  };

  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: isEnglish ? "Business Register Search" : "ბიზნეს რეგისტრის ძებნა",
    description: isEnglish
      ? "Search and find information about Georgian businesses and economic entities in the official Statistical Business Register"
      : "მოძებნეთ და იპოვეთ ინფორმაცია ქართული ბიზნესების და ეკონომიკური სუბიექტების შესახებ ოფიციალურ სტატისტიკურ ბიზნეს რეგისტრში",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GEL",
    },
  };

  return (
    <div className="w-full">
      <SEO
        title={
          isEnglish
            ? "Business Register Search - Find Georgian Companies"
            : "ბიზნეს რეგისტრის ძებნა - იპოვეთ ქართული კომპანიები"
        }
        description={
          isEnglish
            ? "Search the official Statistical Business Register of Georgia. Find comprehensive information about Georgian businesses, economic entities, and their activities."
            : "მოძებნეთ საქართველოს ოფიციალური სტატისტიკური ბიზნეს რეგისტრი. იპოვეთ ყრმა ინფორმაცია ქართული ბიზნესების, ეკონომიკური სუბიექტების და მათი საქმიანობის შესახებ."
        }
        keywords={
          isEnglish
            ? "business search, georgian companies, company lookup, business registry, economic entities, company information"
            : "ბიზნეს ძებნა, ქართული კომპანიები, კომპანიის მოძებნა, ბიზნეს რეგისტრი, ეკონომიკური სუბიექტები, კომპანიის ინფორმაცია"
        }
        isEnglish={isEnglish}
        type="website"
        structuredData={homeStructuredData}
      />
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div
            className={`flipper-container ${isFlipped ? "flipped" : ""} ${
              navigationDirection === "left" ? "flip-left" : "flip-right"
            }`}
          >
            <div className="flipper">
              <div
                className={`border border-[#0080BE] rounded-[0_5px_5px_5px] ${
                  isLoading ? "" : "bg-[#fafafa]"
                }`}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center min-h-[400px] bg-white">
                    <div className="flex flex-col items-center space-y-4">
                      {isExporting ? (
                        <>
                          <div className="w-64">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 font-bpg-nino">
                                {exportType === 'excel' 
                                  ? (isEnglish ? 'Exporting to Excel...' : 'Excel-ში ექსპორტი...') 
                                  : (isEnglish ? 'Exporting to Access...' : 'Access-ში ექსპორტი...')
                                }
                              </span>
                              <span className="text-sm font-medium text-gray-700 font-bpg-nino">
                                {Math.round(exportProgress)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-[#0080BE] h-2.5 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: `${exportProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={loaderIcon}
                            alt="Loading..."
                            className="w-12 h-12 animate-pulse"
                          />
                          <p className="text-gray-600 font-bpg-nino text-sm">
                            {isEnglish ? "Loading..." : "იტვირთება..."}
                          </p>
                        </>
                      )}
                      <button
                        type="button"
                        className="flex items-center justify-center px-6 py-2 font-bold text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer text-sm font-bpg-nino rounded mt-4"
                        onClick={handleStopSearch}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {isExporting ? (isEnglish ? 'Cancel Export' : 'ექსპორტის გაუქმება') : t.stopSearch}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-6">
                    {showResults ? (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-base sm:text-lg font-bpg-nino font-bold">
                            {t.searchResults}
                          </h2>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={printResults}
                              style={{ fontFamily: georgianFont }}
                              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all duration-200 text-sm font-medium group shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-indigo-600 cursor-pointer"
                              disabled={!searchResults?.length || isLoading}
                            >
                              <svg
                                className="w-5 h-5 mr-2 transform group-hover:translate-y-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                              </svg>
                              {t.print || "Print"}
                            </button>
                            <button
                              onClick={exportToExcel}
                              style={{ fontFamily: georgianFont }}
                              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-all duration-200 text-sm font-medium group shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-emerald-600 cursor-pointer"
                              disabled={!searchResults?.length || isLoading}
                            >
                              <svg
                                className="w-5 h-5 mr-2 transform group-hover:translate-y-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              {t.exportToExcel}
                            </button>
                            <button
                              onClick={exportToAccess}
                              style={{ fontFamily: georgianFont }}
                              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-200 text-sm font-medium group shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-red-600 cursor-pointer"
                              disabled={!searchResults?.length || isLoading}
                            >
                              <svg
                                className="w-5 h-5 mr-2 transform group-hover:translate-y-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                                />
                              </svg>
                              {t.exportToAccess || (isEnglish ? "Export to Access" : "Access-ში ექსპორტი")}
                            </button>
                            {isLoading && (
                              <button
                                type="button"
                                className="flex items-center justify-center px-4 py-2 font-bold text-red-600 border border-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer text-sm font-bpg-nino rounded"
                                onClick={handleStopSearch}
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                {t.stopSearch}
                              </button>
                            )}
                            <button
                              onClick={handleBackToSearch}
                              disabled={isLoading}
                              className="px-4 py-2 bg-[#0080BE] text-white rounded hover:bg-[#006698] transition-colors font-bpg-nino disabled:opacity-50 cursor-pointer"
                            >
                              {t.backToSearch}
                            </button>
                          </div>
                        </div>
                        {isLoading ? (
                          <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0080BE]"></div>
                          </div>
                        ) : (
                          <SearchResults
                            results={searchResults}
                            pagination={pagination}
                            isEnglish={isEnglish}
                            formData={formData}
                            handleInputChange={handleInputChange}
                            legalFormsMap={legalFormsMap}
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        <h2 className="text-base sm:text-lg mb-4 sm:mb-6 text-center font-bpg-nino font-bold">
                          {t.title}
                        </h2>
                        <form
                          onSubmit={onSubmit}
                          className={`space-y-4 sm:space-y-6`}
                        >
                          <BasicInfoSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            handleLegalFormChange={handleLegalFormChange}
                            organizationalLegalFormOptions={
                              organizationalLegalFormOptions
                            }
                            t={t}
                            isEnglish={isEnglish}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <AddressSection
                              title={t.legalAddress}
                              formData={formData.legalAddress}
                              handleInputChange={(e) =>
                                handleInputChange(e, "legalAddress", "address")
                              }
                              regionOptions={regionOptions}
                              municipalityOptions={legalMunicipalityOptions}
                              onRegionChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  legalAddress: {
                                    ...prev.legalAddress,
                                    region: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              onMunicipalityChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  legalAddress: {
                                    ...prev.legalAddress,
                                    municipalityCity: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              t={t}
                            />

                            <AddressSection
                              title={t.factualAddress}
                              formData={formData.personalAddress}
                              handleInputChange={(e) =>
                                handleInputChange(
                                  e,
                                  "personalAddress",
                                  "address"
                                )
                              }
                              regionOptions={regionOptions}
                              municipalityOptions={personalMunicipalityOptions}
                              onRegionChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  personalAddress: {
                                    ...prev.personalAddress,
                                    region: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              onMunicipalityChange={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  personalAddress: {
                                    ...prev.personalAddress,
                                    municipalityCity: selected
                                      ? (Array.isArray(selected) ? selected.map((option) => option.value) : [])
                                      : [],
                                  },
                                }));
                              }}
                              t={t}
                            />
                          </div>{" "}
                          <EconomicActivitySection
                            formData={formData}
                            setFormData={setFormData}
                            t={t}
                            isEnglish={isEnglish}
                          />
                          <AdditionalInfoSection
                            formData={formData}
                            handleInputChange={handleInputChange}
                            t={t}
                            isEnglish={isEnglish}
                          />
                          <div className="w-full mb-4">
                            <ActiveFilterCheckbox
                              isActive={formData.isActive}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isActive: e.target.checked,
                                }))
                              }
                              t={t}
                            />
                          </div>
                          <FormActions
                            t={t}
                            onReset={handleReset}
                            onStop={handleStopSearch}
                            isLoading={isLoading}
                            onResetAll={resetAllStates}
                          />
                        </form>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
