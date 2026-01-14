import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportPresentationToPDF(
    clientName: string,
    consultingFirm: string
): Promise<void> {
    try {
        // Get all slides
        const slides = document.querySelectorAll('[data-slide]');

        if (slides.length === 0) {
            throw new Error('No slides found to export');
        }

        // Create PDF (A4 landscape)
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i] as HTMLElement;

            // Capture slide as canvas
            const canvas = await html2canvas(slide, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#0f172a', // slate-900
            });

            // Convert canvas to image
            const imgData = canvas.toDataURL('image/png');

            // Add new page if not first slide
            if (i > 0) {
                pdf.addPage();
            }

            // Calculate dimensions to fit page
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Add header with client name and consulting firm
            pdf.setFontSize(10);
            pdf.setTextColor(148, 163, 184); // slate-400
            pdf.text(clientName, 10, 10);
            pdf.text(consultingFirm, pageWidth - 10, 10, { align: 'right' });
        }

        // Download PDF
        const fileName = `${clientName.replace(/\s+/g, '_')}_Apresentacao_Tributaria.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        throw new Error('Falha ao gerar PDF. Por favor, tente novamente.');
    }
}
