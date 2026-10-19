import { describe, expect, it } from "vitest";
import type { Order, OrderStatus, Preset } from "@/domain/types";
import { getPreset } from "@/presets";
import { assertValidPreset, validatePreset } from "@/presets/validate";
import { createDemoStore } from "@/store/demo-store";
import {
  accessFor,
  completedLessons,
  cursosProblems,
  formatWorkload,
  isCourse,
  lockedReason,
  nextLesson,
  progressPercent,
  purchasedCourses,
  totalMinutes,
  withLessonDone,
  type CourseProduct,
} from "./courses";

const faisca = getPreset("faisca")!;
const courses = faisca.products.filter(isCourse);
const [foto, desenho] = courses;
const trama = getPreset("trama-studio")!;

const orderOf = (id: string, productId: string, status: OrderStatus): Order => ({
  id,
  items: [{ productId, name: "Curso", quantity: 1, unitPrice: 1000 }],
  customer: { name: "Ana Souza", email: "ana@example.com", phone: "" },
  delivery: { type: "digital" },
  payment: { method: "pix" },
  status,
  createdAt: "2026-10-19T10:00:00-03:00",
  total: 1000,
});

describe("carga horária", () => {
  it("é a soma das aulas, formatada em horas e minutos", () => {
    expect(formatWorkload(45)).toBe("45 min");
    expect(formatWorkload(180)).toBe("3 h");
    expect(formatWorkload(160)).toBe("2 h 40 min");
    for (const c of courses) expect(totalMinutes(c.course)).toBe(c.course.lessons.reduce((s, l) => s + l.minutes, 0));
  });
});

describe("acesso ao curso pelo pedido", () => {
  it("sem pedido do curso: nenhum acesso", () => {
    expect(accessFor([], foto.id)).toBeNull();
    expect(accessFor([orderOf("FS-1", desenho.id, "pago")], foto.id)).toBeNull();
  });

  it("pago ou entregue libera; aguardando pagamento e cancelado bloqueiam, cada um com o seu motivo", () => {
    expect(accessFor([orderOf("FS-1", foto.id, "pago")], foto.id)).toEqual({ status: "liberado", orderId: "FS-1" });
    expect(accessFor([orderOf("FS-1", foto.id, "entregue")], foto.id)?.status).toBe("liberado");
    expect(accessFor([orderOf("FS-1", foto.id, "aguardando_pagamento")], foto.id)).toEqual({ status: "aguardando", orderId: "FS-1" });
    expect(accessFor([orderOf("FS-1", foto.id, "cancelado")], foto.id)).toEqual({ status: "cancelado", orderId: "FS-1" });
  });

  it("um pedido pago vale mesmo havendo outro cancelado do mesmo curso", () => {
    expect(accessFor([orderOf("FS-2", foto.id, "cancelado"), orderOf("FS-1", foto.id, "pago")], foto.id)).toEqual({ status: "liberado", orderId: "FS-1" });
  });

  it("o motivo do bloqueio cita o pedido (texto do preset)", () => {
    const texts = faisca.config.cursos!;
    expect(lockedReason({ status: "aguardando", orderId: "FS-1001" }, texts)).toContain("FS-1001");
    expect(lockedReason({ status: "aguardando", orderId: "FS-1001" }, texts)).toBe(texts.lockedAwaiting.replace("{pedido}", "FS-1001"));
    expect(lockedReason({ status: "cancelado", orderId: "FS-1002" }, texts)).toBe(texts.lockedCanceled.replace("{pedido}", "FS-1002"));
    expect(lockedReason({ status: "liberado", orderId: "FS-1" }, texts)).toBe("");
  });
});

