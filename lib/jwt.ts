import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.AUTH_SECRET;
if (!rawSecret) {
  // Fail loudly en runtime: sin AUTH_SECRET cualquiera podría forjar tokens.
  throw new Error('AUTH_SECRET no configurado — imposible firmar/verificar JWT.');
}
const SECRET = new TextEncoder().encode(rawSecret);
const ALG = 'HS256';
const ISSUER = 'quiniela-padelbox';
const EXPIRY_DAYS = 90;

export interface AppTokenPayload {
  sub: string;        // user.id
  email: string;
  role: 'USER' | 'ADMIN';
  hasPaid: boolean;
}

export async function signAppToken(payload: AppTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_DAYS}d`)
    .sign(SECRET);
}

export async function verifyAppToken(token: string): Promise<AppTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: ISSUER, algorithms: [ALG] });
    if (typeof payload.sub !== 'string') return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      role: (payload.role as 'USER' | 'ADMIN') ?? 'USER',
      hasPaid: Boolean(payload.hasPaid),
    };
  } catch {
    return null;
  }
}
