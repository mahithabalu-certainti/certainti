import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post("/federal/calculate", checkUserStatusMiddleware("NA"), controller.financialRDCreditController.financialRDCreditFederal);
routes.get("/preview/:accountRid/:caseRid/:stateCode", checkUserStatusMiddleware("NA"), controller.financialRDCreditController.findRdCreditComputedResults);
routes.post("/process/initiate", checkUserStatusMiddleware("NA"), controller.financialRDCreditController.initiateRDCreditProcess);
routes.get("/status/:accountRid/:caseRid", checkUserStatusMiddleware("NA"), controller.financialRDCreditController.findProcessStatusByCaseRid);
export default routes;