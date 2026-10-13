/** Gera um SVG de placeholder local (sem imagens de terceiros). */
export function placeholderSvg(label: string, hex: string): string {
  const color = /^[0-9a-fA-F]{6}$/.test(hex) ? `#${hex}` : "#999999";
  const text = label
    .slice(0, 40)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${text}"><rect width="600" height="600" fill="${color}" fill-opacity="0.18"/><rect x="40" y="40" width="520" height="520" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="14 10"/><text x="300" y="310" text-anchor="middle" font-family="sans-serif" font-size="30" fill="${color}">${text}</text></svg>`;
}
