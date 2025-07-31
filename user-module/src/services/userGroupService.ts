import { constants, MAIN_SCHEMA_NAME } from "../utils/constant";
import { UserGroup } from "../models/userGroupModel";
import { where, fn, col, Op, WhereOptions, literal,QueryTypes, Sequelize  } from "sequelize";
import { UserGroupMapping } from "../models/userGroupMappingModel";
import { User } from "../models/userModel";
import { Status } from "../models/statusModel";
import { initSequelize } from "../config/dataSource";
import dayjs from "dayjs";
import { UserGroupEntityAccess } from "../models/UserGroupEntityAccessModel";
import moment from "moment";
import { isValidTimezone } from "../utils/helpers";
import { ProjectAccessView } from "../utils/types";
import { UserGroupType } from "../models/userGroupTypesModel";
import { UserGroupAccountMapping } from "../models/userGroupAccountMappingModel";
import UserService from "./userService";
import { getUserGroupUserCount } from "../utils/rawQueries";



class UserGroupService {
  /**
   * Throws a standardized service error with the provided error details.
   * 
   * @param {Error} err - The error object to be processed.
   * @returns {Object} - A standardized error response object.
   */
  private throwServiceError(err: Error): {
    statusCode: number;
    message: string;
    errorMessage: string;
  } {
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
async  getAutoAssignedGroupRidForAccount(accountRid: string): Promise<string> {
  const sequelize = await initSequelize();
  const accWhereClause =  'rid = :account_rid';
  const result = await sequelize.query(
  constants.SQL_GET_ACCOUNT.replace("{whereClause}", accWhereClause),
  {
      replacements: { account_rid: accountRid },
      type: constants.SELECT,
  }
  ) as Array<{ rid: string; is_parent: boolean; parent_account_rid: string }>;
  const accountData = result?.[0];
  if (!accountData) {
    throw new Error(`Account not found: ${accountRid}`);
  }
  const groupType = accountData.is_parent === true ? 'AUTO_ASSIGNED_PARENT' : 'AUTO_ASSIGNED_CHILD';
  const group = await UserGroup.findOne({
    include: [
      {
        model: UserGroupType,
         as: "usergrouptype",
        where: { type: groupType },
      },
      {
        model: UserGroupAccountMapping,
        as :'usergroupaccount',
        where: { account_rid: accountRid },
      },
    ],
  });
  if (!group?.rid) {
      throw new Error(`No AUTO_ASSIGNED group found for account: ${accountRid}`);
    }

  return group?.rid;
}
async assignUserToUserGroups(
  userData: any,
  loggedInUser: string
): Promise<void> {
  try {
    const isConsultant = userData?.is_consultant_firm ?? false;
    const orgId = userData?.org_id;
    const userRid = userData?.rid ?? null;

    if (!userRid || !orgId) {
      throw new Error('Missing userRid or orgId');
    }

    let groupRidToAssign: string | null = null;

    if (!isConsultant) {
      // For non-consultants → get group rid using  helper
      groupRidToAssign = await this.getAutoAssignedGroupRidForAccount(orgId);
    } else {
      // For consultants → find by group name
      const groupType = await UserGroupType.findOne({
        where: { group_type_name: 'Global Consultant Firm' },
      });

      if (!groupType) {
        throw new Error('Group type "Global Consultant Firm" not found');
      }

      const group = await UserGroup.findOne({
        where: { group_type_rid: groupType.rid },
      });

      if (!group) {
        throw new Error('UserGroup for consultant firm not found');
      }

      groupRidToAssign = group.rid;
    }

    if (!groupRidToAssign) {
      throw new Error('Group RID not resolved');
    }

    await UserGroupMapping.create({
      user_rid: userRid,
      group_rid: groupRidToAssign,
      created_by: loggedInUser,
    });
  } catch (err) {
    console.error('Error assigning user to user groups:', err);
    throw err;
  }
}



  /**
   * Creates a new user group in the database
   * 
   * @param {Object} userGroup - The user group to create
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<Object>} - Response object with status and message
   */
  async createUserGroup(
    userGroup: {
      group_name: string;
      users: Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
      accounts:  Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
      projects:Record<string, boolean>;
      status_rid: string;
      is_consultant_only_group: boolean;
      group_type_rid:string;
    },
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { usergroup: any };
  }> {
    try {
      const {
        group_name,
        users,
        accounts,
        projects,
        status_rid,
        is_consultant_only_group,
        group_type_rid
      } = userGroup;

      const isUniqueGroup = await this.checkIsGroupNameUnique(group_name);
      if (!isUniqueGroup) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: `Group name already exists. Please choose a different name.`,
        };
      }
      // Step 1: Create the group (only once)
      const newGroup = await UserGroup.create({
        group_name,
        status_rid,
        group_type_rid,
        is_consultant_only_group,
        created_by: userId,
      });

      const groupRid = newGroup.rid;

      //Step 2:Assign the user,accounts,projects
      await this.applyGroupMappings({
        group_rid: groupRid,
        users,
        accounts,
        projects,
        userId,
      });
      
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          usergroup: newGroup,
        },
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  private async checkIsGroupNameUnique(group_name: string): Promise<boolean> {
  const response = await UserGroup.findOne({
    where: where(fn('LOWER', col('group_name')), Op.eq, group_name.toLowerCase())
  });

  return !response;
}
   /**
   * Updates the user group in the database
   * 
   * @param {Object} userGroup - The user group data to create
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<Object>} - Response object with status and message
   */
  async updateUserGroup(
  userGroup: {
    group_name: string;
    users: Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
    accounts: Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
    projects: Record<string, boolean>;
    group_rid: string;
    status_rid: string;
    is_consultant_only_group: boolean;
  },
  userId: string
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { affectedGroupCount: any };
}> {
  try {
    const { group_name, users, accounts, status_rid, group_rid, is_consultant_only_group, projects } = userGroup;

    // Fetch existing group info
    const existingGroup = await UserGroup.findOne({
      where: { rid: group_rid },
      include: [{ model: UserGroupType, as: 'usergrouptype' }],
    });

    if (!existingGroup) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: `Group not found.`,
      };
    }

    const groupType = (existingGroup as any).usergrouptype?.type;

    // Only check uniqueness if group name is changing
    const isGroupNameChanged = group_name.toLowerCase() !== existingGroup.group_name.toLowerCase();

    if (isGroupNameChanged && groupType === 'CUSTOM') {
      const isExistingGrp = await UserGroup.findOne({
        where: {
          [Op.and]: [
            where(fn('LOWER', col('group_name')), Op.eq, group_name.toLowerCase()),
            { rid: { [Op.ne]: group_rid } },
          ],
        },
      });

      if (isExistingGrp) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: `Group name already exists. Please choose a different name.`,
        };
      }
    }

    // Only update if something is changed
    let shouldUpdate = false;
    const updatePayload: any = {
      status_rid,
      modified_by: userId,
      modified_datetime: new Date(),
    };

    if (isGroupNameChanged && groupType === 'CUSTOM') {
      updatePayload.group_name = group_name;
      shouldUpdate = true;
    }
    let affectedGroupCount = 0;
    if (shouldUpdate) {
      const [count] = await UserGroup.update(updatePayload, {
        where: { rid: group_rid },
      });
      affectedGroupCount = count;
    }

    // Apply mapping logic
    await this.applyGroupMappings({
      group_rid,
      users,
      accounts,
      projects,
      userId,
    });

     await UserGroup.update({modified_by: userId,
      modified_datetime: new Date()}, {
        where: { rid: group_rid },
      });

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        affectedGroupCount,
      },
    };
  } catch (err: any) {
    return this.throwServiceError(err as Error);
  }
}


  private async applyGroupMappings({
    group_rid,
    users,
    accounts,
    projects,
    userId,
  }: {
    group_rid: string;
    users?: Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
    accounts?: Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
    projects?: Record<string, boolean>;
    userId: string;
  }): Promise<void> {
    // Assign users
    const modifiedUsers = users?.filter(u => u.is_modified);
    if (modifiedUsers && modifiedUsers?.length > 0) {
      await this.assignUsersToGroup({
        users: modifiedUsers,
        group_rid,
        userId
      });
    }

    // Assign accounts
    const modifiedAccounts = accounts?.filter(a => a.is_modified);
    if (modifiedAccounts && modifiedAccounts?.length > 0) {
      await this.assignEntityAccessToAccount({
        group_rid,
        accounts: modifiedAccounts,
        userId
      });
      await this.assignAccountsToGroup({
        accounts: modifiedAccounts,
        group_rid,
        userId
      });
     
    }

    // Assign projects
    if (projects && Object.keys(projects).length > 0) {
      await this.assignEntityAccessToProjects({
        group_rid,
        projects,
        userId
      });
    }
  }


   /**
   * Updates the user group in the database
   * 
   * @param {Object} userGroup - The user group data to create
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<Object>} - Response object with status and message
   */
  async updateUserGroupInline(
    data: {group_name: string;group_rid:string},
    userId:string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { usergroup: any };
  }> {
    try {

    // Check if another group with the same name exists (case-insensitive)
      const isExistingGrp = await UserGroup.findOne({
      where: {
        [Op.and]: [
          where(fn('LOWER', col('group_name')), Op.eq, data.group_name.toLowerCase()),
          { rid: { [Op.ne]: data.group_rid } }
        ]
        }
      });
      if (isExistingGrp) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: `Group name already exists. Please choose a different name.`
        };
      }

    // Update the user group
    const [affectedGroupCount] = await UserGroup.update(
      {
        group_name: data.group_name,
        modified_by: userId,
        modified_datetime: new Date(),
      },
      { where: { rid: data.group_rid } }
    );

    // Fetch updated group details
    const userGroup = await UserGroup.findOne({
      where: { rid: data.group_rid },
      attributes: {
        include: [
          [
            literal(`(
              SELECT COUNT(*)
              FROM "${MAIN_SCHEMA_NAME}".user_group_mapping AS ugm
              WHERE ugm.group_rid = "UserGroup".rid
            )`),
            'user_count'
          ],
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['first_name', 'last_name'],
        },
        {
          model: UserGroupType,
          as: 'usergrouptype',
          attributes: ['group_type_name', 'type'],
        }
      ]
    });

    if (!userGroup) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: `Group not found after update.`,
      };
    }

    // Transform result
    const result = userGroup.get({ plain: true });
    const transformed = {
      ...result,
      account_name: result?.account_name ?? null,
      user_count: result.user_count ?? 0,
      creator: undefined,
      modifier: undefined,
    };

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        usergroup: transformed,
      },
    };
  } catch (err: any) {
    return this.throwServiceError(err as Error);
  }
}

 /**
   * Retrieves a list of active users eligible for grouping.
   *
   * - If `is_consultant_only_group` is true, returns only consultant firm users.
   * - If `account_rid` is provided, returns users from the account's org or its parent (if child account).
   * - Excludes users already assigned to a group under the same account.
   *
   * @param {boolean} [is_consultant_only_group] - Whether the group is for consultant users only.
   * @param {string} [account_rid] - The RID of the account to filter users by org or parent org.
   * @returns {Promise<Object>} - Response with list of eligible users and status metadata.
   */
