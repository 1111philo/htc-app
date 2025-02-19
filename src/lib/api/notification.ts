/** Notification-related API calls  */

import * as API from "aws-amplify/api";

export async function addGuestNotification(n: Partial<GuestNotification>): Promise<boolean> {
  try {
    const response =
      await API.post({
        apiName: 'auth',
        path: '/addGuestNotification',
        options: { body: { ...n, status: "Active" } },
      }).response;
    if (response.statusCode === 200) {
      return true;
    } else {
      console.error("There was an error creating the notification. Response:", response);
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function toggleGuestNotificationStatus(
  notificationId: number
): Promise<boolean> {
  try {
    const response = await API.post({
      apiName: "auth",
      path: "/toggleGuestNotificationStatus",
      options: { body: { notification_id: notificationId } },
    }).response;
    const { success } = (await response.body.json()) as SuccessResponse;
    return success;
  } catch (err) {
    console.error(err)
    return false
  }
}
