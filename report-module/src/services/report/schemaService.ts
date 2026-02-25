import { QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
    rawQueries,
    ATTACHMENT_LEVEL,
} from "../../utils/constants";
import {
    errorLog,
} from "../../utils/helpers";
import { IAttachment } from "../../services/interfaces/interface";
class SchemaService {


    async getUserGroupType(userRid: string): Promise<string | null> {
        const mainDbSequelize = await initMainDbSequelize();

        try {
            const results = await mainDbSequelize.query<{ group_type: string }>(
                rawQueries.GET_USER_GROUP_TYPE,
                {
                    replacements: { userRid },
                    type: QueryTypes.SELECT,
                }
            );

            if (!results || results.length === 0) {
                return null;
            }

            return results[0]?.group_type ?? null;
        } catch (error) {
            // Log the error for debugging
            errorLog("Error fetching user group type:", (error as Error).message);
            throw new Error("Failed to get user group type");
        }
    }
    async getAccessibleAccountInfo(userRid: string): Promise<
        Array<{
            id: string;
            isChild: boolean;
            parentId: string | null;
        }>
    > {
        const mainDbSequelize = await initMainDbSequelize();

        try {
            // 1. Direct access with account info
            const directAccess = await mainDbSequelize.query<{
                entity_rid: string;
                parent_account_rid: string | null;
                is_child: boolean;
            }>(rawQueries.GET_ACCOUNT_DIRECT_ACCESS_USER_IDS, {
                replacements: { userRid },
                type: QueryTypes.SELECT,
            });

            // 2. Direct EXCLUDE access — normalize and store in a Set
            const directExclude = await mainDbSequelize.query<{ entity_rid: string }>(
                rawQueries.GET_ACCOUNT_DIRECT_EXCLUDE_ACCESS_USER_IDS,
                {
                    replacements: { userRid },
                    type: QueryTypes.SELECT,
                }
            );

            const excludedEntityRids = new Set(
                directExclude.map((e) => e.entity_rid?.trim().toLowerCase())
            );

            // 3. Group INCLUDE access
            const groupAccess = await mainDbSequelize.query<{
                entity_rid: string;
                parent_account_rid: string | null;
                is_child: boolean;
            }>(rawQueries.GET_GROUP_ACCESS, {
                replacements: { userRid },
                type: QueryTypes.SELECT,
            });

            // 3. Combine and deduplicate
            const allAccess = [...directAccess, ...groupAccess];
            const uniqueAccess = new Map<
                string,
                {
                    id: string;
                    isChild: boolean;
                    parentId: string | null;
                }
            >();

            allAccess.forEach((access) => {
                const normalizedEntityId = access.entity_rid?.trim().toLowerCase();
                if (
                    !excludedEntityRids.has(normalizedEntityId) &&
                    !uniqueAccess.has(normalizedEntityId)
                ) {
                    uniqueAccess.set(normalizedEntityId, {
                        id: access.entity_rid,
                        isChild: access.is_child,
                        parentId: access.parent_account_rid,
                    });
                }
            });

            return Array.from(uniqueAccess.values());
        } catch (err) {
            errorLog("Error in getAccessibleAccountInfo:", (err as Error).message);
            return [];
        }
    }

    async fetchAccountsByIds(accountRids: string[]) {
        try {
            const mainDbSequelize = await initMainDbSequelize();

            // Return empty array if no account IDs provided
            if (!accountRids || accountRids.length === 0) {
                return [];
            }

            const accounts = await mainDbSequelize.query(
                rawQueries.getAccountsByRidsQuery(),
                {
                    replacements: { accountRids },
                    type: QueryTypes.SELECT,
                }
            );

            return accounts;
        } catch (err) {
            throw new Error(
                "Error fetching accounts by IDs: " + (err as Error).message
            );
        }
    }