async getActiveUsersForGrouping(
  is_consultant_only_group?: boolean,
  account_rid?: string | string[],
  page: number = 1,
  limit: number = 10,
  sortBy: string = "first_name", 
  sortOrder: string = "ASC",
  filters: Record<string, any> = {}
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { users: any,count:number };
}> {
  try {
    let basewhereClause: any = {};
    let orgIdsToFilter: string[] = [];
    const offset = (page - 1) * limit;
    const order: any[] = [];
    const allowedSortFields: (keyof User)[] = ["first_name"];
    const sortField = allowedSortFields.includes(sortBy as keyof User) ? sortBy : "first_name";
    const sortDirection = ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : "ASC";
    order.push([sortField, sortDirection]);

    // Step 1: If consultant-only group, filter directly
    if (is_consultant_only_group) {
      basewhereClause.is_consultant_firm = true;
    } else if (account_rid) {
      const accountRidArray: string[] = Array.isArray(account_rid)
        ? account_rid
        : typeof account_rid === 'string' && account_rid.trim() !== ''
          ? account_rid.split(',').map((r) => r.trim())
          : [];

      if (!accountRidArray.length) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid account_rid provided.",
        };
      }

      orgIdsToFilter = accountRidArray;

      // Filter users belonging to these orgs or consultants
      basewhereClause[Op.or] = [
        { org_id: { [Op.in]: orgIdsToFilter } },
      ];
    }
    if (filters && typeof filters === 'object' && Object.keys(filters).length > 0) {
      const { whereClause } = this.buildWhereClause(filters);
      if (whereClause && Object.keys(whereClause).length > 0) {
        Object.assign(basewhereClause, whereClause);
      }
    }

    // Step 2: Get ACTIVE users
    const allUsers = await User.findAll({
      where: basewhereClause,
      attributes: [
      "rid", 
      "email", 
      "status_rid", 
      "first_name", 
      "org_id", 
      "is_consultant_firm",
      [Sequelize.literal(`(
        CASE
          WHEN "User"."is_consultant_firm" = true THEN "User"."org_id"
          ELSE (
            SELECT account_name
            FROM ${MAIN_SCHEMA_NAME}.account
            WHERE account.rid = "User".org_id
          )
        END
      )`), "organization_name"]
    ],
      include: [
        {
          model: Status,
          as: "status",
          where: { status_description: "active" },
          attributes: [],
        },
      ],
      order,
    });

    const allUserRids = allUsers.map(u => u.rid);

    // Step 3: Get group RIDs for the given accounts from mapping table
    let groupRids: string[] = [];
    let assignedMappings: { user_rid: string }[] = [];
    if (!is_consultant_only_group && orgIdsToFilter.length) {
      const groupAccountMappings = await UserGroupAccountMapping.findAll({
        where: {
          account_rid: {
            [Op.in]: orgIdsToFilter,
          }
        },
        attributes: ['group_rid'],
      });
      groupRids = groupAccountMappings.map(g => g.group_rid);
    } 
    // Step 4: Get already-assigned user_rids
     if (is_consultant_only_group) {
  // Directly check if any of the consultant users are already mapped (user-based filtering)
      assignedMappings = await UserGroupMapping.findAll({
        where: {
          user_rid: { [Op.in]: allUserRids },
        },
        attributes: ["user_rid"],
      });
    } else if (groupRids.length) {
      // Default group-based filtering
      assignedMappings = await UserGroupMapping.findAll({
        where: {
          group_rid: { [Op.in]: groupRids },
        },
        attributes: ["user_rid"],
  });
  }
    const assignedUserRids = assignedMappings.map(m => m.user_rid);

    // Step 5: Filter out assigned users
    const unassignedUsers = allUsers.filter(
      user => !assignedUserRids.includes(user.rid)
    );

    const sortedUsers = unassignedUsers.sort((a, b) => {
    const valA = (a[sortBy as keyof User] ?? '').toString().toLowerCase();
    const valB = (b[sortBy as keyof User] ?? '').toString().toLowerCase();
    return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
     const paginatedUsers = sortedUsers.slice(offset, offset + limit);

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: { users: paginatedUsers ,count:sortedUsers.length},
    };
  } catch (err: any) {
    return this.throwServiceError(err as Error);
  }
}

/**
   * Retrieves a list of active users eligible for grouping.
   *
   * - If `is_consultant_only_group` is true, returns only consultant firm users.
   * - If `account_rid` is provided, returns users from the account's org or its parent (if child account).
   * - Excludes users already assigned to a group under the same account.
   *
   * @param {boolean} [is_consultant_only_group] - Whether the group is for consultant users only.
   * @param {string} [account_rid] - The RID of the account to filter users by org or parent org.
   * @returns {Promise<Object>} - Response with list of eligible users and status metadata.
   */
async getActiveUsersForUpdate(
  is_consultant_only_group?: boolean,
  account_rid?: string | string[],
  group_rid?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "first_name", 
  sortOrder: string = "ASC",
  filters: Record<string, any> = {}
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { users: any,count:number };
}> {
  try {
    const basewhereClause: any = {};
    let orgIdsToFilter: string[] = [];

    if (is_consultant_only_group) {
      basewhereClause.is_consultant_firm = true;
    } else if (account_rid) {
      const accountRidArray: string[] = Array.isArray(account_rid)
        ? account_rid
        : typeof account_rid === 'string' && account_rid.trim() !== ''
          ? account_rid.split(',').map((r) => r.trim())
          : [];

      if (!accountRidArray.length) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid account_rid provided.",
        };
      }

      orgIdsToFilter = accountRidArray;
      basewhereClause.org_id = { [Op.in]: orgIdsToFilter };
    }
     if (filters && typeof filters === 'object' && Object.keys(filters).length > 0) {
      const { whereClause } = this.buildWhereClause(filters);
      if (whereClause && Object.keys(whereClause).length > 0) {
        Object.assign(basewhereClause, whereClause);
      }
    }
    // Step 2: Prepare sorting
    const allowedSortFields = ["first_name", "email"]; // Add more fields as needed
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "first_name";
    const sortDirection = ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : "ASC";
    const order: any[] = [[sortField, sortDirection]];
    const offset = (page - 1) * limit;

    // Step 3: Paginated query of all active users
    const { rows: allActiveUsers, count: totalCount } = await User.findAndCountAll({
      where: basewhereClause,
      attributes: ["rid", "email", "status_rid", "first_name", "org_id", 
        "is_consultant_firm",
      [
    Sequelize.literal(`(
      CASE
        WHEN "User"."is_consultant_firm" = true THEN "User"."org_id"
        ELSE (
          SELECT account_name
          FROM ${MAIN_SCHEMA_NAME}.account
          WHERE account.rid = "User".org_id
        )
      END
    )`),
    "organization_name"
  ]],
      include: [
        {
          model: Status,
          as: "status",
          where: { status_description: "active" },
          attributes: [],
        },
      ],
      order
    });

    const allUserRids = allActiveUsers.map(u => u.rid);

    // Step 4: Fetch group mappings for paginated users
    const userGroupMappings = await UserGroupMapping.findAll({
      where: {
        user_rid: { [Op.in]: allUserRids }
      },
      attributes: ["user_rid", "group_rid"]
    });

    const groupedUserMap = new Map<string, string[]>();
    userGroupMappings.forEach(m => {
      if (!groupedUserMap.has(m.user_rid)) {
        groupedUserMap.set(m.user_rid, []);
      }
      groupedUserMap.get(m.user_rid)?.push(m.group_rid);
    });

    // Step 5: Add flags and filter out users in other groups
    const finalUsers = allActiveUsers
      .map(u => {
        const plain = u.get({ plain: true });
        const userGroups = groupedUserMap.get(plain.rid) || [];
        const isGrouped = userGroups.includes(group_rid!);
        const inOtherGroup = userGroups.length > 0 && !isGrouped;

        return {
          ...plain,
          grouped: isGrouped,
          has_access: isGrouped,
          in_other_group: inOtherGroup,
        };
      })
      .filter(u => !u.in_other_group); // Only keep users not in other groups
      
    //  Now apply pagination
    const paginatedUsers = finalUsers.slice(offset, offset + limit);

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        users: paginatedUsers,
        count: finalUsers.length,
      },
    };
  } catch (err: any) {
    return this.throwServiceError(err as Error);
  }
}



/**
 * Retrieves all active users related to the given account and enriches them with access and grouping flags.
 *
 * - If the account is a parent, includes users from its own org.
 * - If the account is a child, includes users from both its org and its parent org.
 * - Always includes consultant firm users.
 * - Adds `is_grouped` flag based on whether the user belongs to any user group under the account.
 * - Adds `has_access` flag based on user-level access in the `user_group_entity_access` table:
 *    - `INCLUDE` grants access
 *    - `EXCLUDE` removes access, even if INCLUDE exists
 *
 * @param {string} [account_rid] - The RID of the account used for filtering users and access.
 * @returns {Promise<Object>} - Promise resolving to an object containing status, message, and the list of enriched users.
 */
