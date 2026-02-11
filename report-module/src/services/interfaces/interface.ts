export interface IReportService {
    getCountDetails(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    getMeetingList(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    getAllowedExportFields(userId: string, permissionName: string): Promise<any>;

    getWeeklyProductivityList(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        errorMessage?: string;
        data?: any;
    }>;

    getUpcomingTasksList(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        data?: any;
    }>;

    getDueTodayOverdueTasksList(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        data?: any;
    }>;

    getOpenTasksList(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        data?: any;
    }>;

    getCompletedTasksThisWeekList(userId: string, flag: string): Promise<{
        statusCode: number;
        message: string;
        data?: any;
    }>;
}
