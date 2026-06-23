import { isAxiosError } from 'axios';

/**
 * Extrait un message lisible depuis une erreur Axios.
 *
 * Les endpoints renvoient souvent un 422 (ou 4xx métier) avec un corps
 * `{ detail: "..." }` où `detail` est une chaîne explicite. On la remonte telle
 * quelle dans le toast. Si `detail` est une liste de validation Pydantic ou
 * absent, on retombe sur le message générique fourni.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
  }
  return fallback;
}
