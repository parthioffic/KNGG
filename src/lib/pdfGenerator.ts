import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  isThermal: boolean = false
): Promise<void> {
  // Capture high-resolution canvas with proper Unicode Tamil font rendering
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');

  if (isThermal) {
    // 80mm width POS receipt format
    const imgWidth = 80;
    const pageHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [imgWidth, pageHeight + 10],
    });

    pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, pageHeight);
    pdf.save(`${fileName}.pdf`);
  } else {
    // Standard A4 / A5 format
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * (pdfWidth - 20)) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  }
}
