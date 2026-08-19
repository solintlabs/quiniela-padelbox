import { prisma } from '@/lib/db';

/**
 * Cliente minimal de Expo Push API.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * - Acepta hasta 100 mensajes por request.
 * - Devuelve un ticket por mensaje. Si Expo dice DeviceNotRegistered,
 *   limpiamos el token de la DB.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;            // ExpoPushToken[xxxxxx]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: 'default' | null;
  channelId?: string;    // android
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoResponse {
  data?: ExpoTicket[];
  errors?: Array<{ message: string }>;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Envia uno o muchos mensajes. Limpia tokens invalidos en DB. */
export async function sendPushMessages(
  messages: PushMessage[],
): Promise<{ sent: number; cleaned: number; errors: string[] }> {
  if (messages.length === 0) return { sent: 0, cleaned: 0, errors: [] };

  let sent = 0;
  const invalidTokens: string[] = [];
  const errors: string[] = [];

  for (const batch of chunk(messages, 100)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(
          batch.map((m) => ({
            to: m.to,
            title: m.title,
            body: m.body,
            data: m.data,
            sound: m.sound ?? 'default',
            badge: m.badge,
            channelId: m.channelId ?? 'default',
            priority: 'high',
          })),
        ),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('[push] HTTP', res.status, txt);
        errors.push(`HTTP ${res.status}: ${txt.slice(0, 120)}`);
        continue;
      }

      const json = (await res.json()) as ExpoResponse;
      const tickets = json.data ?? [];
      tickets.forEach((t, i) => {
        if (t.status === 'ok') {
          sent++;
        } else if (t.details?.error === 'DeviceNotRegistered') {
          // SOLO este error significa "el device ya no existe" → limpiar.
          invalidTokens.push(batch[i].to);
        } else if (t.status === 'error') {
          // InvalidCredentials (APNs key mal/ausente), MessageTooBig, etc.
          // son problemas NUESTROS de config — NO borrar el token, solo loguear.
          // Antes borrabamos en InvalidCredentials y eso vaciaba la tabla de
          // devices cada vez que el push fallaba por falta de APNs key.
          const err = t.details?.error ?? t.message ?? 'error desconocido';
          console.error('[push] ticket error (no se borra token):', err);
          errors.push(err);
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[push] fetch error:', msg);
      errors.push(msg);
    }
  }

  let cleaned = 0;
  if (invalidTokens.length > 0) {
    const r = await prisma.pushDevice.deleteMany({
      where: { expoToken: { in: invalidTokens } },
    });
    cleaned = r.count;
  }

  // Dedup de errores para no repetir el mismo 50 veces.
  return { sent, cleaned, errors: [...new Set(errors)] };
}

/** Envia a todos los devices de un set de userIds. */
export async function sendPushToUsers(
  userIds: string[],
  build: (userId: string) => Omit<PushMessage, 'to'>,
): Promise<{ sent: number; cleaned: number; errors: string[] }> {
  if (userIds.length === 0) return { sent: 0, cleaned: 0, errors: [] };

  const devices = await prisma.pushDevice.findMany({
    where: { userId: { in: userIds } },
  });
  if (devices.length === 0) return { sent: 0, cleaned: 0, errors: ['sin dispositivos registrados'] };

  const messages: PushMessage[] = devices.map((d) => ({
    to: d.expoToken,
    ...build(d.userId),
  }));
  return sendPushMessages(messages);
}

/**
 * De un grupo de usuarios, quiénes NO tienen la app instalada.
 *
 * Sirve para que el email sea un RESPALDO del push, no un duplicado: a quien
 * tiene la app le llega la notificación y no se le gasta un correo. Con esto
 * el consumo de Resend baja a la gente que de verdad no puede recibir push.
 */
export async function usersWithoutPush(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const devices = await prisma.pushDevice.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
  });
  const withPush = new Set(devices.map((d) => d.userId));
  return userIds.filter((id) => !withPush.has(id));
}