async getAccountUsers(
  account_rid?: string,
  project_rid?: string,
  entity_type: string = 'ACCOUNT',
  page: number = 1,
  limit: number = 10,
  sortBy: string = "first_name",
  sortOrder: string = "ASC",
  filters: Record<string, any> = {},
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { users: any ,count:number};
}> {
  try {
    const offset = (page - 1) * limit;
    const basewhereClause: any = {};
    const sequelize = await initSequelize();
    let orgIdsToFilter: string[] = [];

    // Step 1: Get org IDs if account_rid is provided
    if (account_rid) {
      const accWhereClause = "rid = :account_rid";
      const [accountResult] = await sequelize.query(
        constants.SQL_GET_ACCOUNT.replace("{whereClause}", accWhereClause),
        {
          replacements: { account_rid },
          type: constants.SELECT,
        }
      ) as Array<{ rid: string; is_parent: string; parent_account_rid: string }>;

      if (!accountResult) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid account_rid provided.",
        };
      }

      orgIdsToFilter = accountResult.is_parent
        ? [accountResult.rid]
        : [accountResult.rid];

      basewhereClause[Op.or] = [
       // { is_consultant_firm: true },
        { org_id: { [Op.in]: orgIdsToFilter } },
      ];
    }

    // Step 2: Apply filters if any
    if (filters) {
      const { whereClause } = this.buildWhereClause(filters);
      if (Object.keys(whereClause).length > 0) {
        Object.assign(basewhereClause, whereClause);
      }
    }

    // Step 3: Setup sorting
    const order: any[] = [];
    const allowedSortFields = ['first_name', 'email', 'organisation_name'];
    const sortField = allowedSortFields.includes(sortBy || '') ? sortBy : 'first_name';
    const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
    order.push([sortField, sortDirection]);

    // Step 4: Fetch users
   const { rows: users, count } = await User.findAndCountAll({
      where: basewhereClause,
      attributes: ["rid", "email", "status_rid", "first_name", "org_id", "is_consultant_firm",
        [Sequelize.literal(`(
        CASE
          WHEN "User"."is_consultant_firm" = true THEN "User"."org_id"
          ELSE (
            SELECT account_name
            FROM ${MAIN_SCHEMA_NAME}.account
            WHERE account.rid = "User".org_id
          )
        END
      )`), "organization_name"]
      ],
      include: [
        {
          model: Status,
          as: "status",
          where: { status_description: "active" },
          attributes: [],
        },
      ],
      limit,
      offset,
      order,
    });

    const userRids = users.map((u) => u.rid);
    const groupedUserSet = new Set<string>();
    const accessSet = new Set<string>();
    const userToGroupsMap: Map<string, Set<string>> = new Map();
    const userCommentsMap: Map<string, string | undefined> = new Map();
    let groupRids: string[] = [];

    if (account_rid) {
      // Step 5: Get groups for this account
      const groups = await UserGroupAccountMapping.findAll({
        where: { account_rid },
        attributes: ["group_rid"],
      });

      groupRids = groups.map((g) => g.group_rid);

      // Step 6: Get user-group mappings
      const userMappings = await UserGroupMapping.findAll({
        where: { group_rid: { [Op.in]: groupRids } },
        attributes: ["user_rid", "group_rid"],
      });

      userMappings.forEach(({ user_rid, group_rid }) => {
        groupedUserSet.add(user_rid);
        if (!userToGroupsMap.has(user_rid)) userToGroupsMap.set(user_rid, new Set());
        userToGroupsMap.get(user_rid)!.add(group_rid);
      });

      const entity_rid = entity_type === 'PROJECT' ? project_rid : account_rid;

      // Step 7: Get access records from entity access table
      const accessRecords = await UserGroupEntityAccess.findAll({
        where: {
          entity_type,
          entity_rid,
          [Op.or]: [
            { user_rid: { [Op.in]: userRids } },
            { group_rid: { [Op.in]: groupRids } },
          ]
        },
        attributes: ["user_rid", "group_rid", "access_type", "comment"],
      });

      // Step 8: Build access maps
      const userAccessMap = new Map<string, { access_type: string, comment?: string }>(); // user_rid → access_type
      const groupAccessMap = new Map<string, string>();  // group_rid → access_type

      accessRecords.forEach(({ user_rid, group_rid, access_type, comment }) => {
        if (user_rid) userAccessMap.set(user_rid, { access_type, comment });
        if (group_rid) groupAccessMap.set(group_rid, access_type);
      });

      // Step 9: Determine access for each user
      userRids.forEach((userRid) => {
        let hasAccess = false;
        let comment: string | null = null;
        const userAccess = userAccessMap.get(userRid);
        const userGroups = userToGroupsMap.get(userRid) || new Set();

        if (userAccess?.access_type === 'EXCLUDE') {
          hasAccess = false;

          const groupHasAccess = Array.from(userGroups).some(
            g => groupAccessMap.get(g) === 'INCLUDE'
          );

          if (groupHasAccess) {
            comment = userAccess?.comment || null;
          } else {
            comment = userAccess?.comment || null;
          }

        } else if (userAccess?.access_type === 'INCLUDE') {
          hasAccess = true;
          comment = userAccess.comment || null;

        } else {
          for (const group of userGroups) {
            const groupAccess = groupAccessMap.get(group);
            if (groupAccess === 'EXCLUDE') {
              hasAccess = false;
              break;
            } else if (groupAccess === 'INCLUDE') {
              hasAccess = true;
            }
          }
        }

        if (hasAccess) {
          accessSet.add(userRid);
        } else {
          accessSet.delete(userRid);
        }

        if (comment) userCommentsMap.set(userRid, comment);
      });
    }

    // Step 10: Attach access and group flags
    const usersWithFlags = users.map(user => ({
      ...user.toJSON(),
      is_grouped: groupedUserSet.has(user.rid),
      has_access: accessSet.has(user.rid),
      comment: userCommentsMap.get(user.rid) || null,
    }));

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: { users: usersWithFlags, count },
    };
  } catch (err: any) {
    return this.throwServiceError(err as Error);
  }
}



/**
 * Retrieves all user groups associated with the given account and evaluates access flags.
 *
 * - Returns all groups created under the specified account.
 * - For each group, adds a `has_access` flag:
 *   - `true` if the group has an `INCLUDE` access record in `user_group_entity_access` for the account.
 *   - `false` if the group has an `EXCLUDE` record or no access record at all.
 * - Used to identify which groups are enabled (allowed) to access the account.
 *
 * @param {string} [account_rid] - The RID of the account whose groups are to be fetched.
 * @returns {Promise<Object>} - Promise resolving to an object containing the status, message, and list of groups with access flags.
 */
async getAccountGroups(
  account_rid?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = "first_name", 
  sortOrder: string = "ASC",
  filters: Record<string, any> = {},
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { groups: any[],count:number };
}> {
  try {
    if (!account_rid) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: "Missing account_rid",
      };
    }

    // Step 1: Validate the account
    const sequelize = await initSequelize();
    const basewhereClause: any = {};
    const [accountResult] = await sequelize.query(
    constants.SQL_GET_ACCOUNT.replace("{whereClause}", "rid = :account_rid"),
      {
        replacements: { account_rid },
        type: constants.SELECT,
      }
    ) as Array<{ rid: string; is_parent: string; parent_account_rid: string }>;

    if (!accountResult) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: "Invalid account_rid provided.",
      };
    }
    const offset = (page - 1) * limit;
    const {whereClause} = this.buildWhereClause(filters);
    const order: any[] = [];
    const allowedSortFields = ['group_name', 'user_count'];
    const sortField = allowedSortFields.includes(sortBy || '') ? sortBy : 'group_name';
    const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
      if (sortField === 'user_count') {
            order.push([sequelize.literal('user_count'), sortDirection]);
        } else {
            order.push([sortField, sortDirection]);
        }  
    // Step 2: Fetch all groups for the account
  
    const defaultGroups = await UserGroup.findAll({
      attributes: [
        "rid",
        "group_name",
        "is_consultant_only_group",
        "created_datetime",
        [
          literal(`(
            SELECT COUNT(*)
            FROM "${MAIN_SCHEMA_NAME}".user_group_mapping AS ugm
            WHERE ugm.group_rid = "UserGroup".rid
            )`),
            "user_count"
        ]
      ],
      where:whereClause,
      include: [
        {
        model: UserGroupType,
        as: "usergrouptype",
        required: true,
        where: { type: "DEFAULT" }
      }
    ],
    limit,
    offset,
    
    order: [["group_name", "ASC"]]
  });

  // 2. Get mapped groups for this account
  const mappedGroups = await UserGroup.findAll({
    where:whereClause,
    attributes: [
      "rid",
      "group_name",
      "is_consultant_only_group",
      "created_datetime",
      [
        literal(`(
          SELECT COUNT(*)
          FROM "${MAIN_SCHEMA_NAME}".user_group_mapping AS ugm
          WHERE ugm.group_rid = "UserGroup".rid
        )`),
        "user_count"
      ]
    ],
    include: [
      {
        model: UserGroupAccountMapping,
        as: "usergroupaccount",
        required: true,
        where: {
          account_rid: account_rid
        },
      },
       {
        model: UserGroupType,
        as: "usergrouptype",
        required: true,
       // where: { type: "DEFAULT" }
      }
    ],
    order: [["group_name", "ASC"]]
  });

  // Merge both arrays and remove duplicates by `rid`
  const uniqueGroupsMap = new Map();
  [...defaultGroups, ...mappedGroups].forEach(group => {
    uniqueGroupsMap.set(group.rid, group);
  });
  const combinedGroups = Array.from(uniqueGroupsMap.values());

