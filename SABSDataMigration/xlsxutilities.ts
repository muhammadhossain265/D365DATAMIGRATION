import * as XLSX from 'xlsx';

export const exportExcelCS = (data: any, filename: string, csv?: boolean) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Lodgment Items");
  if (csv)
    XLSX.writeFile(workbook, filename, { bookType: 'csv' });
  else
    XLSX.writeFile(workbook, filename);
}