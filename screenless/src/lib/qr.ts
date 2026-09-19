import qrcode from 'qrcode-generator';

/**
 * QR geometry for the treasure badges, as one path.
 *
 * Kept apart from the component that draws it so it can be checked in plain
 * Node against the library's own renderer: a QR drawn with rows and columns
 * the wrong way round looks perfectly plausible and scans on nothing.
 *
 * Badge payloads are upper case letters, digits and colons, which is QR
 * alphanumeric mode and keeps the printed code at its smallest, easiest to
 * scan size. Error correction M survives a crease or a thumb over a corner.
 */

/** Quiet zone in modules. Scanners need it; four is the standard. */
export const QR_QUIET = 4;

const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]*$/;

export type QrPath = {
  /** SVG path data, one rectangle per run of dark modules. */
  d: string;
  /** Width of the code in modules, quiet zone included. */
  size: number;
};

export function qrPath(value: string): QrPath {
  const qr = qrcode(0, 'M');
  qr.addData(value, ALPHANUMERIC.test(value) ? 'Alphanumeric' : 'Byte');
  qr.make();

  const count = qr.getModuleCount();
  let d = '';
  for (let row = 0; row < count; row += 1) {
    let col = 0;
    while (col < count) {
      if (!qr.isDark(row, col)) {
        col += 1;
        continue;
      }
      let end = col;
      while (end < count && qr.isDark(row, end)) end += 1;
      // A row is a y, a column is an x. Swapping them mirrors the code.
      d += `M${col + QR_QUIET} ${row + QR_QUIET}h${end - col}v1h-${end - col}z`;
      col = end;
    }
  }
  return { d, size: count + QR_QUIET * 2 };
}

/** The code as SVG markup, for the printed sheet. */
export function qrSvgMarkup(value: string, size: number): string {
  const { d, size: modules } = qrPath(value);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${modules} ${modules}" shape-rendering="crispEdges">` +
    `<rect width="${modules}" height="${modules}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`
  );
}
