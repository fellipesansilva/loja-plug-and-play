import { describe, expect, it } from "vitest";
import { validateIdentification } from "./checkout-validation";

const base = { name: "Ana Souza", email: "ana@example.com", phone: "", cpf: "529.982.247-25", marketing: false };

describe("H6 · dados mínimos da identificação", () => {
  it("com entrega, nome, e-mail, celular e CPF são obrigatórios", () => {
    expect(Object.keys(validateIdentification({ ...base, name: "", email: "", cpf: "" })).sort()).toEqual(["cpf", "email", "name", "phone"]);
  });

  it("só produto digital: o celular é opcional, mas se digitado precisa ser válido", () => {
    expect(validateIdentification(base, { requirePhone: false })).toEqual({});
    expect(validateIdentification({ ...base, phone: "123" }, { requirePhone: false })).toEqual({ phone: "Celular inválido" });
    expect(validateIdentification({ ...base, phone: "(11) 91234-5678" }, { requirePhone: false })).toEqual({});
  });

  it("a marca de marketing nunca é obrigatória", () => {
    expect(validateIdentification({ ...base, phone: "(11) 91234-5678", marketing: false })).toEqual({});
  });
});
