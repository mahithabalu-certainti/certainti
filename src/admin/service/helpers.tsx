export const buildQueryString = (params: Record<string, unknown>): string => {
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      );
    }
  }

  return queryParams.toString();
};

export const generateFile = (base64Data: string, fileName?: string) => {
  if (!base64Data) {
    console.error('No base64 data found in the response.');
    return;
  }

  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName ? `${fileName}.xlsx` : 'profile_records.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
