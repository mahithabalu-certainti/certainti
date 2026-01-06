
import { constants, statusMessage } from "../utils/constant";
import { Op } from 'sequelize';
import { Notification } from "../models/notificationModel";
import { NotificationStatus } from "../models/notificationStatusModel";
import { getWebPubSubClient } from "../utils/helpers";
class NotificationService {


  /**
   * Retrieves paginated notifications for a given user, including their status details.
   *
   * @param {string} userId - The ID of the user whose notifications are to be listed.
   * @param {number} [limit=10] - The maximum number of notifications to return.
   * @param {number} [offset=0] - The number of notifications to skip (for pagination).
   * @returns {Promise<object>} - A promise resolving to an object containing the notifications array and total count.
   */
  async listNotifications(
    userId: string,
    limit: number = 5,
    offset: number = 0
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notifications: any; total: number; nextOffset: number | null; unreadCount: number };
  }> {
    const offsetNum = Number(offset);
const limitNum = Number(limit);
  const { count, rows } = await Notification.findAndCountAll({
  where: { user_rid: userId },
  limit: limitNum,
  offset : offsetNum,
  distinct: true,       
  col: 'rid',            
  order: [["created_datetime", "DESC"]],
  include: [
    {
      model: NotificationStatus,
      as: "notificationstatus",
      attributes: ["status_description", "status_name"],
      required: false,
    },
  ],
});


    // Get the 'Unread' status rid
    const unreadStatus = await NotificationStatus.findOne({
      where: { status_name: 'Unread' },
      attributes: ['rid'],
    });

    // Count unread notifications for the user
    let unreadCount = 0;
    if (unreadStatus) {
      unreadCount = await Notification.count({
        where: {
          user_rid: userId,
          status_rid: unreadStatus.rid,
        },
      });
    }

    // Calculate nextOffset for pagination
    let nextOffset: number | null = null; 
    if (count > 0 && offsetNum + limitNum < count) {
      nextOffset = offsetNum + limitNum;
    }
    
    return {
      statusCode: constants.SUCCESS,
      message: statusMessage.orgRetrieved,
      data: {
        notifications: rows,
        total: count,
        nextOffset,
        unreadCount,
      },
    };
  }


  /**
   * Updates all notifications for a user from 'Unread' to 'Read' status.
   *
   * @param {string} userId - The ID of the user whose notifications should be marked as read.
   * @returns {Promise<object>} - A promise resolving to an object with the update result.
   *
   * This method:
   * - Fetches the rids for both 'Read' and 'Unread' statuses from NotificationStatus.
   * - Updates all notifications for the user with 'Unread' status to 'Read' status.
   * - Sets modified_by and modified_datetime fields accordingly.
   * - Returns a structured response with status code, message, and update result.
   */
  async updateNotificationStatus(userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { notifications: any };
  }> {
    const notificationStatuses: NotificationStatus[] = await NotificationStatus.findAll({
      where: {
        status_name: { [Op.in]: ['Read', 'Unread'] }
      }
    });
    const readStatus = notificationStatuses.find(s => s.status_name === 'Read');
    const unreadStatus = notificationStatuses.find(s => s.status_name === 'Unread');
    const result = await Notification.update(
      {
        status_rid: readStatus?.rid, // Set to 'Read' status rid
        modified_by: userId,
        modified_datetime: new Date(),
      },
      {
        where: {  
          user_rid: userId,
          status_rid: unreadStatus?.rid // Only update notifications with 'Unread' status
        }
      }
    );
    return {
      statusCode: constants.SUCCESS,
      message: statusMessage.orgRetrieved,
      data: {
        notifications: result,
      },
    };
  }

  async getWebsocketUrl(userId: string): Promise<{
    statusCode: number;
    message: string;  
    errorMessage?: string;
    data?: { webSocketUrl: string };
  }> {
    let token = { token: "" };
    const webPubSubClient = await getWebPubSubClient();
    await webPubSubClient.closeUserConnections(userId);
    token = await webPubSubClient.getClientAccessToken({ userId: userId, expirationTimeInMinutes: 1400 });
    return {
      statusCode: constants.SUCCESS,
      message: statusMessage.orgRetrieved,
      data: {
        webSocketUrl: token.token,
      },
    };
  }
}


export default NotificationService;
