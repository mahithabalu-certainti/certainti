import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post("/generate", controller.otpController.generateOtp);
routes.post("/verify", controller.otpController.verifyOtp);
routes.post("/resend", controller.otpController.resendOtp);

export default routes;