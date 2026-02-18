export interface ICountDetails {
    name: string;
    key: string;
    count: number;
    order: number;
}

export interface IMeetingParticipant {
    email: string;
    name: string;
}

export interface IMeeting {
    // Add other meeting properties as needed based on raw query selection
    meeting_participants: IMeetingParticipant[];
    invited_by: IMeetingParticipant;
    [key: string]: any; // Allow other properties for now
}

export interface IAttachment {
    rid: string;
    attach_to: string;
    attachment_level: string;
    [key: string]: any;
}

export interface IWeeklyProductivity {
    category: string;
    count: number;
    total: number;
    unit: string;
}

export interface ITask {
    assigned_to_name: string;
    [key: string]: any; // Allow other properties for now
}

export interface ICountryConsolidation {
    country_rid: string;
    country_name: string;
    country_code: string;
    approved: number;
}

export interface IGlobalLevelChart {
    accountWiseConsolidationList: any[];
    countryWiseConsolidation: ICountryConsolidation[];
}

export interface IResponse<T> {
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: T;
}

export interface IReportService {
    getCountDetails(userId: string, flag: string): Promise<IResponse<ICountDetails[] | { account: any[], count: number }>>;

    getMeetingList(userId: string, flag: string): Promise<IResponse<IMeeting[]>>;

    getAllowedExportFields(userId: string, permissionName: string): Promise<any>;

    getWeeklyProductivityList(userId: string, flag: string): Promise<IResponse<IWeeklyProductivity[]>>;

    getUpcomingTasksList(userId: string, flag: string): Promise<IResponse<ITask[]>>;

    getDueTodayOverdueTasksList(userId: string, flag: string): Promise<IResponse<ITask[]>>;

    getOpenTasksList(userId: string, flag: string): Promise<IResponse<ITask[]>>;

    getCompletedTasksThisWeekList(userId: string, flag: string): Promise<IResponse<ITask[]>>;

    getPendingFollowUpsList(userId: string, flag: string): Promise<IResponse<ITask[]>>;

    getOverdueApprovalsList(userId: string, flag: string): Promise<IResponse<ITask[]>>;

    getOverallProjectValue(userId: string, flag: string, fiscalYear?: string, countryType?: string): Promise<IResponse<any[]>>;

    getGlobalLevelChart(userId: string, flag: string, fiscalYear?: string, countryRid?: string, countryType?: string): Promise<IResponse<IGlobalLevelChart>>;

    getCasesByHealthStatus(userId: string, flag: string, fiscalYear?: string): Promise<IResponse<any[]>>;
}
