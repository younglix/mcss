/** Builds a CSV string from an array of row arrays and triggers a browser
 * download — same Blob + hidden-<a download> pattern api.js's downloadFile
 * uses for server files, just with client-built content instead of a
 * fetch response. */
function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
