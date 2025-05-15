import Joi from "joi";
import { constants } from "../../../utils/constant";

const userReqSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
})

const createUserSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
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
  status: Joi.string().valid("active", "inactive").required().label("Status"),
  street: Joi.string().max(255).allow('', null).optional().label("Street"),
  city: Joi.string().max(255).allow('', null).optional().label("City"),
  state: Joi.string().max(255).allow('', null).optional().label("Region"),
  zip_code: Joi.string().max(20).allow('', null).optional().label("Zip Code"),
  phone: Joi.string().pattern(/^[1-9]\d{9,14}$/).optional().label("Phone"),
  country: Joi.string().max(255).allow('', null).optional().label("Country"),
  created_by: Joi.string().max(255).required().label("Created By"),
});

const enterpriseUserSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
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
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
  rid: Joi.string().max(255).required(),
  azure_id: Joi.string().max(255).required(),
  first_name: Joi.string().min(3).max(64).required().label("First Name"),
  middle_name: Joi.string().min(3).max(64).optional(),
  last_name: Joi.string().min(3).max(64).required().label("Last Name"),
  profile_id: Joi.string().max(255).required().label("Profile Id"),
  role: Joi.string().max(255).required().label("Role"),
  status: Joi.string().valid("active", "inactive").required().label("Status"),
  street: Joi.string().max(255).allow('', null).optional().label("Street"),
  city: Joi.string().max(255).allow('', null).optional().label("City"),
  state: Joi.string().max(255).allow('', null).optional().label("Region"),
  zip_code: Joi.string().max(20).allow('', null).optional().label("Zip code"),
  country: Joi.string().max(255).allow('', null).optional().label("Country"),
  phone: Joi.string().pattern(/^[1-9]\d{9,14}$/).optional().label("Phone"),
  modified_by: Joi.string().max(255).allow('', null).optional(),
});

const userDetailsUpdateSchema = Joi.object({
  organization: Joi.string().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE).max(255).required(),
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
  organization: Joi.string().required().valid(constants.PLATFORM_TWO, constants.PLATFORM_ONE),
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

export { createUserSchema, updateUserSchema, enterpriseUserSchema, userDetailsUpdateSchema, userReqSchema, listUserSchema, listUserByIdSchema, exportUserSchema };