// Step 2: Sort merged groups before pagination
  const sortedGroups = combinedGroups.sort((a, b) => {
    const valA = (a.get ? a.get(sortField) : a[sortField])?.toString().toLowerCase() || '';
    const valB = (b.get ? b.get(sortField) : b[sortField])?.toString().toLowerCase() || '';
    return sortDirection === "ASC" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
  const paginatedGroups = sortedGroups.slice(offset, offset + limit);
  // Convert map back to array and apply pagination
  

    const groupIds = sortedGroups.map(g => g.rid);
    if (groupIds.length === 0) {
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: { groups: [],count:0 },
      };
    }

    // Step 3: Fetch access records
    const accessRecords = await UserGroupEntityAccess.findAll({
      where: {
        entity_type: "ACCOUNT",
        entity_rid: account_rid,
        group_rid: { [Op.in]: groupIds },
      },
      attributes: ["group_rid", "access_type"],
    });

    // Step 4: Build group_id → has_access map
    const accessMap = new Map<string, boolean>();

    for (const record of accessRecords) {
        const groupRid = record.group_rid;
        if (!groupRid) continue; // skip if undefined
        if (record.access_type === "INCLUDE") {
          accessMap.set(groupRid, true);
        } else if (record.access_type === "EXCLUDE" && !accessMap.has(groupRid)) {
          accessMap.set(groupRid, false);
        }
    }

     const groupsWithAccess  = paginatedGroups.map((group) => {
    const groupJson = group.toJSON();
     const isDefaultGroup = groupJson.usergrouptype?.type === 'DEFAULT';
    return {
      rid: groupJson.rid,
      group_name: groupJson.group_name,
      is_consultant_only_group: groupJson.is_consultant_only_group,
      created_datetime: groupJson.created_datetime,
      user_count: groupJson.user_count,
      group_type_name: groupJson.usergrouptype?.group_type_name || null,
      group_type_description: groupJson.usergrouptype?.group_type_description || null,
      type: groupJson.usergrouptype?.type,
      has_access: isDefaultGroup || accessMap.get(group.rid) === true,
    };
  });

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: { groups: groupsWithAccess, count:sortedGroups.length },
    };
  } catch (err: any) {
    console.error("Error in getAccountGroups:", err);
    return this.throwServiceError(err as Error);
  }
}


 /**
  * Builds a where clause for filtering
  * 
  * @param {Record<string, any>} filters - Filter object mapping fields to values
  * @returns {object} - Object containing the where clause and include clause
  */
  private buildWhereClause(filters: Record<string, any>): {
    whereClause: Record<string, any>;
  } {
    let whereClause: Record<string, any> = {};
    let includeClause: Array<any> = [];
  
    if (filters) {
      const filterProcessors: Record<string, Function> = {
        'group_name': (value: any) => this.processTextFilter('group_name', value, whereClause),
        'first_name': (value: any) => this.processTextFilter('first_name', value, whereClause),
        'email': (value: any) => this.processTextFilter('email', value, whereClause),
        'group_type': (value: any) => this.processTextFilter('group_type_rid', value, whereClause),
        'is_consultant_only_group': (value: any) => this.processBooleanFilter('is_consultant_only_group', value, whereClause),
        'created_datetime': (value: any) => this.processDateFilter('created_datetime', value, whereClause),
        'modified_datetime': (value: any) => this.processDateFilter('modified_datetime', value, whereClause),
        'created_by': (value: any) => this.processRelationFilter('created_by', value, whereClause, includeClause),
        'user_count': (value: any) => this.processUserCountFilter(value, whereClause)
      };
      Object.keys(filters).forEach(key => {
        
        const value = filters[key];
        if (value === undefined || value === null) return;
        if (filterProcessors[key]) {
          filterProcessors[key](value);
        } else if (value !== '') {
          whereClause[key] = value;
        }
      });
    }
    return { whereClause };
  }

    /**
   * Validates and normalizes sort parameters
   * 
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (ASC or DESC)
   * @returns {[string, string]} - Tuple of validated sort parameters
   */
  private getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "group_name",
      "user_count",
      "account_name",
      "created_datetime",
      "created_by",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

private processBooleanFilter(
  field: string,
  value: any,
  whereClause: Record<string, any>
): void {
 
 const parseBoolean = (val: string) => val.toLowerCase() === 'true';

  if (typeof value === 'string') {
    // Convert 'True'/'False' string to boolean
    if (value.toLowerCase() === 'yes') {
      whereClause[field] = true;
    } else if (value.toLowerCase() === 'no') {
      whereClause[field] = false;
    }
  //  whereClause[field] = parseBoolean(value);
  } else if (typeof value === 'object') {
    if (value.equals !== undefined) {
      whereClause[field] = parseBoolean(value.equals);
    } else if (value.not_equals !== undefined) {
      whereClause[field] = { [Op.not]: parseBoolean(value.not_equals) };
    } else if (value.is_empty !== undefined) {
      if (value.is_empty) {
        whereClause[field] = { [Op.or]: [null] };
      } else {
        whereClause[field] = { [Op.not]: null };
      }
    }
  }
}

private processUserCountFilter(value: any, whereClause: Record<string, any>): void {
  const conditions: any[] = [];
  
  if (typeof value === 'number') {
    conditions.push(this.createUserCountCondition('=', value));
  } else if (value && typeof value === 'object') {
    if ('equals' in value) {
      conditions.push(this.createUserCountCondition('=', value.equals));
    }
    if ('not_equals' in value) {
      conditions.push(this.createUserCountCondition('!=', value.not_equals));
    }
    if ('greater_than' in value) {
      conditions.push(this.createUserCountCondition('>', value.greater_than));
    }
    if ('less_than' in value) {
      conditions.push(this.createUserCountCondition('<', value.less_than));
    }
    if ('between' in value && Array.isArray(value.between) && value.between.length === 2) {
      conditions.push({
        [Op.and]: [
          this.createUserCountCondition('>=', value.between[0]),
          this.createUserCountCondition('<=', value.between[1]),
        ]
      });
    }
    if ('is_empty' in value) {
      conditions.push(
        value.is_empty 
          ? this.createUserCountCondition('=', 0)
          : this.createUserCountCondition('>', 0)
      );
    }
  }

  if (conditions.length > 0) {
    if (!whereClause[Op.and as any]) {  // Type assertion for Op.and
      whereClause[Op.and as any] = [];
    }
    (whereClause[Op.and as any] as any[]).push(...conditions);
  }
}

