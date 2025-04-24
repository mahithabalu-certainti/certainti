export const constants = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  FAILED: 500,
  UNAUTHORIZED: 401,
  SUCCESS_MESSAGE: "Success",
  BAD_REQUEST_MESSAGE: "BadRequest",
  NOT_FOUND_MESSAGE: "NotFound",
  FAILED_MESSAGE: "Failed",
  UNAUTHORIZED_MESSAGE: "Unauthorized",
  FORBIDDEN_MESSAGE: "Forbidden",

  PLATFORM_TWO: "PF2.0",
  PLATFORM_ONE: "EA"
  
} as const;


export const NODE_ENV = {
  DEV: "DEV",
  PROD: "PRODUCTION"
}
