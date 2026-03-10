import jsPDF from 'jspdf';

export interface RFQItem {
    part: string;
    quantity: number;
}

export interface RFQFormData {
    items: RFQItem[];
    location: string;
    minimumRequirements: string[];
    isoCertified: boolean;
    pricingMin: number;
    pricingMax: number;
    yearOfManufacturing: number;
}

const COMPANY_NAME = 'VendorVerse Inc.';
const COMPANY_ADDRESS = ' ';
const COMPANY_EMAIL = 'procurement@vendorverse.com';
const COMPANY_PHONE = '+1 (212) xxxx-xxxx';

export function generateRFQPdf(formData: RFQFormData, vendorNames?: string[], preview: boolean = true): string | void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // ─── Header Band ───
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REQUEST FOR QUOTE', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_NAME, pageWidth / 2, 30, { align: 'center' });
    doc.text(COMPANY_ADDRESS, pageWidth / 2, 36, { align: 'center' });

    y = 55;

    // ─── Meta info row ───
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Date: ${today}`, margin, y);
    doc.text(`RFQ #: RFQ-${Date.now().toString(36).toUpperCase()}`, pageWidth - margin, y, { align: 'right' });
    y += 12;

    // ─── Separator ───
    doc.setDrawColor(67, 97, 238);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ─── Items Table ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(43, 54, 116);
    doc.text('Requested Items', margin, y + 2);
    y += 10;

    // Table header
    const col1X = margin;
    const col2X = margin + 15;
    const col3X = pageWidth - margin - 35;
    const tableRowHeight = 10;

    doc.setFillColor(67, 97, 238);
    doc.rect(margin, y - 3, contentWidth, tableRowHeight + 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('#', col1X + 4, y + 4);
    doc.text('Part / Item', col2X + 4, y + 4);
    doc.text('Quantity', col3X + 4, y + 4);
    y += tableRowHeight + 2;

    // Table rows
    formData.items.forEach((item, idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(245, 247, 254);
            doc.rect(margin, y - 3, contentWidth, tableRowHeight, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(`${idx + 1}`, col1X + 4, y + 4);

        const partLines = doc.splitTextToSize(item.part, col3X - col2X - 10);
        doc.text(partLines, col2X + 4, y + 4);

        doc.setFont('helvetica', 'bold');
        doc.text(item.quantity.toString(), col3X + 4, y + 4);

        const extraLines = Math.max(0, partLines.length - 1);
        y += tableRowHeight + extraLines * 4;
    });

    y += 8;

    // ─── Details Table ───
    doc.setDrawColor(67, 97, 238);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const detailRows: [string, string][] = [
        ['Delivery Location', formData.location],
        ['Minimum Requirements', formData.minimumRequirements.length > 0 ? formData.minimumRequirements.join(', ') : 'None specified'],
        ['ISO Certified', formData.isoCertified ? 'Yes — Required' : 'Not Required'],
        ['Pricing Range', `$${formData.pricingMin.toLocaleString()} — $${formData.pricingMax.toLocaleString()}`],
        ['Year of Manufacturing', formData.yearOfManufacturing.toString()],
        ['Requested Date', today],
        ['Company Name', COMPANY_NAME],
    ];

    const colLabelWidth = 60;
    const rowHeight = 12;

    detailRows.forEach((row, idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(245, 247, 254);
            doc.rect(margin, y - 3, contentWidth, rowHeight, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(43, 54, 116);
        doc.text(row[0], margin + 4, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        const valueLines = doc.splitTextToSize(row[1], contentWidth - colLabelWidth - 8);
        doc.text(valueLines, margin + colLabelWidth, y + 5);

        const extraLines = Math.max(0, valueLines.length - 1);
        y += rowHeight + extraLines * 5;
    });

    y += 8;

    // ─── Targeted Vendors ───
    if (vendorNames && vendorNames.length > 0) {
        doc.setDrawColor(67, 97, 238);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(43, 54, 116);
        doc.text('Targeted Vendors', margin, y + 2);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        vendorNames.forEach((name, idx) => {
            doc.text(`${idx + 1}.  ${name}`, margin + 6, y + 2);
            y += 8;
        });
    }

    // ─── Footer ───
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_NAME, margin, footerY);
    doc.text(`${COMPANY_EMAIL}  |  ${COMPANY_PHONE}`, margin, footerY + 5);
    doc.text('Confidential — For intended recipients only', pageWidth - margin, footerY, { align: 'right' });

    // ─── Return or Preview ───
    if (preview) {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    } else {
        return doc.output('datauristring');
    }
}
