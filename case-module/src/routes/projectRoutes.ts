import { Router } from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes: Router = Router()


routes.get(
  "/details/:accountId/:caseId/:projectId",
  checkUserStatusMiddleware("projects_view_edit"),
  controller.projectController.projectById
);

routes.post(
  "/projectFinancialSummary",
  checkUserStatusMiddleware("project_summary_view"),
  controller.projectController.listFinancialHighlightsProjects
);

routes.post(
  "/resourceCost/details",
  checkUserStatusMiddleware("project_resource_cost_view"),
  controller.projectController.resourceCostsForFinancialHighlights
);

export default routes