/**
 * Functional Result Pattern for explicit domain error handling.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly isOk = true;
  readonly isErr = false;

  constructor(readonly value: T) {}

  unwrap(): T {
    return this.value;
  }

  map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }
}

export class Err<T, E> {
  readonly isOk = false;
  readonly isErr = true;

  constructor(readonly error: E) {}

  unwrap(): never {
    throw this.error instanceof Error
      ? this.error
      : new Error(String(this.error));
  }

  map<U>(_fn: (val: T) => U): Result<U, E> {
    return new Err(this.error);
  }
}

export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok<T, E>(value);
}

export function err<T = never, E = unknown>(error: E): Result<T, E> {
  return new Err<T, E>(error);
}
