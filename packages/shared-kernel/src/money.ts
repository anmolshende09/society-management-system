/**
 * Immutable Money Value Object
 * Handles all monetary values in exact integer paise (bigint).
 * Floating-point arithmetic is strictly forbidden.
 */
export class Money {
  readonly amountPaise: bigint;
  readonly currency: "INR" = "INR";

  private constructor(paise: bigint) {
    this.amountPaise = paise;
  }

  /**
   * Create Money from exact integer paise.
   */
  static fromPaise(paise: bigint | number): Money {
    if (typeof paise === "number") {
      if (!Number.isInteger(paise)) {
        throw new TypeError(`Money paise must be an integer, got: ${paise}`);
      }
      return new Money(BigInt(paise));
    }
    return new Money(paise);
  }

  /**
   * Create Money from a base-10 decimal string representing paise (e.g. "125000").
   */
  static fromDecimalString(paiseString: string): Money {
    if (!/^-?\d+$/.test(paiseString.trim())) {
      throw new TypeError(`Invalid integer paise string: "${paiseString}"`);
    }
    return new Money(BigInt(paiseString.trim()));
  }

  /**
   * Helper to create Money from integer rupees (multiplies by 100).
   */
  static fromRupees(rupees: number | bigint): Money {
    if (typeof rupees === "number") {
      if (!Number.isInteger(rupees)) {
        throw new TypeError(
          `Rupee value must be an integer; use fromPaise for fractional amounts.`,
        );
      }
      return new Money(BigInt(rupees) * 100n);
    }
    return new Money(rupees * 100n);
  }

  static zero(): Money {
    return new Money(0n);
  }

  add(other: Money): Money {
    return new Money(this.amountPaise + other.amountPaise);
  }

  subtract(other: Money): Money {
    return new Money(this.amountPaise - other.amountPaise);
  }

  multiply(factor: number | bigint): Money {
    if (typeof factor === "number") {
      if (!Number.isInteger(factor)) {
        throw new TypeError(
          `Multiplication factor must be an integer. Use basis points or percentage.`,
        );
      }
      return new Money(this.amountPaise * BigInt(factor));
    }
    return new Money(this.amountPaise * factor);
  }

  /**
   * Compute percentage using integer basis points (1 bp = 0.01%, 10000 bp = 100%).
   * Uses half-up rounding.
   */
  applyBasisPoints(basisPoints: bigint): Money {
    const product = this.amountPaise * basisPoints;
    const rounded = (product + 5000n) / 10000n;
    return new Money(rounded);
  }

  isZero(): boolean {
    return this.amountPaise === 0n;
  }

  isPositive(): boolean {
    return this.amountPaise > 0n;
  }

  isNegative(): boolean {
    return this.amountPaise < 0n;
  }

  equals(other: Money): boolean {
    return this.amountPaise === other.amountPaise;
  }

  greaterThan(other: Money): boolean {
    return this.amountPaise > other.amountPaise;
  }

  lessThan(other: Money): boolean {
    return this.amountPaise < other.amountPaise;
  }

  /**
   * Format for display in Indian Rupees (e.g. "₹1,250.00").
   */
  formatInr(): string {
    const isNeg = this.amountPaise < 0n;
    const absPaise = isNeg ? -this.amountPaise : this.amountPaise;
    const rupees = absPaise / 100n;
    const paise = absPaise % 100n;
    const paiseStr = paise.toString().padStart(2, "0");

    // Indian Numbering System formatting: last 3 digits, then groups of 2
    const rupeesStr = rupees.toString();
    let formattedRupees = rupeesStr;
    if (rupeesStr.length > 3) {
      const last3 = rupeesStr.substring(rupeesStr.length - 3);
      const otherDigits = rupeesStr.substring(0, rupeesStr.length - 3);
      formattedRupees =
        otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
    }

    return `${isNeg ? "-" : ""}₹${formattedRupees}.${paiseStr}`;
  }

  /**
   * Serializes paise as decimal string to prevent JSON BigInt serialization errors
   * and IEEE 754 precision loss in browser JavaScript.
   */
  toJSON(): string {
    return this.amountPaise.toString();
  }

  toString(): string {
    return this.formatInr();
  }
}
