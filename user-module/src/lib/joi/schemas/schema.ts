import Joi from "joi";
import { constants } from "../../../utils/constant";

const userReqSchema = Joi.object({
  organization: Joi.string().valid(constants.ENV_TRD365, constants.ENV_EA).max(255).required(),
})

const createUserGroupSchema = Joi.object({
  group_name: Joi.string().min(3).max(64).required().label("Group Name"),
  users: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().required().label("User ID"),
        is_enabled: Joi.boolean().required(),
        is_modified: Joi.boolean().required(),
      })
    )
    .min(1)
    .required()
    .label("Users"),
  group_type_rid: Joi.string().required().label("Group Type"),
  accounts: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().required().label("Account RID"),
        is_enabled: Joi.boolean().required(),
        is_modified: Joi.boolean().required(),
      })
    )
    .min(1)
    .optional()
    .label("Accounts"),
  status_rid: Joi.string().optional().label("Status"),
  is_consultant_only_group: Joi.boolean().required(),
  projects: Joi.object()
    .pattern(
      Joi.string().min(1), // project_rid
      Joi.boolean()        // has_access_enabled
    )
    .optional()
    .label("Projects"),
});


const updateUserGroupSchema = Joi.object({
  group_name: Joi.string().min(3).max(64).required().label("Group Name"),
  group_rid: Joi.string().required().label("Group Id"),
  users: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().required().label("User ID"),
        is_enabled: Joi.boolean().required(),
        is_modified: Joi.boolean().required(),
      })
    )
    .optional()
    .label("Users"),
  accounts: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().required().label("Account RID"),
        is_enabled: Joi.boolean().required(),
        is_modified: Joi.boolean().required(),
      })
    )
    .min(1)
    .optional()
    .label("Accounts"),
    projects: Joi.object()
    .pattern(
      Joi.string().min(1), // project_rid
      Joi.boolean()        // has_access_enabled
    )
    .optional()
    .label("Projects"),
  status_rid: Joi.string().optional().label("Status"),
  is_consultant_only_group:Joi.boolean().optional()
});

const assignUserToAccountSchema = Joi.object({
  users: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().required().label("User ID"),
        is_enabled: Joi.boolean().required(),
        is_modified: Joi.boolean().required(),
      })
    )
    .optional()
    .label("Users"),
  groups: Joi.array()
    .items(
      Joi.object({
        rid: Joi.string().required().label("User ID"),
        is_enabled: Joi.boolean().required(),
        is_modified: Joi.boolean().required(),
      })
    )
    .optional()
    .label("Users"),
  access_type:Joi.string().required().label("Access type"),
  account_rid: Joi.string().required().label("Account Name"),
  entity_type:Joi.string().required().label("Entity type"),
  project_rid: Joi.string().optional().label("Project rid"),

});

const listUserGroupTypeSchema = Joi.object({
  type: Joi.string().optional().label("Type"),
  
});
const listProjectUserGroupSchema = Joi.object({
  account_rid: Joi.string().required().label("Account Id"),
  entity_rid: Joi.string().required().label("User Id/Project Id"),
  access_type: Joi.string().required().label("Type"),
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("10"),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("first_name"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC")
});

const listProjectOfAccountSchema = Joi.object({
  account_rid: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.array().items(Joi.string())
  ).optional(),
  group_rid: Joi.string().optional().label("Group Id"),
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("1000"),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("first_name"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
});

const assignUserToProjectSchema = Joi.object({
  group_rid: Joi.string().optional().label("Group Id"),
  user_rid: Joi.string().optional().label("User Id"),
  account_rid: Joi.string().required().label("Account Name"),
  projects: Joi.object()
    .pattern(
      Joi.string(), // key: project_rid
      Joi.boolean() // value: has_access_enabled
    )
    .required()
    .min(1)
    .label("Projects Access Map"),
});

const listActiveUserGroupSchema = Joi.object({
 
  is_consultant_only_group:Joi.boolean().optional().allow('',null),
  group_rid:Joi.string().optional().allow('',null),
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("1000"),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("first_name"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  account_rid: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.array().items(Joi.string())
  ).optional()
});

const listAccountUserSchema = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("10"),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("ASC"),
  entity_type:Joi.string().required(),
  project_rid:Joi.string().optional(),
});

