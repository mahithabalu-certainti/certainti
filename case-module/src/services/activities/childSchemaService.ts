
import {
    decryptClientSecret,
    errorLog,
    logMessage,
} from "../../utils/helpers";
import { CaseModelService } from "../caseModelsService";
import {
    HttpStatus,
    MAIN_SCHEMA_NAME,
    STATUS_MESSAGE,
    activityStatus,
    rawQueries,
    activityTypes
} from "../../utils/constants";
import { IActivityMeetingAction } from "../../utils/types";
import { cancelTeamsMeetingUtil } from "../../utils/teamsMeetingUtil";
import ActivitySchemaService from "./schemaService";
import { Sequelize } from "sequelize";
import moment from "moment";


export class ChildSchemaService {
    private caseModelService: CaseModelService;
    private activitySchemaService: ActivitySchemaService;
    private orgDbSequelize: Sequelize | null = null;
    private mainDbSequelize: Sequelize | null = null;

    constructor() {
        this.caseModelService = new CaseModelService();
        this.activitySchemaService = new ActivitySchemaService();
    }


    async cancelActivityMeeting(
        accountNumber: string,
        activityRequest: IActivityMeetingAction,
        userId: string
    ) {
        try {
            const { Activities } = await this.caseModelService.getModels(accountNumber);
            this.mainDbSequelize = await this.caseModelService.getMainSequelize();

            const existingActivity = await Activities.findOne({
                where: {
                    rid: activityRequest.activity_rid,
                    account_rid: activityRequest.account_rid,
                },
            });

            if (!existingActivity) {
                return {
                    success: false,
                    message: "Activity not found",
                    statusCode: HttpStatus.NOT_FOUND
                };
            }

            // Fetch sender email info to cancel teams meeting
            const [accountInfo]: any[] = await this.mainDbSequelize.query(
                rawQueries.fetchAccountInfo(activityRequest.account_rid!),
                { type: "SELECT" }
            );

            let parentAccountNumber = accountNumber;
            if (accountInfo.storage_type === 'separate_db') {
                const [parentAccountInfo]: any[] =
                    await this.mainDbSequelize.query(
                        rawQueries.fetchAccountInfo(accountInfo.parent_account_rid!),
                        { type: "SELECT" }
                    );
                parentAccountNumber = parentAccountInfo.r_number;
            }

            const senderEmailInfo = await this.fetchSenderEmailInfoByAccountId(
                parentAccountNumber,
                accountInfo.parent_account_rid
            );

            if (senderEmailInfo && existingActivity.meeting_id) {
                const cancelResult = await cancelTeamsMeetingUtil(
                    existingActivity.meeting_id,
                    senderEmailInfo
                );

                if (!cancelResult.success) {
                    return {
                        success: false,
                        message: "Failed to cancel Teams meeting",
                        statusCode: HttpStatus.FAILED,
                        errorMessage: cancelResult.error,
                    };
                }
            }

            const [meetingStatus]: any[] = await this.mainDbSequelize.query(
                rawQueries.fetchActivityStatusByName("Cancelled", "Meeting"),
                { type: "SELECT" }
            );

            if (!meetingStatus || !meetingStatus.rid) {
                logMessage("Activity status 'Cancelled' not found for Meeting");
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: HttpStatus.NOT_FOUND_MESSAGE,
                    errorMessage: "Activity status not found",
                };
            }

            await Activities.update(
                {
                    status_rid: meetingStatus?.rid,
                    modified_by: userId,
                    modified_datetime: new Date(),
                },
                {
                    where: { rid: activityRequest.activity_rid },
                }
            );
            if (existingActivity != null) {
                const startDate =
                    existingActivity.effective_start_datetime !== null
                        ? moment.utc(existingActivity.effective_start_datetime).format("YYYY-MM-DD")
                        : null;
                const endDate =
                    existingActivity.effective_end_datetime !== null
                        ? moment.utc(existingActivity.effective_end_datetime).format("YYYY-MM-DD")
                        : null;
                await this.activitySchemaService.addActivityHistory(
                    accountNumber,
                    activityRequest.activity_rid as string,
                    { ...existingActivity.dataValues, status_rid: meetingStatus?.rid, modified_by: userId },
                    {
                        ...existingActivity,
                        effective_start_datetime: startDate,
                        effective_end_datetime: endDate,
                    },
                    activityTypes.meeting
                );
            }
            await this.activitySchemaService.addTaskTimeline(
                accountNumber,
                activityRequest.activity_rid,
                activityRequest.account_rid!,
                `Meeting Activity Cancelled`,
                userId,
                `Meeting Activity Cancelled`,
                "success",
                activityRequest.activity_rid
            );

            return {
                success: true,
                message: "Meeting cancelled successfully",
                statusCode: HttpStatus.SUCCESS
            };

        } catch (error) {
            logMessage(`Error cancelling activity meeting: ${error}`);
            throw error;
        }
    }

    async completeActivityMeeting(
        accountNumber: string,
        activityRequest: IActivityMeetingAction,
        userId: string
    ) {
        try {
            const { Activities } = await this.caseModelService.getModels(accountNumber);
            this.mainDbSequelize = await this.caseModelService.getMainSequelize();

            const existingActivity = await Activities.findOne({
                where: {
                    rid: activityRequest.activity_rid,
                    account_rid: activityRequest.account_rid,
                },
            });

            if (!existingActivity) {
                return {
                    success: false,
                    message: "Activity not found",
                    statusCode: HttpStatus.NOT_FOUND
                };
            }

            const [meetingStatus]: any[] = await this.mainDbSequelize.query(
                rawQueries.fetchActivityStatusByName("Completed", "Meeting"),
                { type: "SELECT" }
            );

            if (!meetingStatus) {
                return {
                    success: false,
                    message: "Meeting Completed status not found",
                    statusCode: HttpStatus.NOT_FOUND
                };
            }

            await Activities.update(
                {
                    status_rid: meetingStatus?.rid,
                    modified_by: userId,
                    modified_datetime: new Date(),
                },
                {
                    where: { rid: activityRequest.activity_rid },
                }
            );
            if (existingActivity != null) {
                const startDate =
                    existingActivity.effective_start_datetime !== null
                        ? moment.utc(existingActivity.effective_start_datetime).format("YYYY-MM-DD")
                        : null;
                const endDate =
                    existingActivity.effective_end_datetime !== null
                        ? moment.utc(existingActivity.effective_end_datetime).format("YYYY-MM-DD")
                        : null;
                await this.activitySchemaService.addActivityHistory(
                    accountNumber,
                    activityRequest.activity_rid as string,
                    { ...existingActivity.dataValues, status_rid: meetingStatus?.rid, modified_by: userId },
                    {
                        ...existingActivity,
                        effective_start_datetime: startDate,
                        effective_end_datetime: endDate,
                    },
                    activityTypes.meeting
                );
            }
            await this.activitySchemaService.addTaskTimeline(
                accountNumber,
                activityRequest.activity_rid,
                activityRequest.account_rid!,
                `Meeting Activity Completed`,
                userId,
                `Meeting Activity Completed`,
                "success",
                activityRequest.activity_rid
            );

            return {
                success: true,
                message: "Meeting completed successfully",
                statusCode: HttpStatus.SUCCESS
            };

        } catch (error) {
            logMessage(`Error completing activity meeting: ${error}`);
            throw error;
        }
    }

    async fetchSenderEmailInfoByAccountId(
        accountNumber: string,
        parentAccountId: string
    ) {
        try {
            if (!this.orgDbSequelize) {
                this.orgDbSequelize = await this.caseModelService.getSequelize();
            }
            const schemaName = `${MAIN_SCHEMA_NAME}_${accountNumber.replace(
                /\D/g,
                ""
            )}`;
            const [senderEmailInfo]: any[] = await this.orgDbSequelize.query(
                rawQueries.fetchSenderEmail(schemaName, parentAccountId)
            );

            if (!senderEmailInfo || senderEmailInfo.length === 0 || !senderEmailInfo[0]) {
                return null;
            }

            const clientSecret = senderEmailInfo[0]?.client_secret;
            const decryptedSecret = await decryptClientSecret(clientSecret);

            return {
                email:
                    senderEmailInfo[0]?.support_email,
                clientId:
                    senderEmailInfo[0]?.client_id,
                clientSecret:
                    decryptedSecret,
                tenantId:
                    senderEmailInfo[0]?.tenant_id,
            };
        } catch (err) {
            logMessage(`Error fetching sender email info for account: ${err}`);
        }
    }
}
