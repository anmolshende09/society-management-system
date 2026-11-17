import { describe, it, expect } from "vitest";
import { Money } from "./money.js";

describe("Money Value Object", () => {
  it("creates money from integer paise", () => {
    const m = Money.fromPaise(125000n);
    expect(m.amountPaise).toBe(125000n);
    expect(m.currency).toBe("INR");
  });

  it("rejects floating point amounts in fromPaise", () => {
    expect(() => Money.fromPaise(125.5)).toThrow(TypeError);
  });

  it("parses base-10 string paise", () => {
    const m = Money.fromDecimalString("450000");
    expect(m.amountPaise).toBe(450000n);
  });

  it("adds and subtracts money with exact integer arithmetic", () => {
    const a = Money.fromPaise(10000n);
    const b = Money.fromPaise(5000n);

    expect(a.add(b).amountPaise).toBe(15000n);
    expect(a.subtract(b).amountPaise).toBe(5000n);
  });

  it("formats to Indian Rupee notation correctly", () => {
    const m1 = Money.fromPaise(125000n); // 1,250.00
    expect(m1.formatInr()).toBe("₹1,250.00");

    const m2 = Money.fromPaise(123456789n); // 12,34,567.89
    expect(m2.formatInr()).toBe("₹12,34,567.89");

    const m3 = Money.fromPaise(-5000n);
    expect(m3.formatInr()).toBe("-₹50.00");
  });

  it("serializes to JSON as a string to prevent precision loss", () => {
    const m = Money.fromPaise(987654321012n);
    expect(m.toJSON()).toBe("987654321012");
  });
});