const listUserGroupSchema = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("10"),
  search: Joi.string().max(255).optional().allow(""),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC")
});

const exportUserGroupSchema = Joi.object({
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  timezone: Joi.string().optional()
});

const createUserSchema = Joi.object({
  organization: Joi.string().valid(constants.ENV_TRD365, constants.ENV_EA).max(255).required(),
  first_name: Joi.string().min(3).max(64).required().label("First Name"),
  last_name: Joi.string().min(3).max(64).required().label("Last Name"),
  middle_name: Joi.string().min(3).max(64).optional(),
  email: Joi.string()
  .trim()
  .regex(/^(?=.{6,254}$)[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/) 
  .min(6).max(255).required().allow("").allow(null).messages({
    "string.base": "Email must be a text value.",
    "string.pattern.base": "Invalid Email Address."
  }).label("Email"),
  profile_id: Joi.string().max(255).required().label("Profile"),
  role: Joi.string().max(255).required().label("Role"),
  status_rid: Joi.string().required().label("Status"),
  street: Joi.string().max(255).allow('', null).optional().label("Street"),
  city_rid: Joi.string().max(255).allow('', null).optional().label("City"),
  region_rid: Joi.string().max(255).allow('', null).optional().label("Region"),
  zip_code: Joi.string().max(20).allow('', null).optional().label("Zip Code"),
  phone: Joi.string().pattern(/^[1-9]\d{9,14}$/).allow('', null).optional().label("Phone"),
  country_rid: Joi.string().max(255).allow('', null).optional().label("Country"),
  created_by: Joi.string().max(255).required().label("Created By"),
  is_consultant_firm:Joi.boolean().required(),
  org_id:Joi.string().required()
});

const enterpriseUserSchema = Joi.object({
  organization: Joi.string().valid(constants.ENV_TRD365, constants.ENV_EA).max(255).required(),
  first_name: Joi.string().min(3).max(64).required().label("First Name"),
  last_name: Joi.string().min(3).max(64).required().label("Last Name"),
  middle_name: Joi.string().max(255).optional(),
  status: Joi.string().valid("active", "inactive").required().label("Last Name"),
  email: Joi.string()
  .trim()
  .regex(/^(?=.{6,254}$)[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63}$/) 
  .min(10).max(255).required().allow("").allow(null).messages({
    "string.min": "Email must be at least 6 characters long.",
    "string.max": "Email cannot exceed 254 characters.",
    "string.pattern.base": "Invalid Email Address."
  }).label("Email"),
  mobile: Joi.string().max(10).required().label("Mobile"),
  profile_id: Joi.string().max(255).required().label("Profile"),
  designation: Joi.string().max(255).required().label("Designation"),
  manager_name: Joi.string().max(255).required().label("Manager Name"),
  manager_email: Joi.string().max(255).required().label("Manager Email"),
  manager_employee_id: Joi.string().max(255).required().label("Manager Employee Id"),
  employee_id: Joi.string().max(255).required().label("Employment Id"),
  employment_date: Joi.date().optional().label("Employment Date"),
  department_id: Joi.string().max(255).required().label("Department Id"),
  function_group_id: Joi.string().max(255).required().label("Function Group Id"),
  created_by: Joi.string().max(255).required().label("Created By"),
})

const updateUserSchema = Joi.object({
  organization: Joi.string().valid(constants.ENV_TRD365, constants.ENV_EA).max(255).required(),
  rid: Joi.string().max(255).required(),
  azure_id: Joi.string().max(255).required(),
  first_name: Joi.string().min(3).max(64).required().label("First Name"),
  middle_name: Joi.string().min(3).max(64).optional(),
  last_name: Joi.string().min(3).max(64).required().label("Last Name"),
  profile_id: Joi.string().max(255).required().label("Profile Id"),
  role: Joi.string().max(255).required().label("Role"),
  status_rid: Joi.string().required().label("Status"),
  street: Joi.string().max(255).allow('', null).optional().label("Street"),
  city_rid: Joi.string().max(255).allow('', null).optional().label("City"),
  region_rid: Joi.string().max(255).allow('', null).optional().label("Region"),
  zip_code: Joi.string().max(20).allow('', null).optional().label("Zip code"),
  country_rid: Joi.string().max(255).allow('', null).optional().label("Country"),
  phone: Joi.string().pattern(/^[1-9]\d{9,14}$/).optional().allow('', null).label("Phone"),
  modified_by: Joi.string().max(255).allow('', null).optional(),
  is_consultant_firm:Joi.boolean().required(),
  org_id:Joi.string().required()
});

const userDetailsUpdateSchema = Joi.object({
  organization: Joi.string().valid(constants.ENV_TRD365, constants.ENV_EA).max(255).required(),
  rid: Joi.string().max(255).required(),
  azure_id: Joi.string().max(255).required(),
  first_name: Joi.string().min(3).max(64).required().label("First Name"),
  last_name: Joi.string().min(3).max(64).required().label("Last Name"),
  middle_name: Joi.string().min(3).max(64).optional(),
  status: Joi.string().valid("active", "inactive").required().label("Status"),
  mobile: Joi.string().max(10).required().label("Phone"),
  profile_id: Joi.string().max(255).required().label("Profile ID"),
  designation: Joi.string().max(255).required().label("Designation"),
  manager_name: Joi.string().max(255).required().label("Manager Name"),
  manager_email: Joi.string().max(255).required().label("Manager Email"),
  manager_employee_id: Joi.string().max(255).required().label("Manager Employee Id"),
  employee_id: Joi.string().max(255).required().label("Employment Id"),
  employment_date: Joi.date().optional().label("Employment Date"),
  department_id: Joi.string().max(255).required().label("Department Id"),
  function_group_id: Joi.string().max(255).required().label("Function Group Id"),
  updated_by: Joi.string().max(255).required(),
});

const listUserSchema = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("10"),
  search: Joi.string().max(255).optional().allow(""),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  organization: Joi.string().required().valid(constants.ENV_TRD365, constants.ENV_EA),
});

