declare module "pdf-poppler" {
  interface ConvertOptions {
    format: "png" | "jpeg" | "jpg";
    out_dir: string;
    out_prefix: string;
    page: number | null;
  }

  interface PdfPoppler {
    convert(buffer: Buffer, options: ConvertOptions): Promise<string[]>;
  }

  const pdfPoppler: PdfPoppler;
  export = pdfPoppler;
}
