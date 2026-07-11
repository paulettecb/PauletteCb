// Cifrado del respaldo local de Cuentas Claras con código de acceso (WebCrypto).
// PBKDF2-SHA256 (310,000 iteraciones) deriva del código una llave AES-GCM 256.
// La llave vive SOLO en memoria mientras la app está abierta; en disco quedan
// salt + iv + blob cifrado. Sin el código, los datos son ilegibles — por eso
// la UI insiste tanto en descargar el respaldo JSON.

const ITERACIONES = 310000;
const te = new TextEncoder();
const td = new TextDecoder();

// base64 por bloques (el spread de String.fromCharCode revienta con arrays grandes)
function aB64(buf) {
  const bytes = new Uint8Array(buf);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

function deB64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export function nuevoSalt() {
  return aB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function derivarLlave(codigo, saltB64) {
  const material = await crypto.subtle.importKey(
    'raw', te.encode(codigo), 'PBKDF2', false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: deB64(saltB64), iterations: ITERACIONES },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// → { iv, blob } en base64
export async function cifrar(texto, llave) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const blob = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, llave, te.encode(texto));
  return { iv: aB64(iv), blob: aB64(blob) };
}

// Lanza si la llave (el código) no es la correcta — AES-GCM autentica.
export async function descifrar({ iv, blob }, llave) {
  const plano = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: deB64(iv) }, llave, deB64(blob),
  );
  return td.decode(plano);
}
