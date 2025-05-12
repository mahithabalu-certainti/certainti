import { constants } from "../utils/constant";
import { models } from "../models/index";
const UserService = require('../services/userService').default;
const userService = new UserService();
import { ProfileTimeline } from "../models/profileTimelineModel";
import { IndexHints } from "sequelize";

const {
  Profile, ProfileMenuAccess, Menu, ProfileModuleAccess, MenuModule, ProfilePermissionAccess, ModulePermission,
  UserMenuAccess, UserModuleAccess, UserPermissionAccess, PermissionField, ProfileFieldsAccess, UserFieldsAccess
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
      sourceProfileId: string;
      profileName: string;
      profileDescription?: string;
      profileType: string;
    },
    userId: string
  ): Promise<{
    statusCode: number;
    message: string;
    errorMessage?: string;
    data?: {
      profile?: any;
      profileId?: string;
      profileNumber?: string;
      permissions?: any[];
    };
  }> {
    try {
      const { sourceProfileId, profileName, profileDescription, profileType } = profileData;

      // Validate required fields
      if (!sourceProfileId || !profileName || !profileType) {
        return {
          statusCode: constants.BAD_REQUEST,
          message: constants.BAD_REQUEST_MESSAGE,
          errorMessage: "Source Profile Id, Profile name and type are required"
        };
      }

      // Create the profile
      const profile = await Profile.create({
        profile_name: profileName,
        profile_description: profileDescription || "",
        profile_type: profileType,
        profile_status: "active",
        created_by: userId,
        modified_by: userId
      });
      const cloneSuccess = await this.profileClone({
        profileId: profile.rid,
        sourceProfileId
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
          errorMessage: `Profile ${profile.rid} was created but cloning from ${sourceProfileId} failed`,
          data: {
            profileId: profile.rid,
            profileNumber: profile.r_number
          }
        };
      } else {
        const permissions = await userService.getProfilePermission(profile.rid);
        return {
          statusCode: constants.SUCCESS,
          message: constants.SUCCESS_MESSAGE,
          data: {
            profileId: profile.rid,
            profileNumber: profile.r_number,
            permissions
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
   * Clones profile data from an existing profile to a new profile
   * 
   * @param {Object} profileData - The profile data for the new profile
   * @param {string} userId - The ID of the user creating the profile
   * @returns {Promise<boolean>} - Returns true if cloning was successful
   */
  private async profileClone(
    profileData: {
      profileId: string;
      sourceProfileId?: string;
    },
    userId: string
  ): Promise<boolean> {
    try {
      const { profileId, sourceProfileId } = profileData;

      // Use Promise.all to run these queries in parallel for better performance
      const [menuAccess, moduleAccess, permissionAccess, fieldAccess] = await Promise.all([
        // Get menu access records
        ProfileMenuAccess.findAll({
          where: { profile_id: sourceProfileId },
          raw: true
        }),

        // Get module access records
        ProfileModuleAccess.findAll({
          where: { profile_id: sourceProfileId },
          raw: true
        }),

        // Get permission access records
        ProfilePermissionAccess.findAll({
          where: { profile_id: sourceProfileId },
          raw: true,
          indexHints: [{ type: IndexHints.USE, values: ['idx_profile_permission_access_profile_id'] }]
        }),

        // Get field access records - using index for better performance
        ProfileFieldsAccess.findAll({
          where: { profile_id: sourceProfileId },
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
    profileId: string;
    profileNumber?: string;
    permissions?: any[];
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
    
    // Import UserService to get profile permissions
    const UserService = require('../services/userService').default;
    const userService = new UserService();
    
    // Get filtered permissions based on provided parameters
    let permissions = [];
    
    if (type === 'permission' && id) {
      // Case 7: If permission type is provided, get only fields for that permission
      permissions = await this.getFieldsForPermission(profileId, id);
    } else if (type === 'module' && id) {
      // Case 6: If module type is provided, get permissions and fields for that module
      permissions = await this.getPermissionsForModule(profileId, id);
    } else if (type === 'menu' && id) {
      // Case 5: If menu type is provided, get modules, permissions, and fields for that menu
      permissions = await this.getModulesForMenu(profileId, id);
    } else {
      // Case 4: If no filters, get all permissions for the profile
      permissions = await userService.getProfilePermission(profileId);
    }
    
    return {
      statusCode: constants.SUCCESS,
      message: constants.SUCCESS_MESSAGE,
      data: {
        profileId: profile.rid,
        permissions
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
      type: "field",
      fieldId: faWithField.permission_field.rid,
      permissionId: faWithField.permission_field.module_permission_id,
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
  const permissions = [];
  
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
    permissions.push({
      type: "permission",
      permissionId: paWithPermission.module_permission.rid,
      moduleId: paWithPermission.module_permission.menu_module_id,
      name: paWithPermission.module_permission.permission_name,
      desc: paWithPermission.module_permission.permission_desc,
      isFieldAvailable: paWithPermission.module_permission.is_field_available,
      isEnabled: paWithPermission.is_enabled
    });
  }
  
  return permissions;
}

/**
 * Gets modules, permissions, and fields for a specific menu
 */
private async getModulesForMenu(profileId: string, menuId: string): Promise<any[]> {
  const permissions = [];
  
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
    permissions.push({
      type: "module",
      moduleId: maWithModule.menu_module.rid,
      menuId: maWithModule.menu_module.menu_id,
      name: maWithModule.menu_module.module_name,
      desc: maWithModule.menu_module.module_desc,
      isEnabled: maWithModule.is_enabled
    });
  }
  
  return permissions;
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
    data?: { profiles: any[] };
  }> {
    try {
      const profiles = await Profile.findAll();

      return {
        statusCode: constants.SUCCESS,
        message: constants.SUCCESS_MESSAGE,
        data: {
          profiles
        }
      };
    } catch (err: any) {
      return this.throwServiceError(err as Error);
    }
  }
}

export default UserManagementService;