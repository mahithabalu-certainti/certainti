import fetch from "node-fetch";
import { IActivityMeeting } from "./types";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client/lib/src/Client";


/**
 * Schedules a meeting in Microsoft Teams using Graph API
 * @param activityRequest Meeting details
 * @param userId User scheduling the meeting
 */
export async function scheduleTeamsMeetingUtil(activityRequest: IActivityMeeting, userId: string,senderEmailInfo: {email:string,clientId:string,tenantId:string,clientSecret:string}): Promise<any> {
 let support_email =  "dev_rd_interactions@resdevtax.com";
  // Ensure attendees is always an array
  let attendeesArray: string[] = [];
  if (Array.isArray(activityRequest.attendees)) {
    attendeesArray = activityRequest.attendees;
  } else if (typeof activityRequest.attendees === 'string') {
    try {
      attendeesArray = JSON.parse(activityRequest.attendees);
    } catch {
      attendeesArray = [];
    }
  }

  const attendees = attendeesArray.map((email: string) => ({
    emailAddress: { address: email },
    type: "required",
  }));

  // Prepare payload for Teams meeting (Graph API event)
  const payload = {
    subject: activityRequest.subject,
    start: {
      dateTime: activityRequest.effective_start_datetime ,
      timeZone: "UTC", // Change to your timezone if needed
    },
    end: {
      dateTime: activityRequest.effective_end_datetime,
      timeZone: "UTC",
    },
    attendees,
    body: {
      contentType: "HTML",
      content: activityRequest.subject || "",
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  try {
   // const accessToken = await getGraphAccessToken();
    const credential = new ClientSecretCredential(
        senderEmailInfo.tenantId,
        senderEmailInfo.clientId,
        senderEmailInfo.clientSecret
      );
    
      const graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async (): Promise<string> => {
            const tokenResponse = await credential.getToken(
              "https://graph.microsoft.com/.default"
            );
            return tokenResponse.token;
          },
        },
      });
      const response = await graphClient
        .api(`/users/${support_email}/events`)
        .post(payload);
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Graph API error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    return result;
  } catch (err) {
    throw new Error(`Failed to schedule Teams meeting: ${err}`);
  }
}