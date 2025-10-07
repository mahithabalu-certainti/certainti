import { initSequelize } from "../config/dataSource";
import { models } from "../models/index";
import { constants, MAIN_SCHEMA_NAME, rawQuery } from "../utils/constant";
import { IUpdateUserData, IUserData } from "../utils/types";
import { Op, Sequelize, IndexHints, DataTypes, QueryTypes } from "sequelize";
import ExcelJS from "exceljs";
import { OrganizationLicenses } from "../models/organisationLicense";
import moment, { Moment } from "moment";
import "moment-timezone";
import { Status } from "../models/statusModel";
import { PermissionObjectMapping } from "../models/permissionObjectMappingModel";
import { UserGroupEntityAccess } from "../models/UserGroupEntityAccessModel";
import { UserGroupMapping } from "../models/userGroupMappingModel";
import { UserGroup } from "../models/userGroupModel";
import { updateAzureUser } from "./manageUser";
import { errorLog, logMessage } from "../utils/helpers";
  const { 
    User, UserDetails, Department, FunctionGroup, Profile, BusinessTeams,
    ProfileMenuAccess, Menu, ProfileModuleAccess, MenuModule, ProfilePermissionAccess, ModulePermission,
    UserMenuAccess, UserModuleAccess, UserPermissionAccess, PermissionField, ProfileFieldsAccess, UserFieldsAccess
  } = models;

class UserService {
  getUserByEmail(email: string) {
    const user = User.findOne({
      where: {
        email: email,
      },
    });
    return user;
  }

  private accountRepository: typeof User | null = null;

  /**
   * Retrieves the User model instance.
   * If the repository has not been initialized, it creates a new instance
   * using the database configuration.
   *
   * @returns {typeof User} - The model for User entities.
   */
  getAccountRepository(): typeof User {
    if (!this.accountRepository) {
      this.accountRepository = User;
    }
    return this.accountRepository;
  }

