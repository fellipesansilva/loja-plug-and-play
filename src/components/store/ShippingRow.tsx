import type { Money } from "@/domain/types";
import { shippingRow, type ShippingRowKind } from "@/lib/shipping-row";

/** Linha de frete (ou de retirada) de um resumo em <dl>. */
export function ShippingRow({
  kind,
  price,
  pending,
  testId,
}: {
  kind: ShippingRowKind;
  price?: Money;
  pending?: string;
  testId?: string;
}) {
  const { label, value } = shippingRow(kind, price, pending);
  return (
    <div className="flex justify-between gap-md" data-testid={testId ? `${testId}-row` : undefined}>
      <dt>{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}