const listProfileSchema = Joi.object({
  page: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("1"),
  limit: Joi.string()
    .pattern(/^[0-9]+$/)
    .default("10"),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime").optional().allow(""),
  sortOrder: Joi.string()
    .valid("ASC", "DESC")
    .default("DESC")
    .optional()
    .allow(""),
});

const exportUserSchema = Joi.object({
  search: Joi.string().max(255).optional().allow(""),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  organization: Joi.string().required().valid(constants.ENV_TRD365, constants.ENV_EA),
  timezone: Joi.string().optional(),
});

const listUserByIdSchema = Joi.object({
  organization: Joi.string().required().valid(constants.ENV_TRD365, constants.ENV_EA),
});

/**
 * Schema for validating user permission by ID requests
 */
const userPermissionByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required().messages({
      "string.empty": "User Azure ID is required",
      "any.required": "User Azure ID is required"
    })
  })
});

/**
 * Schema for validating create profile requests
 */
const createProfileSchema = Joi.object({
  source_profile_id: Joi.string().required().messages({
    "string.empty": "Source Profile ID is required",
    "any.required": "Source Profile ID is required"
  }),
  profile_name: Joi.string().min(2).max(64).required().messages({
    "string.empty": "Profile name is required",
    "string.min": "Profile name must be at least 3 characters long",
    "string.max": "Profile name cannot exceed 255 characters",
    "any.required": "Profile name is required"
  }),
  profile_description: Joi.string().max(2000).allow('', null).optional(),
  profile_type: Joi.string().valid('default', 'custom').required().messages({
      "string.empty": "Profile type is required",
      "any.required": "Profile type is required",
      "any.only": "Profile type must be either 'default' or 'custom'"
    })
});

/**
 * Schema for validating get profile permissions requests
 */
/**
 * Schema for validating get profile permissions requests
 */
const getProfilePermissionsSchema = Joi.object({
  type: Joi.string().valid('menu', 'module', 'permission').optional(),
  id: Joi.string().optional()
  // id: Joi.string().when('type', {
  //   is: Joi.exist(),
  //   then: Joi.required().messages({
  //     "string.empty": "ID is required when type is specified",
  //     "any.required": "ID is required when type is specified"
  //   }),
  //   otherwise: Joi.optional()
  // })
});
/**
 * Schema for validating update/edit profile permissions requests
 */
