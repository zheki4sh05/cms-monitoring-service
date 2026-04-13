export const UUID_GENERATOR = Symbol('UUID_GENERATOR');

export interface UuidGenerator {
  generate(): string;
}
