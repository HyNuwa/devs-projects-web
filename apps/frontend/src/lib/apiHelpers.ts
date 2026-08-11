import { AxiosResponse } from 'axios';

/** Extrae el cuerpo de una respuesta axios tipada. */
export function getData<T>(res: AxiosResponse<T>): T {
  return res.data;
}

/** Normaliza un error de axios a un mensaje legible. */
export function getApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) return data.message.join(', ');
  }
  return 'Ocurrió un error inesperado';
}
