import { initMainDbSequelize } from "../../config/mainDataSource";
import { Sequelize, Op, QueryTypes } from "sequelize";
import { MAIN_SCHEMA_NAME, HttpStatus, rawQueries, USER_FLAG } from "../../utils/constants";
import { errorLog, generateSasUrl } from "../../utils/helpers";
import SchemaService from "./schemaService";
import { CaseSummary } from "../../models/caseSummaryModel";
import { IReportService, ICountDetails, IResponse, IMeeting, IWeeklyProductivity, ITask, IGlobalLevelChart } from "../interfaces/interface";


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

    async getCountDetails(userId: string, flag: string, fiscalYear: number, globalFilters: Record<string, any> = {}): Promise<IResponse<ICountDetails[] | { account: any[], count: number }>> {
        try {
            const sequelize = await this.getMainSequelize();
            const existingCaseSummaryModel = sequelize.models.CaseSummary as typeof CaseSummary | undefined;
            const CaseSummaryModel = existingCaseSummaryModel ?? CaseSummary.initialize(sequelize, MAIN_SCHEMA_NAME);

            let parsedGlobalFilters = globalFilters;
            if (typeof globalFilters === 'string' && (globalFilters as string).trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters as string);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            } else if (!globalFilters) {
                parsedGlobalFilters = {};
            }

            const validFiscalYear = (fiscalYear && fiscalYear > 0) ? fiscalYear : undefined;

            const accountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters);

            if (flag === USER_FLAG) {

                let finalAccountIds = accountIds;
                const childAccountIds = await this.getChildAccountIds(userId);
                if (childAccountIds) {
                    if (accountIds && accountIds.length > 0) {
                        finalAccountIds = childAccountIds.filter((acc) => accountIds.includes(acc));
                    }
                }

                const totalCases = await CaseSummaryModel.count({
                    where: {
                        account_rid: {
                            [Op.in]: finalAccountIds
                        },
                        ...(validFiscalYear ? { fiscal_year: validFiscalYear } : {})
                    }
                })

                const closedCasesQuery = rawQueries.fetchCaseCountWithStatus('Closed', finalAccountIds, validFiscalYear);
                const completedCasesCount: { count: number }[] = await sequelize.query(
                    closedCasesQuery.query,
                    {
                        replacements: closedCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const onHoldCasesQuery = rawQueries.fetchCaseCountWithStatus('On Hold', finalAccountIds, validFiscalYear);
                const onHoldCasesCount: { count: number }[] = await sequelize.query(
                    onHoldCasesQuery.query,
                    {
                        replacements: onHoldCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const openTasksQuery = rawQueries.fetchOpenTaskCount(finalAccountIds, userId, validFiscalYear);
                const openTasksCount: { count: number }[] = await sequelize.query(
                    openTasksQuery.query,
                    {
                        replacements: openTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const overDueTasksQuery = rawQueries.fetchOverDueTaskCount(finalAccountIds, userId, validFiscalYear);
                const overDueTasksCount: { count: number }[] = await sequelize.query(
                    overDueTasksQuery.query,
                    {
                        replacements: overDueTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const upcomingTasksQuery = rawQueries.fetchUpcomingTaskCount(finalAccountIds, userId, validFiscalYear);
                const upcomingTasksCount: { count: number }[] = await sequelize.query(
                    upcomingTasksQuery.query,
                    {
                        replacements: upcomingTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyCompletedTasksQuery = rawQueries.fetchWeeklyCompletedTaskCount(userId, finalAccountIds, validFiscalYear);
                const weeklyCompletedTasksCount: { count: number }[] = await sequelize.query(
                    weeklyCompletedTasksQuery.query,
                    {
                        replacements: weeklyCompletedTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const result: ICountDetails[] = []

                result.push({
                    "name": "Active Accounts",
                    "key": "active_accounts",
                    "count": finalAccountIds.length,
                    "order": 1
                })
                result.push({
                    "name": "Active Cases",
                    "key": "active_cases",
                    "count": totalCases,
                    "order": 2
                })
                result.push({
                    "name": "Total Completed Cases",
                    "key": "total_completed_cases",
                    "count": completedCasesCount[0]?.count || 0,
                    "order": 3
                })
                result.push({
                    "name": "Stalled Cases",
                    "key": "stalled_cases",
                    "count": onHoldCasesCount[0]?.count || 0,
                    "order": 4
                })
                result.push({
                    "name": "Open Tasks",
                    "key": "open_tasks",
                    "count": openTasksCount[0]?.count || 0,
                    "order": 5
                })
                result.push({
                    "name": "Due Today / Over Due Tasks",
                    "key": "due_today_overdue_tasks",
                    "count": overDueTasksCount[0]?.count || 0,
                    "order": 6
                })
                result.push({
                    "name": "Upcoming Tasks (7 Days)",
                    "key": "upcoming_tasks_7_days",
                    "count": upcomingTasksCount[0]?.count || 0,
                    "order": 7
                })
                result.push({
                    "name": "Tasks Completed This Week",
                    "key": "tasks_completed_this_week",
                    "count": weeklyCompletedTasksCount[0]?.count || 0,
                    "order": 8
                })

                return {
                    statusCode: HttpStatus.SUCCESS,
                    message: "Success",
                    data: result
                };

            } else {

                const activeAccountsQuery = rawQueries.fetchActiveAccountsCount(accountIds)

                // Get total active accounts count
                const activeAccountsCount = await sequelize.query<{ count: string }>(
                    activeAccountsQuery.query,
                    {
                        replacements: activeAccountsQuery.replacements,
                        type: QueryTypes.SELECT
                    }
                );

                const totalCasesQuery = rawQueries.fetchActiveCaseCount(accountIds, validFiscalYear);
                const totalCases: { count: number }[] = await sequelize.query(
                    totalCasesQuery.query,
                    {
                        replacements: totalCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const closedCasesQuery = rawQueries.fetchCaseCountWithStatus('Closed', accountIds, validFiscalYear);
                const completedCasesCount: { count: number }[] = await sequelize.query(
                    closedCasesQuery.query,
                    {
                        replacements: closedCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const onHoldCasesQuery = rawQueries.fetchCaseCountWithStatus('On Hold', accountIds, validFiscalYear);
                const onHoldCasesCount: { count: number }[] = await sequelize.query(
                    onHoldCasesQuery.query,
                    {
                        replacements: onHoldCasesQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const openTasksQuery = rawQueries.fetchOpenTaskCount(accountIds, undefined, validFiscalYear);
                const openTasksCount: { count: number }[] = await sequelize.query(
                    openTasksQuery.query,
                    {
                        replacements: openTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const overDueTasksQuery = rawQueries.fetchOverDueTaskCount(accountIds, undefined, validFiscalYear);
                const overDueTasksCount: { count: number }[] = await sequelize.query(
                    overDueTasksQuery.query,
                    {
                        replacements: overDueTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const upcomingTasksQuery = rawQueries.fetchUpcomingTaskCount(accountIds, undefined, validFiscalYear);
                const upcomingTasksCount: { count: number }[] = await sequelize.query(
                    upcomingTasksQuery.query,
                    {
                        replacements: upcomingTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const weeklyCompletedTasksQuery = rawQueries.fetchWeeklyCompletedTaskCount(undefined, accountIds, validFiscalYear);
                const weeklyCompletedTasksCount: { count: number }[] = await sequelize.query(
                    weeklyCompletedTasksQuery.query,
                    {
                        replacements: weeklyCompletedTasksQuery.replacements,
                        type: QueryTypes.SELECT,
                    }
                );

                const result: ICountDetails[] = []

                result.push({
                    "name": "Active Accounts",
                    "key": "active_accounts",
                    "count": Number(activeAccountsCount[0]?.count || 0),
                    "order": 1
                })
                result.push({
                    "name": "Active Cases",
                    "key": "active_cases",
                    "count": totalCases[0]?.count || 0,
                    "order": 2
                })
                result.push({
                    "name": "Total Completed Cases",
                    "key": "total_completed_cases",
                    "count": completedCasesCount[0]?.count || 0,
                    "order": 3
                })
                result.push({
                    "name": "Stalled Cases",
                    "key": "stalled_cases",
                    "count": onHoldCasesCount[0]?.count || 0,
                    "order": 4
                })
                result.push({
                    "name": "Open Tasks",
                    "key": "open_tasks",
                    "count": openTasksCount[0]?.count || 0,
                    "order": 5
                })
                result.push({
                    "name": "Due Today / Over Due Tasks",
                    "key": "due_today_overdue_tasks",
                    "count": overDueTasksCount[0]?.count || 0,
                    "order": 6
                })
                result.push({
                    "name": "Upcoming Tasks (7 Days)",
                    "key": "upcoming_tasks_7_days",
                    "count": upcomingTasksCount[0]?.count || 0,
                    "order": 7
                })
                result.push({
                    "name": "Tasks Completed This Week",
                    "key": "tasks_completed_this_week",
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

    async getMeetingList(userId: string, flag: string, globalFilters: any): Promise<IResponse<IMeeting[]>> {
        try {

            const sequelize = await this.getMainSequelize();

            const activityStatuses: any[] = await sequelize.query(rawQueries.fetchActivityStatus(), { type: QueryTypes.SELECT });

            const statusMap = new Map(activityStatuses.map((s) => [s.rid, s.status_name]));

            const scheduledStatus = activityStatuses.find((s) => s.status_name === 'Scheduled');
            const scheduledStatusId = scheduledStatus ? scheduledStatus.rid : '';


            let parsedGlobalFilters = globalFilters;
            if (typeof globalFilters === 'string' && globalFilters.trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            } else if (!globalFilters) {
                parsedGlobalFilters = {};
            }

            const accountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters);

            let userEmail: string | undefined;
            if (flag === USER_FLAG) {
                const userEmailQuery = rawQueries.fetchUserEmail(userId);
                const userEmailResult: { email: string }[] = await sequelize.query(userEmailQuery.query, {
                    replacements: userEmailQuery.replacements,
                    type: QueryTypes.SELECT
                });
                userEmail = userEmailResult[0]?.email;
            }

            // Fetch Meetings
            const meetingListQuery = rawQueries.fetchMeetingSummaryList(scheduledStatusId, userEmail, accountIds);
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

            // Build attachment display names for each schemaNumber group
            const attachmentDisplayNames: Record<string, string> = await this.schemaService.getAttachmentDisplayNames(
                finalMeetingList
            );

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
                    },
                    attached_to: attachmentDisplayNames[meeting.rid] || ''
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

    async getWeeklyProductivityList(userId: string, flag: string, fiscalYear: number, globalFilters: any): Promise<IResponse<IWeeklyProductivity[]>> {
        try {
            const sequelize = await this.getMainSequelize();

            let parsedGlobalFilters = globalFilters;
            if (typeof globalFilters === 'string' && globalFilters.trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            } else if (!globalFilters) {
                parsedGlobalFilters = {};
            }

            const validFiscalYear = (fiscalYear && fiscalYear > 0) ? fiscalYear : undefined;

            const accountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters);

            let finalAccountIds = accountIds;
            if (flag === USER_FLAG) {
                const childAccountIds = await this.getChildAccountIds(userId);
                if (childAccountIds) {
                    finalAccountIds = childAccountIds;
                    if (accountIds && accountIds.length > 0) {
                        finalAccountIds = childAccountIds.filter((acc) => accountIds.includes(acc));
                    }
                }
            }

            // 2. Fetch Tasks Stats (Main DB)
            const weeklyCompletedQuery = rawQueries.fetchWeeklyCompletedTaskCount(flag === USER_FLAG ? userId : undefined, finalAccountIds, validFiscalYear);
            const weeklyTotalQuery = rawQueries.fetchWeeklyTotalTaskCount(flag === USER_FLAG ? userId : undefined, finalAccountIds, validFiscalYear);
            const weeklyOpenQuery = rawQueries.fetchWeeklyOpenTaskCount(flag === USER_FLAG ? userId : undefined, finalAccountIds, validFiscalYear);
            const weeklyOverdueQuery = rawQueries.fetchWeeklyOverDueTaskCount(flag === USER_FLAG ? userId : undefined, finalAccountIds, validFiscalYear);
            const weeklyBlockedQuery = rawQueries.fetchWeeklyBlockedTaskCount(flag === USER_FLAG ? userId : undefined, finalAccountIds, validFiscalYear);

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

            let userEmail: string | undefined;
            if (flag === USER_FLAG) {
                const userEmailQuery = rawQueries.fetchUserEmail(userId);
                const userEmailResult: { email: string }[] = await sequelize.query(userEmailQuery.query, {
                    replacements: userEmailQuery.replacements,
                    type: QueryTypes.SELECT
                });
                userEmail = userEmailResult[0]?.email;
            }

            const weeklyTotalMeetingQuery = rawQueries.fetchMeetingSummaryCount(totalStatuses, userEmail, finalAccountIds);
            const weeklyAttendedMeetingQuery = rawQueries.fetchMeetingSummaryCount(attendedStatuses, userEmail, finalAccountIds);

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
                    total: weeklyTotal,
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


    private async fetchTasksList(
        userId: string,
        flag: string,
        queryGenerator: (userId?: string, accountIds?: string[], fiscalYear?: number) => { query: string, replacements: any },
        fiscalYear?: number,
        globalFilters?: any
    ): Promise<IResponse<ITask[]>> {
        try {
            const sequelize = await this.getMainSequelize();

            let parsedGlobalFilters = globalFilters;
            if (typeof globalFilters === 'string' && globalFilters.trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            } else if (!globalFilters) {
                parsedGlobalFilters = {};
            }

            const validFiscalYear = (fiscalYear && fiscalYear > 0) ? fiscalYear : undefined;

            const accountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters);

            let finalAccountIds = accountIds;
            if (flag === USER_FLAG) {
                const childAccountIds = await this.getChildAccountIds(userId);
                if (childAccountIds) {
                    finalAccountIds = childAccountIds;
                    if (accountIds && accountIds.length > 0) {
                        finalAccountIds = childAccountIds.filter((acc) => accountIds.includes(acc));
                    }
                }
            }

            const { query, replacements } = queryGenerator(flag === USER_FLAG ? userId : undefined, finalAccountIds, validFiscalYear);
            const tasks: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            // Build attachment display names for each schemaNumber group
            const attachmentDisplayNames: Record<string, string> = await this.schemaService.getAttachmentDisplayNames(
                tasks
            );

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
                assigned_to_name: userMap.get(t.assigned_to) || t.assigned_to,
                attached_to: attachmentDisplayNames[t.rid] || ''
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

    async getUpcomingTasksList(userId: string, flag: string, fiscal_year: string, globalFilters: Record<string, any>): Promise<IResponse<ITask[]>> {
        return this.fetchTasksList(userId, flag, rawQueries.fetchUpcomingTasks, Number(fiscal_year), globalFilters);
    }

    async getDueTodayOverdueTasksList(userId: string, flag: string, fiscal_year: string, globalFilters: any): Promise<IResponse<ITask[]>> {
        return this.fetchTasksList(userId, flag, rawQueries.fetchOverDueTasks, Number(fiscal_year), globalFilters);
    }

    async getOpenTasksList(userId: string, flag: string, fiscal_year: string, globalFilters: any): Promise<IResponse<ITask[]>> {
        return this.fetchTasksList(userId, flag, rawQueries.fetchOpenTasks, Number(fiscal_year), globalFilters);
    }

    async getCompletedTasksThisWeekList(userId: string, flag: string, fiscal_year: string, globalFilters: any): Promise<IResponse<ITask[]>> {
        return this.fetchTasksList(userId, flag, rawQueries.fetchWeeklyCompletedTasks, Number(fiscal_year), globalFilters);
    }

    async getPendingFollowUpsList(userId: string, flag: string, fiscal_year: string, globalFilters: any): Promise<IResponse<ITask[]>> {
        return this.fetchTasksList(userId, flag, rawQueries.fetchWeeklyPendingFollowUps, Number(fiscal_year), globalFilters);
    }

    async getOverdueApprovalsList(userId: string, flag: string, fiscal_year: string, globalFilters: any): Promise<IResponse<ITask[]>> {
        return this.fetchTasksList(userId, flag, rawQueries.fetchOverdueApprovals, Number(fiscal_year), globalFilters);
    }

    async getOverallProjectValue(userId: string, flag: string, fiscalYear?: string, countryType?: string, globalFilters?: Record<string, any>): Promise<IResponse<any[]>> {
        try {
            const sequelize = await this.getMainSequelize();

            let parsedGlobalFilters: Record<string, any> = typeof globalFilters === 'object' && globalFilters !== null ? globalFilters : {};
            if (typeof globalFilters === 'string' && (globalFilters as string).trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters as string);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            }

            const globalAccountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters as Record<string, string[]>);

            let accountIds: string[] = globalAccountIds || [];

            if (flag === USER_FLAG) {
                const childAccountIds = await this.getChildAccountIds(userId);
                if (childAccountIds) {
                    accountIds = childAccountIds;
                    if (accountIds && accountIds.length > 0) {
                        accountIds = childAccountIds.filter((acc) => accountIds.includes(acc));
                    }
                }
            }

            const { query: countryQuery, replacements: countryReplacements } = rawQueries.fetchCountries(undefined, countryType);
            const activeCountriesRids: any[] = await sequelize.query(countryQuery, {
                replacements: countryReplacements,
                type: QueryTypes.SELECT
            });

            const activeCountriesRidsSet = new Set<string>();
            activeCountriesRids.forEach((c: any) => activeCountriesRidsSet.add(c.country_rid));

            const finalAccountIds = accountIds && accountIds.length > 0 ? accountIds : undefined;

            const { query, replacements } = rawQueries.fetchOverallProjectValue(finalAccountIds, fiscalYear, activeCountriesRidsSet);
            let finalResult: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            finalResult = finalResult.filter((row) => {
                if ((Number(row.total_project_cost) === 0 &&
                    Number(row.total_fte_cost) === 0 &&
                    Number(row.total_subcon_cost) === 0 &&
                    Number(row.total_nonlabor_cost) === 0) ||
                    (Number(row.total_project_cost) < 0 ||
                        Number(row.total_fte_cost) < 0 ||
                        Number(row.total_subcon_cost) < 0 ||
                        Number(row.total_nonlabor_cost) < 0)) {
                    return false;
                }
                return true;

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

    async getGlobalLevelChart(userId: string, flag: string, fiscalYear?: string, countryRid?: string, countryType?: string, globalFilters?: Record<string, any>): Promise<IResponse<IGlobalLevelChart>> {
        try {
            const sequelize = await this.getMainSequelize();

            let parsedGlobalFilters: Record<string, any> = typeof globalFilters === 'object' && globalFilters !== null ? globalFilters : {};
            if (typeof globalFilters === 'string' && (globalFilters as string).trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters as string);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            }

            const globalAccountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters as Record<string, string[]>);

            let accountIds: string[] = globalAccountIds || [];

            if (flag === USER_FLAG) {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (childAccountIds) {
                    accountIds = childAccountIds;
                    if (accountIds && accountIds.length > 0) {
                        accountIds = childAccountIds.filter((acc) => accountIds.includes(acc));
                    }
                }

            }

            const { query: countryQuery, replacements: countryReplacements } = rawQueries.fetchCountries(countryRid, countryType);
            const activeCountriesRids: any[] = await sequelize.query(countryQuery, {
                replacements: countryReplacements,
                type: QueryTypes.SELECT
            });

            const activeCountriesMap = new Map<string, { country_rid: string, country_name: string, country_code: string }>();
            activeCountriesRids.forEach((c: any) => activeCountriesMap.set(c.country_rid, c));

            const activeCountriesRidsSet = new Set<string>();
            activeCountriesRids.forEach((c: any) => activeCountriesRidsSet.add(c.country_rid));

            const countryWiseApprovedAmount = new Map<string, { country_rid: string, country_name: string, country_code: string, approved: number }>();

            const finalAccountIds = accountIds && accountIds.length > 0 ? accountIds : undefined;

            const { query, replacements } = rawQueries.fetchGlobalAccountClaimedAmounts(finalAccountIds, fiscalYear, activeCountriesRidsSet);
            const accountWiseConsolidationList: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            const finalAccountWiseConsolidationList = accountWiseConsolidationList.filter((row) => row.final_credit_submitted > 0);

            accountWiseConsolidationList.forEach((row) => {
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
    async getCasesByHealthStatus(userId: string, flag: string, fiscalYear: number, filingType?: string, globalFilters?: Record<string, any>): Promise<IResponse<any[]>> {
        try {
            const sequelize = await this.getMainSequelize();

            let parsedGlobalFilters: Record<string, any> = typeof globalFilters === 'object' && globalFilters !== null ? globalFilters : {};
            if (typeof globalFilters === 'string' && (globalFilters as string).trim() !== '') {
                try {
                    parsedGlobalFilters = JSON.parse(globalFilters as string);
                } catch (e) {
                    parsedGlobalFilters = {};
                }
            }

            const globalAccountIds = await this.schemaService.computeGlobalAccountFilter(parsedGlobalFilters as Record<string, string[]>);

            let accountIds: string[] = globalAccountIds || [];

            if (flag === USER_FLAG) {
                const childAccountIds = await this.getChildAccountIds(userId);

                if (childAccountIds) {
                    accountIds = childAccountIds;
                    if (accountIds && accountIds.length > 0) {
                        accountIds = childAccountIds.filter((acc) => accountIds.includes(acc));
                    }
                }

            }

            const validFiscalYear = (fiscalYear && fiscalYear > 0) ? fiscalYear : undefined;

            const finalAccountIds = accountIds && accountIds.length > 0 ? accountIds : undefined;

            const { query, replacements } = rawQueries.fetchCasesByHealthStatus(finalAccountIds, validFiscalYear, filingType);
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

    async getAccountFiscalCost(userId: string, account_id: string): Promise<{ statusCode: number, message: string, data: any[] }> {
        try {
            const sequelize = await this.getMainSequelize();

            if (!account_id) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "Account ID is required",
                    data: []
                };
            }

            const { query, replacements } = rawQueries.fetchAccountFiscalCost(account_id);
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
            errorLog("getAccountFiscalCost", (error as Error).message);
            throw error;
        }
    }
}
