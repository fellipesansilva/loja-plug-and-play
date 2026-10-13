import { placeholderSvg } from "@/theme/placeholder";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const svg = placeholderSvg(searchParams.get("l") ?? "Imagem", searchParams.get("c") ?? "");
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
