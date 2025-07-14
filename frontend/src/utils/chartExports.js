// Enhanced chart export utilities
import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Chart Data') => {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const columnWidths = [];
    const headers = Object.keys(data[0] || {});
    headers.forEach((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      columnWidths[index] = { width: Math.min(maxLength + 2, 50) };
    });
    
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel export failed:', error);
    return false;
  }
};

export const exportToCSV = (data, filename) => {
  try {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    return true;
  } catch (error) {
    console.error('CSV export failed:', error);
    return false;
  }
};

export const exportToJSON = (data, filename) => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    return true;
  } catch (error) {
    console.error('JSON export failed:', error);
    return false;
  }
};

export const copyToClipboard = async (data) => {
  try {
    const headers = Object.keys(data[0] || {});
    const tableText = [
      headers.join('\t'),
      ...data.map(row => headers.map(header => row[header]).join('\t'))
    ].join('\n');
    
    await navigator.clipboard.writeText(tableText);
    return true;
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    return false;
  }
};
