import { NotificationList } from "@/components/notifications/NotificationList";
import { NotificationPreferenceForm } from "@/components/notifications/NotificationPreferenceForm";
import { requireUser } from "@/server/lib/auth-context";
import { getNotificationPreference, listNotifications, unreadNotificationCount } from "@/server/notifications/service";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [result, unread, preference] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationCount(user.id),
    getNotificationPreference(user.id),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="text-sm text-gray-600">{unread} unread notifications</p>
      <NotificationPreferenceForm initial={preference.notificationEmailPreference} />
      <NotificationList initial={result.items} />
    </div>
  );
}
