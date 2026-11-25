import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RfpDocumentsController } from './rfp-documents.controller';
import { RfpDocumentService } from './rfp-document.service';

describe('RfpDocumentsController', () => {
  const PDF_BYTES = Buffer.from('%PDF-1.4 doc');
  const service = {
    downloadForRfp: jest.fn(),
  };
  let controller: RfpDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfpDocumentsController],
      providers: [{ provide: RfpDocumentService, useValue: service }],
    }).compile();

    controller = module.get(RfpDocumentsController);
    jest.clearAllMocks();
  });

  it('streams a downloadable PDF', async () => {
    service.downloadForRfp.mockResolvedValue({
      data: PDF_BYTES,
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
    });

    const file = await controller.download(
      'aaaa0001-0000-4000-8000-000000000001',
      'bbbb0001-0000-4000-8000-000000000001',
      { headers: { authorization: 'Bearer user-jwt' } } as never,
    );

    expect(file).toBeInstanceOf(StreamableFile);
    expect(service.downloadForRfp).toHaveBeenCalledWith(
      'aaaa0001-0000-4000-8000-000000000001',
      'bbbb0001-0000-4000-8000-000000000001',
      { userAuthorization: 'Bearer user-jwt' },
    );
  });
});