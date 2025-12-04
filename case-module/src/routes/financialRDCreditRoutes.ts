import { Router } from "express";
import controller from "../controllers";

import multer from "multer";
import { checkUserStatusMiddleware } from "../middlewares/authmiddleware";

const routes: Router = Router();

routes.post("/rd-credit/fed/generation", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.financialRDCreditFederal);
routes.get("/rd-credit/:accountRid/cases/:caseRid/states/:stateCode/preview", checkUserStatusMiddleware("rd_credit_view"), controller.financialRDCreditController.getRDCreditResultsByCaseAndState);
routes.post("/rd-credit/process/initiate", checkUserStatusMiddleware("rd_credit_cal"), controller.financialRDCreditController.initiateRDCreditProcess);
export default routes;