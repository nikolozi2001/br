import "../styles/SearchForm.scss";
import React, { useState } from "react";
import { translations } from "../translations/searchForm";
import { useSearchForm } from "../hooks/useSearchForm";
import { AddressSection } from "./AddressSection";
import { BasicInfoSection } from "./BasicInfoSection";
import { EconomicActivitySection } from "./EconomicActivitySection";
import { AdditionalInfoSection } from "./AdditionalInfoSection";
import { FormActions } from "./FormActions";
import SearchResults from "./SearchResults";
import georgianFont from '../fonts/NotoSansGeorgian_ExtraCondensed-Bold.ttf';

function SearchForm({ isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const results = await handleSubmit();
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      { label: "identificationNumber", path: "identificationNumber" },
      { label: "personalNumber", path: "personalNumber" },
      { label: "organizationalLegalForm", path: "legalForm" },
      { label: "organizationName", path: "name" },
      { label: "legalRegion", path: "legalAddress.region" },
      { label: "legalAddress", path: "legalAddress.address" },
      { label: "factualRegion", path: "factualAddress.region" },
      { label: "factualAddress", path: "factualAddress.address" },
      { label: "activityCode", path: "activities[0].code" },
      { label: "activityDescription", path: "activities[0].name" },
      { label: "head", path: "head" },
      { label: "phone", path: "phone" },
      { label: "partner", path: "partner" },
      { label: "email", path: "email" },
      { label: "ownershipForm", path: "ownershipType" },
      { label: "activeSubject", path: "isActive" },
      { label: "businessSize", path: "size" }
    ];

    const csvContent = "\ufeff" + [
      // Headers row with translated labels
      headers
        .map(header => {
          // Handle special cases for addresses
          if (header.label === "legalRegion") {
            return `"${t.region} (${t.legalAddress})"`;
          } else if (header.label === "factualRegion") {
            return `"${t.region} (${t.factualAddress})"`;
          }
          // Normal translation
          return `"${t[header.label]}"`;
        })
        .join(","),
      // Data rows
      ...searchResults.map((row) =>
        headers
          .map((header) => {
            let value;
            const path = header.path;
            if (path.includes("[")) {
              // Handle array paths (activities)
              const [arrayPath, arrayKey] = path.split(".");
              value = row[arrayPath.split("[")[0]][0]?.[arrayKey] || "";
            } else if (path.includes(".")) {
              // Handle nested object paths (addresses)
              const [objPath, key] = path.split(".");
              value = row[objPath][key];
            } else {
              // Handle direct properties
              value = row[path];
            }
            if (path === "isActive") value = value ? "✓" : "✗";
            return `"${value || ""}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `business_registry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackToSearch = () => {
    setShowResults(false);
    setSearchResults([]);
  };

  const handleLegalFormChange = (options) => {
    setFormData((prev) => ({
      ...prev,
      organizationalLegalForm: options
        ? options.map((option) => option.value)
        : [],
    }));
  };

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-8">
          <div className="bg-[#fafafa] border border-[#0080BE] rounded-[0_5px_5px_5px]">
            <div className="p-3 sm:p-6">
              {showResults ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base sm:text-lg font-bpg-nino font-bold">
                      {t.searchResults}
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const printContent = document.createElement('div');
                          printContent.innerHTML = `
                            <style>
                              @media print {
                                body { padding: 20px; font-family: Arial, sans-serif; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f8f8f8; }
                                @page { size: landscape; }
                              }
                            </style>
                            <table>
                              <thead>
                                <tr>
                                  <th>${t.identificationNumber}</th>
                                  <th>${t.personalNumber}</th>
                                  <th>${t.organizationalLegalForm}</th>
                                  <th>${t.organizationName}</th>
                                  <th>${t.region} (${t.legalAddress})</th>
                                  <th>${t.legalAddress}</th>
                                  <th>${t.region} (${t.factualAddress})</th>
                                  <th>${t.factualAddress}</th>
                                  <th>NACE 2</th>
                                  <th>${t.activityDescription}</th>
                                  <th>${t.head}</th>
                                  <th>${t.phone}</th>
                                  <th>${t.partner}</th>
                                  <th>${t.email}</th>
                                  <th>${t.ownershipForm}</th>
                                  <th>${t.activeSubject}</th>
                                  <th>${t.businessSize}</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${searchResults.map(result => `
                                  <tr>
                                    <td>${result.identificationNumber || ''}</td>
                                    <td>${result.personalNumber || ''}</td>
                                    <td>${result.legalForm || ''}</td>
                                    <td>${result.name || ''}</td>
                                    <td>${result.legalAddress?.region || ''}</td>
                                    <td>${result.legalAddress?.address || ''}</td>
                                    <td>${result.factualAddress?.region || ''}</td>
                                    <td>${result.factualAddress?.address || ''}</td>
                                    <td>${result.activities?.[0]?.code || ''}</td>
                                    <td>${result.activities?.[0]?.name || ''}</td>
                                    <td>${result.head || ''}</td>
                                    <td>${result.phone || ''}</td>
                                    <td>${result.partner || ''}</td>
                                    <td>${result.email || ''}</td>
                                    <td>${result.ownershipType || ''}</td>
                                    <td>${result.isActive ? '✓' : '✗'}</td>
                                    <td>${result.size || ''}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                          `;

                          const printWindow = window.open('', '_blank', 'height=600,width=800');
                          
                          // Add base styles to ensure fonts are loaded
                          const baseStyles = `
                            @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
                            @font-face {
                              font-family: 'BPG Nino Mtavruli';
                              src: url('/fonts/bpg-nino-mtavruli/fonts/bpg-nino-mtavruli-webfont.woff2') format('woff2'),
                                   url('/fonts/bpg-nino-mtavruli/fonts/bpg-nino-mtavruli-webfont.woff') format('woff');
                              font-weight: normal;
                              font-style: normal;
                            }
                          `;
                          
                          // Combine base styles with content
                          const fullContent = `
                            <html>
                              <head>
                                <style>${baseStyles}</style>
                                ${printContent.innerHTML}
                              </head>
                              <body>
                                <div id="printableContent"></div>
                              </body>
                            </html>
                          `;
                          
                          printWindow.document.write(fullContent);
                          
                          // Get the content div in the new window
                          const contentDiv = printWindow.document.getElementById('printableContent');
                          
                          // Create a temporary div to parse the HTML string
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = printContent.innerHTML;
                          
                          // Find the table in the parsed content
                          const table = tempDiv.querySelector('table');
                          if (table) {
                            contentDiv.appendChild(table);
                          }
                          
                          printWindow.document.close();
                          
                          // Wait for all resources to load before printing
                          if (printWindow.document.readyState === 'loading') {
                            printWindow.document.addEventListener('DOMContentLoaded', handlePrint);
                          } else {
                            handlePrint();
                          }
                          
                          function handlePrint() {
                            // Give extra time for fonts to load
                            setTimeout(() => {
                              printWindow.focus();
                              printWindow.print();
                              
                              // Close window after printing is done
                              printWindow.onafterprint = function() {
                                printWindow.close();
                              };
                              
                              // Fallback for browsers that don't support onafterprint
                              setTimeout(() => {
                                if (!printWindow.closed) {
                                  printWindow.close();
                                }
                              }, 5000);
                            }, 1000);
                          };
                        }}
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
                        onClick={exportToCSV}
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
                        {t.exportToCSV}
                      </button>
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
                    <SearchResults results={searchResults} isEnglish={isEnglish} />
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg mb-4 sm:mb-6 text-center font-bpg-nino font-bold">
                    {t.title}
                  </h2>
                  <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                    <BasicInfoSection
                      formData={formData}
                      handleInputChange={handleInputChange}
                      handleLegalFormChange={handleLegalFormChange}
                      organizationalLegalFormOptions={
                        organizationalLegalFormOptions
                      }
                      t={t}
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
                                ? selected.map((option) => option.value)
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
                                ? selected.map((option) => option.value)
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
                          handleInputChange(e, "personalAddress", "address")
                        }
                        regionOptions={regionOptions}
                        municipalityOptions={personalMunicipalityOptions}
                        onRegionChange={(selected) => {
                          setFormData((prev) => ({
                            ...prev,
                            personalAddress: {
                              ...prev.personalAddress,
                              region: selected
                                ? selected.map((option) => option.value)
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
                                ? selected.map((option) => option.value)
                                : [],
                            },
                          }));
                        }}
                        t={t}
                      />
                    </div>{" "}
                    <EconomicActivitySection
                      formData={formData.economicActivity}
                      handleInputChange={handleInputChange}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          className="w-4 h-4 text-[#0080BE] border-gray-300 rounded focus:ring-[#0080BE] cursor-pointer"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: e.target.checked,
                            }))
                          }
                        />
                        <label
                          htmlFor="isActive"
                          className="flex items-center gap-2 font-bpg-nino font-bold"
                        >
                          {t.activeSubject}
                          <div className="relative group">
                            <svg
                              className="w-5 h-5 text-[#0080BE] cursor-help"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div className="absolute left-0 w-[calc(100vw-2rem)] sm:w-96 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-xs sm:text-sm">
                              {t.activeTooltip}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    <FormActions t={t} onReset={handleReset} isLoading={isLoading} />
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
