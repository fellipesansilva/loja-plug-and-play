/** Evento que abre o painel do WhatsApp (o bot usa para oferecer o WhatsApp na resposta "não sei"). */
export const WHATSAPP_OPEN_EVENT = "loja-whatsapp-open";

export function openWhatsapp(): void {
  window.dispatchEvent(new CustomEvent(WHATSAPP_OPEN_EVENT));
}
