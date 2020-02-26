import _ from "lodash";

import { sendTemplatedEmail } from "./mail";
import db from "./db";

export const Notifications = {
  MESSAGES_WAITING: "messages_waiting"
};

const SES_TEMPLATE_NAMES = {
  [Notifications.MESSAGES_WAITING]: "spoke_pending_messages_reminder"
};

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}

export async function sendReminderEmails() {
  const notifications = await db.Notification.getPendingReplyNotifications();

  await asyncForEach(_.chunk(notifications, 10), async notificationChunk => {
    await asyncForEach(notificationChunk, async notification => {
      await sendTemplatedEmail({
        to: notification.email,
        template: SES_TEMPLATE_NAMES[Notifications.MESSAGES_WAITING],
        templateData: {
          first_name: notification.user_first_name,
          organization_name: notification.organization_name,
          profile_link: `${process.env.BASE_URL}/app/${notification.organization_id}/account/${notification.user_id}`,
          texter_link: `${process.env.BASE_URL}/app/${notification.organization_id}/todos`
        }
      });
    });

    await db.Notification.bulkInsert(
      notificationChunk.map(notification => ({
        email: notification.email,
        userId: notification.user_id,
        notificationType: Notifications.MESSAGES_WAITING,
        data: JSON.stringify({ notification })
      }))
    );
  });
}