    /**
 * Fetches the parent account number for a given parent account ID.
 * @param parentAccountId - Parent account RID.
 * @returns Parent account number.
 */
    async fetchParentAccount(parentAccountId: string): Promise<string> {
        try {
            const sequelize = await initMainDbSequelize();

            const accountDetailsQuery = rawQueries.fetchAccountDetailsByRid(parentAccountId);
            const [account]: any[] = await sequelize.query(
                accountDetailsQuery.query,
                {
                    replacements: accountDetailsQuery.replacements,
                    type: QueryTypes.SELECT,
                }
            );

            return account?.r_number;
        } catch (err) {
            errorLog("Error fetching parent account : " + (err as Error).message);
            throw new Error(
                "Error fetching parent account : " + (err as Error).message
            );
        }
    }
    async getAllowedExportFields(
        userId: string,
        permission_name: string
    ): Promise<any[]> {
        const mainDbSequelize = await initMainDbSequelize();
        const [userInfo] = (await mainDbSequelize.query(
            rawQueries.fetchUserProfileId(),
            {
                replacements: { userId },
                type: QueryTypes.SELECT,
            }
        )) as [{ profile_rid: string }] | [];

        if (!userInfo?.profile_rid) {
            return [];
        }

        const [profileFields, userFields] = await Promise.all([
            mainDbSequelize.query(rawQueries.fetchProfilePermissions(), {
                replacements: {
                    permissionName: permission_name,
                    profileId: userInfo?.profile_rid,
                },
                type: QueryTypes.SELECT,
            }),
            mainDbSequelize.query(rawQueries.fetchUserPermissions(), {
                replacements: {
                    permissionName: permission_name,
                    userId,
                },
                type: QueryTypes.SELECT,
            }),
        ]);

        // Merge: user overrides profile
        const userFieldMap = new Map<string, any>();
        for (const field of userFields as any[]) {
            userFieldMap.set(field.field_name, field);
        }

        const merged = (profileFields as any[]).map((pf) => {
            const userPerm = userFieldMap.get(pf.field_name);
            if (userPerm) {
                userFieldMap.delete(pf.field_name);
                return {
                    field_desc: pf.field_desc,
                    field_name: pf.field_name,
                    read: pf.read ? true : userPerm?.read === true,
                };
            }
            return {
                field_desc: pf.field_desc,
                field_name: pf.field_name,
                read: pf.read,
            };
        });

        const userOnly = Array.from(userFieldMap.values()).map((uf) => ({
            field_desc: uf.field_desc,
            field_name: uf.field_name,
            read: uf.read,
        }));

        const exportableFields = [...merged, ...userOnly].filter((f) => f.read);
        return exportableFields;
    }
    async getAttachmentDisplayNames(attachments: IAttachment[]): Promise<Record<string, string>> {
        const displayNames: Record<string, string> = {};
        const accountRids: string[] = [];
        const projectRids: string[] = [];
        const caseRids: string[] = [];

        // 1. Group IDs by type
        for (const attachment of attachments) {
            if (!attachment.attach_to) {
                displayNames[attachment.rid] = '';
                continue;
            }

            switch (attachment.attachment_level) {
                case ATTACHMENT_LEVEL.ACCOUNT:
                    accountRids.push(attachment.attach_to);
                    break;
                case ATTACHMENT_LEVEL.PROJECT:
                    projectRids.push(attachment.attach_to);
                    break;
                case ATTACHMENT_LEVEL.CASE:
                    caseRids.push(attachment.attach_to);
                    break;
                default:
                    displayNames[attachment.rid] = attachment.attach_to;
            }
        }

        const mainDbSequelize = await initMainDbSequelize();
        const promises = [];

        // 2. Bulk Fetch
        if (accountRids.length > 0) {
            promises.push(
                this.fetchAccountsByIds(accountRids).then(accounts => ({ type: ATTACHMENT_LEVEL.ACCOUNT, data: accounts }))
            );
        }

        if (projectRids.length > 0) {
            const query = rawQueries.getProjectsByRidsQuery();
            promises.push(
                mainDbSequelize.query(query, {
                    replacements: { projectRids },
                    type: QueryTypes.SELECT
                }).then(projects => ({ type: ATTACHMENT_LEVEL.PROJECT, data: projects }))
            );
        }

        if (caseRids.length > 0) {
            const query = rawQueries.fetchCasesByRids();
            promises.push(
                mainDbSequelize.query(query, {
                    replacements: { caseRids },
                    type: QueryTypes.SELECT
                }).then(cases => ({ type: ATTACHMENT_LEVEL.CASE, data: cases }))
            );
        }

        try {
            const results = await Promise.all(promises);

            // 3. Map Results
            const accountMap = new Map<string, string>();
            const projectMap = new Map<string, string>();
            const caseMap = new Map<string, string>();

            results.forEach(result => {
                if (result.type === ATTACHMENT_LEVEL.ACCOUNT) {
                    (result.data as any[]).forEach(a => accountMap.set(a.rid, a.account_name));
                } else if (result.type === ATTACHMENT_LEVEL.PROJECT) {
                    (result.data as any[]).forEach(p => projectMap.set(p.project_fiscal_rid, p.project_code));
                } else if (result.type === ATTACHMENT_LEVEL.CASE) {
                    (result.data as any[]).forEach(c => caseMap.set(c.case_rid, c.case_name));
                }
            });

            // 4. Populate displayNames
            for (const attachment of attachments) {
                // initialization handled in step 1 for default/empty
                if (displayNames[attachment.rid] !== undefined) continue;

                let name = attachment.attach_to;
                switch (attachment.attachment_level) {
                    case ATTACHMENT_LEVEL.ACCOUNT:
                        name = accountMap.get(attachment.attach_to) || attachment.attach_to;
                        break;
                    case ATTACHMENT_LEVEL.PROJECT:
                        name = projectMap.get(attachment.attach_to) || attachment.attach_to;
                        break;
                    case ATTACHMENT_LEVEL.CASE:
                        name = caseMap.get(attachment.attach_to) || attachment.attach_to;
                        break;
                }
                displayNames[attachment.rid] = name;
            }
        } catch (err) {
            errorLog("Error in getAttachmentDisplayNames bulk fetch:", (err as Error).message);
            // Fallback to original ID if bulk fetch fails
            for (const attachment of attachments) {
                if (displayNames[attachment.rid] === undefined) {
                    displayNames[attachment.rid] = attachment.attach_to;
                }
            }
        }

        return displayNames;
    }
    async fetchAccountById(accountId: string) {
        try {
            const mainDbSequelize = await initMainDbSequelize();
            const [accountData]: any[] = await mainDbSequelize.query(
                rawQueries.getAccountWithStatusByRidQuery(),
                {
                    replacements: { rid: accountId },
                    type: "SELECT",
                }
            );

            return accountData;
        } catch (err) {
            errorLog("Error fetching Accounts: " + (err as Error).message);
            throw new Error("Error fetching Accounts: " + (err as Error).message);
        }
    }
    async fetchProjectInfoById(projectFiscalRid: string) {
        const mainDbSequelize = await initMainDbSequelize();
        const [projectData]: any[] = await mainDbSequelize.query(
            rawQueries.getProjectWithStatusByRidQuery(),
            {
                replacements: { projectFiscalRid },
                type: "SELECT",
            }
        );

        return projectData;
    }
    async fetchCaseById(caseId: string) {

        const query = rawQueries.fetchCaseById();

        const mainDbSequelize = await initMainDbSequelize();
        const [result]: any[] = await mainDbSequelize.query(query, {
            replacements: { caseId },
            type: "SELECT",
        });

        return result;
    }

    async computeGlobalAccountFilter(globalFilters: Record<string, string[]>) {
        try {
            const result = [];

            for (const key of Object.keys(globalFilters)) {
                const values = globalFilters[key] ?? [];
                result.push(key, ...values);
            }

            return result;
        } catch (err) {
            throw new Error("Error computing global account filter");
        }
    }
}
export default SchemaService;