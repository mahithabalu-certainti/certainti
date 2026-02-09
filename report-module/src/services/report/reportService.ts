import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { MAIN_SCHEMA_NAME, HttpStatus, rawQueries } from "../../utils/constants";
import { errorLog } from "../../utils/helpers";
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

                const openTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchOpenTaskCount(childAccountIds, userId),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const overDueTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchOverDueTaskCount(childAccountIds, userId),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const upcomingTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchUpcomingTaskCount(childAccountIds, userId),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyCompletedTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchWeeklyCompletedTaskCount(childAccountIds, userId),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const result = {
                    activeAccounts: childAccountIds.length,
                    totalCases: totalCases,
                    completedCases: completedCasesCount[0]?.count || 0,
                    onHoldCases: onHoldCasesCount[0]?.count || 0,
                    openTasks: openTasksCount[0]?.count || 0,
                    overDueTasks: overDueTasksCount[0]?.count || 0,
                    upcomingTasks: upcomingTasksCount[0]?.count || 0,
                    weeklyCompletedTasks: weeklyCompletedTasksCount[0]?.count || 0,
                }

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

                const openTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchOpenTaskCount(),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const overDueTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchOverDueTaskCount(),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const upcomingTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchUpcomingTaskCount(),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyCompletedTasksCount: { count: number }[] = await sequelize.query(
                    rawQueries.fetchWeeklyCompletedTaskCount(),
                    {
                        type: QueryTypes.SELECT,
                    }
                );

                // Get total active accounts count
                const activeAccountsCount = await sequelize.query<{ count: string }>(
                    rawQueries.fetchActiveAccountsCount(),
                    { type: QueryTypes.SELECT }
                );

                const result = {
                    activeAccounts: activeAccountsCount[0]?.count || 0,
                    totalCases: totalCases,
                    completedCases: completedCasesCount[0]?.count || 0,
                    onHoldCases: onHoldCasesCount[0]?.count || 0,
                    openTasks: openTasksCount[0]?.count || 0,
                    overDueTasks: overDueTasksCount[0]?.count || 0,
                    upcomingTasks: upcomingTasksCount[0]?.count || 0,
                    weeklyCompletedTasks: weeklyCompletedTasksCount[0]?.count || 0,
                }

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

                const userEmailResult: any[] = await sequelize.query(rawQueries.fetchUserEmail(userId), { type: QueryTypes.SELECT });
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
                            const result: any[] = await orgDb.query(
                                rawQueries.fetchWeeklyMeetingList(schemaName, scheduledStatusId, userEmail),
                                {
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
                    const participants = typeof meeting.meeting_participants === 'string'
                        ? JSON.parse(meeting.meeting_participants)
                        : meeting.meeting_participants || [];
                    const invitedBy = meeting.invited_by;
                    if (invitedBy) allEmailSet.add(invitedBy);
                    participants.forEach((p: string) => allEmailSet.add(p));
                });

                const emailNameMap = new Map<string, string>();
                if (allEmailSet.size > 0) {
                    try {
                        const users: any[] = await sequelize.query(
                            rawQueries.fetchUsersByEmails(Array.from(allEmailSet)),
                            { type: QueryTypes.SELECT }
                        );
                        users.forEach((u) => {
                            emailNameMap.set(u.email, `${u.first_name || ''} ${u.last_name || ''}`.trim());
                        });
                    } catch (error) {
                        console.error("Error fetching user details:", error);
                    }
                }

                const finalMeetingListWithUsers = finalMeetingList.map((meeting) => {
                    const participants = typeof meeting.meeting_participants === 'string'
                        ? JSON.parse(meeting.meeting_participants)
                        : meeting.meeting_participants || [];
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
                            const result: any[] = await orgDb.query(
                                rawQueries.fetchWeeklyMeetingList(schemaName, scheduledStatusId),
                                {
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
                    const participants = typeof meeting.meeting_participants === 'string'
                        ? JSON.parse(meeting.meeting_participants)
                        : meeting.meeting_participants || [];
                    const invitedBy = meeting.invited_by;
                    if (invitedBy) allEmailSet.add(invitedBy);
                    participants.forEach((p: string) => allEmailSet.add(p));
                });

                const emailNameMap = new Map<string, string>();
                if (allEmailSet.size > 0) {
                    try {
                        const users: any[] = await sequelize.query(
                            rawQueries.fetchUsersByEmails(Array.from(allEmailSet)),
                            { type: QueryTypes.SELECT }
                        );
                        users.forEach((u) => {
                            emailNameMap.set(u.email, `${u.first_name || ''} ${u.last_name || ''}`.trim());
                        });
                    } catch (error) {
                        console.error("Error fetching user details:", error);
                    }
                }

                const finalMeetingListWithUsers = finalMeetingList.map((meeting) => {
                    const participants = typeof meeting.meeting_participants === 'string'
                        ? JSON.parse(meeting.meeting_participants)
                        : meeting.meeting_participants || [];
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
            const tasksPromises = [
                // Completed Tasks (Weekly)
                sequelize.query<{ count: number }>(rawQueries.fetchWeeklyCompletedTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined), { type: QueryTypes.SELECT }),
                // Total Tasks (Weekly)
                sequelize.query<{ count: number }>(rawQueries.fetchWeeklyTotalTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined), { type: QueryTypes.SELECT }),
                // Open Tasks (Pending)
                sequelize.query<{ count: number }>(rawQueries.fetchWeeklyOpenTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined), { type: QueryTypes.SELECT }),
                // Overdue Tasks
                sequelize.query<{ count: number }>(rawQueries.fetchWeeklyOverDueTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined), { type: QueryTypes.SELECT }),
                // Blocked (On Hold Cases)
                sequelize.query<{ count: number }>(rawQueries.fetchWeeklyBlockedTaskCount(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined), { type: QueryTypes.SELECT })
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

            const userEmailResult: any[] = await sequelize.query(rawQueries.fetchUserEmail(userId), { type: QueryTypes.SELECT });
            const userEmail = userEmailResult[0]?.email || '';

            await Promise.all(
                Array.from(uniqueSchemaNames).map(async (schemaName) => {
                    try {
                        const tableExists = await this.checkTableExistence(orgDb, schemaName, 'activities');
                        if (!tableExists) {
                            return;
                        }

                        const [totalRes, attendedRes] = await Promise.all([
                            orgDb.query<{ count: number }>(
                                rawQueries.fetchWeeklyMeetingCount(schemaName, totalStatuses, flag === "user" ? userEmail : undefined),
                                { type: QueryTypes.SELECT }
                            ),
                            orgDb.query<{ count: number }>(
                                rawQueries.fetchWeeklyMeetingCount(schemaName, attendedStatuses, flag === "user" ? userEmail : undefined),
                                { type: QueryTypes.SELECT }
                            )
                        ]);

                        totalMeetingsCount += Number(totalRes[0]?.count || 0);
                        attendedMeetingsCount += Number(attendedRes[0]?.count || 0);

                    } catch (error) {
                        errorLog(`Error fetching meetings for schema ${schemaName}: ${error}`);
                    }
                })
            );

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


    private async fetchTasksList(userId: string, flag: string, queryGenerator: (accountIds?: string[], userId?: string) => string): Promise<{ statusCode: number; message: string; data?: any }> {
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

            const query = queryGenerator(flag === "user" ? accountIds : undefined, flag === "user" ? userId : undefined);
            const tasks: any[] = await sequelize.query(query, { type: QueryTypes.SELECT });

            // Fetch user details for assigned_to
            const assignedToIds = new Set<string>();
            tasks.forEach(t => {
                if (t.assigned_to) assignedToIds.add(t.assigned_to);
            });

            const userMap = new Map<string, string>();
            if (assignedToIds.size > 0) {
                const users: any[] = await sequelize.query(
                    rawQueries.fetchUsersByRids(Array.from(assignedToIds)),
                    { type: QueryTypes.SELECT }
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

    async getOverallProjectValue(userId: string, flag: string, fiscalYear?: string): Promise<{ statusCode: number; message: string; data?: any }> {
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

            const { query, replacements } = rawQueries.fetchOverallProjectValue(flag === "user" ? accountIds : undefined, fiscalYear);
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
            errorLog("getOverallProjectValue", (error as Error).message);
            throw error;
        }
    }

    async getGlobalLevelChart(userId: string, flag: string, fiscalYear?: string, countryRid?: string): Promise<{ statusCode: number; message: string; data?: any }> {
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

            const { query, replacements } = rawQueries.fetchGlobalAccountClaimedAmounts(flag === "user" ? accountIds : undefined, fiscalYear, countryRid);
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
            errorLog("getGlobalLevelChart", (error as Error).message);
            throw error;
        }
    }
}
