/**
 * Password → access level config.
 *
 * Values:
 *   'admin'          → sees all cities + the city dropdown
 *   '<city string>'  → sees only that city's data, no dropdown
 *
 * City strings must match exactly what appears in the CSV's "city/state" column.
 *
 * To add a new client account:
 *   1. Pick their city name exactly as listed below (e.g. "Bakersfield, CA")
 *   2. Add a new entry:  'TheirSecurePassword': 'Bakersfield, CA'
 *   3. Share only that password with the client — they'll see only their city.
 *
 * Available cities:
 *   Bakersfield, CA | Charleston, WV | Charlotte, NC | Laredo, TX
 *   Macon, GA       | Milwaukee, WI  | Phoenix, AZ   | St. Paul, MN
 */
export const CREDENTIALS: Record<string, string> = {
  // ── Admin ──────────────────────────────────────────────────────────────
  TowData2026: 'admin',

  // ── Client accounts ────────────────────────────────────────────────────
  'Bak#Tow!9241': 'Bakersfield, CA',
  'Chs#Tow!5837': 'Charleston, WV',
  'Clt#Tow!7463': 'Charlotte, NC',
  'Lrd#Tow!2058': 'Laredo, TX',
  'Mac#Tow!6714': 'Macon, GA',
  'Mil#Tow!3892': 'Milwaukee, WI',
  'Phx#Tow!1547': 'Phoenix, AZ',
  'Stp#Tow!8326': 'St. Paul, MN',
};

/** Returns 'admin', a city string, or null if the password is wrong. */
export function getRole(password: string): string | null {
  return CREDENTIALS[password] ?? null;
}
