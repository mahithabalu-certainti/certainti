import Joi from "joi";
import { constants } from "../../../utils/constant";

const userReqSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
})

const createUserSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
  first_name: Joi.string().min(3).max(64).required(),
  last_name: Joi.string().min(3).max(64).required(),
  middle_name: Joi.string().min(3).max(64).optional(),
  email: Joi.string()
  .trim()
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,63}$/) 
  .min(10).max(255).required().allow("").allow(null).messages({
    "string.base": "Email must be a text value.",
    "string.empty": "Email cannot be empty.",
    "string.min": "Email must be at least 6 characters long.",
    "string.max": "Email cannot exceed 254 characters.",
    "string.pattern.base": "Invalid Email Address."
  }),
  profile_id: Joi.string().max(255).required(),
  role: Joi.string().max(255).required(),
  status: Joi.string().valid("active", "inactive").required(),
  street: Joi.string().max(255).allow('', null).optional(),
  city: Joi.string().max(255).allow('', null).optional(),
  state: Joi.string().max(255).allow('', null).optional(),
  zip_code: Joi.string().max(20).allow('', null).optional(),
  phone: Joi.string().pattern(/^[1-9]\d{9,14}$/).optional(),
  country: Joi.string().max(255).allow('', null).optional(),
  created_by: Joi.string().max(255).required(),
});

const enterpriseUserSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
  first_name: Joi.string().min(3).max(64).required(),
  last_name: Joi.string().min(3).max(64).required(),
  middle_name: Joi.string().max(255).optional(),
  status: Joi.string().valid("active", "inactive").required(),
  email: Joi.string()
  .trim()
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,63}$/) 
  .min(10).max(255).required().allow("").allow(null).messages({
    "string.base": "Email must be a text value.",
    "string.empty": "Email cannot be empty.",
    "string.min": "Email must be at least 6 characters long.",
    "string.max": "Email cannot exceed 254 characters.",
    "string.pattern.base": "Invalid Email Address."
  }),
  mobile: Joi.string().max(10).required(),
  profile_id: Joi.string().max(255).required(),
  designation: Joi.string().max(255).required(),
  manager_name: Joi.string().max(255).required(),
  manager_email: Joi.string().max(255).required(),
  manager_employee_id: Joi.string().max(255).required(),
  employee_id: Joi.string().max(255).required(),
  employment_date: Joi.date().optional(),
  department_id: Joi.string().max(255).required(),
  function_group_id: Joi.string().max(255).required(),
  created_by: Joi.string().max(255).required(),
})

const updateUserSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
  rid: Joi.string().max(255).required(),
  azure_id: Joi.string().max(255).required(),
  first_name: Joi.string().min(3).max(64).required(),
  middle_name: Joi.string().min(3).max(64).optional(),
  last_name: Joi.string().min(3).max(64).required(),
  profile_id: Joi.string().max(255).required(),
  role: Joi.string().max(255).required(),
  status: Joi.string().valid("active", "inactive").required(),
  street: Joi.string().max(255).allow('', null).optional(),
  city: Joi.string().max(255).allow('', null).optional(),
  state: Joi.string().max(255).allow('', null).optional(),
  zip_code: Joi.string().max(20).allow('', null).optional(),
  country: Joi.string().max(255).allow('', null).optional(),
  phone: Joi.string().pattern(/^[1-9]\d{9,10}$/).optional(),
  modified_by: Joi.string().max(255).allow('', null).optional(),
});

const userDetailsUpdateSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
  rid: Joi.string().max(255).required(),
  azure_id: Joi.string().max(255).required(),
  first_name: Joi.string().min(3).max(64).required(),
  last_name: Joi.string().min(3).max(64).required(),
  middle_name: Joi.string().min(3).max(64).optional(),
  status: Joi.string().valid("active", "inactive").required(),
  mobile: Joi.string().max(10).required(),
  profile_id: Joi.string().max(255).required(),
  designation: Joi.string().max(255).required(),
  manager_name: Joi.string().max(255).required(),
  manager_email: Joi.string().max(255).required(),
  manager_employee_id: Joi.string().max(255).required(),
  employee_id: Joi.string().max(255).required(),
  employment_date: Joi.date().optional(),
  department_id: Joi.string().max(255).required(),
  function_group_id: Joi.string().max(255).required(),
  updated_by: Joi.string().max(255).required(),
});

const listUserSchema = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default("1"),
  limit: Joi.string().pattern(/^[0-9]+$/).default("10"),
  search: Joi.string().max(255).optional().allow(""),
  filters: Joi.string().default("{}"),
  sortBy: Joi.string().default("created_datetime"),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
  organization: Joi.string().required().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE),
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
  organization: Joi.string().required().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE),
});

const listUserByIdSchema = Joi.object({
  organization: Joi.string().required().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE),
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
  source_profileId: Joi.string().required().messages({
    "string.empty": "Source Profile ID is required",
    "any.required": "Source Profile ID is required"
  }),
  profile_name: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Profile name is required",
    "string.min": "Profile name must be at least 3 characters long",
    "string.max": "Profile name cannot exceed 255 characters",
    "any.required": "Profile name is required"
  }),
  profile_description: Joi.string().max(500).allow('', null).optional(),
  profile_type: Joi.string().required().messages({
    "string.empty": "Profile type is required",
    "any.required": "Profile type is required"
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
  id: Joi.string().when('type', {
    is: Joi.exist(),
    then: Joi.required().messages({
      "string.empty": "ID is required when type is specified",
      "any.required": "ID is required when type is specified"
    }),
    otherwise: Joi.optional()
  })
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
  permissions: Joi.array().items(
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
    "array.base": "Permissions must be an array",
    "any.required": "Permissions array is required"
  })
});

const editProfilePermissionsSchema = Joi.object({
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
  permissions: Joi.array().items(
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
    "array.base": "Permissions must be an array",
    "any.required": "Permissions array is required"
  })
});

export { createUserSchema, updateUserSchema, enterpriseUserSchema, userDetailsUpdateSchema, userReqSchema, listUserSchema, listUserByIdSchema, exportUserSchema, userPermissionByIdSchema, createProfileSchema, getProfilePermissionsSchema, updateProfilePermissionsSchema, editProfilePermissionsSchema, listProfileSchema };
