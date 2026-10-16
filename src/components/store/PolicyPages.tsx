"use client";

import type { ReactNode } from "react";
import { PageTitle } from "@/components/store/PageTitle";
import { StoreLink } from "@/components/store/StoreLink";
import { useDemoStore } from "@/store/demo-store";

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-page px-md py-lg">
      <PageTitle title={title} />
      <h1 className="text-3xl">{title}</h1>
      <div className="mt-md flex flex-col gap-lg">{children}</div>
    </section>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-titulo`} data-testid={id} className="flex flex-col gap-sm">
      <h2 id={`${id}-titulo`} className="text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-lg">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** Trocas e devoluções: arrependimento (a regra é a lei; prazo e condições vêm do preset) e troca por defeito. */
export function ExchangeView() {
  const policies = useDemoStore((s) => s.config.policies);
  const hasDigital = useDemoStore((s) => s.products.some((p) => p.type === "digital"));
  return (
    <Page title="Trocas e devoluções">
      <Block id="arrependimento" title="Direito de arrependimento">
        <p>
          Você pode desistir da compra em até <strong data-testid="regret-days">{policies.regretDays} dias</strong> a partir do recebimento, sem precisar
          dar motivo (Código de Defesa do Consumidor, art. 49). O reembolso é integral, com o frete incluso.
        </p>
        <p>{policies.regretConditions}</p>
        <p>
          Para pedir, use o formulário em{" "}
          <StoreLink href="/arrependimento" className="font-bold underline" data-testid="regret-link">
            Desistir da compra
          </StoreLink>
          .
        </p>
      </Block>
      <Block id="defeito" title="Troca por defeito">
        <p>
          Prazo: <strong data-testid="defect-days">{policies.defect.days} dias</strong> a partir do recebimento.
        </p>
        <p>{policies.defect.conditions}</p>
      </Block>
      {hasDigital && policies.digital && (
        <Block id="digital" title="Produtos digitais">
          <p>{policies.digital}</p>
        </Block>
      )}
    </Page>
  );
}

/** Condições comerciais (loja em orçamento, no lugar de Trocas e devoluções): produção, frete e garantia vêm do preset. */
export function CommercialTermsView() {
  const policies = useDemoStore((s) => s.config.policies);
  const commercial = policies.commercial;
  return (
    <Page title="Condições comerciais">
      <Block id="cond-producao" title="Prazo de produção">
        <p>{commercial?.production}</p>
      </Block>
      <Block id="cond-frete" title="Frete">
        <p>{commercial?.freight}</p>
      </Block>
      <Block id="cond-garantia" title="Garantia">
        <p>
          Prazo: <strong data-testid="defect-days">{policies.defect.days} dias</strong> contra defeito de fabricação.
        </p>
        <p>{policies.defect.conditions}</p>
      </Block>
      <p className="text-sm text-muted">Os preços e prazos finais de cada projeto vêm na proposta comercial enviada depois do pedido de orçamento.</p>
    </Page>
  );
}

/** Política de privacidade (LGPD): as seis seções vêm do preset. */
export function PrivacyView() {
  const { privacy } = useDemoStore((s) => s.config.policies);
  return (
    <Page title="Política de privacidade">
      <Block id="priv-dados" title="Dados coletados">
        <Bullets items={privacy.dataCollected} />
      </Block>
      <Block id="priv-finalidade" title="Finalidade">
        <p>{privacy.purpose}</p>
      </Block>
      <Block id="priv-guarda" title="Prazo de guarda">
        <p>{privacy.retention}</p>
      </Block>
      <Block id="priv-compartilhamento" title="Compartilhamento">
        <Bullets items={privacy.sharing} />
      </Block>
      <Block id="priv-direitos" title="Seus direitos como titular">
        <Bullets items={privacy.rights} />
      </Block>
      <Block id="priv-responsavel" title="Responsável pelos dados">
        <p>
          {privacy.controller.name} ·{" "}
          <a href={`mailto:${privacy.controller.email}`} className="underline">
            {privacy.controller.email}
          </a>
        </p>
      </Block>
    </Page>
  );
}

export function AboutView() {
  const about = useDemoStore((s) => s.config.policies.about);
  return (
    <Page title="Sobre">
      <p>{about}</p>
    </Page>
  );
}
