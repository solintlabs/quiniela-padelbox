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
export async function sendPushMessages(messages: PushMessage[]): Promise<{ sent: number; cleaned: number }> {
  if (messages.length === 0) return { sent: 0, cleaned: 0 };

  let sent = 0;
  const invalidTokens: string[] = [];

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
        console.error('[push] HTTP', res.status, await res.text().catch(() => ''));
        continue;
      }

      const json = (await res.json()) as ExpoResponse;
      const tickets = json.data ?? [];
      tickets.forEach((t, i) => {
        if (t.status === 'ok') {
          sent++;
        } else if (
          t.details?.error === 'DeviceNotRegistered' ||
          t.details?.error === 'InvalidCredentials'
        ) {
          invalidTokens.push(batch[i].to);
        }
      });
    } catch (e) {
      console.error('[push] fetch error:', e instanceof Error ? e.message : e);
    }
  }

  let cleaned = 0;
  if (invalidTokens.length > 0) {
    const r = await prisma.pushDevice.deleteMany({
      where: { expoToken: { in: invalidTokens } },
    });
    cleaned = r.count;
  }

  return { sent, cleaned };
}

/** Envia a todos los devices de un set de userIds. */
export async function sendPushToUsers(
  userIds: string[],
  build: (userId: string) => Omit<PushMessage, 'to'>,
): Promise<{ sent: number; cleaned: number }> {
  if (userIds.length === 0) return { sent: 0, cleaned: 0 };

  const devices = await prisma.pushDevice.findMany({
    where: { userId: { in: userIds } },
  });
  if (devices.length === 0) return { sent: 0, cleaned: 0 };

  const messages: PushMessage[] = devices.map((d) => ({
    to: d.expoToken,
    ...build(d.userId),
  }));
  return sendPushMessages(messages);
}
