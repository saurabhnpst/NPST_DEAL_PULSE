import { Module } from '@nestjs/common';
import { PageTextMerger } from './page-text-merger';
import { PdfJsTextExtractor } from './pdfjs-text.extractor';
import { PdfValidationService } from './pdf-validation.service';
import { PopplerRasterizerAdapter } from './poppler-rasterizer.adapter';
import { TesseractOcrAdapter } from './tesseract-ocr.adapter';

@Module({
  providers: [
    PdfJsTextExtractor,
    PdfValidationService,
    PopplerRasterizerAdapter,
    TesseractOcrAdapter,
    PageTextMerger,
  ],
  exports: [
    PdfJsTextExtractor,
    PdfValidationService,
    PopplerRasterizerAdapter,
    TesseractOcrAdapter,
    PageTextMerger,
  ],
})
export class PdfAdaptersModule {}