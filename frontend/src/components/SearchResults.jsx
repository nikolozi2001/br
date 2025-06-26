import { translations } from "../translations/searchForm";
import { useState, useMemo } from "react";

function SearchResults({ results, isEnglish }) {
  const t = translations[isEnglish ? "en" : "ge"];
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sortData = (data, config) => {
    if (!config.key) return data;

    return [...data].sort((a, b) => {
      let aVal = config.key.split('.').reduce((obj, key) => obj?.[key], a);
      let bVal = config.key.split('.').reduce((obj, key) => obj?.[key], b);

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = [
      'identificationNumber',
      'personalNumber',
      'legalForm',
      'name',
      'legalAddress.region',
      'legalAddress.address',
      'factualAddress.region',
      'factualAddress.address',
      'activities[0].code',
      'activities[0].name',
      'head',
      'phone',
      'partner',
      'email',
      'ownershipType',
      'isActive',
      'size'
    ];

    const csvContent = [
      headers.map(header => {
        const label = header.includes('.') || header.includes('[') 
          ? t[header.split('.')[0]] 
          : t[header] || header;
        return `"${label}"`;
      }).join(','),
      ...sortedResults.map(row => 
        headers.map(header => {
          let value = header.includes('[') 
            ? row.activities[0]?.[header.split('.')[1]] || ''
            : header.includes('.') 
              ? row[header.split('.')[0]][header.split('.')[1]] 
              : row[header];
          if (header === 'isActive') value = value ? '✓' : '✗';
          return `"${value || ''}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `business_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev => {
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
      setSelectedRows(new Set(sortedResults.map(r => r.id)));
    }
  };

  const sortedResults = useMemo(() => sortData(results, sortConfig), [results, sortConfig]);
  
  // Pagination
  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!results?.length) return null;

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="w-full mt-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value={10}>10 {t.perPage}</option>
            <option value={25}>25 {t.perPage}</option>
            <option value={50}>50 {t.perPage}</option>
            <option value={100}>100 {t.perPage}</option>
          </select>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t.exportToCSV}
          </button>
        </div>
        <div className="text-sm text-gray-600">
          {t.showing} {Math.min((currentPage - 1) * itemsPerPage + 1, sortedResults.length)}-
          {Math.min(currentPage * itemsPerPage, sortedResults.length)} {t.of} {sortedResults.length}
        </div>
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-8 px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedResults.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#0080BE] focus:ring-[#0080BE]"
                />
              </th>
              <th 
                onClick={() => handleSort('identificationNumber')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.identificationNumber} {getSortIndicator('identificationNumber')}
              </th>
              <th 
                onClick={() => handleSort('personalNumber')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.personalNumber} {getSortIndicator('personalNumber')}
              </th>
              <th 
                onClick={() => handleSort('legalForm')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.organizationalLegalForm} {getSortIndicator('legalForm')}
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.organizationName} {getSortIndicator('name')}
              </th>
              <th 
                onClick={() => handleSort('legalAddress.region')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.region} ({t.legalAddress}) {getSortIndicator('legalAddress.region')}
              </th>
              <th 
                onClick={() => handleSort('legalAddress.address')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.legalAddress} {getSortIndicator('legalAddress.address')}
              </th>
              <th 
                onClick={() => handleSort('factualAddress.region')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.region} ({t.factualAddress}) {getSortIndicator('factualAddress.region')}
              </th>
              <th 
                onClick={() => handleSort('factualAddress.address')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.factualAddress} {getSortIndicator('factualAddress.address')}
              </th>
              <th className="text-center px-4 py-2 text-sm font-bpg-nino">
                NACE 2
              </th>
              <th 
                onClick={() => handleSort('activities.0.name')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.activityDescription} {getSortIndicator('activities.0.name')}
              </th>
              <th 
                onClick={() => handleSort('head')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.head} {getSortIndicator('head')}
              </th>
              <th className="text-center px-4 py-2 text-sm font-bpg-nino">
                {t.phone}
              </th>
              <th className="text-center px-4 py-2 text-sm font-bpg-nino">
                {t.partner}
              </th>
              <th className="text-center px-4 py-2 text-sm font-bpg-nino">
                {t.email}
              </th>
              <th 
                onClick={() => handleSort('ownershipType')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.ownershipForm} {getSortIndicator('ownershipType')}
              </th>
              <th 
                onClick={() => handleSort('isActive')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.activeSubject} {getSortIndicator('isActive')}
              </th>
              <th 
                onClick={() => handleSort('size')}
                className="text-center px-4 py-2 text-sm font-bpg-nino cursor-pointer hover:bg-gray-200"
              >
                {t.businessSize} {getSortIndicator('size')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedResults.map((result) => (
              <tr
                key={result.id}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  selectedRows.has(result.id) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(result.id)}
                    onChange={() => handleRowSelect(result.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0080BE] focus:ring-[#0080BE]"
                  />
                </td>
                <td className="text-center px-4 py-2 text-sm">{result.identificationNumber}</td>
                <td className="text-center px-4 py-2 text-sm">{result.personalNumber}</td>
                <td className="text-center px-4 py-2 text-sm">{result.legalForm}</td>
                <td className="text-center px-4 py-2 text-sm">{result.name}</td>
                <td className="text-center px-4 py-2 text-sm">{result.legalAddress.region}</td>
                <td className="text-center px-4 py-2 text-sm">{result.legalAddress.address}</td>
                <td className="text-center px-4 py-2 text-sm">{result.factualAddress.region}</td>
                <td className="text-center px-4 py-2 text-sm">{result.factualAddress.address}</td>
                <td className="text-center px-4 py-2 text-sm">
                  {result.activities[0]?.code}
                </td>
                <td className="text-center px-4 py-2 text-sm">
                  {result.activities[0]?.name}
                </td>
                <td className="text-center px-4 py-2 text-sm">{result.head}</td>
                <td className="text-center px-4 py-2 text-sm">{result.phone}</td>
                <td className="text-center px-4 py-2 text-sm">{result.partner}</td>
                <td className="text-center px-4 py-2 text-sm">{result.email}</td>
                <td className="text-center px-4 py-2 text-sm">{result.ownershipType}</td>
                <td className="text-center px-4 py-2 text-sm">
                  {result.isActive ? "✓" : "✗"}
                </td>
                <td className="text-center px-4 py-2 text-sm">{result.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  currentPage === i + 1
                    ? 'z-10 bg-[#0080BE] border-[#0080BE] text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
