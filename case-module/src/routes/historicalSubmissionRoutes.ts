import { Router } from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes: Router = Router()

routes.post(
    "/add",
    checkUserStatusMiddleware("case_historical_submission_create"),
    controller.historicalSubmissionController.createHistoricalSubmission
);
routes.get(
    "/list",
    checkUserStatusMiddleware("case_historical_submission_view_edit"),
    controller.historicalSubmissionController.listHistoricalSubmission
);
export default routes