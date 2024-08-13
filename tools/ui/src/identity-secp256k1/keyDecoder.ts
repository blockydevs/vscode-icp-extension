const before = '-----BEGIN'
const after = '-----END'
const endline = '-----'
const header = new RegExp(`^${before} ([A-Z ]+)${endline}`)

/**
 * Convert PEM formatted data to raw buffer.
 * @param {Buffer|String} pem
 * @returns {Buffer}
 */
export function decodePem(pem: string): string {
  if (Buffer.isBuffer(pem)) {
    pem = pem.toString('ascii');
  }

  const lines = pem.trim().split('\n');

  if (lines.length < 3) {
    throw new Error('Invalid PEM data.');
  }

  const match = header.exec(lines[0]);

  if (match === null) {
    throw new Error('Invalid label.');
  }

  const label = match[1];
  let i = 1;

  for (; i < lines.length; ++i) {
    if (lines[i].startsWith(after)) {
      break;
    }
  }

  const footer = new RegExp(`^${after} ${label}${endline}\r?\n?$`);

  if (footer.exec(lines[i]) === null) {
    throw new Error('Invalid end of file.');
  }

  const body = lines.slice(1, i).join('\n').replace(/\r?\n/g, '');
  return body;
}