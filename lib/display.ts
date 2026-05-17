/**
 * Display name "público" para mostrar en rankings, predicciones de otros, etc.
 * Evita filtrar el email completo a otros socios (anti-scraping).
 *
 * - Si tiene `name`: lo usa tal cual.
 * - Si no: máscara el email (ej: "jo**@gmail.com" o "j****@gmail.com").
 *
 * El email completo SOLO se devuelve para el propio user (isMe = true) o admin.
 */
export function publicDisplayName({
  name,
  email,
}: { name: string | null; email: string }): string {
  if (name && name.trim().length > 0) return name.trim();
  return maskEmail(email);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = Math.min(2, Math.max(1, local.length - 1));
  const hidden = '*'.repeat(Math.max(2, local.length - visible));
  return `${local.slice(0, visible)}${hidden}@${domain}`;
}