private createUserCountCondition(operator: string, value: number): any {
  return {
    [Op.and as any]: [  // Type assertion for Op.and
      Sequelize.literal(`(
        SELECT COUNT(*)
        FROM "${MAIN_SCHEMA_NAME}".user_group_mapping
        WHERE "${MAIN_SCHEMA_NAME}".user_group_mapping.group_rid = "UserGroup".rid
      ) ${operator} ${value}`)
    ]
  };
}

  /**
   * Process text field filter with various operators
   * 
   * @param {string} field - Field name
   * @param {any} value - Filter value
   * @param {Record<string, any>} whereClause - Where clause to modify
   */
  private processTextFilter(field: string, value: any,  whereClause: Record<string | symbol, any>): void {
    if (typeof value === 'string') {
      // Simple string value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        whereClause[field] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(field)),
        value.equals.toLowerCase()
      );
      } else if (value.not_equals !== undefined) {
        whereClause[field] = Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col(field)),
        '!=',
        value.not_equals.toLowerCase()
      );
      } else if (value.contains !== undefined) {
        whereClause[field] = { [Op.iLike]: `%${value.contains}%` };
      } else if (Array.isArray(value.in) && value.in.length > 0) {
        whereClause[Op.or] = value.in.map((val: string) =>
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col(field)),
          '=',
          val.toLowerCase()
        )
      );
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = { [Op.or]: [null, ''] };
        } else {
          whereClause[field] = { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] };
        }
      }
    }
  }

  /**
   * Process date field filter with various operators
   * 
   * @param {string} field - Field name
   * @param {any} value - Filter value
   * @param {Record<string, any>} whereClause - Where clause to modify
   */
  private processDateFilter(
    field: string,
    value: any,
    whereClause: Record<string, any>
  ): void {
    if (typeof value === 'string') {
      const date = dayjs(value, 'YYYY-MM-DD').startOf('day').toDate();
      const nextDay = dayjs(date).add(1, 'day').toDate();

      whereClause[field] = {
        [Op.gte]: date,
        [Op.lt]: nextDay
      };
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        const date = dayjs(value.equals, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const nextDay = dayjs(date).add(1, 'day').toDate();

        whereClause[field] = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      } else if (value.before !== undefined) {
        const beforeDate = dayjs(value.before, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        whereClause[field] = { [Op.lt]: beforeDate };
      } else if (value.after !== undefined) {
        const afterDate = dayjs(value.after, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        whereClause[field] = { [Op.gt]: afterDate };
      } else if (value.between?.from && value.between?.to) {
        const fromDate = dayjs(value.between.from, 'YYYY-MM-DD').startOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');
        const toDate = dayjs(value.between.to, 'YYYY-MM-DD').endOf('day').format('YYYY-MM-DDTHH:mm:ss[Z]');

        whereClause[field] = {
          [Op.gte]: fromDate,
          [Op.lte]: toDate
        };
      } else if (value.is_empty !== undefined) {
        if (value.is_empty) {
          whereClause[field] = null;
        } else {
          whereClause[field] = { [Op.ne]: null };
        }
      }
    }
  }


 private processRelationFilter(
  field: string,
  value: any,
  whereClause: WhereOptions,
  includeClause: Array<any>
): void {
  const relationConfig: Record<string, { model: any; as: string; attributes: string[] }> = {
    'created_by': { model: User, as: 'creator', attributes: ['first_name', 'last_name'] }
  };

  const config = relationConfig[field];
  if (!config) return;

  // Ensure the relation is included (LEFT JOIN)
  const existingInclude = includeClause.find(inc => inc.as === config.as);
  if (!existingInclude) {
    includeClause.push({
      model: config.model,
      as: config.as,
      attributes: [],
      required: false
    });
  }

  if (typeof value === 'object') {
    const orConditions: any[] = [];

    if (value.equals !== undefined) {
        const fullNameCondition = Sequelize.where(
        Sequelize.fn('LOWER',
        Sequelize.fn('concat',
        Sequelize.col(`${config.as}.first_name`),
        Sequelize.literal(`' '`),
        Sequelize.col(`${config.as}.last_name`))),
        {
          [Op.eq]: value.equals.toLowerCase()
        })
    if ((whereClause as any)[Op.and]) {
      (whereClause as any)[Op.and].push(fullNameCondition);
    } else {
      (whereClause as any)[Op.and] = [fullNameCondition];
    }
    } else if (value.not_equals !== undefined) {
       const fullNameCondition = Sequelize.where(
        Sequelize.fn('LOWER',
        Sequelize.fn('concat',
        Sequelize.col(`${config.as}.first_name`),
        Sequelize.literal(`' '`),
        Sequelize.col(`${config.as}.last_name`))),
      { [Op.ne]: value.not_equals.toLowerCase() }
    );

    if ((whereClause as any)[Op.and]) {
      (whereClause as any)[Op.and].push(fullNameCondition);
    } else {
      (whereClause as any)[Op.and] = [fullNameCondition];
    }
      
    } else if (value.contains !== undefined) {
      const fullNameCondition = Sequelize.where(
      Sequelize.fn(
        'concat',
        Sequelize.col(`${config.as}.first_name`),
        Sequelize.literal(`' '`),
        Sequelize.col(`${config.as}.last_name`)
      ),
      { [Op.iLike]: `%${value.contains}%` }
    );

    if ((whereClause as any)[Op.and]) {
      (whereClause as any)[Op.and].push(fullNameCondition);
    } else {
      (whereClause as any)[Op.and] = [fullNameCondition];
    }
    }

    if (orConditions.length > 0) {
     (whereClause as any)[Op.or] = orConditions;
    } else if (value.is_empty !== undefined) {
      const emptyCondition = value.is_empty
        ? { [`$${config.as}.id$`]: { [Op.is]: null } }
        : { [`$${config.as}.id$`]: { [Op.not]: null } };

      Object.assign(whereClause, emptyCondition);
    }
  }
}

  /**
   * Creates a new user group in the database
   * 
   * @param {Object} profileData - The profile data to create
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<Object>} - Response object with status and message
   */
  async listUserGroup(
    page: number,
    limit: number,
    filters: Record<string, string>,
    userRid: string,
    sortBy: string,
    sortOrder: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { usergroup: any; count: number };
  }>{
    try {
      const offset = (page - 1) * limit;
      const { whereClause } = this.buildWhereClause(filters);
      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);
      const user = await User.findOne({
        where: { rid: userRid },
        attributes: ['is_consultant_firm', 'org_id'],
        raw: true,
      });
      if (!user) {
        return {
          statusCode: constants.NOT_FOUND,
          message: 'User not found',
        };
      }
      let groupRidSet = new Set<string>();
      if (!user.is_consultant_firm) {
      // Direct access via user_group_mapping
      const userGroupMappings = await UserGroupMapping.findAll({
        where: { user_rid: userRid },
        attributes: ['group_rid'],
        raw: true,
      });
      userGroupMappings.forEach(mapping => groupRidSet.add(mapping.group_rid));

      // Access via user_group_account_mapping by org_id
      //const groupAccountMappings = await UserGroupAccountMapping.findAll({
      //  where: { account_rid: user.org_id },
       // attributes: ['group_rid'],
       // raw: true,
      //  });
     //   groupAccountMappings.forEach(mapping => groupRidSet.add(mapping.group_rid));

      if (groupRidSet.size === 0) {
        return {
          statusCode: constants.SUCCESS,
          message: constants.SUCCESS_MESSAGE,
          data: {
            usergroup: [],
            count: 0,
          },
        };
      }
    }

    const basewhereClause: any = {};
    if (!user.is_consultant_firm) {
      basewhereClause.rid = Array.from(groupRidSet); // merged rid list
    }

    let orderArray;
    if (finalSortBy === 'created_by') {
      orderArray = [[{ model: User, as: 'user' }, 'first_name', finalSortOrder]] as any;
    } else if (finalSortBy === 'account_name') {
      orderArray = [[Sequelize.literal('account_name'), finalSortOrder]];
    } else {
      orderArray = [[finalSortBy, finalSortOrder]];
    }
    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['first_name', 'last_name'],
      },
      {
        model: UserGroupType,
        as: 'usergrouptype',
        attributes: ['group_type_name', 'type'],
      },
    ];

    const count = await UserGroup.count({
      where: {
        ...whereClause,
        ...basewhereClause,
      },
      include: includeClause,
      distinct: true,
    });

    const userGroup = await UserGroup.findAll({
      where: {
        ...whereClause,
        ...basewhereClause,
      },
      order: orderArray,
      limit,
      offset,
      attributes: {
        include: [
            [
              Sequelize.literal(`(${getUserGroupUserCount(MAIN_SCHEMA_NAME)})`),
              "user_count",
            ],
        ],
      },
      include: includeClause,
    });

      const transformedData = userGroup.map(userGrp => {
      const result = userGrp.get({ plain: true });
      return {
          ...result,
          account_name: result?.account_name ?? null,
          user_count: result.user_count ?? 0,
          creator: undefined,
          modifier: undefined,
        };
      });
       return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          usergroup:transformedData,
          count
        },
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  
   /**
   * Creates a new user group in the database
   * 
   * @param {Object} profileData - The profile data to create
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<Object>} - Response object with status and message
   */
  async exportUserGroup(
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    timezone:string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { usergroup: any; };
  }>{
    try {
      const { whereClause } = this.buildWhereClause(filters);
      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);

      // Prepare order array based on sort field
      let orderArray;

      if (finalSortBy === 'created_by') {
        orderArray = [
          [{ model: User, as: 'user' }, 'first_name', finalSortOrder]
        ] as any;
      } 
      else if (finalSortBy === 'account_name') {
        orderArray = [[Sequelize.literal('account_name'), finalSortOrder]];
      }
      else {
        orderArray = [[finalSortBy, finalSortOrder]];
      }
       const userService = new UserService();
       const allowedFieldsForExport = await userService.getAllowedExportFields(userId,"user_group_view_edit");
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
      const userGroup = await UserGroup.findAll(
        {
          where: whereClause,
          order: orderArray,
          attributes: {
           include: [
            [
              Sequelize.literal(`(${getUserGroupUserCount(MAIN_SCHEMA_NAME)})`),
              "user_count",
            ],
              ]
            },
          include: [
          {
            model: User,
             as: "user",
            attributes: ['first_name','last_name'],
          },
          {
            model: UserGroupType,
             as: "usergrouptype",
            attributes: ['group_type_name','type'],
          }],
        }
      );
      const labelMap: Record<string, string> = {
        "group_name": "Group Name",
        "group_type_rid": "Group Type",
        "account_name": "Account Name",
        "is_consultant_only_group": "Is Consultant Only Group",
        "user_count": "User Count",
        "created_datetime": "Created On",
        "modified_datetime": "Updated On"
      };
      // Transform the results to replace user IDs with usernames
      const transformedData = userGroup.map(userGrp => {
      const result = userGrp.get({ plain: true });
      
      const isValidTZ = timezone &&  isValidTimezone(timezone);
      const formatDate = (date?: Date) =>
        date
          ? moment(date).tz(isValidTZ ? timezone : 'UTC').format('YYYY-MM-DD, hh:mm:ss A')
          : null;
      
       

       const exportData: Record<string, string | number> = {};   
        let resultMap =  {
        "group_name": result.group_name ?? '-',
        "group_type_rid":result?.usergrouptype?.group_type_name ?? '-',
        "account_name": result?.account_name ?? '-',
        "is_consultant_only_group": result.is_consultant_only_group ? 'Yes' : 'No',
        "user_count": result.user_count ?? 0,
        "created_datetime": formatDate(result.created_datetime) ?? '-',
        "modified_datetime": formatDate(result.modified_datetime) ?? '-'
      };
       for (const [field, value] of Object.entries(resultMap)) {
          if (allowedFieldSet.has(field)) {
            exportData[labelMap[field]] = value;
          }
         }
         return exportData
      });
       return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          usergroup:transformedData
        },
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  
 async listUserGroupDetailsById(user_group_id: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { userGroupById: any };
}> {
  try {
    const userGroupById = await UserGroup.findOne({
      where: { rid: user_group_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name"],
        },
        {
          model: UserGroupType,
          as: "usergrouptype",
          attributes: ["rid", "group_type_name", "type"]
        }
      ],
    });

    if (!userGroupById) {
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: { userGroupById: null },
      };
    }

    const groupData = userGroupById.toJSON() as any;

    // Add created_by info
    if (groupData.user) {
      groupData.created_by = `${groupData.user.first_name || ""} ${groupData.user.last_name || ""}`.trim();
    }
    delete groupData.user;
    const groupType = groupData.usergrouptype?.type;
    groupData.group_type = groupType;
    delete groupData.usergrouptype;
    const usersList = await this.getFormattedUsersForGroup(groupData, user_group_id);
    groupData.users = usersList;
    const accountsList = await this.getFormattedAccountsForGroup(groupType, user_group_id);
    groupData.accounts = accountsList;
    const projectList = await this.getFormattedProjectsForGroup(groupType, user_group_id)
    groupData.projects = projectList;
   
    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: { userGroupById: groupData },
    };
  } catch (err) {
    return this.throwServiceError(err as Error);
  }
}

 async listAccountGroupById(user_group_id: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { userGroupById: any };
}> {
  try {
    const userGroupById = await UserGroup.findOne({
      where: { rid: user_group_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name"],
        },
        {
          model: UserGroupType,
          as: "usergrouptype",
          attributes: ["rid", "group_type_name", "type"]
        }
      ],
    });

    if (!userGroupById) {
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: { userGroupById: null },
      };
    }

    const groupData = userGroupById.toJSON() as any;
    
    // Add created_by info
    if (groupData.user) {
      groupData.created_by = `${groupData.user.first_name || ""} ${groupData.user.last_name || ""}`.trim();
    }
    delete groupData.user;
     const accountsList = await this.getFormattedAccountsForGroup(groupData.usergrouptype?.type, user_group_id);
    groupData.accounts = accountsList;

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: { userGroupById: groupData },
    };
  } catch (err) {
    return this.throwServiceError(err as Error);
  }
}

async listUserGroupById(
  user_group_id: string
): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: {
    groupInfo: any;
    users: any[];
  };
}> {
  try {
    // Step 1: Get basic group information
    const userGroup = await UserGroup.findOne({
      where: { rid: user_group_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name"],
        },
        {
          model: UserGroupType,
          as: "usergrouptype",
          attributes: ["rid", "group_type_name", "type"]
        }
      ],
    });

    if (!userGroup) {
      return {
        statusCode: constants.NOT_FOUND,
        message: constants.NOT_FOUND_MESSAGE,
        errorMessage: "Group not found",
      };
    }

    const groupData = userGroup.toJSON() as any;
    
    // Add created_by info
    if (groupData.user) {
      groupData.created_by = `${groupData.user.first_name || ""} ${groupData.user.last_name || ""}`.trim();
    }
    delete groupData.user;
    const formattedUsers = await this.getFormattedUsersForGroup(groupData, user_group_id);
    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        groupInfo: {
          ...groupData
        },
        users: formattedUsers
      },
    };
  } catch (err) {
    console.error(err);
    return this.throwServiceError(err as Error);
  }
}

