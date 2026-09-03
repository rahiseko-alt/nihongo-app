export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const rnd = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${rnd(8)}-${rnd(4)}-4${rnd(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${rnd(3)}-${rnd(12)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
