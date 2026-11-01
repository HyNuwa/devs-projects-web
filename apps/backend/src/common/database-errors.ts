import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma';

export async function databaseWrite<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (['P2002', 'P2003', 'P2034'].includes(error.code))
        throw new ConflictException(
          'La operación entra en conflicto con datos existentes',
        );
      if (error.code === 'P2025')
        throw new NotFoundException('Registro no encontrado');
    }
    throw error;
  }
}
