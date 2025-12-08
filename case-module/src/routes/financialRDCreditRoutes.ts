import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post("/federal/calculate", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.financialRDCreditFederal);
routes.get("/:accountRid/case/:caseRid/state/:stateCode/preview", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.getRDCreditResultsByCaseAndState);
routes.post("/process/initiate", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.initiateRDCreditProcess);
routes.get("/:accountRid/case/:caseRid/status", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.findProcessStatusByCaseRid);
export default routes;