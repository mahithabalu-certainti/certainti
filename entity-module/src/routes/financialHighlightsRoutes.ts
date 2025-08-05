import {Router} from 'express'
import controllers from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authMiddleware'

const routes : Router = Router()

routes.post('/list', checkUserStatusMiddleware('account_summary_view'),controllers.financialController.listFinancialHighlightsAccounts)
routes.post('/state',checkUserStatusMiddleware('account_statewise_summary_view'), controllers.financialController.listFinancialHighlightsAccounts)
routes.post('/project', checkUserStatusMiddleware('project_summary_view'),controllers.financialController.listFinancialHighlightsProjects)
routes.get('/list/projectCost', checkUserStatusMiddleware('account_project_cost_view'),controllers.financialController.financialHighlightsProjectCostAccountLevel)
routes.get('/list/projectCost/export', checkUserStatusMiddleware('account_project_cost_view'),controllers.financialController.exportFinancialHighlightsProjectCostAccountLevel)
routes.post('/regions', controllers.financialController.fetchRegionsFromAccountFiscalRegions)
export default routes