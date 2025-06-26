import { translations } from "../translations/searchForm";
import { useState, useMemo } from "react";
import "../styles/scrollbar.css";

function SearchResults({ results, isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sortData = (data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      let aVal = config.key.split(".").reduce((obj, key) => obj?.[key], a);
      let bVal = config.key.split(".").reduce((obj, key) => obj?.[key], b);

      if (aVal === null || aVal === undefined) aVal = "";
      if (bVal === null || bVal === undefined) bVal = "";

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return config.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return config.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === sortedResults.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedResults.map((r) => r.id)));
    }
  };

  const sortedResults = useMemo(
    () => sortData(results, sortConfig),
    [results, sortConfig]
  );

  // Pagination
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      // Show all pages if total pages are 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust start and end to always show 3 pages
      if (currentPage <= 3) {
        end = 4;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  if (!results?.length) return null;

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const headerClassName =
    "sticky top-0 z-20 px-4 py-3 text-sm font-bpg-nino cursor-pointer bg-[#0080BE] text-center text-[#fff]  transition-colors border-b border-[#0080BE] first:rounded-tl-lg last:rounded-tr-lg hover:bg-[#006698]";
  const cellClassName =
    "px-4 py-3 text-sm whitespace-nowrap text-center border-b border-gray-200 group-hover:bg-blue-50/50";

  return (
    <div className="w-full mt-4 bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Table Container */}
      <div className="relative overflow-x-auto overflow-y-auto max-h-[calc(100vh-450px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="sticky top-0 z-20 bg-[#0080BE] shadow-sm">
            <tr>
              <th className="sticky top-0 left-0 z-30 px-4 py-3 bg-[#0080BE] hover:bg-[#006698]">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedResults.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#0080BE] focus:ring-[#0080BE] transition-colors"
                />
              </th>
              <th
                onClick={() => handleSort("identificationNumber")}
                className={headerClassName}
              >
                {t.identificationNumber}{" "}
                {getSortIndicator("identificationNumber")}
              </th>
              <th
                onClick={() => handleSort("personalNumber")}
                className={headerClassName}
              >
                {t.personalNumber} {getSortIndicator("personalNumber")}
              </th>
              <th
                onClick={() => handleSort("legalForm")}
                className={headerClassName}
              >
                {t.organizationalLegalForm} {getSortIndicator("legalForm")}
              </th>
              <th
                onClick={() => handleSort("name")}
                className={headerClassName}
              >
                {t.organizationName} {getSortIndicator("name")}
              </th>
              <th
                onClick={() => handleSort("legalAddress.region")}
                className={headerClassName}
              >
                {t.region} ({t.legalAddress}){" "}
                {getSortIndicator("legalAddress.region")}
              </th>
              <th
                onClick={() => handleSort("legalAddress.address")}
                className={headerClassName}
              >
                {t.legalAddress} {getSortIndicator("legalAddress.address")}
              </th>
              <th
                onClick={() => handleSort("factualAddress.region")}
                className={headerClassName}
              >
                {t.region} ({t.factualAddress}){" "}
                {getSortIndicator("factualAddress.region")}
              </th>
              <th
                onClick={() => handleSort("factualAddress.address")}
                className={headerClassName}
              >
                {t.factualAddress} {getSortIndicator("factualAddress.address")}
              </th>
              <th className={headerClassName}>NACE 2</th>
              <th
                onClick={() => handleSort("activities.0.name")}
                className={headerClassName}
              >
                {t.activityDescription} {getSortIndicator("activities.0.name")}
              </th>
              <th
                onClick={() => handleSort("head")}
                className={headerClassName}
              >
                {t.head} {getSortIndicator("head")}
              </th>
              <th className={headerClassName}>{t.phone}</th>
              <th className={headerClassName}>{t.partner}</th>
              <th className={headerClassName}>{t.email}</th>
              <th
                onClick={() => handleSort("ownershipType")}
                className={headerClassName}
              >
                {t.ownershipForm} {getSortIndicator("ownershipType")}
              </th>
              <th
                onClick={() => handleSort("isActive")}
                className={headerClassName}
              >
                {t.activeSubject} {getSortIndicator("isActive")}
              </th>
              <th
                onClick={() => handleSort("size")}
                className={headerClassName}
              >
                {t.businessSize} {getSortIndicator("size")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedResults.map((result) => (
              <tr
                key={result.id}
                className={`group transition-colors ${
                  selectedRows.has(result.id) ? "bg-blue-50" : ""
                }`}
              >
                <td className={`sticky left-0 z-10 bg-white ${cellClassName}`}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(result.id)}
                    onChange={() => handleRowSelect(result.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0080BE] focus:ring-[#0080BE] transition-colors"
                  />
                </td>
                <td className={cellClassName}>{result.identificationNumber}</td>
                <td className={cellClassName}>{result.personalNumber}</td>
                <td className={cellClassName}>{result.legalForm}</td>
                <td className={cellClassName}>{result.name}</td>
                <td className={cellClassName}>{result.legalAddress.region}</td>
                <td className={cellClassName}>{result.legalAddress.address}</td>
                <td className={cellClassName}>
                  {result.factualAddress.region}
                </td>
                <td className={cellClassName}>
                  {result.factualAddress.address}
                </td>
                <td className={cellClassName}>{result.activities[0]?.code}</td>
                <td className={cellClassName}>{result.activities[0]?.name}</td>
                <td className={cellClassName}>{result.head}</td>
                <td className={cellClassName}>{result.phone}</td>
                <td className={cellClassName}>{result.partner}</td>
                <td className={cellClassName}>{result.email}</td>
                <td className={cellClassName}>{result.ownershipType}</td>
                <td className={cellClassName}>{result.isActive ? "✓" : "✗"}</td>
                <td className={cellClassName}>{result.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination and Items Per Page */}
      <div className="px-4 py-3 sm:px-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="mr-2 font-bpg-nino">{t.perPage}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium hover:border-[#0080BE] focus:outline-none focus:border-[#0080BE] focus:ring-2 focus:ring-[#0080BE]/20 transition-all"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="hidden sm:block">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <span>{t.page}</span>
                  <span className="font-medium text-gray-900">
                    {currentPage}
                  </span>
                  <span>{t.of}</span>
                  <span className="font-medium text-gray-900">
                    {totalPages}
                  </span>
                </div>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex-1 flex justify-center sm:justify-end">
              <nav
                className="relative z-0 inline-flex shadow-sm rounded-lg -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">{t.first}</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.707 15.707a1 1 0 01-1.414 0L9 10.414V13a1 1 0 11-2 0V7a1 1 0 011-1h6a1 1 0 110 2h-2.586l5.293 5.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">{t.previous}</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
                      <span className="h-1 w-1 bg-gray-500 rounded-full mx-0.5"></span>
                      <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors
                        ${
                          currentPage === pageNum
                            ? "z-10 bg-[#0080BE] border-[#0080BE] text-white hover:bg-[#0070aa]"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      aria-current={
                        currentPage === pageNum ? "page" : undefined
                      }
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">{t.next}</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">{t.last}</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 15.707a1 1 0 001.414 0L11 10.414V13a1 1 0 102 0V7a1 1 0 00-1-1H6a1 1 0 100 2h2.586l-5.293 5.293a1 1 0 000 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
