import { Request, Response } from "express";
import { handleErrorResponse, validateAccountSettingRequest, validateProjectSettingRequest } from "../utils/helpers";
import { HttpStatus, STATUS_MESSAGE, UPDATE_FLAG } from "../utils/constants";
import Configurations from "../config/config";

const Services = Configurations.getInstance().getServices()
const settingServices = Services.settingServices

const settingController = async (req : Request, res : Response) => {
    try {
        const data = req.body;
        const userId = req.headers['x-user-id']
        if(!userId) {
            handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, STATUS_MESSAGE.userIdMissingInHeader);
            return;
        }
        if(data.flag == UPDATE_FLAG.account) {
            let validateRequest = validateAccountSettingRequest(data)
            if(validateRequest) {
                handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, validateRequest)
                return;
            }
        }
        else {
            let validateRequest = validateProjectSettingRequest(data)
            if(validateRequest) {
                handleErrorResponse(res, HttpStatus.BAD_REQUEST, HttpStatus.BAD_REQUEST_MESSAGE, validateRequest)
                return
            }
        }
        data.userId = userId
        const result = await settingServices.updateSettings(data)
        if(result.statusCode == HttpStatus.SUCCESS) {
            handleErrorResponse(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS_MESSAGE, result.statusMessage)
            return;
        }else{
            handleErrorResponse(res, result.statusCode, HttpStatus.BAD_REQUEST_MESSAGE, result.statusMessage)
            return;
        }
    } catch (error : any) {
        handleErrorResponse(res, HttpStatus.FAILED, HttpStatus.FAILED_MESSAGE, error.message)
        return;
    }
}

export default {
    settingController
}