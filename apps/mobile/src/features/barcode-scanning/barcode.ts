import type { BarcodeType } from 'expo-camera';

/**
 * Barcode formats UniBlip treats as product barcodes (GTIN family).
 * Everything else the camera recognises is reported as "unsupported" so the
 * customer gets feedback instead of silence, but it never reaches the catalog.
 */
export const PRODUCT_BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const satisfies readonly BarcodeType[];

/**
 * Formats the camera listens for. Non-product formats are included only so we
 * can tell the customer "that's not a product barcode" (issue #22).
 */
export const DETECTED_BARCODE_TYPES: BarcodeType[] = [
  ...PRODUCT_BARCODE_TYPES,
  'qr',
  'code128',
  'code39',
  'code93',
  'itf14',
  'datamatrix',
  'pdf417',
];

export type ProductBarcodeFormat = (typeof PRODUCT_BARCODE_TYPES)[number];

export type NormalizedBarcode =
  | {
      kind: 'product';
      /** Canonical value sent to the catalog: GTIN-13 for EAN-13/UPC-A/UPC-E, 8 digits for EAN-8. */
      gtin: string;
      format: ProductBarcodeFormat;
    }
  | {
      kind: 'unsupported';
      reason: 'unsupported-format' | 'invalid-value';
      type: string;
      data: string;
    };

/**
 * Normalises a raw camera detection into a canonical product barcode.
 *
 * Platforms report the same physical barcode differently (iOS reports UPC-A as
 * a 13-digit EAN-13 with a leading 0, Android reports 12 digits), so every
 * UPC/EAN-13 code is converted to GTIN-13. The catalog should store barcodes in
 * this same canonical form.
 */
export function normalizeBarcode(type: string, data: string): NormalizedBarcode {
  const rawType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  const value = data.trim();
  const unsupported = (reason: 'unsupported-format' | 'invalid-value'): NormalizedBarcode => ({
    kind: 'unsupported',
    reason,
    type,
    data,
  });

  const format = toProductFormat(rawType);
  if (!format) return unsupported('unsupported-format');
  if (!/^\d+$/.test(value)) return unsupported('invalid-value');

  let gtin: string | null = null;
  switch (format) {
    case 'ean13':
      gtin = value.length === 13 ? value : null;
      break;
    case 'upc_a':
      // Some devices already prepend the leading 0 and report 13 digits.
      gtin = value.length === 12 ? `0${value}` : value.length === 13 && value.startsWith('0') ? value : null;
      break;
    case 'ean8':
      gtin = value.length === 8 ? value : null;
      break;
    case 'upc_e': {
      const upcA = expandUpcE(value);
      gtin = upcA ? `0${upcA}` : null;
      break;
    }
  }

  if (!gtin || !hasValidCheckDigit(gtin)) return unsupported('invalid-value');
  return { kind: 'product', gtin, format };
}

function toProductFormat(rawType: string): ProductBarcodeFormat | null {
  switch (rawType) {
    // expo-camera names, plus the native iOS names (e.g. "org.gs1.EAN-13").
    case 'ean13':
    case 'orggs1ean13':
      return 'ean13';
    case 'ean8':
    case 'orggs1ean8':
      return 'ean8';
    case 'upca':
      return 'upc_a';
    case 'upce':
    case 'orggs1upce':
      return 'upc_e';
    default:
      return null;
  }
}

/** Computes the GS1 check digit for the digits *before* the check digit. */
export function gs1CheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = Number(body[body.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

export function hasValidCheckDigit(gtin: string): boolean {
  if (!/^\d{8,14}$/.test(gtin)) return false;
  return gs1CheckDigit(gtin.slice(0, -1)) === Number(gtin[gtin.length - 1]);
}

/**
 * Expands a UPC-E code (6, 7 or 8 digits) into its 12-digit UPC-A form.
 * Returns null if the value can't be a UPC-E code.
 */
export function expandUpcE(value: string): string | null {
  let numberSystem = '0';
  let body: string;
  let check: string | null = null;

  if (value.length === 6) {
    body = value;
  } else if (value.length === 7) {
    numberSystem = value[0];
    body = value.slice(1);
  } else if (value.length === 8) {
    numberSystem = value[0];
    body = value.slice(1, 7);
    check = value[7];
  } else {
    return null;
  }
  if (numberSystem !== '0' && numberSystem !== '1') return null;

  const [d1, d2, d3, d4, d5, d6] = body;
  let manufacturerAndProduct: string;
  switch (d6) {
    case '0':
    case '1':
    case '2':
      manufacturerAndProduct = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
      break;
    case '3':
      manufacturerAndProduct = `${d1}${d2}${d3}00000${d4}${d5}`;
      break;
    case '4':
      manufacturerAndProduct = `${d1}${d2}${d3}${d4}00000${d5}`;
      break;
    default:
      manufacturerAndProduct = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;
  }

  const withoutCheck = `${numberSystem}${manufacturerAndProduct}`;
  return `${withoutCheck}${check ?? gs1CheckDigit(withoutCheck)}`;
}

/** Key used to recognise "the same barcode again" for duplicate suppression. */
export function detectionKey(barcode: NormalizedBarcode): string {
  return barcode.kind === 'product' ? `gtin:${barcode.gtin}` : `raw:${barcode.type}:${barcode.data}`;
}