describe("Meus cursos: só o que foi comprado neste navegador", () => {
  it("lista cada curso comprado uma vez, do pedido mais recente ao mais antigo, e ignora o que não é curso", () => {
    const orders = [orderOf("FS-3", desenho.id, "aguardando_pagamento"), orderOf("FS-2", foto.id, "pago"), orderOf("FS-1", desenho.id, "pago"), orderOf("TS-1", trama.products[0].id, "pago")];
    const list = purchasedCourses(orders, [...faisca.products, ...trama.products]);
    expect(list.map((x) => x.product.id)).toEqual([desenho.id, foto.id]);
    expect(list[0].access.status).toBe("liberado"); // o pago vale mais que o aguardando do mesmo curso
  });

  it("sem pedidos, a lista é vazia", () => {
    expect(purchasedCourses([], faisca.products)).toEqual([]);
  });
});

describe("progresso do aluno", () => {
  const total = foto.course.lessons.length;

  it("concluir aula atualiza a porcentagem; concluir de novo não muda nada", () => {
    let progress = withLessonDone({}, foto, foto.course.lessons[0].id);
    expect(completedLessons(progress, foto)).toEqual([foto.course.lessons[0].id]);
    expect(progressPercent(progress, foto)).toBe(Math.round((1 / total) * 100));
    expect(withLessonDone(progress, foto, foto.course.lessons[0].id)).toBe(progress);
    for (const l of foto.course.lessons) progress = withLessonDone(progress, foto, l.id);
    expect(progressPercent(progress, foto)).toBe(100);
    expect(nextLesson(progress, foto)).toBeUndefined();
  });

  it("aula que não existe no curso não conta, e o progresso de um curso não vaza para outro", () => {
    const progress = withLessonDone({}, foto, "nao-existe");
    expect(progress).toEqual({});
    const done = withLessonDone({}, foto, foto.course.lessons[1].id);
    expect(progressPercent(done, desenho)).toBe(0);
    expect(completedLessons({ [foto.id]: ["nao-existe", foto.course.lessons[2].id] }, foto)).toEqual([foto.course.lessons[2].id]);
  });

  it("a próxima aula é a primeira ainda não concluída", () => {
    expect(nextLesson({}, foto)?.id).toBe(foto.course.lessons[0].id);
    expect(nextLesson({ [foto.id]: [foto.course.lessons[0].id] }, foto)?.id).toBe(foto.course.lessons[1].id);
  });

  it("curso sem aulas tem 0% (sem dividir por zero)", () => {
    const vazio = { ...foto, course: { ...foto.course, lessons: [] } } as CourseProduct;
    expect(progressPercent({}, vazio)).toBe(0);
  });
});

describe("área do aluno no store (um por navegador, por loja)", () => {
  const novo = () => createDemoStore(faisca);
  const comprar = (store: ReturnType<typeof novo>, status: OrderStatus = "aguardando_pagamento") => store.getState().placeOrder(orderOf("FS-1001", foto.id, status));

  it("curso bloqueado sem pagamento aprovado: concluir aula não grava progresso", () => {
    const store = novo();
    comprar(store);
    expect(store.getState().completeLesson(foto.id, foto.course.lessons[0].id)).toBe(false);
    expect(store.getState().progress).toEqual({});
    store.getState().setOrderStatus("FS-1001", "cancelado");
    expect(store.getState().completeLesson(foto.id, foto.course.lessons[0].id)).toBe(false);
    expect(store.getState().progress).toEqual({});
  });

  it("sem nenhum pedido do curso também não grava", () => {
    const store = novo();
    expect(store.getState().completeLesson(foto.id, foto.course.lessons[0].id)).toBe(false);
  });

  it("pago → entregue: o acesso segue liberado e o progresso é mantido", () => {
    const store = novo();
    comprar(store);
    store.getState().setOrderStatus("FS-1001", "pago");
    expect(store.getState().completeLesson(foto.id, foto.course.lessons[0].id)).toBe(true);
    expect(store.getState().completeLesson(foto.id, foto.course.lessons[0].id)).toBe(false); // já concluída
    expect(store.getState().changeOrderStatus("FS-1001", "entregue")).toBe(true); // regra do produto digital: pago → entregue
    expect(accessFor(store.getState().orders, foto.id)?.status).toBe("liberado");
    expect(completedLessons(store.getState().progress, foto)).toEqual([foto.course.lessons[0].id]);
  });

  it("reset apaga cursos comprados e progresso", () => {
    const store = novo();
    comprar(store, "pago");
    store.getState().completeLesson(foto.id, foto.course.lessons[0].id);
    expect(purchasedCourses(store.getState().orders, store.getState().products)).toHaveLength(1);
    store.getState().reset();
    expect(store.getState().orders).toEqual([]);
    expect(store.getState().progress).toEqual({});
    expect(purchasedCourses(store.getState().orders, store.getState().products)).toEqual([]);
  });

  it("as outras lojas nascem sem progresso", () => {
    expect(createDemoStore(trama).getState().progress).toEqual({});
  });
});

