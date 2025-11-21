import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post("/rd-credit/generation", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.financialRDCredit
);

export default routes;