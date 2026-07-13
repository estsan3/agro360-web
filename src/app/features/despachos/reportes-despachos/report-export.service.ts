import { Injectable } from '@angular/core';

export interface ReporteTabla {
  titulo: string;
  headers: string[];
  filas: string[][];
}

/**
 * Exportación de reportes del lado del cliente.
 * TODO(backend): los reportes definitivos (PDF con membrete, XLSX real)
 * los generará el backend Python; esto cubre la operatoria mientras tanto.
 */
@Injectable({ providedIn: 'root' })
export class ReportExportService {
  exportCsv(reporte: ReporteTabla): void {
    const escape = (celda: string) => `"${celda.replace(/"/g, '""')}"`;
    const lineas = [
      reporte.headers.map(escape).join(';'),
      ...reporte.filas.map((fila) => fila.map(escape).join(';')),
    ];
    // BOM para que Excel abra acentos correctamente
    this.descargar(`\ufeff${lineas.join('\r\n')}`, 'text/csv;charset=utf-8', 'csv', reporte);
  }

  exportExcel(reporte: ReporteTabla): void {
    const html = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8" /></head>
        <body>
          <table border="1">
            <thead><tr>${reporte.headers.map((h) => `<th>${this.esc(h)}</th>`).join('')}</tr></thead>
            <tbody>
              ${reporte.filas
                .map((fila) => `<tr>${fila.map((c) => `<td>${this.esc(c)}</td>`).join('')}</tr>`)
                .join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    this.descargar(html, 'application/vnd.ms-excel', 'xls', reporte);
  }

  exportPdf(reporte: ReporteTabla): void {
    const ventana = window.open('', '_blank', 'width=1000,height=700');
    if (!ventana) {
      return;
    }
    ventana.document.write(`
      <html>
        <head>
          <title>${this.esc(reporte.titulo)}</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 20px; }
            h1 span { color: #00a63e; }
            p { color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
            th { background: #00a63e; color: #fff; padding: 6px 8px; text-align: left; }
            td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) td { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Agro<span>360</span> — ${this.esc(reporte.titulo)}</h1>
          <p>Generado el ${new Date().toLocaleString('es-AR')} · ${reporte.filas.length} registros</p>
          <table>
            <thead><tr>${reporte.headers.map((h) => `<th>${this.esc(h)}</th>`).join('')}</tr></thead>
            <tbody>
              ${reporte.filas
                .map((fila) => `<tr>${fila.map((c) => `<td>${this.esc(c)}</td>`).join('')}</tr>`)
                .join('')}
            </tbody>
          </table>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>`);
    ventana.document.close();
  }

  private descargar(
    contenido: string,
    mime: string,
    extension: string,
    reporte: ReporteTabla,
  ): void {
    const blob = new Blob([contenido], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reporte.titulo.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private esc(valor: string): string {
    return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