describe("o build recusa preset de cursos inválido", () => {
  const com = (mudar: (p: Preset) => void): Preset => {
    const p = structuredClone(faisca);
    mudar(p);
    return p;
  };

  it("a Faísca é válida", () => {
    expect(validatePreset(faisca)).toEqual([]);
    expect(cursosProblems(faisca)).toEqual([]);
  });

  it("texto da área do aluno faltando", () => {
    const p = com((x) => {
      x.config.cursos!.accessLabel = "";
    });
    expect(() => assertValidPreset(p)).toThrow(/Preset "faisca" inválido[\s\S]*config\.cursos: informe todos os textos/);
  });

  it("motivo de bloqueio sem o número do pedido", () => {
    const p = com((x) => {
      x.config.cursos!.lockedAwaiting = "Curso bloqueado.";
    });
    expect(() => assertValidPreset(p)).toThrow(/precisam conter \{pedido\}/);
  });

  it("curso sem aulas, com aula repetida ou duração inválida", () => {
    expect(() => assertValidPreset(com((x) => (x.products[0].course!.lessons = [])))).toThrow(/informe 2 ou mais aulas/);
    expect(() => assertValidPreset(com((x) => (x.products[0].course!.lessons[1].id = x.products[0].course!.lessons[0].id)))).toThrow(/ids de aula vazios ou repetidos/);
    expect(() => assertValidPreset(com((x) => (x.products[0].course!.lessons[0].minutes = 0)))).toThrow(/minutos inteiros e positivos/);
  });

  it("instrutor da demonstração sem a marca de fictício", () => {
    const p = com((x) => (x.products[0].course!.instructorNote = "Professora premiada."));
    expect(() => assertValidPreset(p)).toThrow(/marcado como fictício/);
  });

  it("curso que não é produto digital", () => {
    const p = com((x) => (x.products[0].type = "physical"));
    expect(() => assertValidPreset(p)).toThrow(/curso é produto digital/);
  });

  it("curso numa loja sem o módulo, ou o módulo junto com o modo orçamento", () => {
    const sem = com((x) => (x.config.modules.cursos = false));
    expect(() => assertValidPreset(sem)).toThrow(/o módulo cursos está desligado/);
    const orc = com((x) => (x.config.modules.orcamento = { enabled: true }));
    expect(() => assertValidPreset(orc)).toThrow(/não pode coexistir com o modo orçamento/);
  });

  it("produto digital sem o texto de produto digital (política) derruba o build", () => {
    const p = com((x) => (x.config.policies.digital = ""));
    expect(() => assertValidPreset(p)).toThrow(/config\.policies\.digital/);
  });

  it("as outras lojas não têm o módulo nem curso", () => {
    for (const p of ["trama-studio", "forno-da-vila", "arca-inflaveis"]) {
      const preset = getPreset(p)!;
      expect(preset.config.modules.cursos, p).not.toBe(true);
      expect(preset.products.some((x) => x.course), p).toBe(false);
    }
  });
});
