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
  userEmail: string,
  senderEmailInfo: {
    email: string;
    clientId: string;
    tenantId: string;
    clientSecret: string;
  }
): Promise<any> {
  const support_email = senderEmailInfo.email;
  // Ensure meeting_participants is always an array of strings
  let meetingParticipants: string[] = [];
  if (Array.isArray(activityRequest.meeting_participants)) {
    meetingParticipants = activityRequest.meeting_participants.filter((email) => typeof email === "string" && email);
  } else if (typeof activityRequest.meeting_participants === "string") {
    try {
      const parsed = JSON.parse(activityRequest.meeting_participants);
      meetingParticipants = Array.isArray(parsed)
        ? parsed.filter((email) => typeof email === "string" && email)
        : [];
    } catch {
      meetingParticipants = [];
    }
  }
  // Remove duplicates and trim emails
  meetingParticipants = Array.from(new Set(meetingParticipants.map(e => e.trim())));
  // Add userEmail to attendees if not already present
  if (userEmail && !meetingParticipants.includes(userEmail)) {
    meetingParticipants.push(userEmail);
  }
  const attendees = meetingParticipants.map((email) => ({
    emailAddress: { address: email },
    type: "required",
  }));
  let recurrentpattern = {}
  if (activityRequest.recurrence_type === "daily") {
    recurrentpattern = {
      type: activityRequest.recurrence_type,
      interval: Number(activityRequest.recurrence_interval) || 1,
    };
  }

  if (activityRequest.recurrence_type === "weekly") {
    recurrentpattern = {
      type: activityRequest.recurrence_type || "weekly",
      interval: Number(activityRequest.recurrence_interval) || 1,
      daysOfWeek: activityRequest.recurrence_days || [],
      firstDayOfWeek: "sunday",
    };
  }
  if (activityRequest.recurrence_type === "monthly") {
    if (activityRequest.recurrence_day_of_month != undefined && activityRequest.recurrence_day_of_month > 0) {
      recurrentpattern = {
        type: "absoluteMonthly",
        interval: Number(activityRequest.recurrence_interval) || 1,
        dayOfMonth: Number(activityRequest.recurrence_day_of_month) || 1,
      };
    }
    else {
      recurrentpattern = {
        type: "relativeMonthly",
        interval: Number(activityRequest.recurrence_interval) || 1,
        daysOfWeek: activityRequest.recurrence_days || [],
        index: activityRequest.recurrence_monthly_index || "first",
        firstDayOfWeek: "sunday",
      };
    }

  }


  const tz = activityRequest.time_zone || "UTC";
  const startDateTime = moment.tz(`${activityRequest.effective_start_date} ${activityRequest.effective_start_time}`, "YYYY-MM-DD HH:mm", tz);
  const endDateTimepayload = moment.tz(`${activityRequest.effective_end_date} ${activityRequest.effective_end_time}`, "YYYY-MM-DD HH:mm", tz);
  const payload: any = {
    subject: activityRequest.subject,
    start: {
      dateTime: startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
      timeZone: activityRequest.time_zone || "UTC",
    },
    end: {
      dateTime: endDateTimepayload.format("YYYY-MM-DDTHH:mm:ss"),
      timeZone: activityRequest.time_zone || "UTC",
    },
    attendees: attendees,
    body: {
      contentType: "HTML",
      content: activityRequest.subject || "",
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",

  };

  // Only add recurrence if recurrence_type is set and not 'none'
  if (recurrentpattern && Object.keys(recurrentpattern).length > 0) {
    payload.recurrence = {
      pattern: recurrentpattern,
      range: {
        type: "endDate",
        startDate: activityRequest.effective_start_date,
        endDate: activityRequest.effective_end_date,
        recurrenceTimeZone: activityRequest.time_zone || "UTC",
      },
    };
  } else if (activityRequest.recurrence_type && activityRequest.recurrence_type !== 'none') {
    logMessage(
      `scheduleTeamsMeetingUtil: Unsupported or invalid recurrence_type '${activityRequest.recurrence_type}', skipping recurrence configuration.`
    );
  }
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
    const startDateTimeUTC = startDateTime.clone().utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    const endDateTimeUTC = endDateTimepayload.clone().utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    // Query only the exact requested time window in UTC
    const conflictResponse = await graphClient
      .api(`/users/${support_email}/calendarView`)
      .query({
        startDateTime: startDateTimeUTC,
        endDateTime: endDateTimeUTC,
      })
      .get();
    logMessage(`Conflict check response: ${JSON.stringify(conflictResponse)}`);

    // Check for overlapping times with existing events, with detailed logging
    let hasConflict = false;
    if (conflictResponse.value && conflictResponse.value.length > 0) {
      const tz = activityRequest.time_zone || "UTC";
      const requestedStart = startDateTime;
      const requestedEnd = endDateTimepayload;
      for (const event of conflictResponse.value) {
        // Use event's timezone if available, else fallback to requested timezone
        const eventTz = (event.start && event.start.timeZone) ? event.start.timeZone : tz;
        const eventStart = moment.tz(event.start.dateTime, eventTz);
        const eventEnd = moment.tz(event.end.dateTime, eventTz);
        // Check for overlap
        const overlap = requestedStart.isBefore(eventEnd) && requestedEnd.isAfter(eventStart);
        if (overlap) {
          logMessage(`Conflict detected with event: ${event.id}`);
          hasConflict = true;
          break;
        } else {
          logMessage(`No overlap with event: ${event.id}`);
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
      webLink: event.onlineMeeting ? event.onlineMeeting.joinUrl : "",
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

/**
 * Cancels a meeting in Microsoft Teams using Graph API
 * @param meetingId The ID of the meeting to cancel
 * @param senderEmailInfo Credentials for the sender
 */
export async function cancelTeamsMeetingUtil(
  meetingId: string,
  senderEmailInfo: {
    email: string;
    clientId: string;
    tenantId: string;
    clientSecret: string;
  }
): Promise<any> {
  const support_email = senderEmailInfo.email;
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

    logMessage(`Cancelling Teams meeting: ${meetingId}`);
    await graphClient
      .api(`/users/${support_email}/events/${meetingId}`)
      .delete();

    logMessage(`Teams meeting cancelled successfully: ${meetingId}`);

    return {
      success: true,
    };
  } catch (err: any) {
    logMessage(`Error cancelling Teams meeting: ${err}`);
    return {
      success: false,
      error: err,
    };
  }
}

/**
 * Updates a meeting in Microsoft Teams using Graph API
 * @param meetingId The ID of the meeting to update
 * @param activityRequest Meeting details
 * @param senderEmailInfo Credentials for the sender
 */
export async function updateTeamsMeetingUtil(
  meetingId: string,
  activityRequest: IActivityMeeting,
  senderEmailInfo: {
    email: string;
    clientId: string;
    tenantId: string;
    clientSecret: string;
  }
): Promise<any> {
  const support_email = senderEmailInfo.email;
  // Ensure meeting_participants is always an array of strings
  let meetingParticipants: string[] = [];
  if (Array.isArray(activityRequest.meeting_participants)) {
    meetingParticipants = activityRequest.meeting_participants.filter((email) => typeof email === "string" && email);
  } else if (typeof activityRequest.meeting_participants === "string") {
    try {
      const parsed = JSON.parse(activityRequest.meeting_participants);
      meetingParticipants = Array.isArray(parsed)
        ? parsed.filter((email) => typeof email === "string" && email)
        : [];
    } catch {
      meetingParticipants = [];
    }
  }
  // Remove duplicates, trim, and filter out empty strings
  meetingParticipants = Array.from(
    new Set(
      meetingParticipants
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0)
    )
  );

  const attendees = meetingParticipants.map((email) => ({
    emailAddress: { address: email },
    type: "required",
  }));

  const tz = activityRequest.time_zone || "UTC";
  const startDateTime = moment.tz(`${activityRequest.effective_start_date} ${activityRequest.effective_start_time}`, "YYYY-MM-DD HH:mm", tz);
  const endDateTimepayload = moment.tz(`${activityRequest.effective_end_date} ${activityRequest.effective_end_time}`, "YYYY-MM-DD HH:mm", tz);

  const payload: any = {
    subject: activityRequest.subject,
    start: {
      dateTime: startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
      timeZone: activityRequest.time_zone || "UTC",
    },
    end: {
      dateTime: endDateTimepayload.format("YYYY-MM-DDTHH:mm:ss"),
      timeZone: activityRequest.time_zone || "UTC",
    },
    attendees: attendees,
    body: {
      contentType: "HTML",
      content: activityRequest.subject || "",
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
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

    logMessage(`Updating Teams meeting: ${meetingId} with payload: ${JSON.stringify(payload)}`);
    const event = await graphClient
      .api(`/users/${support_email}/events/${meetingId}`)
      .patch(payload);

    logMessage(`Teams meeting updated: ${JSON.stringify(event)}`);

    return {
      success: true,
      webLink: event.onlineMeeting ? event.onlineMeeting.joinUrl : "",
      meetingId: event.id,
    };
  } catch (err: any) {
    logMessage(`Error updating Teams meeting: ${err}`);
    return {
      success: false,
      error: err,
    };
  }
}
