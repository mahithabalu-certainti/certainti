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
}
export default SchemaService;