// 加密安全随机数。Node 18+ 与浏览器都有 globalThis.crypto。
export function secureInt(n: number): number {
  if (n <= 0) throw new Error("n must be positive");
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x: number;
  do { globalThis.crypto.getRandomValues(buf); x = buf[0]; } while (x >= max);
  return x % n;
}

export function secureShuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = secureInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** 以 p 的概率返回 true */
export function secureChance(p: number): boolean { return secureInt(10000) < Math.round(p * 10000); }
