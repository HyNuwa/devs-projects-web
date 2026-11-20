import { registerDecorator, type ValidationOptions } from 'class-validator';

/**
 * Names an account may not use: anonymous entries are shown as «Anónimo», so
 * an account with that name would pass for an anonymous author and the reverse.
 */
const RESERVED = new Set([
  'anonimo',
  'anonima',
  'anonime',
  'anonimx',
  'anonymous',
]);

/** Compares without case, accents or surrounding spaces. */
export function isReservedName(name: string) {
  const plain = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
  return RESERVED.has(plain);
}

export function NotReservedName(options?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'notReservedName',
      target: target.constructor,
      propertyName,
      options: {
        message: 'Ese nombre está reservado.',
        ...options,
      },
      validator: {
        validate: (value: unknown) =>
          typeof value !== 'string' || !isReservedName(value),
      },
    });
  };
}
