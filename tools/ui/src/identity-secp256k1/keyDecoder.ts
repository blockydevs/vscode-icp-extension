const before = '-----BEGIN'
const after = '-----END'
const endline = '-----'
const header = new RegExp(`${before}[A-Z ]+${endline}(.+)${after}[A-Z ]+${endline}`)

/**
 * Convert PEM formatted data to raw buffer.
 * @param {Buffer|String} pem
 * @returns {Buffer}
 */
export function decodePem(pem: string): string {
  if (Buffer.isBuffer(pem)) {
    pem = pem.toString('ascii');
  }

  const match = header.exec(pem.trim());

  if (match === null) {
    throw new Error('Invalid key.');
  }
  return match[1].split(' ').join('');
}