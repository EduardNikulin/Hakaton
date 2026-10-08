// Нормализация и проверка ролей.
// Роли бэкенда: resident | author | admin (роли "operator" на бэке нет).
export function normalizeRole(role: string | null | undefined): string {
  return (role ?? '').toLowerCase();
}

export function hasAnyRole(
  role: string | null | undefined,
  allowed: readonly string[] | null | undefined,
): boolean {
  if (!allowed || allowed.length === 0) return true;
  const current = normalizeRole(role);
  return allowed.some((r) => normalizeRole(r) === current);
}