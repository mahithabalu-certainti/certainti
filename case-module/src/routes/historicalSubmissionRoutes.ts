import { Router } from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes: Router = Router()

routes.post(
    "/add",
    checkUserStatusMiddleware("NA"),
    controller.historicalSubmissionController.createHistoricalSubmission
);
routes.get(
    "/list",
    checkUserStatusMiddleware("NA"),
    controller.historicalSubmissionController.listHistoricalSubmission
);
export default routes