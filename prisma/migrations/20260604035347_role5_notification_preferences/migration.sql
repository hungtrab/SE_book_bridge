-- CreateEnum
CREATE TYPE "NotificationEmailPreference" AS ENUM ('IMMEDIATE', 'DAILY', 'OFF');

-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'MODERATION_ACTION';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "emailSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "isSystemGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetMessageId" TEXT,
ALTER COLUMN "filerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationEmailPreference" "NotificationEmailPreference" NOT NULL DEFAULT 'DAILY';

-- CreateIndex
CREATE INDEX "Notification_emailSentAt_createdAt_idx" ON "Notification"("emailSentAt", "createdAt");

-- CreateIndex
CREATE INDEX "Report_targetUserId_idx" ON "Report"("targetUserId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetMessageId_fkey" FOREIGN KEY ("targetMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
