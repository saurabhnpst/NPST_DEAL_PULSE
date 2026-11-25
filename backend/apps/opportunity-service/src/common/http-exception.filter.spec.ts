import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ApiExceptionFilter } from './http-exception.filter';
import { assertValidProducts } from '../products/product-catalog';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('uses machine-readable codes for HTTP errors', () => {
    expect(filter.toReply(new NotFoundException('Opportunity not found'))).toEqual({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Opportunity not found',
    });
  });

  it('keeps the details list of business errors (e.g. missing fields)', () => {
    const reply = filter.toReply(
      new BadRequestException({ message: 'Fill these first', details: ['Close Date'] }),
    );
    expect(reply).toMatchObject({ status: 400, code: 'BAD_REQUEST', details: ['Close Date'] });
  });

  it('maps MySQL duplicate keys to 409 and too-long values to 400', () => {
    expect(filter.toReply({ driverError: { code: 'ER_DUP_ENTRY' } })).toMatchObject({ status: 409, code: 'CONFLICT' });
    expect(filter.toReply({ code: 'ER_DATA_TOO_LONG' })).toMatchObject({ status: 400, code: 'INVALID_VALUE' });
  });

  it('hides unexpected errors behind INTERNAL_ERROR and logs them', () => {
    expect(filter.toReply(new Error('boom'))).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});

describe('assertValidProducts', () => {
  it('accepts valid modules and products without a module list', () => {
    expect(() =>
      assertValidProducts([
        { productSlot: 1, productTsp: 'UPI', modules: ['TPAP', 'UPI'] },
        { productSlot: 2, productTsp: 'Others', modules: [] },
      ]),
    ).not.toThrow();
  });

  it('rejects duplicate slots and modules from another product', () => {
    expect(() =>
      assertValidProducts([
        { productSlot: 1, productTsp: 'UPI', modules: [] },
        { productSlot: 1, productTsp: 'BBPS', modules: [] },
      ]),
    ).toThrow('unique');
    expect(() =>
      assertValidProducts([{ productSlot: 1, productTsp: 'IMPS', modules: ['TPAP'] }]),
    ).toThrow(BadRequestException);
  });
});
