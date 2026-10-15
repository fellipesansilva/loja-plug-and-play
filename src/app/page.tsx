import { redirect } from "next/navigation";
import { DEFAULT_PRESET_SLUG } from "@/config";

/** Raiz: vai para o preset padrão (o proxy já redireciona antes; esta página é a rede de segurança). */
export default function RootPage() {
  redirect(`/${DEFAULT_PRESET_SLUG}`);
}
