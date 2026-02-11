import { QueryTypes, Sequelize } from "sequelize";
import { initMainDbSequelize } from "../../config/mainDataSource";
import {
    rawQueries,
} from "../../utils/constants";
import {
    errorLog,
} from "../../utils/helpers";
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
}
export default SchemaService;