  /**
   * Creates a new user in the database using the provided user data.
   * The user data is processed and then inserted into the `User` model.
   * If the organization is `ENV_EA`, additional user details are created.
   *
   * @param {IUserData} userData - The data of the user to be created.
   * @param {string} azureId - The Azure ID associated with the user.
   *
   * @returns {Promise<{statusCode: number, message: string, data: {user: typeof User}} | {statusCode: number, message: string, error: string}>}
   * - On success, it returns a success status, a success message, and the created user data.
   * - On failure, it returns a failure status, a failure message, and the error message.
   */
  async createUser(
    userData: IUserData,
    azureId: string,
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { user: any };
  }> {
    try {
      const {
        first_name,
        last_name,
        email,
        profile_id,
        status_rid,
        street,
        city_rid,
        region_rid,
        zip_code,
        country_rid,
        role,
        middle_name,
        created_by,
        organization,
        phone,
        is_consultant_firm,
        org_id,
      } = userData;

      const repository = this.getAccountRepository();
      logMessage(`Creating user with data : ${JSON.stringify(userData)}`);
      const user = await repository.create({
        azure_id: azureId,
        first_name,
        last_name,
        email,
        profile_rid: profile_id,
        status_rid,
        street,
        city_rid,
        region_rid,
        zip_code,
        country_rid: country_rid,
        role_rid: role,
        middle_name,
        phone,
        created_by: userId,
        is_consultant_firm: is_consultant_firm,
        org_id,
      });

      if (organization === constants.ENV_EA) {
        this.createUserDetails(userData, user.rid);
      }

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          user,
        },
      };
    } catch (err) {
      errorLog("Error creating user:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Updates an existing user in the database using the provided user data.
   * The user is searched by its `userId`, and if found, its data is updated
   * with the new provided values. If the organization is `ENV_EA`,
   * additional user details are updated.
   *
   * @param {IUpdateUserData} userData - The new data for the user to be updated.
   * @param {string} userId - The ID of the user to be updated.
   *
   * @returns {Promise<{statusCode: number, message: string, data: {user: typeof User}} | {statusCode: number, message: string}>}
   * - On success, it returns a success status, a success message, and the updated user data.
   * - On failure, it returns a failure status and a message indicating the error (e.g., user not found).
   */
  async updateUser(
    userData: IUpdateUserData,
    userId: string,
    loggedInUser: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    requiresConfimration?: boolean;
    data?: { user: any };
  }> {
    try {
      const {
        first_name,
        last_name,
        profile_id,
        status_rid,
        street,
        city_rid,
        region_rid,
        zip_code,
        country_rid,
        role,
        middle_name,
        organization,
        phone,
        is_consultant_firm,
        org_id,
        remove_group_memberships
      } = userData;
      logMessage(`Updating user ${userId} with data: ${JSON.stringify(userData)}`);

      const repository = this.getAccountRepository();

      const user = await repository.findOne({ where: { rid: userId } });

      if (!user) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: "User not found",
        };
      }
      if(remove_group_memberships)
      {
         this.revokeAllGroupAccessForUser(userId)     
      }
      if (user.org_id !== org_id) {
        const userGroups = await this.getUserAccessStatus(userId);
      if (userGroups.hasAccess) {
        return {
          statusCode: constants.CONFLICT, // 409 Conflict or use a custom code
          message: constants.CONFLICT_MESSAGE,
          errorMessage: `This user currently has access to this organization directly or through the following groups:
            ${userGroups.groupNames.join(', ')}
            If you continue, their existing access to the organization will be updated.
            Do you want to proceed?`,
          requiresConfimration:true
        };
      }

      }

      //REstrict if user belongs the group if the user belongs to any group
      const updatedData = await repository.update(
        {
          first_name,
          last_name,
          profile_rid: profile_id,
          status_rid,
          street,
          city_rid,
          region_rid,
          zip_code,
          country_rid,
          role_rid: role,
          middle_name,
          phone,
          modified_by: loggedInUser,
          modified_datetime: new Date(),
          is_consultant_firm,
          org_id,
        },
        {
          where: {
            rid: userId,
          },
        }
      );

      if (organization === constants.ENV_EA) {
        this.updateUserDetails(userData, userId);
      }
     

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          user: updatedData,
        },
      };
    } catch (err) {
      errorLog("Error updating user:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  async getUserAccessStatus(userId: string): Promise<{
    hasAccess: boolean;
    groupNames: string[];
  }> {
    try {
      // 1. Check for direct access first
      const directAccess = await UserGroupEntityAccess.findOne({
        where: { user_rid: userId }
      });

      if (directAccess) {
        return {
          hasAccess: true,
          groupNames: []
        };
      }

      // 2. Check for group-based access
      const userGroups = await UserGroupMapping.findAll({
        where: { user_rid: userId },
        include: [{
          model: UserGroup,
          as: 'group',
          attributes: ['group_name'],
          required: true
        }],
        raw: true,
        nest: true
      });

      const groupNames = userGroups
        .map(g => g.group?.group_name)
        .filter((name): name is string => typeof name === 'string');

      const groupRids = userGroups.map(g => g.group_rid);

      if (groupRids.length > 0) {
        const groupAccess = await UserGroupEntityAccess.findOne({
          where: { group_rid: { [Op.in]: groupRids } }
        });

        return {
          hasAccess: Boolean(groupAccess),
          groupNames: groupAccess ? groupNames : []
        };
      }

      return {
        hasAccess: false,
        groupNames: []
      };
    } catch (error) {
      errorLog('Error checking user access:', (error as Error).message);
      return {
        hasAccess: false,
        groupNames: []
      };
    }
  }

  async updateUserInLine(
    userData: Partial<IUpdateUserData>,
    userId: string,
    loggedInUser: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { user: any };
  }> {
    try {
      logMessage(`Updating user ${userId} with data: ${JSON.stringify(userData)}`);
      const mainSequelize = await initSequelize()
      const { ...fieldsToUpdate } = userData;

      if (Object.keys(fieldsToUpdate).length === 0) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Missing user ID or no fields to update",
        };
      }

      const repository = this.getAccountRepository();

      const user = await repository.findOne({ where: { rid: userId } });

      if (!user) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: "User not found",
        };
      }

      fieldsToUpdate.modified_by = loggedInUser;

      // Remove status_rid if it is undefined to satisfy UpdateUser type
      const azureUserUpdate: any = { ...fieldsToUpdate };
      if (azureUserUpdate.status_rid === undefined) {
        delete azureUserUpdate.status_rid;
      }

      const azureUser = await updateAzureUser(azureUserUpdate);
      if (!azureUser) {
        return {
          statusCode: constants.FAILED,
          message: constants.FAILED_MESSAGE,
          errorMessage: "Azure AD B2C user update failed",
        };
      }

      const updatedData = await repository.update(
        {
          ...fieldsToUpdate,
          modified_datetime: new Date(),
        },
        { where: { rid: userId } }
      );

      let userDetails = await mainSequelize.query(rawQuery.fetchUserByIdForGraphql(userId))
      let d : any = userDetails[0][0]
      let finalData = {
        rid : d.rid,
        email : d.email,
        status_rid : d.status_rid,
        first_name : d.first_name,
        created_datetime : d.created_datetime,
        modified_datetime : d.modified_datetime,
        azure_id : d.azure_id,
        profile : d.profile == null ? null : {
          rid : d.profile.rid,
          profile_name : d.profile.profile_name
        },
        business_teams : d.business_teams == null ? null : {
          rid : d.business_teams.rid,
          business_teams : d.business_teams.business_teams
        },
        status : d.status == null ? null : {
          status_name : d.status.status_name,
          status_description : d.status.status_description
        }
      }
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          user: finalData,
        },
      };
    } catch (err) {
      errorLog("Error updating user inline:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  // ... existing code ...
  // ... existing code ...
  // ... existing code ...
  async getPermissionFieldsByIds(userId: string, permissionIds: string[]) {
    try {
      // 1. Get profile id for user
      const user = await User.findOne({
        where: { rid: userId },
        attributes: ["profile_rid"],
      });
     
      const profileId = user?.profile_rid;
      if (!profileId) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: "No profile found for the given userId",
          data: {},
        };
      }

      // 2. Get all fields for the given permission ids
      const fields = await PermissionField.findAll({
        where: { module_permission_id: permissionIds },
        raw: true,
      });
  

      // Collect all field IDs
      const fieldIds = fields.map((f) => f.rid);

      // 3. Get profile field access for these fields
      const profileFieldAccess = await ProfileFieldsAccess.findAll({
        where: { profile_id: profileId, permission_field_id: fieldIds },
        raw: true,
      });

      // 4. Get user field access for these fields
      const userFieldAccess = await UserFieldsAccess.findAll({
        where: { user_id: userId, permission_field_id: fieldIds },
        raw: true,
      });
      

      // 5. Build access maps for quick lookup (by field_id)
      const profileAccessMap: {
        [key: string]: { read: boolean; edit: boolean };
      } = {};
      profileFieldAccess.forEach((acc) => {
        profileAccessMap[acc.permission_field_id] = {
          read: acc.read,
          edit: acc.edit,
        };
      });
      const userAccessMap: { [key: string]: { read: boolean; edit: boolean } } =
        {};
      userFieldAccess.forEach((acc) => {
        userAccessMap[acc.permission_field_id] = {
          read: acc.read,
          edit: acc.edit,
        };
      })

      // 6. Build the response
      const result: { [key: string]: any[] } = {};
      permissionIds.forEach((pid) => {
        const fieldObjs = fields.filter((f) => f.module_permission_id === pid);
        result[pid] = fieldObjs.map((f) => {
          const profile = profileAccessMap[f.rid] || {
            read: false,
            edit: false,
          };
          const user = userAccessMap[f.rid] || { read: false, edit: false };
          // Logic: If either profile or user access is true, set to true
          return {
            name: f.field_name,
            desc: f.field_desc,
            read: profile.read || user.read,
            edit: profile.edit || user.edit,
          };
        });
      });

      return result;
    } catch (err) {
      errorLog("Error in getPermissionFieldsByIds:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }
  // ... existing code ...

  /**
   * Creates a new UserDetails record associated with the given user.
   * It saves the provided user data, including department, designation,
   * employment information, and manager details.
   *
   * @param {IUserData} userData - The data to be saved for the new UserDetails.
   * @param {string} userId - The ID of the user to associate the details with.
   *
   * @returns {Promise<void>} - A promise that resolves when the UserDetails
   * record is successfully created.
   */
  async createUserDetails(userData: IUserData, userId: string) {
    const {
      department_id,
      designation,
      employment_date,
      manager_email,
      manager_employee_id,
      manager_name,
      employee_id,
      function_group_id,
      mobile,
    } = userData;

    await UserDetails.create({
      user_id: userId,
      department_id,
      designation,
      employment_date,
      manager_email,
      manager_employee_id,
      manager_name,
      employee_id,
      function_group_id,
      mobile,
    });
  }

    /**
   * Removes all group-related access and mappings for a given user.
   * This includes their entries in `UserGroupEntityAccess` and `UserGroupMapping`.
   * 
   * @param userId - The ID of the user whose access is being revoked.
   * @throws If database operations fail (caller should handle errors).
   */
  async revokeAllGroupAccessForUser(userId: string): Promise<void> {
    // Execute deletions in parallel for efficiency (since they’re independent)
    await Promise.all([
      // Remove all entity access entries for the user
      UserGroupEntityAccess.destroy({ where: { user_rid: userId } }),
      // Remove all group mappings for the user
      UserGroupMapping.destroy({ where: { user_rid: userId } }),
    ]);
    logMessage(`Revoked all group access for user ${userId}`); 
  }

  /**
   * Updates the UserDetails record associated with the given user.
   * It updates the user's department, designation, employment information,
   * manager details, and other related fields.
   *
   * @param {IUpdateUserData} userData - The data to be updated for the UserDetails.
   * @param {string} userId - The ID of the user whose details need to be updated.
   *
   * @returns {Promise<void>} - A promise that resolves when the UserDetails
   * record is successfully updated.
   */
  async updateUserDetails(userData: IUpdateUserData, userId: string) {
    const {
      department_id,
      designation,
      employee_id,
      employment_date,
      manager_email,
      manager_employee_id,
      manager_name,
      function_group_id,
      mobile,
    } = userData;

    await UserDetails.update(
      {
        department_id,
        designation,
        employment_date,
        manager_email,
        manager_employee_id,
        manager_name,
        employee_id,
        function_group_id,
        mobile,
        modified_datetime: new Date(),
      },
      {
        where: {
          user_id: userId,
        },
      }
    );
  }

  /**
   * Retrieves a paginated list of users based on search and filter criteria,
   * as well as sorting parameters. The method fetches user data either
   * from the `ENV_TRD365` organization or from the `ENV_EA` organization
   * using different fetch strategies.
   *
   * @param {number} page - The page number for pagination.
   * @param {number} limit - The number of users to fetch per page.
   * @param {string} search - The search query to filter users by.
   * @param {Record<string, string>} filters - The filters applied to user data.
   * @param {string} sortBy - The field by which to sort the results.
   * @param {string} sortOrder - The order of sorting ('ASC' or 'DESC').
   * @param {string} organization - The organization type used to determine the fetch method.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { users: any } }>}
   * A promise that resolves to an object containing the status, message,
   * and user data.
   */
  async listUsers(
    page: number,
    limit: number,
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    organization: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { users: any; count: number };
  }> {
    try {
      logMessage(`listUsers called with page: ${page}, limit: ${limit}, search: ${search}, filters: ${JSON.stringify(filters)}, sortBy: ${sortBy}, sortOrder: ${sortOrder}, organization: ${organization}`);
      let users = null;
      let count: number = 0;
      const offset = (page - 1) * limit;

      const whereClause = this.buildWhereClause(filters, search);

      logMessage(`whereClause : ${JSON.stringify(whereClause)}`);

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      if (organization == constants.ENV_TRD365) {
        const { rows, count: totalCount } = await this.fetchUser(
          whereClause,
          limit,
          offset,
          finalSortBy,
          finalSortOrder
        );
        users = rows;
        count = totalCount;
      } else {
        users = await this.fetchUserDetails(
          whereClause,
          limit,
          offset,
          finalSortBy,
          finalSortOrder
        );
      }
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          users,
          count,
        },
      };
    } catch (err) {
      errorLog("Error listing users:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves a user's details by their user ID based on the organization type.
   * Depending on the organization, it fetches either basic user information from
   * `ENV_TRD365` or detailed user information from `ENV_EA`,
   * including related data such as profile, business teams, department, and function group.
   *
   * @param {string} userId - The ID of the user to retrieve.
   * @param {string} organization - The organization type used to determine the fetch method.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { users: any } }>}
   * A promise that resolves to an object containing the status, message,
   * and user data.
   */
  async listUserById(
    userId: string,
    organization: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { users: any };
  }> {
    try {
      logMessage(`listUserById called with userId: ${userId}, organization: ${organization}`);
      let users = null;
      if (organization === constants.ENV_TRD365) {
        users = await User.findOne({
          where: {
            rid: userId,
          },
          include: [
            {
              model: Profile,
              as: "profile",
              attributes: ["profile_name"],
              required: true,
            },
            {
              model: BusinessTeams,
              as: "business_teams",
              attributes: ["business_teams"],
              required: true,
            },
            {
              model: Status,
              as: "status",
              attributes: [["status_description", "status_name"]],
              required: false,
            },
          ],
        });

        if (users) {
          const { country, state, city, orgName } = await this.getGeoData(
            users.country_rid || "",
            users.region_rid || "",
            users.city_rid || "",
            users.org_id || "",
            users.is_consultant_firm
          );
          (users as any).dataValues.country_name = country;
          (users as any).dataValues.state_name = state;
          (users as any).dataValues.city_name = city;
          (users as any).dataValues.org_name = orgName;

          // Fetch user names for created_by and modified_by
          const userNames = await this.fetchUserNames({
            created_by: users.created_by || "",
            modified_by: users.modified_by || "",
          });
           const permissions = await this.getAllUserExtendedPermissionForView(
            users.rid,
            users.profile_rid || ""
    );
          (users as any).dataValues.permissions = permissions;
          (users as any).dataValues.created_by = userNames.created_by_name;
          (users as any).dataValues.modified_by = userNames.modified_by_name;
        }
      } else {
        users = UserDetails.findAll({
          where: {
            user_id: userId,
          },
          include: [
            {
              model: User,
              required: true,
            },
            {
              model: Department,
              attributes: ["department_name"],
              required: true,
            },
            {
              model: FunctionGroup,
              attributes: ["function_group_name"],
              required: true,
            },
          ],
        });
      }
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          users,
        },
      };
    } catch (err) {
      errorLog("Error listing user by ID:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves a list of all roles from the `BusinessTeams` model.
   *
   * This method fetches all the available business team roles from the database and returns them in the response.
   * If the fetch is successful, it returns the roles in the `data` field of the response.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { roles: any[] } }>}
   * A promise that resolves to an object containing the status, message, and the list of roles.
   */
  async roles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { roles: any };
  }> {
    try {
      const roles = await BusinessTeams.findAll({
        order: [["business_teams", "ASC"]],
      });
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          roles,
        },
      };
    } catch (err) {
      errorLog("Error fetching roles:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Retrieves the role information for a user by their Azure ID.
   *
   * This method finds a user by their Azure ID and returns the role ID (`role_rid`) and associated user role
   * from the `business_teams` model. If no user or associated `business_teams` are found, it returns an error message.
   *
   * @param {string} azureId - The Azure ID of the user whose role is to be retrieved.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { rid: string; user_role: string } | null }>}
   */
  async permissionById(azureId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      rid: string;
      user_role: string;
      user_id: string;
      profile_id: string;
      permissions: any[];
      organisation_name: string;
      logo_url: string;
    } | null;
  }> {
    try {
      logMessage(`Fetching permissions for user with Azure ID: ${azureId}`);
      const roles = await User.findOne({
        attributes: [
          "role_rid",
          "rid",
          "profile_rid",
          "is_consultant_firm",
          "org_id",
        ],
        where: { azure_id: azureId },
        include: [
          {
            model: BusinessTeams,
            as: "business_teams",
            required: true,
            attributes: ["business_teams"],
          },
        ],
      });

      let organisation_name = "";
      let logo_url = "";

      if (!roles || !roles.business_teams) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          data: null,
        };
      }
      const mainDbSequelize = await initSequelize();
      if (roles.is_consultant_firm) {
        const org = await OrganizationLicenses.findOne({
          attributes: ["firm_name", "logo_url"],
        });
        if (org) {
          organisation_name = org.firm_name || "";
          logo_url = org.logo_url || "";
        }
      } else {
        const mainDbSequelize = await initSequelize();
        const [account]: any[] = await mainDbSequelize.query(
          `SELECT organisation_name, logo_url FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
          {
            replacements: { rid: roles.org_id },
            type: "SELECT",
          }
        );
        if (account) {
          organisation_name = account.organisation_name || "";
          logo_url = account.logo_url || "";
        }
      }

      // Check again for roles.business_teams
      if (!roles.business_teams) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          data: null,
        };
      }

      const permissions = await this.getAllUserPermission(
        roles.rid,
        roles.profile_rid || ""
      );

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          rid: roles.role_rid || "",
          user_role: roles.business_teams.business_teams,
          user_id: roles.rid,
          profile_id: roles.profile_rid || "",
          permissions,
          organisation_name,
          logo_url,
        },
      };
    } catch (err) { 
      errorLog("Error in permissionById:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  // Consolidate all permissions for a user
// ... existing code ...
async getAllUserPermission(userId: string, profileId: string) {
 logMessage(`getAllUserPermission called with userId: ${userId}, profileId: ${profileId}`);
  const [profilePermissions, userPermissions] = await Promise.all([
    this.getProfilePermission(profileId,false),
    this.getUserPermission(userId)
  ]);

  const userPermissionMap = new Map<string, any>();
  userPermissions.forEach((p) =>
    userPermissionMap.set(getPermissionKey(p), p)
  );

  // Result array for merged permissions
  const mergedPermissions: any[] = [];

  // Merge profilePermissions with userPermissions overrides
  for (const profilePerm of profilePermissions) {
    const key = getPermissionKey(profilePerm);
    const userPerm = userPermissionMap.get(key);
    if (profilePerm.type === "field") {
        // For field permissions, merge read/edit and extended flags
        mergedPermissions.push({
          ...profilePerm,
          read: profilePerm.read ? true : userPerm?.read === true,
          edit: profilePerm.edit ? true : userPerm?.edit === true
        });
    } else {
        // For other types (menu, module, etc.)
        mergedPermissions.push({
          ...profilePerm,
          is_enabled: profilePerm.is_enabled
            ? true
            : userPerm?.is_enabled === true,
        });
      }

      // Remove merged user permission from map to track leftover user-only permissions
      if (userPerm) userPermissionMap.delete(key);
    }
    return mergedPermissions
  }

  // Get all profile-based permissions
async getProfilePermission(profileId: string,includeDependencies: boolean = false) {
  const permissions: any[] = [];
  const mainDbSequelize = await initSequelize();

  // Get all data including dependencies in parallel
  const [
    menuAccess,
    moduleAccess,
    permissionAccess,
    fieldAccess,
    allDependencies
  ] = await Promise.all([
    ProfileMenuAccess.findAll({
      where: { profile_id: profileId },
      include: [{ model: Menu, as: "menu" }],
      order: [
        [{ model: Menu, as: "menu" }, "menu_category", "DESC"],
        [{ model: Menu, as: "menu" }, "sort_order", "ASC"]
      ]
    }),
    ProfileModuleAccess.findAll({
      where: { profile_id: profileId },
      include: [{ model: MenuModule, as: "menu_module" }],
      order: [[{ model: MenuModule, as: "menu_module" }, "sort_order", "ASC"]],
    }),
    ProfilePermissionAccess.findAll({
      where: { profile_id: profileId},
      include: [{ model: ModulePermission, as: "module_permission" }],
      indexHints: [{ type: IndexHints.USE, values: ['idx_profile_permission_access_profile_id'] }],
       order: [[{ model: ModulePermission, as: "module_permission" }, "permission_desc", "ASC"]]
    }),
    ProfileFieldsAccess.findAll({
      where: { profile_id: profileId },
      include: [{ model: PermissionField, as: "permission_field" }],
      indexHints: [{ type: IndexHints.USE, values: ['idx_profile_fields_access_profile_id'] }],
       order: [[{ model: PermissionField, as: "permission_field" }, "sort_order", "ASC"]],
    }),
   includeDependencies ? PermissionObjectMapping.findAll({
      attributes: ['dependent_id', 'depends_on_id', 'dependent_type', 'depends_on_type']
    }) : Promise.resolve([])
  ]);

  // Create lookup maps for dependencies
  const dependencyMap = includeDependencies ? new Map<string, { id: string, type: string }[]>() : null;
  
  const reverseDependencyMap = includeDependencies ? new Map<string, { id: string, type: string }[]>() : null;

if (includeDependencies) {
  allDependencies.forEach((dep: any) => {
    const key = `${dep.dependent_id}`;
    const reverseKey = `${dep.depends_on_id}`;

    if (!dependencyMap!.has(key)) {
      dependencyMap!.set(key, []);
    }
    dependencyMap!.get(key)!.push({
      id: dep.depends_on_id,
      type: dep.depends_on_type
    });

    // Populate reverse dependency map (parenting_on)
    if (!reverseDependencyMap!.has(reverseKey)) {
      reverseDependencyMap!.set(reverseKey, []);
    }
    reverseDependencyMap!.get(reverseKey)!.push({
      id: dep.dependent_id,
      type: dep.dependent_type
    });
  });
}


  // Process menus with dependencies
  menuAccess.forEach((ma: any) => {
      const maWithMenu = ma as any;
      const deps = includeDependencies ? dependencyMap?.get(`${maWithMenu.menu.rid}`) || [] : [];
      const parents = includeDependencies ? reverseDependencyMap?.get(`${maWithMenu.menu.rid}`) || [] : [];

      if (maWithMenu.menu) {
        permissions.push({
          rid: maWithMenu.rid,
          type: "menu",
          menu_id: maWithMenu.menu.rid,
          name: maWithMenu.menu.menu_name,
          desc: maWithMenu.menu.menu_desc,
          is_enabled: maWithMenu.is_enabled,
          depends_on_menu:includeDependencies ?  deps.filter(d => d.type === 'menu').map(d => d.id) : undefined,
          depends_on_module: includeDependencies ? deps.filter(d => d.type === 'module').map(d => d.id):undefined,
          depends_on_permission :includeDependencies ?  deps.filter(d => d.type === 'permission').map(d => d.id) : undefined,
          depended_by_menu :includeDependencies ?  parents.filter(d => d.type === 'menu').map(d => d.id):undefined,
          depended_by_module : includeDependencies ? parents.filter(d => d.type === 'module').map(d => d.id):undefined,
          depended_by_permission :includeDependencies ? parents.filter(d => d.type === 'permission').map(d => d.id):undefined
        });
      }
    });

  // Process modules with dependencies
  moduleAccess.forEach((mo: any) => {
      const moWithModule = mo as any;
       const deps = includeDependencies ? dependencyMap?.get(`${moWithModule.menu_module.rid}`) || [] : [];
      const parents = includeDependencies ? reverseDependencyMap?.get(`${moWithModule.menu_module.rid}`) || [] : [];
      if (moWithModule.menu_module) {
        permissions.push({
          rid: moWithModule.rid,
          type: "module",
          module_id: moWithModule.menu_module.rid,
          menu_id: moWithModule.menu_module.menu_id,
          name: moWithModule.menu_module.module_name,
          desc: moWithModule.menu_module.module_desc,
          is_enabled: moWithModule.is_enabled,
          depends_on_menu:includeDependencies ? deps.filter(d => d.type === 'menu').map(d => d.id) :undefined,
          depends_on_module:includeDependencies ? deps.filter(d => d.type === 'module').map(d => d.id):undefined,
          depends_on_permission :includeDependencies ? deps.filter(d => d.type === 'permission').map(d => d.id):undefined,
          depended_by_menu : includeDependencies ? parents.filter(d => d.type === 'menu').map(d => d.id):undefined,
          depended_by_module : includeDependencies ? parents.filter(d => d.type === 'module').map(d => d.id):undefined,
          depended_by_permission : includeDependencies ? parents.filter(d => d.type === 'permission').map(d => d.id):undefined
        });
      }
    });

  // Process permissions (unchanged)
  permissionAccess.forEach((pa: any) => {
      const paWithPerm = pa as any;
       const deps = includeDependencies ? dependencyMap?.get(`${paWithPerm.module_permission.rid}`) || [] : [];
      const parents = includeDependencies ? reverseDependencyMap?.get(`${paWithPerm.module_permission.rid}`) || [] : [];
      if (paWithPerm.module_permission) {
        permissions.push({
          rid: paWithPerm.rid,
          type: "permission",
          permission_id: paWithPerm.module_permission_id,
          module_id: paWithPerm.module_permission.menu_module_id,
          name: paWithPerm.module_permission.permission_name,
          desc: paWithPerm.module_permission.permission_desc,
          is_field_available: paWithPerm.module_permission.is_field_available,
          is_enabled: paWithPerm.is_enabled,
          depends_on_menu:includeDependencies ? deps.filter(d => d.type === 'menu').map(d => d.id):undefined,
          depends_on_module:includeDependencies ? deps.filter(d => d.type === 'module').map(d => d.id) :undefined,
          depends_on_permission :includeDependencies ?  deps.filter(d => d.type === 'permission').map(d => d.id) :undefined,
          depended_by_menu : includeDependencies ? parents.filter(d => d.type === 'menu').map(d => d.id) :undefined,
          depended_by_module : includeDependencies ? parents.filter(d => d.type === 'module').map(d => d.id):undefined,
          depended_by_permission :includeDependencies ? parents.filter(d => d.type === 'permission').map(d => d.id):undefined
        });
      }
    });

  // Process fields (unchanged)
    fieldAccess.forEach((fa: any) => {
      const faWithField = fa as any;
      if (faWithField.permission_field) {
        permissions.push({
          rid: faWithField.rid,
          type: "field",
          field_id: faWithField.permission_field.rid,
          permission_id: faWithField.permission_field.module_permission_id,
          name: faWithField.permission_field.field_name,
          desc: faWithField.permission_field.field_desc,
          read: faWithField.read,
          edit: faWithField.edit,
          is_read_only: includeDependencies ? faWithField.permission_field.is_read_only : undefined,
          is_edit_only: includeDependencies ? faWithField.permission_field.is_edit_only : undefined
        });
      }
    });

    return permissions;
  }

  // Get all user-based permissions
  async getUserPermission(userId: string) {
    const permissions: any[] = [];

    // Menus
    const menuAccess = await UserMenuAccess.findAll({
      where: { user_id: userId , is_enabled: true },
      include: [{ model: Menu, as: "menu" }],
    });
    menuAccess.forEach((ma) => {
      const maWithMenu = ma as any;
      if (maWithMenu.menu) {
        permissions.push({
          rid: maWithMenu.rid,
          type: "menu",
          menu_id: maWithMenu.menu.rid,
          name: maWithMenu.menu.menu_name,
          desc: maWithMenu.menu.menu_desc,
          is_enabled: maWithMenu.is_enabled,
        });
      }
    });

    // Modules
    const moduleAccess = await UserModuleAccess.findAll({
      where: { user_id: userId , is_enabled: true },
      include: [{ model: MenuModule, as: "menu_module" }],
    });
    moduleAccess.forEach((mo) => {
      const moWithModule = mo as any;
      if (moWithModule.menu_module) {
        permissions.push({
          rid: moWithModule.rid,
          type: "module",
          module_id: moWithModule.menu_module.rid,
          menu_id: moWithModule.menu_module.menu_id,
          name: moWithModule.menu_module.module_name,
          desc: moWithModule.menu_module.module_desc,
          is_enabled: moWithModule.is_enabled,
        });
      }
    });

    // Permissions
    const permissionAccess = await UserPermissionAccess.findAll({
      where: { user_id: userId, is_enabled: true },
      include: [{ model: ModulePermission, as: "module_permission" }],
      indexHints: [
        {
          type: IndexHints.USE,
          values: ["idx_user_permission_access_user_id"],
        },
      ],
    });
    permissionAccess.forEach((pa) => {
      const paWithPerm = pa as any;
      if (paWithPerm.module_permission) {
        permissions.push({
          rid: paWithPerm.rid,
          type: "permission",
          permission_id: paWithPerm.module_permission_id,
          module_id: paWithPerm.module_permission.menu_module_id,
          name: paWithPerm.module_permission.permission_name,
          desc: paWithPerm.module_permission.permission_desc,
          is_enabled: paWithPerm.is_enabled,
        });
      }
    });

    const fieldAccess = await UserFieldsAccess.findAll({
      where: {
      user_id: userId,
      [Op.or]: [
        { read: true },
        { edit: true }
      ]
      },
      include: [{ model: PermissionField, as: "permission_field" }],
      indexHints: [
      { type: IndexHints.USE, values: ["idx_user_fields_access_user_id"] },
      ],
    });

    fieldAccess.forEach((fa) => {
      const faWithField = fa as any;
      if (faWithField.permission_field) {
        permissions.push({
          rid: faWithField.rid,
          type: "field",
          field_id: faWithField.permission_field.rid,
          permission_id: faWithField.permission_field.module_permission_id,
          name: faWithField.permission_field.field_name,
          desc: faWithField.permission_field.field_desc,
          read: faWithField.read,
          edit: faWithField.edit,
        });
      }
    });

    return permissions;
  }

  /**
   * Fetches user details based on the provided filters, pagination, and sorting.
   *
   * This method retrieves a list of users from the database, including their profile and business teams,
   * based on the `whereClause` filter, with pagination (`limit` and `offset`), and sorted according to
   * the `sortBy` and `sortOrder` parameters. The resulting users' attributes include their ID, email,
   * status, full name, first name, along with the profile and business team information.
   *
   * @param {Record<string, any>} whereClause - The filtering conditions to apply to the query.
   * @param {number} limit - The maximum number of records to return.
   * @param {number} offset - The number of records to skip for pagination.
   * @param {string} sortBy - The field to sort by.
   * @param {string} sortOrder - The sorting order, either 'ASC' or 'DESC'.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of user objects that match the query criteria.
   */
  async fetchUser(
    whereClause: Record<string, any>,
    limit: number,
    offset: number,
    sortBy: string,
    sortOrder: string
  ) {
    logMessage(`Fetching users with filters: ${JSON.stringify(whereClause)}, limit: ${limit}, offset: ${offset}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);
    const order: any[] = [];
    if (sortBy === "$business_teams.business_teams$") {
      order.push(
        [
          { model: BusinessTeams, as: "business_teams" },
          "business_teams",
          sortOrder,
        ],
        ["first_name", "asc"]
      );
    } else if (sortBy === "$profile.profile_name$") {
      order.push(
        [{ model: Profile, as: "profile" }, "profile_name", sortOrder],
        ["first_name", "asc"]
      );
    } else if (sortBy === "$status.status_name$") {
      order.push(
        [{ model: Status, as: "status" }, "status_name", sortOrder],
        ["first_name", "asc"]
      );
    } else {
      order.push([sortBy, sortOrder]);
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        "rid",
        "email",
        "status_rid",
        "first_name",
        "created_datetime",
        "modified_datetime",
        "azure_id"
      ],
      limit,
      offset,
      order,
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["profile_name", "rid"],
          required: true,
        },
        {
          model: BusinessTeams,
          as: "business_teams",
          attributes: ["business_teams", "rid"],
          required: true,
        },
        {
          model: Status,
          as: "status",
          attributes: ["status_description", "status_name"],
          required: false,
        },
      ],
    });
    return {
      rows,
      count,
    };
  }

  /**
   * Fetches detailed user information based on the provided filters, pagination, and sorting.
   *
   * This method retrieves a list of user details from the database, including the associated user,
   * department, and function group information, based on the `whereClause` filter. Pagination is
   * applied using the `limit` and `offset` parameters, and sorting is done based on the `sortBy`
   * and `sortOrder` parameters.
   *
   * @param {Record<string, any>} whereClause - The filtering conditions to apply to the query.
   * @param {number} limit - The maximum number of records to return.
   * @param {number} offset - The number of records to skip for pagination.
   * @param {string} sortBy - The field to sort by.
   * @param {string} sortOrder - The sorting order, either 'ASC' or 'DESC'.
   *
   * @returns {Promise<Array>} - A promise that resolves to an array of user details objects that match the query criteria.
   */
  async fetchUserDetails(
    whereClause: Record<string, any>,
    limit: number,
    offset: number,
    sortBy: string,
    sortOrder: string
  ) {
    logMessage(`Fetching user details with filters: ${JSON.stringify(whereClause)}, limit: ${limit}, offset: ${offset}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);
    return await UserDetails.findAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          required: true,
        },
        {
          model: Department,
          attributes: ["department_name"],
          required: true,
        },
        {
          model: FunctionGroup,
          attributes: ["function_group_name"],
          required: true,
        },
      ],
    });
  }

  /**
   * Builds a `whereClause` object for filtering database queries based on provided filters and search criteria.
   *
   * This method constructs a `whereClause` object used to filter database records. It supports searching
   * for users by fields such as  `first_name`, `email`, and `business_teams.business_teams`,
   * as well as applying additional filters for specific fields (e.g., `user_name`, `status`, etc.).
   *
   * @param {Record<string, any>} filters - The filtering conditions for specific fields (e.g., user_name, status).
   * @param {string} search - The search term to be used for full text search in various fields.
   *
   * @returns {Record<string, any>} - The constructed `whereClause` object used for filtering database queries.
   */
  buildWhereClause(
    filters: Record<string, any>,
    search: string
  ): Record<string, any> {
    let whereClause: Record<string, any> = {};

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { middle_name: { [Op.iLike]: `%${search}%` } },
          { r_number: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { "$business_teams.business_teams$": { [Op.iLike]: `%${search}%` } },
        ],
      };

      if (Object.keys(whereClause).length > 0) {
        whereClause = {
          [Op.and]: [whereClause, searchCondition],
        };
      } else {
        whereClause = searchCondition;
      }
    }

    const filterFields = [
      { clientField: "username", dbField: "first_name" },
      { clientField: "first_name", dbField: "first_name" },
      { clientField: "last_name", dbField: "last_name" },
      { clientField: "middle_name", dbField: "middle_name" },
      { clientField: "r_number", dbField: "r_number" },
      { clientField: "email", dbField: "email" },
      { clientField: "created_datetime", dbField: "created_datetime" },
      { clientField: "modified_datetime", dbField: "modified_datetime" },
      // Status is handled separately
    ];

    // Process all fields except status
    filterFields.forEach((fieldMapping) => {
      const { clientField, dbField } = fieldMapping;

      if (filters[clientField]) {
        const fieldFilter = filters[clientField];

        if (
          clientField === "created_datetime" ||
          clientField === "modified_datetime"
        ) {
          if (fieldFilter.equals !== undefined) {
            const dateStr = fieldFilter.equals;

            const startOfDay = moment
              .utc(dateStr, "YYYY-MM-DD")
              .startOf("day")
              .toDate();
            const endOfDay = moment
              .utc(dateStr, "YYYY-MM-DD")
              .endOf("day")
              .toDate();

            whereClause[dbField] = {
              [Op.between]: [startOfDay, endOfDay],
            };
            return;
          }

          if (fieldFilter.before !== undefined) {
            whereClause[dbField] = {
              [Op.lt]: this.normalizeDate(fieldFilter.before),
            };
            return;
          }

          if (fieldFilter.after !== undefined) {
            whereClause[dbField] = {
              [Op.gt]: this.normalizeDate(fieldFilter.after),
            };
            return;
          }

          if (
            fieldFilter.between &&
            typeof fieldFilter.between === "object" &&
            fieldFilter.between.from &&
            fieldFilter.between.to
          ) {
            const startDate = moment
              .utc(fieldFilter.between.from, "YYYY-MM-DD")
              .startOf("day")
              .toDate();

            const endDate = moment
              .utc(fieldFilter.between.to, "YYYY-MM-DD")
              .endOf("day")
              .toDate();

            whereClause[dbField] = { [Op.between]: [startDate, endDate] };
            return;
          }

          if (fieldFilter.is_empty === true) {
            whereClause[dbField] = { [Op.or]: [null] };
            return;
          }
        }

        if (fieldFilter.startsWith) {
          whereClause[dbField] = { [Op.iLike]: `${fieldFilter.startsWith}%` };
        } else if (fieldFilter.endWith) {
          whereClause[dbField] = { [Op.iLike]: `%${fieldFilter.endWith}` };
        } else if (fieldFilter.contains) {
          whereClause[dbField] = { [Op.iLike]: `%${fieldFilter.contains}%` };
        } else if (fieldFilter.equals) {
          whereClause[dbField] = Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col(dbField)),
            Sequelize.fn("LOWER", fieldFilter.equals)
          );
        } else if (fieldFilter.not_equals) {
          const value = fieldFilter.not_equals.toLowerCase();
          whereClause[dbField] = Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col(dbField)),
            "!=",
            value
          );
        } else if (typeof fieldFilter === "string") {
          whereClause[dbField] = { [Op.eq]: fieldFilter };
        }
      }
    });

    // Special handling for status field

    if (filters.status) {
      whereClause["$status.status_name$"] = this.getMultiValueFilter(
        filters.status,
        "status.status_name"
      );
      if (Array.isArray(filters.profile)) {
        whereClause["$status.status_name$"] = {
          [Op.in]: filters.status,
        };
      }
    }

    // Handle profile filters
    if (filters.profile) {
      whereClause["$profile.profile_name$"] = this.getMultiValueFilter(
        filters.profile,
        "profile.profile_name"
      );
      if (Array.isArray(filters.profile)) {
        whereClause["$profile.profile_name$"] = {
          [Op.in]: filters.profile,
        };
      }
    }

    // Handle profile filters
    if (filters.role) {
      whereClause["$business_teams.business_teams$"] = this.getMultiValueFilter(
        filters.role,
        "business_teams.business_teams"
      );
      if (Array.isArray(filters.role)) {
        whereClause["$business_teams.business_teams$"] = {
          [Op.in]: filters.role,
        };
      }
    }

    return whereClause;
  }
  normalizeDate(input: string): any | null {
    let parsed = moment.utc(input, "YYYY-MM-DD", true);
    if (!parsed.isValid()) throw new Error("Invalid date");

    const startOfDay = parsed.startOf("day").toDate();
    return startOfDay;
  }
  private getMultiValueFilter(filter: any, fieldName: string): any {
    if (!filter) return null;

    const conditions: any[] = [];
    const colName = fieldName.replace(/\$/g, "");

    // Case-insensitive exact match
    if (typeof filter.equals === "string") {
      conditions.push(
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col(colName)),
          "=",
          filter.equals.toLowerCase()
        )
      );
    }

    // Case-insensitive NOT EQUALS
    if (typeof filter.not_equals === "string") {
      conditions.push(
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col(colName)),
          "!=",
          filter.not_equals.toLowerCase()
        )
      );
    }

    // Case-insensitive IN match
    if (Array.isArray(filter.in) && filter.in.length > 0) {
      conditions.push({
        [Op.or]: filter.in.map((val: string) =>
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col(colName)),
            "=",
            val.toLowerCase()
          )
        ),
      });
    }

    // Match null or empty string
    if (filter.is_empty === true) {
      conditions.push({
        [Op.or]: [
          Sequelize.where(Sequelize.col(colName), { [Op.is]: null }),
          Sequelize.where(Sequelize.col(colName), ""),
        ],
      });
    }

    if (conditions.length === 0) return null;

    return { [Op.and]: conditions };
  }

  /**
   * Retrieves the sorting parameters for database queries based on the provided `sortBy` and `sortOrder`.
   *
   * This method ensures that the `sortBy` field is one of the valid columns, falling back to the `created_datetime`
   * field if it's not valid. It also ensures that the `sortOrder` is either 'ASC' or 'DESC', defaulting to 'DESC'
   * if the provided value is invalid.
   *
   * @param {string} sortBy - The field to sort by. Should be one of the valid columns.
   * @param {string} sortOrder - The sorting order, either 'ASC' (ascending) or 'DESC' (descending).
   *
   * @returns {[string, string]} - An array containing the valid sorting field and the sorting order.
   */
  getSortParameters(sortBy: string, sortOrder: string): [string, string] {
    const validSortColumns = [
      "first_name",
      "last_name",
      "email",
      "status_name",
      "created_datetime",
      "modified_datetime",
      "profile",
      "business_teams",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    if (sortBy === "profile") {
      sortBy = "$profile.profile_name$";
    }

    if (sortBy === "business_teams") {
      sortBy = "$business_teams.business_teams$";
    }
    if (sortBy === "status_name") {
      sortBy = "$status.status_name$";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  async getGeoData(
    countryId: string,
    stateId: string,
    cityId: string,
    orgId: string,
    isConsultantFirm: boolean
  ) {
    const mainDbSequelize = await initSequelize();

    let country: string | null = null;
    let state: string | null = null;
    let city: string | null = null;
    let orgName: string | null = null;

    if (orgId) {
      if (isConsultantFirm) {
        const org = await OrganizationLicenses.findOne({
          attributes: ["firm_name"],
        });
        if (org) {
          orgName = org.firm_name || "";
        }
      } else {
        const [orgNameResult]: any[] = await mainDbSequelize.query(
          `SELECT organisation_name FROM ${MAIN_SCHEMA_NAME}.account WHERE rid = :rid`,
          {
            replacements: { rid: orgId },
            type: "SELECT",
          }
        );
        orgName = orgNameResult?.organisation_name || null;
      }
    }

    if (countryId) {
      const [countryResult]: any[] = await mainDbSequelize.query(
        `SELECT country_name FROM ${MAIN_SCHEMA_NAME}.country WHERE rid = :rid`,
        {
          replacements: { rid: countryId },
          type: "SELECT",
        }
      );
      country = countryResult?.country_name || null;
    }

    if (stateId) {
      const [stateResult]: any[] = await mainDbSequelize.query(
        `SELECT state_name FROM ${MAIN_SCHEMA_NAME}.state WHERE rid = :rid`,
        {
          replacements: { rid: stateId },
          type: "SELECT",
        }
      );
      state = stateResult?.state_name || null;
    }

    if (cityId) {
      const [stateResult]: any[] = await mainDbSequelize.query(
        `SELECT city_name FROM ${MAIN_SCHEMA_NAME}.city WHERE rid = :rid`,
        {
          replacements: { rid: cityId },
          type: "SELECT",
        }
      );
      city = stateResult?.city_name || null;
    }

    return {
      country,
      state,
      city,
      orgName,
    };
  }
 async getAllowedExportFields(userId: string, permission_name: string): Promise<any[]> {
  const userInfo = await User.findOne({
    attributes: ["role_rid", "rid", "profile_rid", "first_name"],
    where: { rid: userId },
  });

  if (!userInfo) {
    return [];
  }

  const sequelize = await initSequelize();

  const [profileFields, userFields] = await Promise.all([
    sequelize.query(
      `
      SELECT pf.field_desc, pf.field_name, pfa.read, pfa.edit
      FROM ${MAIN_SCHEMA_NAME}.profile_fields_access pfa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON pfa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND pfa.profile_id = :profileId
      `,
      {
        replacements: {
          permissionName: permission_name,
          profileId: userInfo.profile_rid,
        },
        type: QueryTypes.SELECT,
      }
    ),
    sequelize.query(
      `
      SELECT pf.field_desc, pf.field_name, ufa.read, ufa.edit
      FROM ${MAIN_SCHEMA_NAME}.user_fields_access ufa
      JOIN ${MAIN_SCHEMA_NAME}.permission_fields pf ON ufa.permission_field_id = pf.rid
      JOIN ${MAIN_SCHEMA_NAME}.module_permission mp ON pf.module_permission_id = mp.rid
      WHERE mp.permission_name = :permissionName
        AND ufa.user_id = :userId
      `,
      {
        replacements: {
          permissionName: permission_name,
          userId,
        },
        type: QueryTypes.SELECT,
      }
    ),
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
        read:pf.read ? true : userPerm?.read === true,
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


  /**
   * Retrieves a  list of users based on search and filter criteria  for exporting the data with,
   *sorting parameters. The method fetches user data either
   * from the `ENV_TRD365` organization or from the `ENV_EA` organization
   * using different fetch strategies.
   *
   * @param {string} search - The search query to filter users by.
   * @param {Record<string, string>} filters - The filters applied to user data.
   * @param {string} sortBy - The field by which to sort the results.
   * @param {string} sortOrder - The order of sorting ('ASC' or 'DESC').
   * @param {string} organization - The organization type used to determine the fetch method.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { users: any } }>}
   * A promise that resolves to an object containing the status, message,
   * and user data.
   */
  async exportUsers(
    search: string,
    filters: Record<string, string>,
    sortBy: string,
    sortOrder: string,
    organization: string,
    timezone: string,
    userId:string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { users: any; count: number };
  }> {
    try {
      let users = null;
      let count: number = 0;
      logMessage(`Export Users - Search: ${search}, Filters: ${JSON.stringify(
        filters
      )}, SortBy: ${sortBy}, SortOrder: ${sortOrder}, Organization: ${organization}`);
      const whereClause = this.buildWhereClause(filters, search);

      logMessage(`Export Users - WhereClause: ${JSON.stringify(whereClause)}`);

      const [finalSortBy, finalSortOrder] = this.getSortParameters(
        sortBy,
        sortOrder
      );

      if (organization == constants.ENV_TRD365) {
        const { rows, count: totalCount } = await this.fetchUserForExport(
          whereClause,
          finalSortBy,
          finalSortOrder
        );
        users = rows;
        count = totalCount;
      } else {
        users = await this.fetchUserDetailsForExport(
          whereClause,
          finalSortBy,
          finalSortOrder
        );
      }

      const rawResult = users || [];
      const cleanedUsers = rawResult.map((user) => {
        if (typeof user.get === "function") {
          return user.get({ plain: true });
        } else {
          return user.dataValues;
        }
      });
      const allowedFieldsForExport = await this.getAllowedExportFields(userId,"user_view_edit");
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
      users = cleanedUsers.map((user: any) => {
      const exportData: Record<string, string> = {};
      const flatUser = {
        ...user,
        profile_name: user.profile?.profile_name,
        business_teams: user.business_teams?.business_teams,
        status_name: user.status?.status_name,
      };
      const fieldMap: Record<string, string> = {
        first_name: flatUser.first_name || "-",
        email: flatUser.email || "-",
        profile_rid: flatUser.profile_name || "-",
        business_teams: flatUser.business_teams || "-",
        created_datetime: flatUser.created_datetime
            ? timezone && isValidTimezone(timezone)
            ? moment(flatUser.created_datetime).tz(timezone).format("YYYY-MM-DD, hh:mm:ss A")
          : moment(flatUser.created_datetime).format("YYYY-MM-DD, hh:mm:ss A")
          : "-",
        modified_datetime: flatUser.modified_datetime
        ? timezone && isValidTimezone(timezone)
        ? moment(flatUser.modified_datetime).tz(timezone).format("YYYY-MM-DD, hh:mm:ss A")
        : moment(flatUser.modified_datetime).format("YYYY-MM-DD, hh:mm:ss A")
        : "-",
        status_rid: flatUser.status_name || "-",
  };

  // Label mapping for output
  const labelMap: Record<string, string> = {
    first_name: "Username",
    email: "Email",
    profile_rid: "Profile",
    business_teams: "Role",
    created_datetime: "Created On",
    modified_datetime: "Updated On",
    status_rid: "Status",
  };

  for (const [field, value] of Object.entries(fieldMap)) {
    if (allowedFieldSet.has(field)) {
      exportData[labelMap[field]] = value;
    }
  }

  return exportData;
});


  return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          users,
          count,
        },
      };
    } catch (err) {
      return this.throwServiceError(err as Error);
    }
  }

  async fetchUserForExport(
    whereClause: Record<string, any>,
    sortBy: string,
    sortOrder: string
  ) {
    const order: any[] = [];

    if (sortBy === "$business_teams.business_teams$") {
      order.push(
        [
          { model: BusinessTeams, as: "business_teams" },
          "business_teams",
          sortOrder,
        ],
        ["first_name", "asc"]
      );
    } else if (sortBy === "$profile.profile_name$") {
      order.push(
        [{ model: Profile, as: "profile" }, "profile_name", sortOrder],
        ["first_name", "asc"]
      );
    } else if (sortBy === "$status.status_name$") {
      order.push(
        [{ model: Status, as: "status" }, "status_name", sortOrder],
        ["first_name", "asc"]
      );
    } else {
      order.push([sortBy, sortOrder]);
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: [
        "rid",
        "email",
        "status_rid",
        "first_name",
        "created_datetime",
        "modified_datetime",
      ],
      order,
      include: [
        {
          model: Profile,
          as: "profile",
          attributes: ["profile_name"],
          required: true,
        },
        {
          model: BusinessTeams,
          as: "business_teams",
          attributes: ["business_teams"],
          required: true,
        },
        {
          model: Status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
      ],
    });
    return {
      rows,
      count,
    };
  }

  async fetchUserDetailsForExport(
    whereClause: Record<string, any>,
    sortBy: string,
    sortOrder: string
  ) {
    return await UserDetails.findAll({
      where: whereClause,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          required: true,
        },
        {
          model: Department,
          attributes: ["department_name"],
          required: true,
        },
        {
          model: FunctionGroup,
          attributes: ["function_group_name"],
          required: true,
        },
        {
          model: BusinessTeams,
          as: "business_teams",
          attributes: ["business_teams"],
          required: true,
        },
      ],
    });
  }

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

  /**
   * Fetches user names for user IDs from the main database
   * @param userIds - Object containing user IDs (created_by, modified_by)
   * @returns Promise resolving to object with user names
   */
  private async fetchUserNames(userIds: {
    created_by?: string;
    modified_by?: string;
  }): Promise<{ created_by_name: string; modified_by_name: string }> {
    const result = {
      created_by_name: "",
      modified_by_name: "",
    };

    try {
      const sequelize = await initSequelize();

      // Fetch created_by user name if ID exists
      if (userIds.created_by) {
        const [createdByUser] = await sequelize.query(
          `SELECT first_name || ' ' || last_name AS full_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: userIds.created_by },
            type: "SELECT",
          }
        );

        if (createdByUser) {
          result.created_by_name = (createdByUser as any).full_name;
        }
      }

      // Fetch modified_by user name if ID exists
      if (userIds.modified_by) {
        const [modifiedByUser] = await sequelize.query(
          `SELECT first_name || ' ' || last_name AS full_name FROM ${MAIN_SCHEMA_NAME}."user" WHERE rid = :userId LIMIT 1`,
          {
            replacements: { userId: userIds.modified_by },
            type: "SELECT",
          }
        );

        if (modifiedByUser) {
          result.modified_by_name = (modifiedByUser as any).full_name;
        }
      }
    } catch (error) {
      errorLog("Error fetching user names:", (error as Error).message);
    
    }

    return result;
  }

  /**
   * Retrieves the role information for a user by their Azure ID.
   *
   * This method finds a user by their Azure ID and returns the role ID (`role_rid`) and associated user role
   * from the `business_teams` model. If no user or associated `business_teams` are found, it returns an error message.
   *
   * @param {string} azureId - The Azure ID of the user whose role is to be retrieved.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { rid: string; user_role: string } | null }>}
   */
  async fetchUserExtendedpermission(userId: string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      rid: string;
      user_role: string;
      user_id: string;
      user_name: string;
      permissions: any[];
    } | null;
  }> {
    try {
      const roles = await User.findOne({
        attributes: ["role_rid", "rid", "profile_rid", "first_name"],
        where: { rid: userId },
        include: [
          {
            model: BusinessTeams,
            as: "business_teams",
            required: true,
            attributes: ["business_teams"],
          },
        ],
      });

      if (!roles || !roles.business_teams) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          data: null,
        };
      }

      // Call getAllUserPermission here
      const permissions = await this.getAllUserExtendedPermission(
        roles.rid,
        roles.profile_rid || ""
      );

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          rid: roles.role_rid || "",
          user_role: roles.business_teams?.business_teams,
          user_id: roles.rid,
          user_name: roles.first_name,
          permissions,
        },
      };
    } catch (err) {
      errorLog("Error fetching user extended permissions:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }

  async fetchUserExtendedpermissionForUserView(userId: string): Promise<{
  statusCode: number;
  message: string;
  errorMessage?: string;
  data?: {
    rid: string;
    user_role: string;
    user_id: string;
    user_name: string;
    permissions: any[];
  } | null;
}> {
  try {
    const roles = await User.findOne({
      attributes: ["role_rid", "rid", "profile_rid", "first_name"],
      where: { rid: userId },
      include: [
        {
          model: BusinessTeams,
          as: "business_teams",
          required: true,
          attributes: ["business_teams"],
        },
      ],
    });
   

    if (!roles || !roles.business_teams) {
      return {
        statusCode: constants.NOT_FOUND,
        message: constants.NOT_FOUND_MESSAGE,
        data: null,
      };
    }

    // Call getAllUserPermission here
    const permissions = await this.getAllUserExtendedPermissionForView(
      roles.rid,
      roles.profile_rid || ""
    );

    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        rid: roles.role_rid || "",
        user_role: roles.business_teams?.business_teams,
        user_id: roles.rid,
        user_name: roles.first_name,
        permissions,
      },
    };
  } catch (err) {
    errorLog("Error fetching user extended permissions:", (err as Error).message);
    return this.throwServiceError(err as Error);
  }
}

  

  // Consolidate all permissions for a user
  async getAllUserExtendedPermission(userId: string, profileId: string) {
    logMessage(`Fetching user extended permissions for userId: ${userId}, profileId: ${profileId}`);

  const [profilePermissions, userPermissions] = await Promise.all([
    this.getProfilePermission(profileId,true),
    this.getUserPermission(userId)
  ]);

    // Create map of user permissions by key for quick lookup
    const userPermissionMap = new Map<string, any>();
    userPermissions.forEach((p) =>
      userPermissionMap.set(getPermissionKey(p), p)
    );

    // Result array for merged permissions
    const mergedPermissions: any[] = [];

    // Merge profilePermissions with userPermissions overrides
    for (const profilePerm of profilePermissions) {
      const key = getPermissionKey(profilePerm);
      const userPerm = userPermissionMap.get(key);

      if (profilePerm.type === "field") {
        // For field permissions, merge read/edit and extended flags
        mergedPermissions.push({
          ...profilePerm,
          read: profilePerm.read ? true : userPerm?.read === true,
          edit: profilePerm.edit ? true : userPerm?.edit === true,
          hasReadExtendedPermsission: profilePerm.read ? false : true,
          hasEditExtendedPermsission: profilePerm.edit ? false : true,
        });
      } else {
        // For other types (menu, module, etc.)
        mergedPermissions.push({
          ...profilePerm,
          is_enabled: profilePerm.is_enabled
            ? true
            : userPerm?.is_enabled === true,
          has_extended_permission: profilePerm.is_enabled ? false : true,
        });
      }

      // Remove merged user permission from map to track leftover user-only permissions
      if (userPerm) userPermissionMap.delete(key);
    }

    // Add remaining user permissions that weren't in profilePermissions (user-only perms)
    for (const userPerm of userPermissionMap.values()) {
      if (userPerm.type === "field") {
        mergedPermissions.push({
          ...userPerm,
          hasReadExtendedPermsission: false,
          hasEditExtendedPermsission: false,
        });
      } else {
        mergedPermissions.push({
          ...userPerm,
          has_extended_permission: false,
        });
      }
    }

    return mergedPermissions;
  }

   async getAllUserExtendedPermissionForView(userId: string, profileId: string) {
   logMessage(`Fetching user extended permissions for edit view userId: ${userId}, profileId: ${profileId}`);

    const [ userPermissions] = await Promise.all([
      this.getUserPermission(userId)
    ]);

    // Create map of user permissions by key for quick lookup
    const userPermissionMap = new Map<string, any>();
    userPermissions.forEach((p) =>
      userPermissionMap.set(getPermissionKey(p), p)
    );

    return userPermissions;
  }

  /**
   * Retrieves a list of all profiles from the `Profile` model.
   *
   * This method fetches all the available profiles from the database and returns them in the response.
   * If the fetch is successful, it returns the profiles in the `data` field of the response.
   *
   * @returns {Promise<{ statusCode: string, message: string, data: { profiles: any[] } }>}
   * A promise that resolves to an object containing the status, message, and the list of profiles.
   */
  async exportUserprofiles(profileId: string,userId:string): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { exportProfiles: any };
  }> {
    try {
      const workbook = new ExcelJS.Workbook();
      const headerSheet = workbook.addWorksheet("Headers");
      const allowedFieldsForExport = await this.getAllowedExportFields(userId,"profile_view_edit");
      const allowedFieldSet = new Set<string>();
      for (const field of allowedFieldsForExport) {
        if (field.read) {
          allowedFieldSet.add(field.field_name);
        }
      }
      const labelMap: Record<string, string> = {
        profile_name: "Profile Name",
        profile_description: "Profile Description",
        created_datetime: "Created On",
        created_by: "Created By",
      };
      const headers: string[] = [];

      for (const field of Object.keys(labelMap)) {
        if (allowedFieldSet.has(field)) {
          headers.push(labelMap[field]);
        }
      }

      headerSheet.addRow(headers);
      const profile = await Profile.findByPk(profileId, {
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["first_name", "last_name"],
            required: false,
          },
        ],
      });

      if (profile) {
        const createdByName = profile.creator
          ? `${profile.creator.first_name} ${profile.creator.last_name}`
          : "";
        const createdDate = profile.created_datetime
          ? new Date(profile.created_datetime).toISOString().slice(0, 10)
          : "";
        const fieldsToExport = Object.keys(labelMap).filter(field =>
          allowedFieldSet.has(field)
        );

        // Add dynamic headers
        const rowData: any[] = [];
        for (const field of fieldsToExport) {
          if (field === "profile_name") {
            rowData.push(profile.profile_name || "");
          } else if (field === "profile_description") {
            rowData.push(profile.profile_description || "");
          } else if (field === "created_datetime") {
            rowData.push(createdDate);
          } else if (field === "created_by") {
            rowData.push(createdByName);
          }
        }
        headerSheet.addRow(rowData); 
       
      }
      const sheet = workbook.addWorksheet("Menu");

      const menuheaders = ["Menu", "Is Selected"];

      const profileData = await ProfileMenuAccess.findAll({
        where: { profile_id: profileId },
        include: [
          {
            model: Menu,
            as: "menu",
            attributes: ["menu_name", "menu_desc"],
            required: false,
          },
        ],
        order: [[{ model: Menu, as: "menu" }, "menu_name", "ASC"]],
      });
      sheet.addRow(menuheaders);

      // Add rows
      if (profileData.length > 0) {
        profileData.forEach((entry) => {
          const desc = (entry as any).menu?.menu_desc;
          if (desc) {
            const isEnabled = entry.is_enabled ? "Enabled" : "Disabled";
            sheet.addRow([desc, isEnabled]);
          }
        });
      }

      const moduleheaders = ["Menu", "Module", "Is Selected"];
      const moduleSheet = workbook.addWorksheet("Module");
      moduleSheet.addRow(moduleheaders);

      const profileModuleData = await ProfileModuleAccess.findAll({
        where: { profile_id: profileId },
        include: [
          {
            model: MenuModule,
            as: "menu_module",
            attributes: ["module_name", "module_desc", "menu_id"],
            required: false,
            include: [
              {
                model: Menu,
                as: "menu",
                attributes: ["menu_desc"], // adjust according to your menu model column
                required: false,
              },
            ],
          },
        ],
      });

      if (profileModuleData.length > 0) {
        profileModuleData.forEach((entry) => {
          const menuName = (entry as any).menu_module?.menu?.menu_desc;
          const moduleName = (entry as any).menu_module?.module_desc;
          if (menuName) {
            const isEnabled = entry.is_enabled ? "Enabled" : "Disabled";
            moduleSheet.addRow([menuName, moduleName, isEnabled]);
          }
        });
      }
      const pemissionheaders = ["Module", "Permission", "Is Selected"];
      const permissionSheet = workbook.addWorksheet("Permission");
      permissionSheet.addRow(pemissionheaders);

      const ModulePermissionData = await ProfilePermissionAccess.findAll({
        where: { profile_id: profileId },
        include: [
          {
            model: ModulePermission,
            as: "module_permission",
            attributes: [
              "permission_name",
              "permission_desc",
              "menu_module_id",
            ],
            required: false,
            include: [
              {
                model: MenuModule,
                as: "menu_module",
                attributes: ["module_desc"], // adjust according to your menu model column
                required: false,
              },
            ],
          },
        ],
      });
      if (ModulePermissionData.length > 0) {
        ModulePermissionData.forEach((entry) => {
          const moduleName = (entry as any).module_permission?.menu_module
            ?.module_desc;
          const permissionName = (entry as any).module_permission
            ?.permission_desc;
          if (moduleName) {
            const isEnabled = entry.is_enabled ? "Enabled" : "Disabled";
            permissionSheet.addRow([moduleName, permissionName, isEnabled]);
          }
        });
      }
      const fieldheaders = ["Permission", "Field", "View", "Edit"];
      const fieldSheet = workbook.addWorksheet("Fields");
      fieldSheet.addRow(fieldheaders);
      const fieldData = await ProfileFieldsAccess.findAll({
        where: { profile_id: profileId },
        include: [
          {
            model: PermissionField,
            as: "permission_field",
            attributes: ["field_name", "field_desc", "module_permission_id"],
            required: false,
            include: [
              {
                model: ModulePermission,
                as: "module_permission",
                attributes: ["permission_desc"], // adjust according to your menu model column
                required: false,
              },
            ],
          },
        ],
      });
      if (fieldData.length > 0) {
        fieldData.forEach((entry) => {
          const moduleName = (entry as any).permission_field?.module_permission
            ?.permission_desc;
          const permissionName = (entry as any).permission_field?.field_desc;
          if (moduleName) {
            const view = entry.read ? "Enabled" : "Disabled";
            const edit = entry.edit ? "Enabled" : "Disabled";
            fieldSheet.addRow([moduleName, permissionName, view, edit]);
          }
        });
      }
      //await workbook.xlsx.writeFile('Profile_Permissions.xlsx');
      const buffer = await workbook.xlsx.writeBuffer();
      logMessage("Excel file generated successfully.");
      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          exportProfiles: Buffer.from(buffer).toString("base64"),
        },
      };
    } catch (err) {
      errorLog("Error exporting user profiles:", (err as Error).message);
      return this.throwServiceError(err as Error);
    }
  }
}

function isValidTimezone(tz: string) {
  return moment.tz.names().includes(tz);
}

// Helper function to calculate unique key based on type
function getPermissionKey(permission: any): string {
  switch (permission.type) {
    case "field":
      return `field::${permission.field_id}`;
    case "module":
      return `module::${permission.module_id}`;
    case "menu":
      return `menu::${permission.menu_id}`;
    case "permission":
      return `permission::${permission.permission_id}`;
    default:
      return `${permission.type}::${
        permission.name || permission.permission_id
      }`;
  }
}
export default UserService;
