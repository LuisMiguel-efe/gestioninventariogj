export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) {
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV string
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      // Escape strings containing commas, newlines or double quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('\n') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val === null || val === undefined ? '' : val;
    });
    csvRows.push(values.join(','));
  }

  // Create blob and download
  const csvString = csvRows.join('\n');
  // Use BOM for Excel to recognize UTF-8 correctly
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
