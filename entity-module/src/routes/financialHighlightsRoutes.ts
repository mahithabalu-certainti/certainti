import {Router} from 'express'
import controllers from '../controllers'

const routes : Router = Router()

routes.post('/list', controllers.financialController.listFinancialHighlightsAccounts)
routes.post('/project', controllers.financialController.listFinancialHighlightsProjects)
routes.get('/list/project_cost', controllers.financialController.financialHighlightsProjectCostAccountLevel)
routes.get('/list/project_cost/export', controllers.financialController.exportFinancialHighlightsProjectCostAccountLevel)

export default routes