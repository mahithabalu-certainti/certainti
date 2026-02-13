import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { MAIN_SCHEMA_NAME, HttpStatus, rawQueries } from "../../utils/constants";
import { errorLog, generateSasUrl } from "../../utils/helpers";
import SchemaService from "./schemaService";
import { CaseSummary } from "../../models/caseSummaryModel";
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

            let accountIds: string[] = [];

            if (flag === "user") {
                const childAccountIds = await this.getChildAccountIds(userId);
                if (!childAccountIds) {
                    return {
                        statusCode: HttpStatus.SUCCESS,
                        message: "No accessible accounts found",
                        data: [],
                    };
                }
                accountIds = childAccountIds;
            } else {
                const allAccountsQuery = `SELECT rid FROM ${MAIN_SCHEMA_NAME}.account WHERE parent_account_rid IS NOT NULL`;
                const allAccounts: { rid: string }[] = await sequelize.query(allAccountsQuery, { type: QueryTypes.SELECT });
                accountIds = allAccounts.map(a => a.rid);
            }

            if (accountIds.length === 0) {
                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "Success",
                    data: []
                };
            }

            const activityStatuses: any[] = await sequelize.query(rawQueries.fetchActivityStatus(), { type: QueryTypes.SELECT });

            const statusMap = new Map(activityStatuses.map((s) => [s.rid, s.status_name]));

            const scheduledStatus = activityStatuses.find((s) => s.status_name === 'Scheduled');
            const scheduledStatusId = scheduledStatus ? scheduledStatus.rid : '';

            // Fetch Meetings
            const meetingListQuery = rawQueries.fetchMeetingSummaryList(accountIds, scheduledStatusId, flag === "user" ? userId : undefined);
            const meetings: any[] = await sequelize.query(meetingListQuery.query, {
                replacements: meetingListQuery.replacements,
                type: QueryTypes.SELECT
            });

            const finalMeetingList = meetings.map((meeting) => ({
                ...meeting,
                status_name: statusMap.get(meeting.status_rid) || null,
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

                // Update meeting object with parsed participants for later use
                meeting.meeting_participants = participants;

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
                const participants = meeting.meeting_participants; // Already parsed above
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

        } catch (error) {
            errorLog("getMeetingList", (error as Error).message);
            throw error;
        }
    }

    async getAllowedExportFields(userId: string, permissionName: string) {
        return this.schemaService.getAllowedExportFields(userId, permissionName);
    }

    async getWeeklyProductivityList(userId: string, flag: string): Promise<{ statusCode: number; message: string; errorMessage?: string; data?: any }> {
        try {
            const sequelize = await this.getMainSequelize();

            let accountIds: string[] = [];

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
            } else {
                // Admin/Else case: Use all accounts
                const allAccountsQuery = `SELECT rid FROM ${MAIN_SCHEMA_NAME}.account WHERE parent_account_rid IS NOT NULL`;
                const allAccounts: { rid: string }[] = await sequelize.query(allAccountsQuery, { type: QueryTypes.SELECT });
                accountIds = allAccounts.map(a => a.rid);
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

            // 3. Fetch Meeting Stats (Main DB - MeetingSummary)
            const activityStatuses: any[] = await sequelize.query(rawQueries.fetchActivityStatus(), { type: QueryTypes.SELECT });

            // Define statuses
            const attendedStatuses = activityStatuses
                .filter((s: any) => s.status_name === 'Completed')
                .map((s: any) => s.rid);

            const totalStatuses = activityStatuses.map((s: any) => s.rid);

            let totalMeetingsCount = 0;
            let attendedMeetingsCount = 0;

            const weeklyTotalMeetingQuery = rawQueries.fetchMeetingSummaryCount(accountIds, totalStatuses, flag === "user" ? userId : undefined);
            const weeklyAttendedMeetingQuery = rawQueries.fetchMeetingSummaryCount(accountIds, attendedStatuses, flag === "user" ? userId : undefined);

            const [totalRes, attendedRes] = await Promise.all([
                sequelize.query<{ count: number }>(
                    weeklyTotalMeetingQuery.query,
                    {
                        replacements: weeklyTotalMeetingQuery.replacements,
                        type: QueryTypes.SELECT
                    }
                ),
                sequelize.query<{ count: number }>(
                    weeklyAttendedMeetingQuery.query,
                    {
                        replacements: weeklyAttendedMeetingQuery.replacements,
                        type: QueryTypes.SELECT
                    }
                )
            ]);

            totalMeetingsCount = Number(totalRes[0]?.count || 0);
            attendedMeetingsCount = Number(attendedRes[0]?.count || 0);

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

    async getOverallProjectValue(userId: string, flag: string, fiscalYear?: string, countryType?: string): Promise<{ statusCode: number; message: string; data?: any }> {
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

            const { query: countryQuery, replacements: countryReplacements } = rawQueries.fetchActiveCountries(undefined, countryType);
            const activeCountriesRids: any[] = await sequelize.query(countryQuery, {
                type: QueryTypes.SELECT
            });

            const activeCountriesRidsSet = new Set<string>();
            activeCountriesRids.forEach((c: any) => activeCountriesRidsSet.add(c.country_rid));


            const { query, replacements } = rawQueries.fetchOverallProjectValue(flag === "user" ? accountIds : undefined, fiscalYear, activeCountriesRidsSet);
            const finalResult: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
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

    async getGlobalLevelChart(userId: string, flag: string, fiscalYear?: string, countryRid?: string, countryType?: string): Promise<{ statusCode: number; message: string; data?: any }> {
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

            const { query: countryQuery, replacements: countryReplacements } = rawQueries.fetchActiveCountries(countryRid, countryType);
            const activeCountriesRids: any[] = await sequelize.query(countryQuery, {
                replacements: countryReplacements,
                type: QueryTypes.SELECT
            });

            const activeCountriesMap = new Map<string, { country_rid: string, country_name: string, country_code: string }>();
            activeCountriesRids.forEach((c: any) => activeCountriesMap.set(c.country_rid, c));

            const activeCountriesRidsSet = new Set<string>();
            activeCountriesRids.forEach((c: any) => activeCountriesRidsSet.add(c.country_rid));

            const countryWiseApprovedAmount = new Map<string, { country_rid: string, country_name: string, country_code: string, approved: number }>();

            const { query, replacements } = rawQueries.fetchGlobalAccountClaimedAmounts(flag === "user" ? accountIds : undefined, fiscalYear, activeCountriesRidsSet);
            const AccountWiseConsolidationList: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            const finalAccountWiseConsolidationList = AccountWiseConsolidationList.filter((row) => row.final_credit_submitted > 0);

            AccountWiseConsolidationList.forEach((row) => {
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