private async getFormattedAccountsForGroup(groupType: string, groupRid: string): Promise<any[]> {
  const sequelize = await initSequelize();

  if (groupType === "DEFAULT") {
    return await sequelize.query(constants.SQL_GET_DEFAULT_ACCOUNT,
    {
      type: constants.SELECT,
    });
  }

  if (groupType === "AUTO_ASSIGNED") {
    return await sequelize.query(
      `SELECT a.rid, a.account_name, true as has_access
       FROM ${MAIN_SCHEMA_NAME}.account a
       INNER JOIN ${MAIN_SCHEMA_NAME}.user_group_account_mapping uga 
       ON uga.account_rid = a.rid
       WHERE uga.group_rid = :group_rid`,
      {
        replacements: { group_rid: groupRid },
        type: QueryTypes.SELECT
      }
    );
  }

  // Else: Custom group with dynamic access
  return await sequelize.query(
   constants.SQL_GET_SELECTED_ACCOUNT_ACCESS,
    {
      replacements: { group_rid: groupRid },
      type: QueryTypes.SELECT
    }
  );
}

private async getFormattedProjectsForGroup(groupType: string, groupRid: string): Promise<any[]> {
  const sequelize = await initSequelize();

  if (groupType === "DEFAULT") {
      return await sequelize.query(constants.SQL_GET_DEFAULT_PROJECT_ACCESS,
    {
      type: constants.SELECT,
    });
  }

  if (groupType === "AUTO_ASSIGNED") {
    return await sequelize.query(
      `SELECT a.rid, a.account_name, true as has_access
       FROM ${MAIN_SCHEMA_NAME}.account a
       INNER JOIN ${MAIN_SCHEMA_NAME}.user_group_account_mapping uga 
       ON uga.account_rid = a.rid
       WHERE uga.group_rid = :group_rid`,
      {
        replacements: { group_rid: groupRid },
        type: QueryTypes.SELECT
      }
    );
  }

  // Else: Custom group with dynamic access
  return await sequelize.query(
   constants.SQL_GET_SELECTED_PROJECT_ACCESS,
    {
      replacements: { group_rid: groupRid },
      type: QueryTypes.SELECT
    }
  );
}

private async getFormattedUsersForGroup(groupData: any, groupRid: string): Promise<any[]> {
  // Step 1: Get assigned account_rids using the model
  const assignedAccounts = await UserGroupAccountMapping.findAll({
    where: { group_rid: groupRid },
    attributes: ["account_rid"],
    raw: true,
  });

  const accountRids = assignedAccounts.map(acc => acc.account_rid);
  if (accountRids.length === 0 && !groupData?.is_consultant_only_group) return [];

  const userWhereClause: WhereOptions<User> = {};

// Consultant group
if (groupData?.is_consultant_only_group) {
  userWhereClause.is_consultant_firm = true;
} else {
  userWhereClause.is_consultant_firm = false;
  userWhereClause.org_id = { [Op.in]: accountRids }; // All assigned accounts
}
  // Step 3: Get all users from those accounts
  const allUsers = await User.findAll({
    where: userWhereClause,
    attributes: ["rid", "email", "first_name", "last_name", "org_id", "is_consultant_firm"],
    include: [
      {
        model: Status,
        as: "status",
        where: { status_description: "active" },
        attributes: [],
      },
    ],
    order: [["first_name", "ASC"]],
  });

  const userRids = allUsers.map(u => u.rid);

  // Step 4: Get user mappings in the group
  const assignedMappings = await UserGroupMapping.findAll({
    where: {
      group_rid: groupRid,
      user_rid: { [Op.in]: userRids },
    },
    attributes: ["user_rid"],
    raw: true,
  });

  const assignedUserSet = new Set(assignedMappings.map(m => m.user_rid));

  // Step 5: Format and return users with has_access flag
  return allUsers.map(user => {
    const u = user.toJSON();
    return {
      rid: u.rid,
      email: u.email,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
      account_rid: u.org_id,
      is_consultant: u.is_consultant_firm,
      has_access: assignedUserSet.has(u.rid),
    };
  });
}


/**
 * Assigns or revokes access to an account for a user or a group based on a `has_access` flag.
 *
 * - Accepts either a `user_rid` or a `group_id` (but not both).
 * - If `has_access` is true → access_type = 'INCLUDE'
 * - If `has_access` is false → access_type = 'EXCLUDE'
 *
 * @param {Object} params - Access assignment input
 * @param {string} [params.user_rid] - RID of the user (optional)
 * @param {string} [params.group_id] - RID of the group (optional)
 * @param {string} params.account_rid - RID of the account
 * @param {boolean} params.has_access - Flag indicating whether access should be granted
 * @param {string} params.modified_by - RID of the user performing the operation
 * @returns {Promise<Object>} - Result with status and message
 */
async assignUsersToGroup({
  users,
  group_rid,
  userId,
}: {
  users?: Array<{ rid: string; is_enabled: boolean; is_modified: boolean }>;
  group_rid?: string;
  userId: string;
}): Promise<{
  statusCode: number;
  message: string;
  data?: { added: string[]; removed: string[] };
  errorMessage?: string;
}> {
  try {
    if (!users || !users.length || !group_rid) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: "Both user_rid list and group_rid are required.",
      };
    }

    const toAdd: string[] = [];
    const toRemove: string[] = [];

    for (const user of users) {
      if (!user.is_modified) continue;

      if (user.is_enabled) {
        toAdd.push(user.rid);
      } else {
        toRemove.push(user.rid);
      }
    }

    const added: string[] = [];
    const removed: string[] = [];

    // ➕ Create new mappings (avoid duplicates)
    if (toAdd.length > 0) {
      const existing = await UserGroupMapping.findAll({
        where: {
          group_rid,
          user_rid: { [Op.in]: toAdd },
        },
        attributes: ["user_rid"],
      });

      const alreadyAssigned = new Set(existing.map((e) => e.user_rid));
      const toCreate = toAdd
        .filter((rid) => !alreadyAssigned.has(rid))
        .map((rid) => ({
          group_rid,
          user_rid: rid,
          created_by: userId,
        }));

      if (toCreate.length > 0) {
        await UserGroupMapping.bulkCreate(toCreate);
        added.push(...toCreate.map((u) => u.user_rid));
      }
    }

    // ➖ Delete mappings
    if (toRemove.length > 0) {
      const deleted = await UserGroupMapping.destroy({
        where: {
          group_rid,
          user_rid: { [Op.in]: toRemove },
        },
      });

      removed.push(...toRemove);
    }

    return {
      statusCode: constants.SUCCESS,
      message: `Group access updated. Added: ${added.length}, Removed: ${removed.length}`,
      data: { added, removed },
    };
  } catch (err: any) {
    console.error("Error assigning users to group:", err);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}


/**
 * Assigns or revokes access to an account for a user or a group based on a `has_access` flag.
 *
 * - Accepts either a `user_rid` or a `group_id` (but not both).
 * - If `has_access` is true → access_type = 'INCLUDE'
 * - If `has_access` is false → access_type = 'EXCLUDE'
 *
 * @param {Object} params - Access assignment input
 * @param {string} [params.user_rid] - RID of the user (optional)
 * @param {string} [params.group_id] - RID of the group (optional)
 * @param {string} params.account_rid - RID of the account
 * @param {boolean} params.has_access - Flag indicating whether access should be granted
 * @param {string} params.modified_by - RID of the user performing the operation
 * @returns {Promise<Object>} - Result with status and message
 */
async assignAccountsToGroup({
  accounts,
  group_rid,
  userId,
}: {
  accounts?: { rid: string; is_enabled: boolean; is_modified: boolean }[];
  group_rid?: string;
  userId: string;
}): Promise<{
  statusCode: number;
  message: string;
  data?: { created: string[]; deleted: string[] };
  errorMessage?: string;
}> {
  try {
    if (!accounts || !group_rid) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: "Both account_rid and group_rid are required.",
      };
    }
    const { toAssign, toRevoke } = accounts.reduce<{
      toAssign: string[];
      toRevoke: string[];
    }>(
      (acc, account) => {
        if (account.is_modified) {
          account.is_enabled 
            ? acc.toAssign.push(account.rid) 
            : acc.toRevoke.push(account.rid);
        }
        return acc;
      },
      { toAssign: [], toRevoke: [] }
    );
    // Process assignments and revocations in parallel
    const [created, deleted] = await Promise.all([
      this.createAccountMappings(group_rid,toAssign,userId),
      this.revokeAccountMappings(group_rid,toRevoke),
    ]);
     return {
      statusCode: constants.SUCCESS,
      message: `Account access updated. Created: ${created.length}, Deleted: ${deleted.length}`,
      data: { created, deleted },
    };
    } catch (err: any) {
    console.error("Error assigning accounts to group:", err);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}

 // Helper functions
  async  createAccountMappings(group_rid:string,accountRids: string[],userId:string): Promise<string[]> {
    if (accountRids.length === 0) return [];

    const existing = await UserGroupAccountMapping.findAll({
      where: {
        group_rid,
        account_rid: { [Op.in]: accountRids },
      },
      attributes: ["account_rid"],
      raw: true,
    });

    const existingSet = new Set(existing.map(e => e.account_rid));
    const newMappings = accountRids
      .filter(rid => !existingSet.has(rid))
      .map(rid => ({
        group_rid,
        account_rid: rid,
        created_by: userId,
      }));

    if (newMappings.length > 0) {
      await UserGroupAccountMapping.bulkCreate(newMappings);
      return newMappings.map(m => m.account_rid);
    }
    return [];
  }

  async  revokeAccountMappings(group_rid:string,accountRids: string[]): Promise<string[]> {
    if (accountRids.length === 0) return [];

    const sequelize = await initSequelize();
    
    const [usersToRemove, projectsToRemove] = await Promise.all([
      sequelize.query<{ user_rid: string }>(
        constants.USER_OF_SELECTED_ACCOUNTS,
        {
          replacements: { group_rid, revokedAccounts: accountRids },
          type: QueryTypes.SELECT,
        }
      ),
      sequelize.query<{ entity_rid: string }>(
        constants.PROJECT_OF_SELECTED_ACCOUNTS,
        {
          replacements: { group_rid, revokedAccounts: accountRids },
          type: QueryTypes.SELECT,
        }
      ),
    ]);

    const userRids = usersToRemove.map(u => u.user_rid);
    const projectRids = projectsToRemove.map(p => p.entity_rid);
    await Promise.all([
      userRids.length > 0 && UserGroupMapping.destroy({
        where: {
          group_rid,
          user_rid: { [Op.in]: userRids },
        },
      }),
      UserGroupEntityAccess.destroy({
        where: {
          group_rid,
          entity_rid: { [Op.in]: [...accountRids, ...projectRids] },
        },
      }),
      UserGroupAccountMapping.destroy({
        where: {
          group_rid,
          account_rid: { [Op.in]: accountRids },
        },
      }),
    ]);
    return accountRids;
  }


