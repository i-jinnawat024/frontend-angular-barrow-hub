export type SortDirection = 'asc' | 'desc';

export interface SortState {
  active: string | null;
  direction: SortDirection;
}

export const defaultSortState: SortState = {
  active: null,
  direction: 'asc',
};

export function cycleSortState(current: SortState, column: string): SortState {
  if (current.active !== column) {
    return { active: column, direction: 'asc' };
  }

  if (current.direction === 'asc') {
    return { active: column, direction: 'desc' };
  }

  return { active: null, direction: 'asc' };
}

export function compareValues(
  a: unknown,
  b: unknown,
  direction: SortDirection,
): number {
  const valueA = normalizeForCompare(a);
  const valueB = normalizeForCompare(b);

  if (valueA < valueB) {
    return direction === 'asc' ? -1 : 1;
  }

  if (valueA > valueB) {
    return direction === 'asc' ? 1 : -1;
  }

  return 0;
}

export function toSearchableString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().toLowerCase();
  }

  if (typeof value === 'string') {
    return value.toLowerCase();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return String(value).toLowerCase();
}

function normalizeForCompare(value: unknown): string | number {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  switch (typeof value) {
    case 'number':
      return value;
    case 'boolean':
      return value ? 1 : 0;
    case 'string':
      return value.toLowerCase();
    default:
      return String(value).toLowerCase();
  }
}
