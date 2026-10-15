/** Gerador pseudoaleatório determinístico (mulberry32) a partir de um texto. */
function seeded(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = (h ^ (h >>> 16)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 29;

/** QR Code FICTÍCIO (padrão decorativo que não decodifica) com a marca "DEMONSTRAÇÃO". */
export function FakeQr({ seed }: { seed: string }) {
  const rand = seeded(seed);
  const finder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!finder(x, y) && rand() > 0.52) cells.push({ x, y });
    }
  }
  const corner = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx} y={cy} width="7" height="7" fill="currentColor" />
      <rect x={cx + 1} y={cy + 1} width="5" height="5" fill="var(--t-color-surface)" />
      <rect x={cx + 2} y={cy + 2} width="3" height="3" fill="currentColor" />
    </g>
  );
  return (
    <svg
      role="img"
      aria-label="QR Code fictício de demonstração"
      viewBox={`0 0 ${N} ${N}`}
      className="size-48 text-text"
      data-testid="fake-qr"
    >
      <rect width={N} height={N} fill="var(--t-color-surface)" />
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1" height="1" fill="currentColor" />
      ))}
      {corner(0, 0)}
      {corner(N - 7, 0)}
      {corner(0, N - 7)}
      <g transform={`rotate(-20 ${N / 2} ${N / 2})`}>
        <rect x="2" y={N / 2 - 3} width={N - 4} height="6" fill="var(--t-color-surface)" fillOpacity="0.92" />
        <rect x="2" y={N / 2 - 3} width={N - 4} height="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
        <text x={N / 2} y={N / 2 + 1.3} textAnchor="middle" fontSize="3.4" fontWeight="800" fill="currentColor">
          DEMONSTRAÇÃO
        </text>
      </g>
    </svg>
  );
}
