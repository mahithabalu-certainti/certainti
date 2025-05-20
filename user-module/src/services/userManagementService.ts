import { constants } from "../utils/constant";
import { models } from "../models/index";
const UserService = require('../services/userService').default;
const userService = new UserService();
import { ProfileTimeline } from "../models/profileTimelineModel";
import { UserExtendedPermissionTimeline } from "../models/userExtendedPermissionTimelineModel";
import { Op, IndexHints } from "sequelize";
import { initSequelize } from "../config/dataSource";
import { UserFieldsAccessHistory } from "../models/userFieldsAccessHistoryModel";
import { UserPermissionAccessHistory } from "../models/userPermissionAccessHistoryModel";
import { UserModuleAccessHistory } from "../models/userModuleAccessHistoryModel";
import { UserMenuAccessHistory } from "../models/userMenuAccessHistoryModel";

const {
  Profile, ProfileMenuAccess, Menu, ProfileModuleAccess, MenuModule, ProfilePermissionAccess, ModulePermission, User,
  UserMenuAccess, UserModuleAccess, UserPermissionAccess, PermissionField, ProfileFieldsAccess, UserFieldsAccess, ProfileMenuAccessHistory, ProfileModuleAccessHistory, ProfilePermissionAccessHistory, ProfileFieldsAccessHistory, ProfileHistory
} = models;

class UserManagementService {
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

