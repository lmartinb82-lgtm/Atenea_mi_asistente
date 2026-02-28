import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function generateExcel(data: any[], fileName: string = 'atenea_report.xlsx') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte Atenea');

  if (data.length > 0) {
    const columns = Object.keys(data[0]).map(key => ({ header: key, key: key, width: 20 }));
    worksheet.columns = columns;
    worksheet.addRows(data);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function generatePDF(title: string, content: string, fileName: string = 'atenea_report.pdf') {
  const doc = new jsPDF() as any;

  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Atenea Indigo
  doc.text(title, 20, 30);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Generado por ATENEA - Inteligencia Neural', 20, 40);

  doc.line(20, 45, 190, 45);

  const splitText = doc.splitTextToSize(content, 170);
  doc.text(splitText, 20, 55);

  doc.save(fileName);
}