const updateProfilePermissionsSchema = Joi.object({
  profile_id: Joi.string().required().messages({
    "string.empty": "Profile ID is required",
    "any.required": "Profile ID is required"
  }),
  profile_name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Profile name is required",
    "string.min": "Profile name must be at least 3 characters long",
    "string.max": "Profile name cannot exceed 255 characters",
    "any.required": "Profile name is required"
  }),
  privileges: Joi.array().items(
    Joi.object({
      rid: Joi.string().required(),
      type: Joi.string().valid('menu', 'module', 'permission', 'field').required(),
      menu_id: Joi.string().optional(),
      module_id: Joi.string().optional(),
      permission_id: Joi.string().optional(),
      field_id: Joi.string().optional(),
      name: Joi.string().optional(),
      desc: Joi.string().optional(),
      is_modified: Joi.boolean().required(),
      is_enabled: Joi.boolean().optional(),
      is_field_available: Joi.boolean().optional(),
      read: Joi.boolean().optional(),
      edit: Joi.boolean().optional()
    })
  ).required().messages({
    "array.base": "Privileges must be an array",
    "any.required": "Privileges array is required"
  })
});


const updateUserExtendedPermissionsSchema = Joi.object({
  user_id: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required"
  }),
  privileges: Joi.array().items(
    Joi.object({
      rid: Joi.string().required(),
      type: Joi.string().valid('menu', 'module', 'permission', 'field').required(),
      menu_id: Joi.string().optional(),
      module_id: Joi.string().optional(),
      permission_id: Joi.string().optional(),
      field_id: Joi.string().optional(),
      name: Joi.string().optional(),
      desc: Joi.string().optional(),
      is_modified: Joi.boolean().required(),
      has_extended_permission: Joi.boolean().optional(),
      is_enabled: Joi.boolean().optional(),
      is_field_available: Joi.boolean().optional(),
      hasReadExtendedPermsission: Joi.boolean().optional(),
      hasEditExtendedPermsission: Joi.boolean().optional(),
      read: Joi.boolean().optional(),
      edit: Joi.boolean().optional()
    
    })
  ).required().messages({
    "array.base": "Privileges must be an array",
    "any.required": "Privileges array is required"
  })
});
const editProfilePermissionsSchema = Joi.object({
  profile_id: Joi.string().required().messages({
    "string.empty": "Profile ID is required",
    "any.required": "Profile ID is required"
  }),
  profile_name: Joi.string().min(2).max(64).required().messages({
    "string.empty": "Profile name is required",
    "string.min": "Profile name must be at least 2 characters long",
    "string.max": "Profile name cannot exceed 64 characters",
    "any.required": "Profile name is required"
  }),
  privileges: Joi.array().items(
    Joi.object({
      rid: Joi.string().required(),
      type: Joi.string().valid('menu', 'module', 'permission', 'field').required(),
      menu_id: Joi.string().optional(),
      module_id: Joi.string().optional(),
      permission_id: Joi.string().optional(),
      field_id: Joi.string().optional(),
      name: Joi.string().optional(),
      desc: Joi.string().optional(),
      is_modified: Joi.boolean().required(),
      is_enabled: Joi.boolean().optional(),
      is_field_available: Joi.boolean().optional(),
      read: Joi.boolean().optional(),
      edit: Joi.boolean().optional()
    })
  ).required().messages({
    "array.base": "Privileges must be an array",
    "any.required": "Privileges array is required"
  })
});

export { createUserSchema, updateUserSchema, enterpriseUserSchema,
   userDetailsUpdateSchema, userReqSchema, listUserSchema, listUserByIdSchema, 
   exportUserSchema, userPermissionByIdSchema, createProfileSchema, 
   getProfilePermissionsSchema, updateProfilePermissionsSchema,
    editProfilePermissionsSchema, listProfileSchema,updateUserExtendedPermissionsSchema,
  createUserGroupSchema,updateUserGroupSchema,listUserGroupSchema,
listActiveUserGroupSchema,assignUserToAccountSchema,assignUserToProjectSchema,
listProjectUserGroupSchema,listAccountUserSchema,exportUserGroupSchema ,
listProjectOfAccountSchema,listUserGroupTypeSchema};
