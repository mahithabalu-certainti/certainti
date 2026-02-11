import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { MAIN_SCHEMA_NAME, HttpStatus, rawQueries } from "../../utils/constants";
import { errorLog, generateSasUrl } from "../../utils/helpers";
import SchemaService from "./schemaService";
import { CaseSummary } from "../../models/caseSummaryModel";
import { number } from "joi";
import { initOrgSequelize } from "../../config/orgDataSource";
import { IReportService } from "../interfaces/interface";


export class ReportService implements IReportService {
    private mainDbSequelize: Sequelize | null = null;
    private schemaService: SchemaService;

    constructor() {
        this.schemaService = new SchemaService();
    }

    async getMainSequelize(): Promise<Sequelize> {
        if (!this.mainDbSequelize) {
            this.mainDbSequelize = await initMainDbSequelize();
        }
        return this.mainDbSequelize;
    }

    private async getChildAccountIds(userId: string): Promise<string[] | null> {
        const accessibleAccountsInfo = await this.schemaService.getAccessibleAccountInfo(userId);
        if (accessibleAccountsInfo.length === 0) {
            return null;
        }
        return accessibleAccountsInfo
            .filter((acc) => acc.isChild)
            .map((acc) => acc.id);
    }

    async getCountDetails(userId: string, flag: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const existingCaseSummaryModel = sequelize.models.CaseSummary as typeof CaseSummary | undefined;
            const CaseSummaryModel = existingCaseSummaryModel ?? CaseSummary.initialize(sequelize, MAIN_SCHEMA_NAME);

            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: { account: [], count: 0 },
                    };
                }

                const totalCases = await CaseSummaryModel.count({
                    where: {
                        account_rid: {
                            [Op.in]: childAccountIds
                        }
                    }
                })

                const closedCasesQuery = rawQueries.fetchCaseCountWithStatus('Closed', childAccountIds);
                const completedCasesCount: { count: number }[] = await sequelize.query(
                    closedCasesQuery.query,
                    {
                        replacements: closedCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const onHoldCasesQuery = rawQueries.fetchCaseCountWithStatus('On Hold', childAccountIds);
                const onHoldCasesCount: { count: number }[] = await sequelize.query(
                    onHoldCasesQuery.query,
                    {
                        replacements: onHoldCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const openTasksQuery = rawQueries.fetchOpenTaskCount(childAccountIds, userId);
                const openTasksCount: { count: number }[] = await sequelize.query(
                    openTasksQuery.query,
                    {
                        replacements: openTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const overDueTasksQuery = rawQueries.fetchOverDueTaskCount(childAccountIds, userId);
                const overDueTasksCount: { count: number }[] = await sequelize.query(
                    overDueTasksQuery.query,
                    {
                        replacements: overDueTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const upcomingTasksQuery = rawQueries.fetchUpcomingTaskCount(childAccountIds, userId);
                const upcomingTasksCount: { count: number }[] = await sequelize.query(
                    upcomingTasksQuery.query,
                    {
                        replacements: upcomingTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyCompletedTasksQuery = rawQueries.fetchWeeklyCompletedTaskCount(childAccountIds, userId);
                const weeklyCompletedTasksCount: { count: number }[] = await sequelize.query(
                    weeklyCompletedTasksQuery.query,
                    {
                        replacements: weeklyCompletedTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const result: any = []

                result.push({
                    "name": "Active Accounts",
                    "count": childAccountIds.length,
                    "order": 1
                })
                result.push({
                    "name": "Active Cases",
                    "count": totalCases,
                    "order": 2
                })
                result.push({
                    "name": "Total Completed Cases",
                    "count": completedCasesCount[0]?.count || 0,
                    "order": 3
                })
                result.push({
                    "name": "Stalled Cases",
                    "count": onHoldCasesCount[0]?.count || 0,
                    "order": 4
                })
                result.push({
                    "name": "Open Tasks",
                    "count": openTasksCount[0]?.count || 0,
                    "order": 5
                })
                result.push({
                    "name": "Due Today / Over Due Tasks",
                    "count": overDueTasksCount[0]?.count || 0,
                    "order": 6
                })
                result.push({
                    "name": "Upcoming Tasks (7 Days)",
                    "count": upcomingTasksCount[0]?.count || 0,
                    "order": 7
                })
                result.push({
                    "name": "Tasks Completed This Week",
                    "count": weeklyCompletedTasksCount[0]?.count || 0,
                    "order": 8
                })

                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "Success",
                    data: result
                };

            } else {

                const totalCases = await CaseSummaryModel.count({});

                const closedCasesQuery = rawQueries.fetchCaseCountWithStatus('Closed');
                const completedCasesCount: { count: number }[] = await sequelize.query(
                    closedCasesQuery.query,
                    {
                        replacements: closedCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const onHoldCasesQuery = rawQueries.fetchCaseCountWithStatus('On Hold');
                const onHoldCasesCount: { count: number }[] = await sequelize.query(
                    onHoldCasesQuery.query,
                    {
                        replacements: onHoldCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const openTasksQuery = rawQueries.fetchOpenTaskCount();
                const openTasksCount: { count: number }[] = await sequelize.query(
                    openTasksQuery.query,
                    {
                        replacements: openTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const overDueTasksQuery = rawQueries.fetchOverDueTaskCount();
                const overDueTasksCount: { count: number }[] = await sequelize.query(
                    overDueTasksQuery.query,
                    {
                        replacements: overDueTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const upcomingTasksQuery = rawQueries.fetchUpcomingTaskCount();
                const upcomingTasksCount: { count: number }[] = await sequelize.query(
                    upcomingTasksQuery.query,
                    {
                        replacements: upcomingTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyCompletedTasksQuery = rawQueries.fetchWeeklyCompletedTaskCount();
                const weeklyCompletedTasksCount: { count: number }[] = await sequelize.query(
                    weeklyCompletedTasksQuery.query,
                    {
                        replacements: weeklyCompletedTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                // Get total active accounts count
                const activeAccountsCount = await sequelize.query<{ count: string }>(
                    rawQueries.fetchActiveAccountsCount(),
                    { type: QueryTypes.SELECT }
                );

                const result: any = []

                result.push({
                    "name": "Active Accounts",
                    "count": activeAccountsCount[0]?.count || 0,
                    "order": 1
                })
                result.push({
                    "name": "Active Cases",
                    "count": totalCases,
                    "order": 2
                })
                result.push({
                    "name": "Total Completed Cases",
                    "count": completedCasesCount[0]?.count || 0,
                    "order": 3
                })
                result.push({
                    "name": "Stalled Cases",
                    "count": onHoldCasesCount[0]?.count || 0,
                    "order": 4
                })
                result.push({
                    "name": "Open Tasks",
                    "count": openTasksCount[0]?.count || 0,
                    "order": 5
                })
                result.push({
                    "name": "Due Today / Over Due Tasks",
                    "count": overDueTasksCount[0]?.count || 0,
                    "order": 6
                })
                result.push({
                    "name": "Upcoming Tasks (7 Days)",
                    "count": upcomingTasksCount[0]?.count || 0,
                    "order": 7
                })
                result.push({
                    "name": "Tasks Completed This Week",
                    "count": weeklyCompletedTasksCount[0]?.count || 0,
                    "order": 8
                })


                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "Success",
                    data: result
                };
            }


        } catch (error) {
            errorLog("getCountDetails", (error as Error).message);
            throw error;
        }
    }

    async getMeetingList(userId: string, flag: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const orgDb = await initOrgSequelize();

            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: { account: [], count: 0 },
                    };
                }

                const accounts = await this.schemaService.fetchAccountsByIds(childAccountIds);

                const schemaNumberMap = new Map<string, string>();

                await Promise.all(
                    accounts.map(async (account) => {
                        const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
                        const { rid, storage_type, r_number, parent_account_rid } = acc;

                        if (storage_type === "store_in_parent") {
                            const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
                            schemaNumberMap.set(rid, parent);
                        } else {
                            schemaNumberMap.set(rid, r_number);
                        }
                    })
                );

                const activityStatuses: any[] = await sequelize.query(rawQueries.fetchActivityStatus(), { type: QueryTypes.SELECT });
                const casePriorities: any[] = await sequelize.query(rawQueries.fetchCasePriority(), { type: QueryTypes.SELECT });

                const statusMap = new Map(activityStatuses.map((s) => [s.rid, s.status_name]));
                const priorityMap = new Map(casePriorities.map((p) => [p.rid, p.priority_name]));

                const scheduledStatus = activityStatuses.find((s) => s.status_name === 'Scheduled');
                const scheduledStatusId = scheduledStatus ? scheduledStatus.rid : '';

                const userEmailQuery = rawQueries.fetchUserEmail(userId);
                const userEmailResult: any[] = await sequelize.query(userEmailQuery.query, {
                    replacements: userEmailQuery.replacements,
                    type: QueryTypes.SELECT
                });
                const userEmail = userEmailResult[0]?.email || '';

                const uniqueSchemaNames = new Set<string>();
                for (const schemaNumber of schemaNumberMap.values()) {
                    const schemaName = `${MAIN_SCHEMA_NAME}_${schemaNumber.replace(/\D/g, "")}`;
                    uniqueSchemaNames.add(schemaName);
                }

                const weeklyMeetingList: any[] = [];

                await Promise.all(
                    Array.from(uniqueSchemaNames).map(async (schemaName) => {
                        try {
                            const tableExists = await this.checkTableExistence(orgDb, schemaName, 'activities');
                            if (!tableExists) {
                                return;
                            }
                            // Get unique RIDs for this schema
                            const weeklyMeetingListQuery = rawQueries.fetchWeeklyMeetingList(schemaName, scheduledStatusId, userEmail);
                            const result: any[] = await orgDb.query(
                                weeklyMeetingListQuery.query,
                                {
                                    replacements: weeklyMeetingListQuery.replacements,
                                    type: QueryTypes.SELECT,
                                }
                            );
                            weeklyMeetingList.push(...result);
                        } catch (error) {
                            console.error(`Error fetching resources for schema ${schemaName}:`, error);
                        }
                    })
                );

                const finalMeetingList = weeklyMeetingList.map((meeting) => ({
                    ...meeting,
                    status_name: statusMap.get(meeting.status_rid) || null,
                    priority_name: priorityMap.get(meeting.priority_rid) || null,
                }));

                const allEmailSet = new Set<string>();
                finalMeetingList.forEach((meeting) => {
                    let participants: any[] = [];
                    if (typeof meeting.meeting_participants === 'string') {
                        const rawParticipants = meeting.meeting_participants.trim();
                        if (rawParticipants) {
                            try {
                                const parsed = JSON.parse(rawParticipants);
                                participants = Array.isArray(parsed) ? parsed : [];
                            } catch (e) {
                                participants = [];
                            }
                        }
                    } else if (Array.isArray(meeting.meeting_participants)) {
                        participants = meeting.meeting_participants;
                    }

                    const invitedBy = meeting.invited_by;
                    if (invitedBy) allEmailSet.add(invitedBy);
                    participants.forEach((p: string) => allEmailSet.add(p));
                });

                const emailNameMap = new Map<string, string>();
                if (allEmailSet.size > 0) {
                    try {
                        const usersByEmailsQuery = rawQueries.fetchUsersByEmails(Array.from(allEmailSet));
                        const users: any[] = await sequelize.query(
                            usersByEmailsQuery.query,
                            {
                                replacements: usersByEmailsQuery.replacements,
                                type: QueryTypes.SELECT
                            }
                        );
                        users.forEach((u) => {
                            emailNameMap.set(u.email, `${u.first_name || ''} ${u.last_name || ''}`.trim());
                        });
                    } catch (error) {
                        console.error("Error fetching user details:", error);
                    }
                }

                const finalMeetingListWithUsers = finalMeetingList.map((meeting) => {
                    let participants: any[] = [];
                    if (typeof meeting.meeting_participants === 'string') {
                        const rawParticipants = meeting.meeting_participants.trim();
                        if (rawParticipants) {
                            try {
                                const parsed = JSON.parse(rawParticipants);
                                participants = Array.isArray(parsed) ? parsed : [];
                            } catch (e) {
                                participants = [];
                            }
                        }
                    } else if (Array.isArray(meeting.meeting_participants)) {
                        participants = meeting.meeting_participants;
                    }
                    const invitedBy = meeting.invited_by;

                    return {
                        ...meeting,
                        meeting_participants: participants.map((email: string) => ({
                            email,
                            name: emailNameMap.get(email) || ''
                        })),
                        invited_by: {
                            email: invitedBy,
                            name: emailNameMap.get(invitedBy) || ''
                        }
                    };
                });

                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "Success",
                    data: finalMeetingListWithUsers
                };

            } else {

                const activityStatuses: any[] = await sequelize.query(rawQueries.fetchActivityStatus(), { type: QueryTypes.SELECT });
                const casePriorities: any[] = await sequelize.query(rawQueries.fetchCasePriority(), { type: QueryTypes.SELECT });

                const statusMap = new Map(activityStatuses.map((s) => [s.rid, s.status_name]));
                const priorityMap = new Map(casePriorities.map((p) => [p.rid, p.priority_name]));

                const scheduledStatus = activityStatuses.find((s) => s.status_name === 'Scheduled');
                const scheduledStatusId = scheduledStatus ? scheduledStatus.rid : '';

                const schemaList: any[] = await orgDb.query(
                    rawQueries.fetchSchemas(),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyMeetingList: any[] = [];

                await Promise.all(
                    schemaList.map(async (schema) => {
                        try {
                            const schemaName = schema.schema_name;
                            const tableExists = await this.checkTableExistence(orgDb, schemaName, 'activities');
                            if (!tableExists) {
                                return;
                            }
                            const weeklyMeetingListQuery = rawQueries.fetchWeeklyMeetingList(schemaName, scheduledStatusId);
                            const result: any[] = await orgDb.query(
                                weeklyMeetingListQuery.query,
                                {
                                    replacements: weeklyMeetingListQuery.replacements,
                                    type: QueryTypes.SELECT,
                                }
                            );
                            weeklyMeetingList.push(...result);
                        } catch (error) {
                            console.error(`Error fetching resources for schema ${schema.schema_name}:`, error);
                        }
                    })
                );

                const finalMeetingList = weeklyMeetingList.map((meeting) => ({
                    ...meeting,
                    status_name: statusMap.get(meeting.status_rid) || null,
                    priority_name: priorityMap.get(meeting.priority_rid) || null,
                }));

                const allEmailSet = new Set<string>();
                finalMeetingList.forEach((meeting) => {
                    let participants: any[] = [];
                    if (typeof meeting.meeting_participants === 'string') {
                        const rawParticipants = meeting.meeting_participants.trim();
                        if (rawParticipants) {
                            try {
                                const parsed = JSON.parse(rawParticipants);
                                participants = Array.isArray(parsed) ? parsed : [];
                            } catch (e) {
                                participants = [];
                            }
                        }
                    } else if (Array.isArray(meeting.meeting_participants)) {
                        participants = meeting.meeting_participants;
                    }

                    const invitedBy = meeting.invited_by;
                    if (invitedBy) allEmailSet.add(invitedBy);
                    participants.forEach((p: string) => allEmailSet.add(p));
                });

                const emailNameMap = new Map<string, string>();
                if (allEmailSet.size > 0) {
                    try {
                        const usersByEmailsQuery = rawQueries.fetchUsersByEmails(Array.from(allEmailSet));
                        const users: any[] = await sequelize.query(
                            usersByEmailsQuery.query,
                            {
                                replacements: usersByEmailsQuery.replacements,
                                type: QueryTypes.SELECT
                            }
                        );
                        users.forEach((u) => {
                            emailNameMap.set(u.email, `${u.first_name || ''} ${u.last_name || ''}`.trim());
                        });
                    } catch (error) {
                        console.error("Error fetching user details:", error);
                    }
                }

                const finalMeetingListWithUsers = finalMeetingList.map((meeting) => {
                    let participants: any[] = [];
                    if (typeof meeting.meeting_participants === 'string') {
                        const rawParticipants = meeting.meeting_participants.trim();
                        if (rawParticipants) {
                            try {
                                const parsed = JSON.parse(rawParticipants);
                                participants = Array.isArray(parsed) ? parsed : [];
                            } catch (e) {
                                participants = [];
                            }
                        }
                    } else if (Array.isArray(meeting.meeting_participants)) {
                        participants = meeting.meeting_participants;
                    }
                    const invitedBy = meeting.invited_by;

                    return {
                        ...meeting,
                        meeting_participants: participants.map((email: string) => ({
                            email,
                            name: emailNameMap.get(email) || ''
                        })),
                        invited_by: {
                            email: invitedBy,
                            name: emailNameMap.get(invitedBy) || ''
                        }
                    };
                });

                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "Success",
                    data: finalMeetingListWithUsers
                };
            }


        } catch (error) {
            errorLog("getMeetingList", (error as Error).message);
            throw error;
        }
    }

    async getAllowedExportFields(userId: string, permissionName: string) {
        return this.schemaService.getAllowedExportFields(userId, permissionName);
    }

    private async checkTableExistence(sequelize: Sequelize, schemaName: string, tableName: string): Promise<boolean> {
        try {
            const query = rawQueries.checkTableExistence();
            const result: { exists: boolean }[] = await sequelize.query(query, {
                replacements: { schemaName, tableName },
                type: QueryTypes.SELECT
            });
            return result[0]?.exists || false;
        } catch (error) {
            errorLog(`Error checking table existence for ${schemaName}.${tableName}: ${error}`);
            return false;
        }
    }

    async getWeeklyProductivityList(userId: string, flag: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const orgDb = await initOrgSequelize();

            let accountIds: string[] = [];
            let uniqueSchemaNames = new Set<string>();

            // 1. Resolve Accounts and Schemas based on flag
            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: [
                            { category: "Tasks Completed", count: 0, total: 0, unit: "tasks" },
                            { category: "Meetings / Sessions Attended", count: 0, total: 0, unit: "meetings" },
                            { category: "Pending Tasks", count: 0, total: 0, unit: "tasks" },
                            { category: "Blocked / Bottlenecks", count: 0, total: 0, unit: "issues" }
                        ],
                    };
                }
                accountIds = childAccountIds;

                // Resolve Schemas for Meetings
                const accounts = await this.schemaService.fetchAccountsByIds(accountIds);

                await Promise.all(
                    accounts.map(async (account) => {
                        const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
                        const { rid, storage_type, r_number, parent_account_rid } = acc;

                        if (storage_type === "store_in_parent") {
                            const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
                            uniqueSchemaNames.add(`${MAIN_SCHEMA_NAME}_${parent.replace(/\D/g, "")}`);
                        } else {
                            uniqueSchemaNames.add(`${MAIN_SCHEMA_NAME}_${r_number.replace(/\D/g, "")}`);
                        }
                    })
                );

            } else {
                // Admin/Else case: Use all schemas, empty accountIds means all accounts in fetch queries
                const schemaList: any[] = await orgDb.query(rawQueries.fetchSchemas(), { type: QueryTypes.SELECT });
                schemaList.forEach((s: any) => uniqueSchemaNames.add(s.schema_name));
            }

            // 2. Fetch Tasks Stats (Main DB)
            const weeklyCompletedQuery = rawQueries.fetchWeeklyCompletedTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);
            const weeklyTotalQuery = rawQueries.fetchWeeklyTotalTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);
            const weeklyOpenQuery = rawQueries.fetchWeeklyOpenTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);
            const weeklyOverdueQuery = rawQueries.fetchWeeklyOverDueTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);
            const weeklyBlockedQuery = rawQueries.fetchWeeklyBlockedTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);

            const tasksPromises = [
                // Completed Tasks (Weekly)
                sequelize.query<{ count: number }>(weeklyCompletedQuery.query, { replacements: weeklyCompletedQuery.replacements, type: QueryTypes.SELECT }),
                // Total Tasks (Weekly)
                sequelize.query<{ count: number }>(weeklyTotalQuery.query, { replacements: weeklyTotalQuery.replacements, type: QueryTypes.SELECT }),
                // Open Tasks (Pending)
                sequelize.query<{ count: number }>(weeklyOpenQuery.query, { replacements: weeklyOpenQuery.replacements, type: QueryTypes.SELECT }),
                // Overdue Tasks
                sequelize.query<{ count: number }>(weeklyOverdueQuery.query, { replacements: weeklyOverdueQuery.replacements, type: QueryTypes.SELECT }),
                // Blocked (On Hold Cases)
                sequelize.query<{ count: number }>(weeklyBlockedQuery.query, { replacements: weeklyBlockedQuery.replacements, type: QueryTypes.SELECT })
            ];

            const tasksResults = await Promise.all(tasksPromises);

            const weeklyCompletedResult = tasksResults[0];
            const weeklyTotalResult = tasksResults[1];
            const openTasksResult = tasksResults[2];
            const overdueTasksResult = tasksResults[3];
            const blockedTasksResult = tasksResults[4];

            const weeklyCompleted = weeklyCompletedResult && weeklyCompletedResult[0] ? weeklyCompletedResult[0].count : 0;
            const weeklyTotal = weeklyTotalResult && weeklyTotalResult[0] ? weeklyTotalResult[0].count : 0;
            const openTasks = openTasksResult && openTasksResult[0] ? openTasksResult[0].count : 0;
            const overdueTasks = overdueTasksResult && overdueTasksResult[0] ? overdueTasksResult[0].count : 0;
            const blockedTasks = blockedTasksResult && blockedTasksResult[0] ? blockedTasksResult[0].count : 0;

            // 3. Fetch Meeting Stats (Org DB)
            const activityStatuses: any[] = await sequelize.query(rawQueries.fetchActivityStatus(), { type: QueryTypes.SELECT });

            // Define statuses
            const attendedStatuses = activityStatuses
                .filter((s: any) => s.status_name === 'Completed')
                .map((s: any) => s.rid);

            const totalStatuses = activityStatuses.map((s: any) => s.rid);

            let totalMeetingsCount = 0;
            let attendedMeetingsCount = 0;

            const userEmailQuery = rawQueries.fetchUserEmail(userId);
            const userEmailResult: any[] = await sequelize.query(userEmailQuery.query, {
                replacements: userEmailQuery.replacements,
                type: QueryTypes.SELECT
            });
            const userEmail = userEmailResult[0]?.email || '';

            const meetingCounts = await Promise.all(
                Array.from(uniqueSchemaNames).map(async (schemaName) => {
                    try {
                        const tableExists = await this.checkTableExistence(orgDb, schemaName, 'activities');
                        if (!tableExists) {
                            return { total: 0, attended: 0 };
                        }

                        const weeklyTotalMeetingQuery = rawQueries.fetchWeeklyMeetingCount(schemaName, totalStatuses, flag === "user" ? userEmail : undefined);
                        const weeklyAttendedMeetingQuery = rawQueries.fetchWeeklyMeetingCount(schemaName, attendedStatuses, flag === "user" ? userEmail : undefined);

                        const [totalRes, attendedRes] = await Promise.all([
                            orgDb.query<{ count: number }>(
                                weeklyTotalMeetingQuery.query,
                                {
                                    replacements: weeklyTotalMeetingQuery.replacements,
                                    type: QueryTypes.SELECT
                                }
                            ),
                            orgDb.query<{ count: number }>(
                                weeklyAttendedMeetingQuery.query,
                                {
                                    replacements: weeklyAttendedMeetingQuery.replacements,
                                    type: QueryTypes.SELECT
                                }
                            )
                        ]);

                        return {
                            total: Number(totalRes[0]?.count || 0),
                            attended: Number(attendedRes[0]?.count || 0)
                        };

                    } catch (error) {
                        errorLog(`Error fetching meetings for schema ${schemaName}: ${error}`);
                        return { total: 0, attended: 0 };
                    }
                })
            );

            totalMeetingsCount = meetingCounts.reduce((acc, curr) => acc + curr.total, 0);
            attendedMeetingsCount = meetingCounts.reduce((acc, curr) => acc + curr.attended, 0);

            // 4. Construct Response
            const data = [
                {
                    category: "Tasks Completed",
                    count: weeklyCompleted,
                    total: weeklyTotal,
                    unit: "tasks"
                },
                {
                    category: "Meetings / Sessions Attended",
                    count: attendedMeetingsCount,
                    total: totalMeetingsCount,
                    unit: "meetings"
                },
                {
                    category: "Pending Tasks",
                    count: openTasks,
                    total: weeklyTotal,
                    unit: "tasks"
                },
                {
                    category: "Blocked / Bottlenecks",
                    count: blockedTasks,
                    total: 0, // Target is usually 0 for bottlenecks
                    unit: "issues"
                }
            ];

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "Success",
                data: data
            };

        } catch (error) {
            errorLog("getWeeklyProductivityList", (error as Error).message);
            throw error;
        }
    }


    private async fetchTasksList(userId: string, flag: string, queryGenerator: (accountIds?: string[], userId?: string) => { query: string, replacements: any }): Promise<{ statusCode: number; message: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            let accountIds: string[] = [];

            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: []
                    };
                }
                accountIds = childAccountIds;
            }

            const { query, replacements } = queryGenerator(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);
            const tasks: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            // Fetch user details for assigned_to
            const assignedToIds = new Set<string>();
            for (const t of tasks) {
                if (t.assigned_to) assignedToIds.add(t.assigned_to);
            }

            await Promise.all(
                tasks.map(async (t: any) => {
                    if (t.profile_url) {
                        t.profile_url = await generateSasUrl(t.profile_url);
                    } else {
                        t.profile_url = null;
                    }
                })
            );

            const userMap = new Map<string, string>();
            if (assignedToIds.size > 0) {
                const usersByRidsQuery = rawQueries.fetchUsersByRids(Array.from(assignedToIds));
                const users: any[] = await sequelize.query(
                    usersByRidsQuery.query,
                    {
                        replacements: usersByRidsQuery.replacements,
                        type: QueryTypes.SELECT
                    }
                );
                users.forEach(u => {
                    userMap.set(u.rid, `${u.first_name || ''} ${u.last_name || ''}`.trim());
                });
            }

            const finalTasks = tasks.map(t => ({
                ...t,
                assigned_to_name: userMap.get(t.assigned_to) || t.assigned_to
            }));

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "Success",
                data: finalTasks
            };

        } catch (error) {
            errorLog("fetchTasksList", (error as Error).message);
            throw error;
        }
    }

    async getUpcomingTasksList(userId: string, flag: string) {
        return this.fetchTasksList(userId, flag, rawQueries.fetchUpcomingTasks);
    }

    async getDueTodayOverdueTasksList(userId: string, flag: string) {
        return this.fetchTasksList(userId, flag, rawQueries.fetchOverDueTasks);
    }

    async getOpenTasksList(userId: string, flag: string) {
        return this.fetchTasksList(userId, flag, rawQueries.fetchOpenTasks);
    }

    async getCompletedTasksThisWeekList(userId: string, flag: string) {
        return this.fetchTasksList(userId, flag, rawQueries.fetchWeeklyCompletedTasks);
    }

    async getPendingFollowUpsList(userId: string, flag: string) {
        return this.fetchTasksList(userId, flag, rawQueries.fetchWeeklyPendingFollowUps);
    }

    async getOverdueApprovalsList(userId: string, flag: string) {
        return this.fetchTasksList(userId, flag, rawQueries.fetchOverdueApprovals);
    }

    async getOverallProjectValue(userId: string, flag: string, fiscalYear?: string): Promise<{ statusCode: number; message: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const orgDb = await initOrgSequelize();

            let accountIds: string[] = [];
            let uniqueSchemaNames = new Set<string>();

            // 1. Resolve Accounts and Schemas based on flag
            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: []
                    };
                }
                accountIds = childAccountIds;

                // Resolve Schemas for Meetings
                const accounts = await this.schemaService.fetchAccountsByIds(accountIds);

                await Promise.all(
                    accounts.map(async (account) => {
                        const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
                        const { rid, storage_type, r_number, parent_account_rid } = acc;

                        if (storage_type === "store_in_parent") {
                            const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
                            uniqueSchemaNames.add(`${MAIN_SCHEMA_NAME}_${parent.replace(/\D/g, "")}`);
                        } else {
                            uniqueSchemaNames.add(`${MAIN_SCHEMA_NAME}_${r_number.replace(/\D/g, "")}`);
                        }
                    })
                );

            } else {
                // Admin/Else case: Use all schemas, empty accountIds means all accounts in fetch queries
                const schemaList: any[] = await orgDb.query(rawQueries.fetchSchemas(), { type: QueryTypes.SELECT });
                schemaList.forEach((s: any) => uniqueSchemaNames.add(s.schema_name));
            }

            const { query: countryQuery, replacements: countryReplacements } = rawQueries.fetchActiveCountries();
            const activeCountriesRids: any[] = await sequelize.query(countryQuery, {
                type: QueryTypes.SELECT
            });

            const activeCountriesRidsSet = new Set<string>();
            activeCountriesRids.forEach((c: any) => activeCountriesRidsSet.add(c.country_rid));

            const countryWiseAmounts = new Map<string, { computed: number, submitted: number, approved: number }>();

            await Promise.all(
                Array.from(uniqueSchemaNames).map(async (schemaName) => {
                    try {
                        const countryTableExists = await this.checkTableExistence(orgDb, schemaName, 'rd_credit_country_calculations');
                        const casesTableExists = await this.checkTableExistence(orgDb, schemaName, 'cases');
                        if (!countryTableExists || !casesTableExists) {
                            return;
                        }

                        const { query, replacements } = rawQueries.fetchCountryWiseRDAmounts(schemaName, flag === "user" ? accountIds : undefined, fiscalYear, activeCountriesRidsSet);
                        const results: any[] = await orgDb.query(query, {
                            replacements,
                            type: QueryTypes.SELECT
                        });

                        for (const row of results) {
                            const rid = row.country_rid;
                            if (!countryWiseAmounts.has(rid)) {
                                countryWiseAmounts.set(rid, { computed: 0, submitted: 0, approved: 0 });
                            }
                            const entry = countryWiseAmounts.get(rid)!;
                            entry.computed += Number(row.final_credit_computed || 0);
                            entry.submitted += Number(row.final_credit_submitted || 0);
                            entry.approved += Number(row.final_credit_approved || 0);
                        }

                    } catch (error) {
                        errorLog(`Error fetching country wise amounts for schema ${schemaName}: ${(error as Error).message}`);
                    }
                })
            );

            const { query, replacements } = rawQueries.fetchOverallProjectValue(flag === "user" ? accountIds : undefined, fiscalYear);
            const projectValueResults: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            const finalResult = projectValueResults.map(row => {
                const amounts = countryWiseAmounts.get(row.country_rid) || { computed: 0, submitted: 0, approved: 0 };
                return {
                    ...row,
                    final_credit_computed: amounts.computed,
                    final_credit_submitted: amounts.submitted,
                    final_credit_approved: amounts.approved
                };
            });

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "Success",
                data: finalResult
            };

        } catch (error) {
            errorLog("getOverallProjectValue", (error as Error).message);
            throw error;
        }
    }

    async getGlobalLevelChart(userId: string, flag: string, fiscalYear?: string, countryRid?: string): Promise<{ statusCode: number; message: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            const orgDb = await initOrgSequelize();

            let accountIds: string[] = [];
            let uniqueSchemaNames = new Set<string>();

            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: []
                    };
                }
                accountIds = childAccountIds;

                // Resolve Schemas for Meetings
                const accounts = await this.schemaService.fetchAccountsByIds(accountIds);

                await Promise.all(
                    accounts.map(async (account) => {
                        const acc = account as { rid: string; storage_type: string; r_number: string; parent_account_rid: string };
                        const { rid, storage_type, r_number, parent_account_rid } = acc;

                        if (storage_type === "store_in_parent") {
                            const parent = await this.schemaService.fetchParentAccount(parent_account_rid);
                            uniqueSchemaNames.add(`${MAIN_SCHEMA_NAME}_${parent.replace(/\D/g, "")}`);
                        } else {
                            uniqueSchemaNames.add(`${MAIN_SCHEMA_NAME}_${r_number.replace(/\D/g, "")}`);
                        }
                    })
                );

            } else {
                // Admin/Else case: Use all schemas, empty accountIds means all accounts in fetch queries
                const schemaList: any[] = await orgDb.query(rawQueries.fetchSchemas(), { type: QueryTypes.SELECT });
                schemaList.forEach((s: any) => uniqueSchemaNames.add(s.schema_name));
            }

            const { query: countryQuery, replacements: countryReplacements } = rawQueries.fetchActiveCountries(countryRid);
            const activeCountriesRids: any[] = await sequelize.query(countryQuery, {
                replacements: countryReplacements,
                type: QueryTypes.SELECT
            });

            const activeCountriesMap = new Map<string, { country_rid: string, country_name: string, country_code: string }>();
            activeCountriesRids.forEach((c: any) => activeCountriesMap.set(c.country_rid, c));

            const activeCountriesRidsSet = new Set<string>();
            activeCountriesRids.forEach((c: any) => activeCountriesRidsSet.add(c.country_rid));

            const countryAccountWiseAmounts = new Map<string, { computed: number, submitted: number, approved: number }>();
            const countryWiseApprovedAmount = new Map<string, { country_rid: string, country_name: string, country_code: string, approved: number }>();

            await Promise.all(
                Array.from(uniqueSchemaNames).map(async (schemaName) => {
                    try {
                        const countryTableExists = await this.checkTableExistence(orgDb, schemaName, 'rd_credit_country_calculations');
                        const casesTableExists = await this.checkTableExistence(orgDb, schemaName, 'cases');
                        if (!countryTableExists || !casesTableExists) {
                            return;
                        }

                        const { query, replacements } = rawQueries.fetchCountryAccountWiseRDAmounts(schemaName, flag === "user" ? accountIds : undefined, fiscalYear, activeCountriesRidsSet);
                        const results: any[] = await orgDb.query(query, {
                            replacements,
                            type: QueryTypes.SELECT
                        });

                        for (const row of results) {
                            const key = `${row.country_rid}-${row.account_rid}`;
                            if (!countryAccountWiseAmounts.has(key)) {
                                countryAccountWiseAmounts.set(key, { computed: 0, submitted: 0, approved: 0 });
                            }
                            const entry = countryAccountWiseAmounts.get(key)!;
                            entry.computed += Number(row.final_credit_computed || 0);
                            entry.submitted += Number(row.final_credit_submitted || 0);
                            entry.approved += Number(row.final_credit_approved || 0);

                            const countryKey = row.country_rid || '';
                            if (!countryWiseApprovedAmount.has(countryKey)) {
                                const countryDetails = activeCountriesMap.get(countryKey);
                                countryWiseApprovedAmount.set(countryKey, {
                                    country_rid: countryDetails?.country_rid || '',
                                    country_name: countryDetails?.country_name || '',
                                    country_code: countryDetails?.country_code || '',
                                    approved: 0
                                });
                            }
                            const countryEntry = countryWiseApprovedAmount.get(countryKey)!;
                            countryEntry.approved += Number(row.final_credit_approved || 0);
                        }

                    } catch (error) {
                        errorLog(`Error fetching country account wise amounts for schema ${schemaName}: ${(error as Error).message}`);
                    }
                })
            );

            const { query, replacements } = rawQueries.fetchGlobalAccountClaimedAmounts(flag === "user" ? accountIds : undefined, fiscalYear, activeCountriesRidsSet);
            const accountWiseConsolidationList: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            const finalAccountWiseConsolidationList = accountWiseConsolidationList.map(row => {
                const key = `${row.country_rid}-${row.account_rid}`;
                const amounts = countryAccountWiseAmounts.get(key) || { computed: 0, submitted: 0, approved: 0 };
                return {
                    ...row,
                    final_credit_computed: amounts.computed,
                    final_credit_submitted: amounts.submitted,
                    final_credit_approved: amounts.approved
                };
            });

            const countryWiseConsolidation = Array.from(countryWiseApprovedAmount.values());

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "Success",
                data: { accountWiseConsolidationList: finalAccountWiseConsolidationList, countryWiseConsolidation }
            };

        } catch (error) {
            errorLog("getGlobalLevelChart", (error as Error).message);
            throw error;
        }
    }
    async getCasesByHealthStatus(userId: string, flag: string, fiscalYear?: string): Promise<{ statusCode: number; message: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();
            let accountIds: string[] = [];

            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: []
                    };
                }
                accountIds = childAccountIds;
            }

            const { query, replacements } = rawQueries.fetchCasesByHealthStatus(flag === "user" ? accountIds : undefined, fiscalYear);
            const result: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            return {
                statusCode: HttpStatus.SUCCESS,
                message: "Success",
                data: result
            };

        } catch (error) {
            errorLog("getCasesByHealthStatus", (error as Error).message);
            throw error;
        }
    }
}
