import { IActivityMeeting } from "./types";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client/lib/src/Client";
import { logMessage } from "./helpers";
import moment from "moment-timezone";
/**
 * Schedules a meeting in Microsoft Teams using Graph API
 * @param activityRequest Meeting details
 * @param userId User scheduling the meeting
 */
export async function scheduleTeamsMeetingUtil(
  activityRequest: IActivityMeeting,
  userId: string,
  senderEmailInfo: {
    email: string;
    clientId: string;
    tenantId: string;
    clientSecret: string;
  }
): Promise<any> {
  const support_email = senderEmailInfo.email;
  // Normalize attendees
  let attendeesArray: string[] = [];
  if (Array.isArray(activityRequest.attendees)) {
    attendeesArray = activityRequest.attendees;
  } else if (typeof activityRequest.attendees === "string") {
    try {
      attendeesArray = JSON.parse(activityRequest.attendees);
    } catch {
      attendeesArray = [];
    }
  }
  let recurrenceDays: string[] = [];
  if (activityRequest.recurrence_days) {
    if (Array.isArray(activityRequest.recurrence_days)) {
      recurrenceDays = activityRequest.recurrence_days;
    } else if (typeof activityRequest.recurrence_days === "string") {
      try {
        recurrenceDays = JSON.parse(activityRequest.recurrence_days);
      } catch {
        recurrenceDays = [];
      }
    }
  }

  const attendees = attendeesArray.map((email) => ({
    emailAddress: { address: email },
    type: "required",
  }));

const startDateTime = moment(`${activityRequest.effective_start_date} ${activityRequest.effective_start_time}`,  "YYYY-MM-DD HH:mm");
const endDateTime   = moment(`${activityRequest.effective_end_date} ${activityRequest.effective_end_time}`,      "YYYY-MM-DD HH:mm");
const endDateTimepayload   = moment(`${activityRequest.effective_start_date} ${activityRequest.effective_end_time}`,      "YYYY-MM-DD HH:mm");


  const payload = {
    subject: activityRequest.subject,
    start: {
      dateTime: startDateTime,
      timeZone: activityRequest.time_zone || "UTC",
    },
    end: {
      dateTime: endDateTimepayload,
      timeZone: activityRequest.time_zone || "UTC",
    },
    attendees,
    body: {
      contentType: "HTML",
      content: activityRequest.subject || "",
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
    recurrence: {
      pattern: {
        type: activityRequest.recurrence_type || "weekly",
        interval: Number(activityRequest.recurrence_interval) || 1,
        daysOfWeek: recurrenceDays || ["Monday"],
        firstDayOfWeek: "sunday",
      },
      range: {
        type: "endDate",
        startDate: activityRequest.effective_start_date,
        endDate: activityRequest.effective_end_date,
        recurrenceTimeZone: activityRequest.time_zone || "UTC",
      },
    },
  };
  try {
    const credential = new ClientSecretCredential(
      senderEmailInfo.tenantId,
      senderEmailInfo.clientId,
      senderEmailInfo.clientSecret
    );

    const graphClient = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken(
            "https://graph.microsoft.com/.default"
          );
          return token.token;
        },
      },
    });

    // Check for conflicting meetings
    // Convert to ISO string if not already
    // Convert moment objects to ISO string
    const startDateTimeStr = moment(startDateTime).toISOString();
    const endDateTimeStr = moment(endDateTime).toISOString();

    // Query only the exact requested time window
    const conflictResponse = await graphClient
      .api(`/users/${support_email}/calendarView`)
      .query({
        startDateTime: startDateTimeStr,
        endDateTime: endDateTimeStr,
      })
      .get();
    logMessage(`Conflict check response: ${JSON.stringify(conflictResponse)}`);

    // Check for overlapping times with existing events, with detailed logging
    let hasConflict = false;
    if (conflictResponse.value && conflictResponse.value.length > 0) {
      const requestedStart = new Date(startDateTimeStr);
      const requestedEnd = new Date(endDateTimeStr);
      for (const event of conflictResponse.value) {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        if (
          requestedStart.toDateString() === eventStart.toDateString() ||
          requestedEnd.toDateString() === eventStart.toDateString() ||
          (eventStart > requestedStart && eventStart < requestedEnd)
        ) {
          // Check for overlapping hours on the same day
          const reqStartHours =
            requestedStart.getHours() * 60 + requestedStart.getMinutes();
          const reqEndHours =
            requestedEnd.getHours() * 60 + requestedEnd.getMinutes();
          const evtStartHours =
            eventStart.getHours() * 60 + eventStart.getMinutes();
          const evtEndHours = eventEnd.getHours() * 60 + eventEnd.getMinutes();
          const overlap =
            reqStartHours < evtEndHours && reqEndHours > evtStartHours;

          if (overlap) {
            logMessage(`Conflict detected with event: ${event.id}`);
            hasConflict = true;
            break;
          }
        } else {
          logMessage(`Event not on same day, skipping.`);
        }
      }
    }
    if (hasConflict) {
      logMessage(
        "Cannot schedule meeting: There is a conflicting meeting in the selected time slot"
      );
      return {
        success: false,
        error:
          "Cannot schedule meeting: There is a conflicting meeting in the selected time slot",
      };
    } else {
      logMessage("Final result: No conflict, meeting can be scheduled.");
    }
    logMessage(`Scheduling meeting with payload: ${JSON.stringify(payload)}`);
    // Add sendInvitations query parameter to send invites automatically
    const event = await graphClient
      .api(`/users/${support_email}/events`)
      .query({ sendInvitations: "true" })
      .post(payload);

    logMessage(`Teams meeting scheduled: ${JSON.stringify(event)}`);

    return {
      success: true,
      webLink: event.webLink ? event.webLink : "",
      meetingId: event.id,
    };
  } catch (err: any) {
    logMessage(`Error scheduling Teams meeting: ${err}`);
    return {
      success: false,
      error: err,
    };
  }
}