/**
 * Assigns or revokes access to an account for a user or a group based on a `has_access` flag.
 *
 * - Accepts either a `user_rid` or a `group_id` (but not both).
 * - If `has_access` is true → access_type = 'INCLUDE'
 * - If `has_access` is false → access_type = 'EXCLUDE'
 *
 * @param {Object} params - Access assignment input
 * @param {string} [params.user_rid] - RID of the user (optional)
 * @param {string} [params.group_id] - RID of the group (optional)
 * @param {string} params.account_rid - RID of the account
 * @param {boolean} params.has_access - Flag indicating whether access should be granted
 * @param {string} params.modified_by - RID of the user performing the operation
 * @returns {Promise<Object>} - Result with status and message
 */
async assignEntityAccessToAccount({
  user_rid,
  group_rid,
  accounts,
  userId,
}: {
  user_rid?: string;
  group_rid?: string;
  accounts: Array<{
    rid: string;
    is_enabled: boolean;
    is_modified: boolean;
  }>;
  userId: string;
}): Promise<{
  statusCode: number;
  message: string;
  data?: { created: string[]; updated: string[] };
  errorMessage?: string;
}> {
  try {
    if (!accounts) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage:
          "Missing required identifiers (user_rid/group_rid or account_rid)",
      };
    }

    const now = new Date();
    const created: string[] = [];
    const updated: string[] = [];

    for (const acc of accounts) {
      if (!acc.is_modified) continue;

      const access_type = acc.is_enabled ? "INCLUDE" : "EXCLUDE";

      const whereClause: any = {
        entity_type: "ACCOUNT",
        entity_rid: acc.rid,
      };
      if (user_rid) whereClause.user_rid = user_rid;
      if (group_rid) whereClause.group_rid = group_rid;

      const existing = await UserGroupEntityAccess.findOne({
        where: whereClause,
      });

      if (existing) {
        await existing.update({
          access_type,
          modified_by: userId,
          modified_datetime: now,
        });
        updated.push(acc.rid);
      } else {
        await UserGroupEntityAccess.create({
          user_rid: user_rid ?? null,
          group_rid: group_rid ?? null,
          entity_type: "ACCOUNT",
          entity_rid: acc.rid,
          access_type,
          created_by: userId,
          created_datetime: now,
        });
        created.push(acc.rid);
      }
    }

    return {
      statusCode: constants.SUCCESS,
      message: `Access updated successfully. Created: ${created.length}, Updated: ${updated.length}`,
      data: {
        created,
        updated,
      },
    };
  } catch (err: any) {
    console.error("Error assigning access to entity:", err);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}

async assignUserAccessToAccount({
  users,
  account_rid,
  userId,
  entity_type,
  project_rid,
}: {
  users?: Array<{
    rid: string;
    is_enabled: boolean;
    is_modified: boolean;
  }>;
  account_rid: string;
  userId: string;
  entity_type: "ACCOUNT" | "PROJECT";
  project_rid?:string
}): Promise<{
  statusCode: number;
  message: string;
  data?: { created: string[]; updated: string[] };
  errorMessage?: string;
}> {
  try {
    if (!account_rid || (!users)) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage:
          "Missing required identifiers (user_rid/group_rid or account_rid)",
      };
    }

    const entity_rid = entity_type === 'PROJECT' ? project_rid : account_rid;
    if (!entity_rid){
       return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage:
          "Missing required identifiers project id",
      };
    }

    const now = new Date();
    const created: string[] = [];
    const updated: string[] = [];
    let comment: string | null = '';

    for (const user of users) {
      if (!user.is_modified) continue;
      comment = '';
      const access_type = user.is_enabled ? "INCLUDE" : "EXCLUDE";

      const whereClause: any = {
        entity_type:entity_type,
        entity_rid: entity_type === 'PROJECT' ? project_rid : account_rid,
      };
       whereClause.user_rid = user.rid;

      const existing = await UserGroupEntityAccess.findOne({
        where: whereClause,
      });
      

    // If user is disabled, check if they belong to a group that has access to the account
    if (user.is_modified) {
    const userGroups = await UserGroupMapping.findAll({
      where: { user_rid: user.rid },
      attributes: ['group_rid'],
    });

    const groupRids = userGroups.map(g => g.group_rid);

    if (groupRids.length > 0) {
      const groupHasAccess = await UserGroupAccountMapping.findOne({
        where: {
          group_rid: { [Op.in]: groupRids },
          account_rid,
        },
      });
      if(!user.is_enabled)
      {
          if (groupHasAccess) {
                 const user = await User.findOne({
                  where: { rid: userId },
                  attributes: ["first_name"],
                });
                  comment = `${user?.first_name}  Disabled Access on ${dayjs().format('YYYY-MM-DD, hh:mm:ss A')}  `;
                }
      }
      else
      {
        if (groupHasAccess) {
                  comment = '';
                }
      }
      
    }
  }
      if (existing) {
        await existing.update({
          access_type,
          comment,
          modified_by: userId,
          modified_datetime: now,
        });
        updated.push(user.rid);
      } else {
        await UserGroupEntityAccess.create({
          user_rid: user.rid ?? null,
          comment,
          group_rid: null,
          entity_type,
          entity_rid,
          access_type,
          created_by: userId,
          created_datetime: now,
        });
        created.push(user.rid);
      }
    }

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        created,
        updated,
      },
    };
  } catch (err: any) {
    console.error("Error assigning access to entity:", err);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}

async assignGroupAccessToAccount({
  groups,
  account_rid,
  userId,
  entity_type,
  project_rid
}: {
  groups?: Array<{
    rid: string;
    is_enabled: boolean;
    is_modified: boolean;
  }>;
  account_rid: string;
  userId: string;
  entity_type: "ACCOUNT" | "PROJECT",
  project_rid?:string
}): Promise<{
  statusCode: number;
  message: string;
  data?: { created: string[]; updated: string[] };
  errorMessage?: string;
}> {
  try {
    if (!account_rid || (!groups)) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage:
          "Missing required identifiers (user_rid/group_rid or account_rid)",
      };
    }

    const now = new Date();
    const created: string[] = [];
    const updated: string[] = [];

    for (const grp of groups) {
      if (!grp.is_modified) continue;

      const access_type = grp.is_enabled ? "INCLUDE" : "EXCLUDE";

      const whereClause: any = {
        entity_type: "ACCOUNT",
        entity_rid: account_rid,
      };
       whereClause.group_rid = grp.rid;

      const existing = await UserGroupEntityAccess.findOne({
        where: whereClause,
      });

      if (existing) {
        await existing.update({
          access_type,
          modified_by: userId,
          modified_datetime: now,
        });
        updated.push(grp.rid);
      } else {
        await UserGroupEntityAccess.create({
          user_rid:  null,
          group_rid: grp.rid ?? null,
          entity_type: "ACCOUNT",
          entity_rid:account_rid,
          access_type,
          created_by: userId,
          created_datetime: now,
        });
        created.push(grp.rid);
      }
    }

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        created,
        updated,
      },
    };
  } catch (err: any) {
    console.error("Error assigning access to entity:", err);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}


/**
 * Assigns or revokes access to a project for a user or a group based on `has_access` flag.
 *
 * @param {Object} params - Access assignment input
 * @param {string} [params.user_rid] - RID of the user (optional)
 * @param {string} [params.group_id] - RID of the group (optional)
 * @param {string} params.project_rid - RID of the project (maps to entity_rid)
 * @param {boolean} params.has_access - True = INCLUDE, False = EXCLUDE
 * @param {string} params.modified_by - RID of the user making the change
 * @returns {Promise<Object>} - Result object with status and message
 */
async  assignEntityAccessToProjects({
  user_rid,
  group_rid,
  projects,
  userId,
}: {
  user_rid?: string;
  group_rid?: string;
  projects: any;
  userId: string;
}): Promise<{
  statusCode: number;
  message: string;
  data?: { updated: number; failed: number };
  errorMessage?: string;
}> {
 
  try {
    if ((!user_rid && !group_rid) || !projects) {
      return {
        statusCode: constants.BAD_REQUEST,
        message: constants.BAD_REQUEST_MESSAGE,
        errorMessage: "Missing user/group info or project list",
      };
    }

    let updated = 0;
    let failed = 0;

      for (const [project_rid, has_access_enabled] of Object.entries(projects)) {
      if (!project_rid) {
        failed++;
        continue;
      }

      const access_type = has_access_enabled ? 'INCLUDE' : 'EXCLUDE';

      const whereClause: any = {
        entity_type: 'PROJECT',
        entity_rid: project_rid,
      };
      if (user_rid) whereClause.user_rid = user_rid;
      if (group_rid) whereClause.group_rid = group_rid;

      try {
        const existing = await UserGroupEntityAccess.findOne({ where: whereClause });

        if (existing) {
          await existing.update({
            access_type,
            modified_by: userId,
            modified_datetime: new Date(),
          });
        } else {
          await UserGroupEntityAccess.create({
            user_rid: user_rid ?? null,
            group_rid: group_rid ?? null,
            entity_type: 'PROJECT',
            entity_rid: project_rid,
            access_type,
            created_by: userId,
            created_datetime: new Date(),
          });
        }
        updated++;
      } catch (err) {
        console.error(`Failed to assign access for project_rid: ${project_rid}`, err);
        failed++;
      }
    }

    return {
      statusCode: constants.SUCCESS,
      message: `Project access update complete. Updated: ${updated}, Failed: ${failed}`,
      data: { updated, failed },
    };
  } catch (err: any) {
    console.error("Error in bulk project access assignment:", err);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: err.message,
    };
  }
}