  /**
   * Creates a new profile in the database
   * 
   * @param {Object} profileData - The profile data to create
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<Object>} - Response object with status and message
   */
  async createProfile(
    profileData: {
      source_profile_id: string;
      profile_name: string;
      profile_description?: string;
      profile_type: string;
    },
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      profile?: any;
      profile_id?: string;
      source_profile_id?:string,
      profile_number?: string;
      privileges?: any[];
    };
  }> {
    try {
      const { source_profile_id, profile_name, profile_description, profile_type } = profileData;

      // Check if profile name already exists
      const existingProfile = await Profile.findOne({
        where: {
          profile_name: profile_name
        }
      });

      if (existingProfile) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: `Profile name '${profile_name}' already exists`
        };
      }

      // Create the profile
      const profile = await Profile.create({
        profile_name: profile_name,
        profile_description: profile_description || "",
        profile_type: profile_type,
        profile_status: "active",
        created_by: userId,
        modified_by: userId
      });
      const cloneSuccess = await this.profileClone({
        profileId: profile.rid,
        source_profile_id
      }, userId);

      // Record the profile creation event with appropriate status
      await this.recordProfileEvent(
        profile.rid,
        "create",
        cloneSuccess ? "success" : "failure",
        userId
      );

      if (!cloneSuccess) {
        // If cloning failed but profile was created
        return {
          statusCode: constants.FAILED,
          message: "Profile created but cloning failed",
          errorMessage: `Profile ${profile.rid} was created but cloning from ${source_profile_id} failed`,
          data: {
            profile_id: profile.rid,
            profile_number: profile.r_number
          }
        };
      } else {
        const privileges = await userService.getProfilePermission(profile.rid);
        return {
          statusCode: constants.SUCCESS,
          message: constants.SUCCESS_MESSAGE,
          data: {
            profile_id: profile.rid,
            profile_number: profile.r_number,
            source_profile_id:source_profile_id,
            privileges
          }
        };
      }
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
 * Records a profile event in the profile_timeline table
 * 
 * @param {string} profileId - The ID of the profile
 * @param {string} eventName - The name of the event (e.g., "create")
 * @param {string} eventStatus - The status of the event (e.g., "success" or "failure")
 * @param {string} userId - The ID of the user who performed the action
 * @returns {Promise<boolean>} - Returns true if recording was successful
 */
  private async recordProfileEvent(
    profileId: string,
    eventName: string,
    eventStatus: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Create timeline entry
      await ProfileTimeline.create({
        profile_rid: profileId,
        event_name: eventName,
        event_status: eventStatus,
        event_datetime: new Date(),
        modified_by: userId
      });

      return true;
    } catch (error) {
      console.error('Error recording profile event:', error);
      return false;
    }
  }

    /**
 * Records a profile event in the profile_timeline table
 * 
 * @param {string} profileId - The ID of the profile
 * @param {string} eventName - The name of the event (e.g., "create")
 * @param {string} eventStatus - The status of the event (e.g., "success" or "failure")
 * @param {string} userId - The ID of the user who performed the action
 * @returns {Promise<boolean>} - Returns true if recording was successful
 */
  private async recordUserExtendedProfileEvent(
    userId: string,
    profile_rid:string,
    eventName: string,
    eventStatus: string,
    loggedInUser: string
  ): Promise<boolean> {
    try {
      // Create timeline entry
      await UserExtendedPermissionTimeline.create({
        user_rid: userId,
        profile_rid: profile_rid,
        event_name: eventName,
        event_status: eventStatus,
        event_datetime: new Date(),
        modified_by: loggedInUser
      });

      return true;
    } catch (error) {
      console.error('Error recording profile event:', error);
      return false;
    }
  }


  /**
   * Clones profile data from an existing profile to a new profile
   * 
   * @param {Object} profileData - The profile data for the new profile
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<boolean>} - Returns true if cloning was successful
   */
  private async profileClone(
    profileData: {
      profileId: string;
      source_profile_id?: string;
    },
    userId: string
  ): Promise<boolean> {
    try {
      const { profileId, source_profile_id } = profileData;

      // Use Promise.all to run these queries in parallel for better performance
      const [menuAccess, moduleAccess, permissionAccess, fieldAccess] = await Promise.all([
        // Get menu access records
        ProfileMenuAccess.findAll({
          where: { profile_id: source_profile_id },
          raw: true
        }),

        // Get module access records
        ProfileModuleAccess.findAll({
          where: { profile_id: source_profile_id },
          raw: true
        }),

        // Get permission access records
        ProfilePermissionAccess.findAll({
          where: { profile_id: source_profile_id },
          raw: true,
          indexHints: [{ type: IndexHints.USE, values: ['idx_profile_permission_access_profile_id'] }]
        }),

        // Get field access records - using index for better performance
        ProfileFieldsAccess.findAll({
          where: { profile_id: source_profile_id },
          raw: true,
          indexHints: [{ type: IndexHints.USE, values: ['idx_profile_fields_access_profile_id'] }]

        })
      ]);

      // Prepare new records for bulk creation
      const newMenuAccess = menuAccess.map(item => ({
        profile_id: profileId,
        menu_id: item.menu_id,
        is_enabled: item.is_enabled,
        created_by: userId,
        modified_by: userId,
      }));

      const newModuleAccess = moduleAccess.map(item => ({
        profile_id: profileId,
        menu_module_id: item.menu_module_id,
        is_enabled: item.is_enabled,
        created_by: userId,
        modified_by: userId,
      }));

      const newPermissionAccess = permissionAccess.map(item => ({
        profile_id: profileId,
        module_permission_id: item.module_permission_id,
        is_enabled: item.is_enabled,
        created_by: userId,
        modified_by: userId,
      }));

      const newFieldAccess = fieldAccess.map(item => ({
        profile_id: profileId,
        permission_field_id: item.permission_field_id,
        read: item.read,
        edit: item.edit,
        created_by: userId,
        modified_by: userId,
      }));

      // Use Promise.all for parallel bulk creation to improve performance and capture results
      const [createdMenuAccess, createdModuleAccess, createdPermissionAccess, createdFieldAccess] = await Promise.all([
        // Only perform bulkCreate if there are records to create
        newMenuAccess.length > 0 ?
          ProfileMenuAccess.bulkCreate(newMenuAccess, {
            fields: ['rid', 'profile_id', 'menu_id', 'is_enabled', 'created_by', 'modified_by', 'created_datetime', 'modified_datetime'],
            updateOnDuplicate: ['modified_by', 'modified_datetime'],
            returning: true // Ensure all fields are returned
          }) : Promise.resolve([]),

        newModuleAccess.length > 0 ?
          ProfileModuleAccess.bulkCreate(newModuleAccess, {
            fields: ['rid', 'profile_id', 'menu_module_id', 'is_enabled', 'created_by', 'modified_by', 'created_datetime', 'modified_datetime'],
            updateOnDuplicate: ['modified_by', 'modified_datetime'],
            returning: true // Ensure all fields are returned
          }) : Promise.resolve([]),

        newPermissionAccess.length > 0 ?
          ProfilePermissionAccess.bulkCreate(newPermissionAccess, {
            fields: ['rid', 'profile_id', 'module_permission_id', 'is_enabled', 'created_by', 'modified_by', 'created_datetime', 'modified_datetime'],
            updateOnDuplicate: ['modified_by', 'modified_datetime'],
            returning: true // Ensure all fields are returned
          }) : Promise.resolve([]),

        newFieldAccess.length > 0 ?
          ProfileFieldsAccess.bulkCreate(newFieldAccess, {
            fields: ['rid', 'profile_id', 'permission_field_id', 'read', 'edit', 'created_by', 'modified_by', 'created_datetime', 'modified_datetime'],
            updateOnDuplicate: ['modified_by', 'modified_datetime'],
            returning: true // Ensure all fields are returned
          }) : Promise.resolve([])
      ]);

      // Now you have access to all created records
      console.log(`Created ${createdMenuAccess.length} menu access records`);
      console.log(`menu access data => ${createdMenuAccess}`);
      console.log(`Created ${createdModuleAccess.length} module access records`);
      console.log(`Created ${createdPermissionAccess.length} permission access records`);
      console.log(`Created ${createdFieldAccess.length} field access records`);

      return true;
    } catch (error) {
      console.error('Error in profileClone:', error);
      return false;
    }
  }

  /**
 * Retrieves profile permissions based on profile ID and optional type and ID filters
 * 
 * @param {Object} params - Parameters for filtering permissions
 * @param {string} params.profileId - The profile ID to retrieve permissions for
 * @param {string} [params.type] - Optional filter type (menu, module, permission)
 * @param {string} [params.id] - Optional ID corresponding to the filter type
 * @returns {Promise<Object>} - Response object with permissions data
 */
  async getProfilePermissions(
    params: {
      profileId: string;
      type?: string;
      id?: string;
    }
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      profile_id: string;
      profile_number?: string;
      privileges?: any[];
    };
  }> {
    try {
      const { profileId, type, id } = params;

      // Verify profile exists
      const profile = await Profile.findByPk(profileId);
      if (!profile) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: `Profile with ID ${profileId} not found`
        };
      }
      // Get filtered permissions based on provided parameters
      let privileges = [];
      if (type === 'menu' && !id) {
        // Case 1: If menu type is provided and id not provided, get all menus
        privileges = await this.getAllMenusForProfile(profileId);
      }
      else if (type === 'permission' && id) {
        // Case 2: If permission type is provided, get only fields for that permission
        privileges = await this.getFieldsForPermission(profileId, id);
      } else if (type === 'module' && id) {
        // Case 3: If module type is provided, get permissions and fields for that module
        privileges = await this.getPermissionsForModule(profileId, id);
      } else if (type === 'menu' && id) {
        // Case 4: If menu type is provided, get modules, permissions, and fields for that menu
        privileges = await this.getModulesForMenu(profileId, id);
      } else {
        // Case 5: If no filters, get all permissions for the profile
        privileges = await userService.getProfilePermission(profileId);
      }

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profile_id: profile.rid,
          privileges
        }
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Gets fields for a specific permission
   */
  private async getFieldsForPermission(profileId: string, permissionId: string): Promise<any[]> {
    const fieldAccess = await ProfileFieldsAccess.findAll({
      where: {
        profile_id: profileId,
        '$permission_field.module_permission_id$': permissionId
      },
      include: [{
        model: PermissionField,
        as: "permission_field",
        required: true
      }],
      indexHints: [{ type: IndexHints.USE, values: ['idx_profile_fields_access_profile_id'] }]
    });

    return fieldAccess.map(fa => {
      const faWithField = fa as any;
      return {
        rid: faWithField.rid,
        type: "field",
        field_id: faWithField.permission_field.rid,
        permission_id: faWithField.permission_field.module_permission_id,
        name: faWithField.permission_field.field_name,
        desc: faWithField.permission_field.field_desc,
        read: faWithField.read,
        edit: faWithField.edit
      };
    });
  }

  /**
   * Gets permissions and fields for a specific module
   */
  private async getPermissionsForModule(profileId: string, moduleId: string): Promise<any[]> {
    const privileges = [];

    // Get permission access
    const permissionAccess = await ProfilePermissionAccess.findAll({
      where: {
        profile_id: profileId,
        '$module_permission.menu_module_id$': moduleId
      },
      include: [{
        model: ModulePermission,
        as: "module_permission",
        required: true
      }],
      indexHints: [{ type: IndexHints.USE, values: ['idx_profile_permission_access_profile_id'] }]
    });

    // Add permissions to result
    for (const pa of permissionAccess) {
      const paWithPermission = pa as any;
      privileges.push({
        rid: paWithPermission.rid,
        type: "permission",
        permission_id: paWithPermission.module_permission.rid,
        module_id: paWithPermission.module_permission.menu_module_id,
        name: paWithPermission.module_permission.permission_name,
        desc: paWithPermission.module_permission.permission_desc,
        is_field_available: paWithPermission.module_permission.is_field_available,
        is_enabled: paWithPermission.is_enabled
      });
    }

    return privileges;
  }

  
    /**
   * Gets  all menus for a profile
   */
  private async getAllMenusForProfile(profileId: string): Promise<any[]> {
    const privileges = [];

    // Get module access
    const menuAccess = await ProfileMenuAccess.findAll({
      where: {
        profile_id: profileId
      }
    });

    // Add modules to result
    for (const ma of menuAccess) {
      const menu = ma as any;
      console.log(menu.rid)
      privileges.push({
        rid: menu.rid,
        type: "menu",
        menu_id: menu.menu_id,
        name: menu.menu_name,
        desc: menu.menu_desc,
        is_enabled: menu.is_enabled
      });
    }

    return privileges;
  }

  /**
   * Gets modules, permissions, and fields for a specific menu
   */
  private async getModulesForMenu(profileId: string, menuId: string): Promise<any[]> {
    const privileges = [];

    // Get module access
    const moduleAccess = await ProfileModuleAccess.findAll({
      where: {
        profile_id: profileId,
        '$menu_module.menu_id$': menuId
      },
      include: [{
        model: MenuModule,
        as: "menu_module",
        required: true
      }]
    });

    // Add modules to result
    for (const ma of moduleAccess) {
      const maWithModule = ma as any;
      privileges.push({
        rid: maWithModule.rid,
        type: "module",
        module_id: maWithModule.menu_module.rid,
        menu_id: maWithModule.menu_module.menu_id,
        name: maWithModule.menu_module.module_name,
        desc: maWithModule.menu_module.module_desc,
        is_enabled: maWithModule.is_enabled
      });
    }

    return privileges;
  }

  // ... existing code ...

  /**
   * Retrieves a paginated, filtered, and sorted list of user profiles
   * 
   * @param {number} page - The page number for pagination
   * @param {number} limit - The number of items per page
   * @param {Record<string, any>} filters - Optional filters to apply
   * @param {string} sortBy - Optional field to sort by
   * @param {string} sortOrder - Optional sort direction ('asc' or 'desc')
   * @returns {Promise<ApiResponse>} - Response with paginated profiles data
   */
  async profilesList(
    page: number = 1,
    limit: number = 10,
    filters: Record<string, any> = {},
    sortBy: string = "created_datetime",
    sortOrder: string = "ASC"
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      profiles: any[];
      count: number;
    };
  }> {
    try {
      // Calculate pagination offset
      const offset = (page - 1) * limit;

      // Get validated sort parameters
      const [finalSortBy, finalSortOrder] = this.getSortParameters(sortBy, sortOrder);

      // Build where clause for filtering
      const { whereClause, includeClause } = this.buildWhereClause(filters);

      // Get total count for pagination
      const totalCount = await Profile.count({
        where: whereClause,
        include: includeClause,
        distinct: true  // Add this line to handle LEFT JOINs correctly
      });

      // Prepare order array based on sort field
      let orderArray;
      if (finalSortBy === 'created_by') {
        orderArray = [
          [{ model: User, as: 'creator' }, 'first_name', finalSortOrder]
        ] as any; // Type assertion to avoid TypeScript errors
      } else {
        orderArray = [[finalSortBy, finalSortOrder]];
      }
      // Get profiles with pagination, filtering and sorting
      const profiles = await Profile.findAll({
        where: whereClause,
        order: orderArray,
        limit,
        offset,
        attributes: [
          'rid',
          'r_number',
          'profile_name',
          'profile_description',
          'profile_type',
          'profile_status',
          'created_datetime',
          'modified_datetime',
          'created_by',
          'modified_by'
        ],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['first_name','last_name'],
            required: includeClause.find(clause => clause.as === 'creator')?.required ?? false
          },
          {
            model: User,
            as: 'modifier',
            attributes: ['first_name','last_name'],
            required: false
          }
        ]
      });

      // Transform the results to replace user IDs with usernames
      const transformedProfiles = profiles.map(profile => {
        const plainProfile = profile.get({ plain: true });

        // Only use creator.first_name if it exists and doesn't conflict with filters
        const createdByName = plainProfile.creator ?  `${plainProfile.creator.first_name || ''} ${plainProfile.creator.last_name || ''}`.trim() : null;
        const modifiedByName = plainProfile.modifier ?  `${plainProfile.modifier.first_name || ''} ${plainProfile.modifier.last_name || ''}`.trim() : null;

        return {
          ...plainProfile,
          created_by: createdByName,
          modified_by: modifiedByName,
          creator: undefined,  // Remove the nested creator object
          modifier: undefined  // Remove the nested modifier object
        };
      });

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profiles: transformedProfiles,
          count: totalCount
        }
      };
    } catch (error) {
      return this.throwServiceError(error as Error);
    }
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
      "profile_name",
      "created_datetime",
      "created_by",
    ];

    if (!validSortColumns.includes(sortBy)) {
      sortBy = "created_datetime";
    }

    sortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [sortBy, sortOrder];
  }

  /**
  * Builds a where clause for filtering
  * 
  * @param {Record<string, any>} filters - Filter object mapping fields to values
  * @returns {object} - Object containing the where clause and include clause
  */
  private buildWhereClause(filters: Record<string, any>): {
    whereClause: Record<string, any>;
    includeClause: Array<any>;
  } {
    let whereClause: Record<string, any> = {};
    let includeClause: Array<any> = [];
  
    if (filters) {
      const filterProcessors: Record<string, Function> = {
        'profile_name': (value: any) => this.processTextFilter('profile_name', value, whereClause),
        'created_datetime': (value: any) => this.processDateFilter('created_datetime', value, whereClause),
        'created_by': (value: any) => this.processRelationFilter('created_by', value, whereClause, includeClause)
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
    return { whereClause, includeClause };
  }

  /**
   * Process text field filter with various operators
   * 
   * @param {string} field - Field name
   * @param {any} value - Filter value
   * @param {Record<string, any>} whereClause - Where clause to modify
   */
  private processTextFilter(field: string, value: any, whereClause: Record<string, any>): void {
    if (typeof value === 'string') {
      // Simple string value - treat as equals
      whereClause[field] = value;
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        whereClause[field] = value.equals;
      } else if (value.not_equals !== undefined) {
        whereClause[field] = { [Op.ne]: value.not_equals };
      } else if (value.contains !== undefined) {
        whereClause[field] = { [Op.iLike]: `%${value.contains}%` };
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
  private processDateFilter(field: string, value: any, whereClause: Record<string, any>): void {
    if (typeof value === 'string') {
      // Simple string date - treat as equals (on date)
      const date = new Date(value);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause[field] = {
        [Op.gte]: date,
        [Op.lt]: nextDay
      };
    } else if (typeof value === 'object') {
      if (value.equals !== undefined) {
        const date = new Date(value.equals);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        whereClause[field] = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      } else if (value.before !== undefined) {
        whereClause[field] = { [Op.lt]: new Date(value.before) };
      } else if (value.after !== undefined) {
        whereClause[field] = { [Op.gt]: new Date(value.after) };
      } else if (value.between !== undefined && value.between.from !== undefined && value.between.to !== undefined) {
        const fromDate = new Date(value.between.from);
        const toDate = new Date(value.between.to);
        // Add one day to include the end date fully
        toDate.setHours(23, 59, 59, 999);

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
    whereClause: Record<string, any>,
    includeClause: Array<any>
  ): void {
    const relationConfig: Record<string, { model: any; as: string; attribute: string }> = {
      'created_by': { model: User, as: 'creator', attribute: 'first_name' }
    };
  
    const config = relationConfig[field];
    if (!config) return;
  
    // Ensure the User model is included as a LEFT JOIN
    const existingInclude = includeClause.find(inc => inc.as === config.as);
    if (!existingInclude) {
      includeClause.push({
        model: config.model,
        as: config.as,
        attributes: [], // No need to select attributes
        required: false // LEFT JOIN
      });
    }
  
    // Reference the nested field (e.g., $creator.first_name$)
    const nestedField = `$${config.as}.${config.attribute}$`;
  
    if (typeof value === 'object') {
      if (value.equals !== undefined) {
        // Case-insensitive match
        whereClause[nestedField] = { [Op.iLike]: value.equals };
      } else if (value.not_equals !== undefined) {
        whereClause[nestedField] = {
          [Op.or]: [
            { [Op.notILike]: value.not_equals }, // Case-insensitive not equal
            { [Op.is]: null } // Include profiles without a creator
          ]
        };
      } else if (value.contains !== undefined) {
        whereClause[nestedField] = { [Op.iLike]: `%${value.contains}%` };
      } else if (value.is_empty !== undefined) {
        // Handle is_empty filter for relation fields
        if (value.is_empty) {
          // If is_empty is true, find records where the relation is null
          whereClause[nestedField] = { [Op.is]: null };
        } else {
          // If is_empty is false, find records where the relation is not null
          whereClause[nestedField] = { [Op.not]: null };
        }
      }
    }
  }

  /**
   * Gets all profiles
   * 
   * @returns {Promise<Object>} - Response object with status and message
   */
  async getAllProfiles(): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: { profiles: any[]; count: number };
  }> {
    try {
      const profiles = await Profile.findAll();

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profiles,
          count: profiles.length
        }
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }
  /**
   * Extends the permissionfor a user based on modified items
   * 
   * @param {string} profileId - The profile ID to update permissions for
   * @param {Array} privileges - Array of permission objects with modification flags
   * @param {string} userId - The ID of the user making the update
 * @returns {Promise<Object>} - Response object with update status
 */
  async updateUserExtendedPermissions(
    profileId: string,
    profileName: string,
    privileges: Array<{
      rid: string;
      type: string;
      field_id:string;
      permission_id:string;
      module_id:string;
      menu_id:string;
      is_modified: boolean;
      has_extended_permission:boolean;
      is_enabled?: boolean;
      read?: boolean;
      edit?: boolean;
    }>,
    requestedUserId : string,
    loggedInUsername : string,
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      profile_id: string;
      updated_permission_count: number;
    };
  }> {
    try {
      // Verify profile exists
      const profile = await Profile.findByPk(profileId);
      if (!profile) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: `Profile with ID ${profileId} not found`
        };
      }
  
      // Filter only modified permissions
      const modifiedPermissions = privileges.filter(p => p.is_modified === true);
      if (modifiedPermissions.length === 0) {
        return {
          statusCode: constants.SUCCESS,
          message: constants.SUCCESS_MESSAGE,
          data: {
            profile_id: profileId,
            updated_permission_count: 0
          }
        };
      }

      // Process updates by type
      const updatePromises = modifiedPermissions.map(async (permission) => {
        switch (permission.type) {
          case 'menu':
            return this.updateUserMenuAccessIfChanged(profileId,permission.rid,permission.menu_id, permission.has_extended_permission || false, requestedUserId ,loggedInUsername
            );
          case 'module':
            return this.updateUserModuleAccessIfChanged(profileId,permission.rid,permission.module_id, permission.has_extended_permission || false, requestedUserId ,loggedInUsername);
          case 'permission':
            return this.updateUserPermissionAccessIfChanged(profileId,permission.rid,permission.permission_id, permission.has_extended_permission || false, requestedUserId ,loggedInUsername);
          case 'field':
            return this.updateUserFieldAccessIfChanged(
              profileId,
              permission.rid,
              permission.field_id,
              permission.read || false,
              permission.edit || false,
              requestedUserId ,loggedInUsername,
            );

          default:
            console.warn(`Unknown permission type: ${permission.type}`);
            return false;
        }
      });

      // Wait for all updates to complete
      const updateResults = await Promise.all(updatePromises);
      const updatedPermissionCount = updateResults.filter(result => result === true).length;

      // Record the update event in profile timeline only if changes were made
      // if (updatedPermissionCount > 0 && originalUrl.includes('edit')) {
      //   await this.recordProfileEvent(
      //     profileId,
      //     "update",
      //     "success",
      //     userId
      //   );
      // }

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profile_id: profileId,
          updated_permission_count: updatedPermissionCount
        }
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Updates profile permissions based on modified items
   * 
   * @param {string} profileId - The profile ID to update permissions for
   * @param {Array} privileges - Array of permission objects with modification flags
   * @param {string} userId - The ID of the user making the update
 * @param {string} originalUrl - OriginalUrl of the request
 * @returns {Promise<Object>} - Response object with update status
 */
  async updateProfilePermissions(
    profileId: string,
    profileName: string,
    privileges: Array<{
      rid: string;
      type: string;
      is_modified: boolean;
      is_enabled?: boolean;
      read?: boolean;
      edit?: boolean;
    }>,
    userId: string,
    originalUrl: string = ""
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      profile_id: string;
      updated_permission_count: number;
    };
  }> {
    try {
      // Verify profile exists
      const profile = await Profile.findByPk(profileId);
      if (!profile) {
        return {
          statusCode: constants.NOT_FOUND,
          message: constants.NOT_FOUND_MESSAGE,
          errorMessage: `Profile with ID ${profileId} not found`
        };
      }

      if (originalUrl.includes('edit') && profileName) {
        // Check if name has changed
        if (profile.profile_name !== profileName) {
          const isUniqueAndUpdated = await this.checkProfileNameUniqueAndUpdate(
            profileId,
            profileName,
            profile.profile_name,
            userId
          );

          if (!isUniqueAndUpdated) {
            return {
              statusCode: constants.BAD_REQUEST,
              message: constants.BAD_REQUEST_MESSAGE,
              errorMessage: `Profile name '${profileName}' is already in use`,
              data: {
                profile_id: profileId,
                updated_permission_count: 0
              }
            };
          }
        }
      }

      // Filter only modified permissions
      const modifiedPermissions = privileges.filter(p => p.is_modified === true);

      if (modifiedPermissions.length === 0) {
        return {
          statusCode: constants.SUCCESS,
          message: constants.SUCCESS_MESSAGE,
          data: {
            profile_id: profileId,
            updated_permission_count: 0
          }
        };
      }

      // Process updates by type
      const updatePromises = modifiedPermissions.map(async (permission) => {
        switch (permission.type) {
          case 'menu':
            return this.updateMenuAccessIfChanged(permission.rid, permission.is_enabled || false, userId, originalUrl);
          case 'module':
            return this.updateModuleAccessIfChanged(permission.rid, permission.is_enabled || false, userId, originalUrl);
          case 'permission':
            return this.updatePermissionAccessIfChanged(permission.rid, permission.is_enabled || false, userId, originalUrl);
          case 'field':
            return this.updateFieldAccessIfChanged(
              permission.rid,
              permission.read || false,
              permission.edit || false,
              userId,
              originalUrl
            );

          default:
            console.warn(`Unknown permission type: ${permission.type}`);
            return false;
        }
      });

      // Wait for all updates to complete
      const updateResults = await Promise.all(updatePromises);
      const updatedPermissionCount = updateResults.filter(result => result === true).length;

      // Record the update event in profile timeline only if changes were made
      if (updatedPermissionCount > 0 && originalUrl.includes('edit')) {
        await this.recordProfileEvent(
          profileId,
          "update",
          "success",
          userId
        );
      }

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profile_id: profileId,
          updated_permission_count: updatedPermissionCount
        }
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }

  /**
   * Checks if a profile name is unique and updates the profile if it is
   * 
   * @param {string} profileId - The ID of the profile to update
   * @param {string} profileName - The new profile name to check
   * @param {string} currentProfileName - The current profile name
   * @param {string} userId - The ID of the user making the update
   * @returns {Promise<boolean>} - Returns true if name is unique and update successful, false otherwise
   */
  async checkProfileNameUniqueAndUpdate(
    profileId: string,
    profileName: string,
    currentProfileName: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if the new name is unique
      const existingProfile = await Profile.findOne({
        where: {
          profile_name: profileName,
        }
      });
      // If profile with same name exists, return false
      if (existingProfile) {
        return false;
      }

      // Create history record for name change
      await ProfileHistory.create({
        profile_rid: profileId,
        attribute_name: 'name',
        old_value: currentProfileName,
        new_value: profileName,
        modified_by: userId
      });

      // Update the profile name
      await Profile.update(
        {
          profile_name: profileName,
          modified_by: userId,
          modified_datetime: new Date(),
        },
        {
          where: { rid: profileId }
        }
      );

      return true;
    } catch (error) {
      console.error('Error checking profile name uniqueness and updating:', error);
      return false;
    }
  }

  /**
   * Updates menu access for a profile if the value has changed
   */
  private async updateMenuAccessIfChanged(
    accessId: string,
    isEnabled: boolean,
    userId: string,
    originalUrl: string = "create"
  ): Promise<boolean> {
    try {
      // First fetch the current value
      const currentAccess = await ProfileMenuAccess.findByPk(accessId);
      if (!currentAccess) {
        console.error(`Menu access with ID ${accessId} not found`);
        return false;
      }

      // Check if the value has actually changed
      if (currentAccess.is_enabled === isEnabled) {
        console.log(`Menu access ${accessId} value unchanged, skipping update`);
        return false;
      }

      // Store history if this is an edit operation
      if (originalUrl.includes('edit')) {
        await ProfileMenuAccessHistory.create({
          profile_menu_access_rid: accessId,
          attribute_name: 'is_enabled',
          old_value: currentAccess.is_enabled.toString(),
          new_value: isEnabled.toString(),
          modified_by: userId
        });
      }

      // Update only if the value has changed
      const [updated] = await ProfileMenuAccess.update(
        {
          is_enabled: isEnabled,
          modified_by: userId
        },
        {
          where: { rid: accessId }
        }
      );

      return updated > 0;
    } catch (error) {
      console.error('Error updating menu access:', error);
      return false;
    }
  }
   
  /**
   * Updates module access for a profile if the value has changed
   */
  private async updateModuleAccessIfChanged(
    accessId: string,
    isEnabled: boolean,
    userId: string,
    originalUrl: string = "create"
  ): Promise<boolean> {
    try {
      // First fetch the current value
      const currentAccess = await ProfileModuleAccess.findByPk(accessId);
      if (!currentAccess) {
        console.error(`Module access with ID ${accessId} not found`);
        return false;
      }

      // Check if the value has actually changed
      if (currentAccess.is_enabled === isEnabled) {
        console.log(`Module access ${accessId} value unchanged, skipping update`);
        return false;
      }

      // Store history if this is an edit operation
      if (originalUrl.includes('edit')) {
        await ProfileModuleAccessHistory.create({
          profile_module_access_rid: accessId,
          attribute_name: 'is_enabled',
          old_value: currentAccess.is_enabled.toString(),
          new_value: isEnabled.toString(),
          modified_by: userId
        });
      }

      // Update only if the value has changed
      const [updated] = await ProfileModuleAccess.update(
        {
          is_enabled: isEnabled,
          modified_by: userId
        },
        {
          where: { rid: accessId }
        }
      );

      return updated > 0;
    } catch (error) {
      console.error('Error updating module access:', error);
      return false;
    }
  }
 
  /**
   * Updates permission access for a profile if the value has changed
   */
  private async updatePermissionAccessIfChanged(
    accessId: string,
    isEnabled: boolean,
    userId: string,
    originalUrl: string = "create"
  ): Promise<boolean> {
    try {
      // First fetch the current value
      const currentAccess = await ProfilePermissionAccess.findByPk(accessId);
      if (!currentAccess) {
        console.error(`Permission access with ID ${accessId} not found`);
        return false;
      }

      // Check if the value has actually changed
      if (currentAccess.is_enabled === isEnabled) {
        console.log(`Permission access ${accessId} value unchanged, skipping update`);
        return false;
      }

      // Store history if this is an edit operation
      if (originalUrl.includes('edit')) {
        await ProfilePermissionAccessHistory.create({
          profile_permission_access_rid: accessId,
          attribute_name: 'is_enabled',
          old_value: currentAccess.is_enabled.toString(),
          new_value: isEnabled.toString(),
          modified_by: userId
        });
      }

      // Update only if the value has changed
      const [updated] = await ProfilePermissionAccess.update(
        {
          is_enabled: isEnabled,
          modified_by: userId
        },
        {
          where: { rid: accessId }
        }
      );

      return updated > 0;
    } catch (error) {
      console.error('Error updating permission access:', error);
      return false;
    }
  }

  /**
   * Updates field access for a profile if the values have changed
   */
  private async updateFieldAccessIfChanged(
    accessId: string,
    read: boolean,
    edit: boolean,
    userId: string,
    originalUrl: string = "create"
  ): Promise<boolean> {
    try {
      // First fetch the current values
      const currentAccess = await ProfileFieldsAccess.findByPk(accessId);
      if (!currentAccess) {
        console.error(`Field access with ID ${accessId} not found`);
        return false;
      }

      // Check if any values have actually changed
      const readChanged = currentAccess.read !== read;
      const editChanged = currentAccess.edit !== edit;

      if (!readChanged && !editChanged) {
        console.log(`Field access ${accessId} values unchanged, skipping update`);
        return false;
      }

      // Store history if this is an edit operation
      if (originalUrl.includes('edit')) {
        // Create history entry for read permission if changed
        if (readChanged) {
          await ProfileFieldsAccessHistory.create({
            profile_fields_access_rid: accessId,
            attribute_name: 'read',
            old_value: currentAccess.read.toString(),
            new_value: read.toString(),
            modified_by: userId
          });
        }

        // Create history entry for edit permission if changed
        if (editChanged) {
          await ProfileFieldsAccessHistory.create({
            profile_fields_access_rid: accessId,
            attribute_name: 'edit',
            old_value: currentAccess.edit.toString(),
            new_value: edit.toString(),
            modified_by: userId
          });
        }
      }

      // Update only if values have changed
      const [updated] = await ProfileFieldsAccess.update(
        {
          read,
          edit,
          modified_by: userId
        },
        {
          where: { rid: accessId }
        }
      );

      return updated > 0;
    } catch (error) {
      console.error('Error updating field access:', error);
      return false;
    }
  }

  /**
   * Updates menu access for a profile if the value has changed
   */
  private async updateUserMenuAccessIfChanged(
    profileId:string,
    accessId: string,
    menu_id:string,
    isEnabled: boolean,
    requestedUserId:string,
    loggedInUsername:string
   
  ): Promise<boolean> {
    try {
      // First fetch the current value
      const currentAccess = await UserMenuAccess.findOne({
        where: {
          user_id: requestedUserId,
          menu_id:menu_id
        }
      });
      if (!currentAccess) {
        const newUserMenuAccessRecord =  await UserMenuAccess.create({
          user_id : requestedUserId,
          menu_id:menu_id,
          is_enabled:isEnabled
         });
         // Store history if this is an edit operation
         await UserMenuAccessHistory.create({
           user_menu_access_rid: newUserMenuAccessRecord.rid,
           attribute_name: 'is_enabled',
           old_value: "",
           new_value: isEnabled.toString(),
           modified_by: loggedInUsername
         });
          await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "create",
          "success",
          loggedInUsername
        );

      return true;
      }
      else
      {
      // Check if the value has actually changed
        if (currentAccess?.is_enabled === isEnabled) {
          console.log(`Menu access ${accessId} value unchanged, skipping update`);
          return false;
        }

      // Store history if this is an edit operation
         await UserMenuAccessHistory.create({
           user_menu_access_rid: currentAccess.rid,
           attribute_name: 'is_enabled',
           old_value: currentAccess.is_enabled.toString(),
           new_value: isEnabled.toString(),
           modified_by: loggedInUsername
         });

          await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "update",
          "success",
          loggedInUsername
        );
        // Update only if the value has changed
        const [updated] = await UserMenuAccess.update(
          {
            is_enabled: isEnabled,
            modified_by: loggedInUsername
          },
          {
            where: { rid: currentAccess.rid }
          }
        );
      return updated > 0;
    }
    } catch (error) {
      console.error('Error updating menu access:', error);
      return false;
    }
  }


   /**
   * Updates module access for a profile if the value has changed
   */
  private async updateUserModuleAccessIfChanged(
     profileId:string,
    accessId: string,
    module_id:string,
    has_extended_permission: boolean,
    requestedUserId:string,
    loggedInUsername:string
  ): Promise<boolean> {
    try {
      // First fetch the current value
      const currentAccess = await UserModuleAccess.findOne({
        where: {
          user_id: requestedUserId,
          menu_module_id:module_id
        }
      });
      
      if (!currentAccess) {
        const newUserModuleAccessRecord =  await UserModuleAccess.create({
          user_id : requestedUserId,
          menu_module_id:module_id,
          is_enabled:has_extended_permission
         });
          await UserModuleAccessHistory.create({
          user_module_access_rid: newUserModuleAccessRecord.rid,
          attribute_name: 'is_enabled',
          old_value: "",
          new_value: has_extended_permission.toString(),
          modified_by: loggedInUsername
        });
         await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "create",
          "success",
          loggedInUsername
        );
      return true;
      }
      else
      {
      // Check if the value has actually changed
      if (currentAccess?.is_enabled === has_extended_permission) {
        console.log(`Module access ${accessId} value unchanged, skipping update`);
        return false;
      }
      // Store history if this is an edit operation
        await UserModuleAccessHistory.create({
          user_module_access_rid: currentAccess.rid,
          attribute_name: 'is_enabled',
          old_value: currentAccess.is_enabled.toString(),
          new_value: has_extended_permission.toString(),
          modified_by: loggedInUsername
        });
         await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "update",
          "success",
          loggedInUsername
        );
     

      // Update only if the value has changed
      const [updated] = await UserModuleAccess.update(
        {
          is_enabled: has_extended_permission,
          modified_by: loggedInUsername
        },
        {
          where: { rid: currentAccess.rid }
        }
      );

      return updated > 0;

      }
      
    } catch (error) {
      console.error('Error updating module access:', error);
      return false;
    }
  }


  /**
   * Updates permission access for a profile if the value has changed
   */
  private async updateUserPermissionAccessIfChanged(
     profileId:string,
    accessId: string,
    permissionId:string,
    isEnabled: boolean,
    requestedUserId:string,
    loggedInUsername:string
  ): Promise<boolean> {
    try {
      // First fetch the current value
       const currentAccess = await UserPermissionAccess.findOne({
        where: {
          user_id: requestedUserId,
          module_permission_id:permissionId
        }
      });
      if (!currentAccess) {
       const newUserPermisisonAccessRecord =  await UserPermissionAccess.create({
          user_id : requestedUserId,
          module_permission_id:permissionId,
          is_enabled:isEnabled
         });
          await UserPermissionAccessHistory.create({
          user_permission_access_rid: newUserPermisisonAccessRecord.rid,
          attribute_name: 'is_enabled',
          old_value: "",
          new_value: isEnabled.toString(),
          modified_by: loggedInUsername
        });
         await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "create",
          "success",
          loggedInUsername
        );
      return true;
      }
      else
      {
      // Check if the value has actually changed
      if (currentAccess.is_enabled === isEnabled) {
        console.log(`Permission access ${accessId} value unchanged, skipping update`);
        return false;
      }
      
        await UserPermissionAccessHistory.create({
          user_permission_access_rid: currentAccess.rid,
          attribute_name: 'is_enabled',
          old_value: currentAccess.is_enabled.toString(),
          new_value: isEnabled.toString(),
          modified_by: loggedInUsername
        });
      
        await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "update",
          "success",
          loggedInUsername
        );
      // Update only if the value has changed
      const [updated] = await UserPermissionAccess.update(
        {
          is_enabled: isEnabled,
          modified_by: loggedInUsername
        },
        {
          where: { rid: accessId }
        }
      );

      return updated > 0;
      }
     
    } catch (error) {
      console.error('Error updating permission access:', error);
      return false;
    }
  }

   /**
   * Updates field access for a profile if the values have changed
   */
  private async updateUserFieldAccessIfChanged(
     profileId:string,
    accessId: string,
    fieldId:string,
    read: boolean,
    edit: boolean,
    requestedUserId:string,
    loggedInUsername:string
  ): Promise<boolean> {
    try {
      // First fetch the current values
      const currentAccess = await UserFieldsAccess.findOne({
        where: {
          user_id: requestedUserId,
          permission_field_id:fieldId
        }
      });
      if (!currentAccess) {
      const newUserFieldAccessRecord = await UserFieldsAccess.create({
          user_id : requestedUserId,
          permission_field_id:fieldId,
          read,
          edit,
         });
         await UserFieldsAccessHistory.create({
            user_fields_access_rid: newUserFieldAccessRecord.rid,
            attribute_name: 'read',
            old_value: "",
            new_value: read.toString(),
            modified_by: loggedInUsername
          });
           await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "create",
          "success",
          loggedInUsername
        );
       // console.error(`Menu access with ID ${accessId} not found`);
      return true;
      }
      else
      {
 // Check if any values have actually changed
      const readChanged = currentAccess.read !== read;
      const editChanged = currentAccess.edit !== edit;

      if (!readChanged && !editChanged) {
        console.log(`Field access ${accessId} values unchanged, skipping update`);
        return false;
      }
      
        // Create history entry for read permission if changed
        if (readChanged) {
          await UserFieldsAccessHistory.create({
            user_fields_access_rid: currentAccess.rid,
            attribute_name: 'read',
            old_value: currentAccess.read.toString(),
            new_value: read.toString(),
            modified_by: loggedInUsername
          });
           await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "update",
          "success",
          loggedInUsername
        );
        }

        // Create history entry for edit permission if changed
        if (editChanged) {
          await UserFieldsAccessHistory.create({
            user_fields_access_rid: currentAccess.rid,
            attribute_name: 'edit',
            old_value: currentAccess.edit.toString(),
            new_value: edit.toString(),
            modified_by: loggedInUsername
          });
           await this.recordUserExtendedProfileEvent(
          requestedUserId,
          profileId,
          "update",
          "success",
          loggedInUsername
        );
        }
      
      // Update only if values have changed
      const [updated] = await UserFieldsAccess.update(
        {
          read,
          edit,
          modified_by: loggedInUsername
        },
        {
          where: { permission_field_id: fieldId,user_id:requestedUserId }
        }
      );
      return updated > 0;
      }
    } catch (error) {
      console.error('Error updating field access:', error);
      return false;
    }
  }
}

export default UserManagementService;