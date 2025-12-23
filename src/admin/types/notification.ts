import { CommonApiResponse } from "../../common-service";

export interface NotificationApiResponse extends CommonApiResponse {
    data: {
      notifications: any[];
      total: number;
      nextOffset: number;
    };
  }

  export interface NotificationParams {
    nextOffset?: number;
    limit?: number;
  }

  export interface updateNotificationAPiResponse extends CommonApiResponse {
    data:{
      notifications:number[]
    }
  }