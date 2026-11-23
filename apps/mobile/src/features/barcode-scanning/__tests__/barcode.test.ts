import { describe, expect, it } from '@jest/globals';

import { detectionKey, expandUpcE, hasValidCheckDigit, normalizeBarcode } from '../barcode';
import { MOCK_FAILING_BARCODE, MOCK_PRODUCTS } from '../product-catalog';

describe('normalizeBarcode', () => {
  it('accepts a valid EAN-13 as-is', () => {
    expect(normalizeBarcode('ean13', '4006381333931')).toEqual({ kind: 'product', gtin: '4006381333931', format: 'ean13' });
  });

  it('accepts a valid EAN-8 as-is', () => {
    expect(normalizeBarcode('ean8', '96385074')).toEqual({ kind: 'product', gtin: '96385074', format: 'ean8' });
  });

  it('converts UPC-A to GTIN-13 so iOS and Android agree', () => {
    // Android reports 12 digits, iOS reports the same code as EAN-13 with a leading 0.
    const android = normalizeBarcode('upc_a', '036000291452');
    const ios = normalizeBarcode('ean13', '0036000291452');
    expect(android).toMatchObject({ kind: 'product', gtin: '0036000291452' });
    expect(ios).toMatchObject({ kind: 'product', gtin: '0036000291452' });
  });

  it('expands UPC-E to GTIN-13', () => {
    // 04252614 is the UPC-E form of UPC-A 042100005264.
    expect(normalizeBarcode('upc_e', '04252614')).toMatchObject({ kind: 'product', gtin: '0042100005264' });
  });

  it('trims whitespace around the value', () => {
    expect(normalizeBarcode('ean13', ' 4006381333931\n')).toMatchObject({ kind: 'product', gtin: '4006381333931' });
  });

  it('accepts native platform type names', () => {
    expect(normalizeBarcode('org.iso.Code39Mod43', 'ABC')).toMatchObject({ kind: 'unsupported', reason: 'unsupported-format' });
    expect(normalizeBarcode('org.gs1.EAN-13', '4006381333931')).toMatchObject({ kind: 'product' });
  });

  it.each([
    ['qr', 'https://example.com'],
    ['code128', '12345678'],
    ['datamatrix', '0104006381333931'],
    ['itf14', '14006381333938'],
  ])('reports %s as unsupported', (type, data) => {
    expect(normalizeBarcode(type, data)).toMatchObject({ kind: 'unsupported', reason: 'unsupported-format' });
  });

  it.each([
    ['ean13', '4006381333932', 'wrong check digit'],
    ['ean13', '400638133393', 'too short'],
    ['ean13', '40063813339A1', 'non-numeric'],
    ['ean8', '96385075', 'wrong check digit'],
    ['upc_a', '136000291452', '13 digits needed a leading 0'],
    ['upc_e', '24252614', 'invalid number system'],
  ])('rejects %s %s (%s)', (type, data) => {
    expect(normalizeBarcode(type, data)).toMatchObject({ kind: 'unsupported', reason: 'invalid-value' });
  });
});

describe('expandUpcE', () => {
  it.each([
    ['01234505', '012000003455'],
    ['04252614', '042100005264'],
    ['0425261', '042100005264'],
    ['425261', '042100005264'],
  ])('expands %s to %s', (upcE, upcA) => {
    expect(expandUpcE(upcE)).toBe(upcA);
  });
});

describe('detectionKey', () => {
  it('treats the same product from different formats as the same key', () => {
    expect(detectionKey(normalizeBarcode('upc_a', '036000291452'))).toBe(
      detectionKey(normalizeBarcode('ean13', '0036000291452')),
    );
  });
});

describe('mock catalog data', () => {
  it('only contains valid GTINs', () => {
    for (const product of MOCK_PRODUCTS) expect(hasValidCheckDigit(product.barcode)).toBe(true);
    expect(hasValidCheckDigit(MOCK_FAILING_BARCODE)).toBe(true);
  });
});