/**
 * Fetch all projects for a given account and indicate if the user has access to each.
 *
 * Access is evaluated based on `UserGroupEntityAccess` entries where:
 * - `entity_type = 'PROJECT'`
 * - `entity_rid = project.rid`
 * - `user_rid = <provided>`
 *
 * A project is marked `has_project_access: true` if:
 * - It has an `INCLUDE` entry and no `EXCLUDE` entry for the user
 *
 * @param account_rid - The account to fetch projects from
 * @param user_rid - The user whose project access is evaluated
 * @returns List of all eligible projects with access flags
 */

async  getProjectsOfSelectedAccounts(
  account_rids: string | string[],
  group_rid?:string,
  page: number = 1,
  limit: number = 1000,
  filters: Record<string, string>= {},
  sortBy: string = "project_name", 
  sortOrder: string = "ASC"
): Promise<{
  statusCode: number;
  message: string;
  data?: { projects: ProjectAccessView[]; totalCount: number };
  errorMessage?: string;
}> {
  const offset = (page - 1) * limit;
  const sequelize = await initSequelize();

  if(account_rids)
  {
    const accountRidArray: string[] = Array.isArray(account_rids)
        ? account_rids
        : typeof account_rids === 'string' && account_rids.trim() !== ''
          ? account_rids.split(',').map((r) => r.trim())
          : [];

      if (!accountRidArray.length) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid account_rid provided.",
        };
      }
      const allowedSortFields = ['project_name'];
      const sortField = allowedSortFields.includes(sortBy || '') ? sortBy : 'project_name';
      const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
      const baseWhereClauses = ['ps.account_rid IN (:accountRidArray)'];
       const replacements: any = { accountRidArray, limit, offset,
        group_rid: group_rid ?? null,
      };
      const filterConditions = this.buildSQLConditions(filters);
      if (filterConditions) {
        baseWhereClauses.push(filterConditions);
        }
        
    // Build ORDER BY clause with proper access type sorting
      let orderByClause: string;
      orderByClause = `ORDER BY ps.${sortField} ${sortDirection.toUpperCase()}`;

      // Main query with both access_type and has_access fields
      const query =constants.SQL_GET_ALL_PROJECTS_OF_ACCOUNT
        .replace('{whereClauses}', baseWhereClauses.join(' AND '))
        .replace('{orderByClause}', orderByClause)

      // Count query
      const countQuery = constants.SQL_GET_ALL_PROJECTS_OF_ACCOUNT_COUNT
          .replace("{whereClauses}", baseWhereClauses.join(' AND '))
      

  try {
    const [projects, total_count] = await Promise.all([
  sequelize.query<ProjectAccessView>(query, {
    replacements,
    type: QueryTypes.SELECT,
  }),
  sequelize.query<{ total_count: string }>(countQuery, {
    replacements: { ...replacements, limit: undefined, offset: undefined },
    type: QueryTypes.SELECT,
  }),
]) as [ProjectAccessView[], [{ total_count: string }]];
    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        projects,
        totalCount: parseInt(total_count[0]?.total_count),
      },
    };
  } catch (error) {
    console.error('Database query failed:', error);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: 'Failed to fetch projects',
    };
  }
}
else
{
   return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Invalid account_rid provided.",
        };
}
}


/**
 * Fetch all projects for a given account and indicate if the user has access to each.
 *
 * Access is evaluated based on `UserGroupEntityAccess` entries where:
 * - `entity_type = 'PROJECT'`
 * - `entity_rid = project.rid`
 * - `user_rid = <provided>`
 *
 * A project is marked `has_project_access: true` if:
 * - It has an `INCLUDE` entry and no `EXCLUDE` entry for the user
 *
 * @param account_rid - The account to fetch projects from
 * @param user_rid - The user whose project access is evaluated
 * @returns List of all eligible projects with access flags
 */

async  getProjectsWithUserAccessFlag(
  access_type:string,
  account_rid: string,
  entity_rid: string,
  page: number = 1,
  limit: number = 10,
  filters: Record<string, string>= {},
  sortBy: string = "project_name", 
  sortOrder: string = "ASC"
): Promise<{
  statusCode: number;
  message: string;
  data?: { projects: ProjectAccessView[]; totalCount: number };
  errorMessage?: string;
}> {
  const offset = (page - 1) * limit;
  const sequelize = await initSequelize();

  // Validate inputs
  if (!account_rid || !entity_rid) {
    return {
      statusCode: constants.BAD_REQUEST,
      message: constants.BAD_REQUEST_MESSAGE,
      errorMessage: "Missing account_rid or user_rid",
    };
  }

   const allowedSortFields = ['project_name'];
   const sortField = allowedSortFields.includes(sortBy || '') ? sortBy : 'project_name';
   const sortDirection = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'ASC';
   const baseWhereClauses = ['ps.account_rid = :account_rid'];
   const replacements: any = { account_rid, entity_rid, limit, offset };
   let joinCondition = '';
   let extraJoin = '';
   let isGroupedSelect = '';
   if (access_type === 'USER') {
    joinCondition = `
      (uga.user_rid = :entity_rid OR uga.group_rid = ugm.group_rid)
    `;
    extraJoin = `
      LEFT JOIN ${MAIN_SCHEMA_NAME}.user_group_mapping ugm
        ON ugm.user_rid = :entity_rid
    `;
     isGroupedSelect = `,
    (
      uga.user_rid IS NULL AND 
      uga.group_rid IS NOT NULL AND 
      ugm.group_rid IS NOT NULL
    ) AS is_grouped`;
  } else {
    joinCondition = `uga.group_rid = :entity_rid`;
    extraJoin = ''; // no join needed for group
  }
  replacements.entity_rid = entity_rid;

   const filterConditions = this.buildSQLConditions(filters);
  if (filterConditions) {
    baseWhereClauses.push(filterConditions);
  }

  // Build ORDER BY clause with proper access type sorting
  let orderByClause: string;
  if (sortBy === 'has_access') {
    orderByClause = `
      ORDER BY 
        CASE 
          WHEN uga.access_type = 'INCLUDE' THEN ${sortOrder === 'asc' ? 0 : 1}
          ELSE ${sortOrder === 'asc' ? 1 : 0}
        END
    `;
  } else {
    orderByClause = `ORDER BY ps.${sortField} ${sortDirection.toUpperCase()}`;
  }

  const queryTemplate = access_type === 'USER' 
    ? constants.SQL_GET_USER_PROJECTS 
    : constants.SQL_GET_PROJECTS;
  // Main query with both access_type and has_access fields
  const query =queryTemplate
    .replace('{whereClauses}', baseWhereClauses.join(' AND '))
    .replace('{orderByClause}', orderByClause)
    .replace('{joinCondition}',joinCondition)
    .replace('{extraJoin}', extraJoin)
    .replace('{isGroupedSelect}', isGroupedSelect)

  // Count query
  const countQuery = constants.SQL_GET_PROJECTS_COUNT
      .replace("{whereClauses}", baseWhereClauses.join(' AND '))
      .replace('{joinCondition}',joinCondition)
      .replace('{extraJoin}', extraJoin)


  try {
    const [projects, total_count] = await Promise.all([
  sequelize.query<ProjectAccessView>(query, {
    replacements,
    type: QueryTypes.SELECT,
  }),
  sequelize.query<{ total_count: string }>(countQuery, {
    replacements: { ...replacements, limit: undefined, offset: undefined },
    type: QueryTypes.SELECT,
  }),
]) as [ProjectAccessView[], [{ total_count: string }]];
    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        projects,
        totalCount: parseInt(total_count[0].total_count, 10),
      },
    };
  } catch (error) {
    console.error('Database query failed:', error);
    return {
      statusCode: constants.FAILED,
      message: constants.FAILED_MESSAGE,
      errorMessage: 'Failed to fetch projects',
    };
  }
}



async getUserGroupType(type: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: { groupTypes: any; count: number };
}> {
  try {
    const whereClause =
      type === 'All'
        ? {} // no filter
        : { type: 'CUSTOM' }; // only custom group types

    const groupTypes = await UserGroupType.findAll({
      where: whereClause,
      attributes: [
        'rid',
        'group_type_name',
        'group_type_description',
        'type',
        'is_consultant_only_group',
      ],
      order: [['group_type_name', 'ASC']],
    });

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        groupTypes,
        count: groupTypes.length,
      },
    };
  } catch (err) {
    return this.throwServiceError(err as Error);
  }
}



private buildSQLConditions(filters: Record<string, any>): string | null {
  const conditions: string[] = [];

  for (const [column, condition] of Object.entries(filters)) {
    if (!condition || typeof condition !== 'object') continue;

    // Handle operators like { equals: "value" }, { contains: "value" }
    for (const [operator, value] of Object.entries(condition)) {
      if (value === undefined || value === null) continue;
      const lowerColumn = `LOWER(${column})`; // wrap column in LOWER()
      switch (operator.toLowerCase()) {
        case 'equals':
        case 'eq':
          conditions.push(`${lowerColumn} = '${String(value).toLowerCase()}'`);
          break;
        case 'not_equals':
        case 'ne':
           conditions.push(`${lowerColumn} != '${String(value).toLowerCase()}'`);
          break;
        case 'is_empty':
          conditions.push(`(${lowerColumn} IS NULL OR ${lowerColumn} = '')`);
          break;
        case 'contains':
          conditions.push(`${lowerColumn} LIKE '%${String(value).toLowerCase()}%'`);
          break;
        case 'in':
          if (Array.isArray(value)) {
            const quotedValues = value
              .map(v => `'${String(v).toLowerCase()}'`)
              .join(', ');
            conditions.push(`${lowerColumn} IN (${quotedValues})`);
          }
          break;
        case 'gt':
          conditions.push(`${column} > ${value}`);
          break;
        case 'lt':
          conditions.push(`${column} < ${value}`);
          break;
        case 'gte':
          conditions.push(`${column} >= ${value}`);
          break;
        case 'lte':
          conditions.push(`${column} <= ${value}`);
          break;
        default:
          console.warn(`Unsupported operator: ${operator}`);
      }
    }
  }

  return conditions.length > 0 ? conditions.join(' AND ') : null;
}
  
}
export default UserGroupService