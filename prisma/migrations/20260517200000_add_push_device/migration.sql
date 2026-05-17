-- PushDevice: token Expo por dispositivo (un user puede tener varios)
CREATE TABLE "PushDevice" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "expoToken"   TEXT NOT NULL,
  "platform"    TEXT NOT NULL,
  "appVersion"  TEXT,
  "lastUsedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushDevice_expoToken_key" ON "PushDevice"("expoToken");
CREATE INDEX "PushDevice_userId_idx" ON "PushDevice"("userId");

ALTER TABLE "PushDevice"
ADD CONSTRAINT "PushDevice_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
