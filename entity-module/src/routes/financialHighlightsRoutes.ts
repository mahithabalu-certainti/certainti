import {Router} from 'express'
import controllers from '../controllers'

const routes : Router = Router()

routes.post('/list', controllers.financialController.listFinancialHighlightsAccounts)
routes.post('/project', controllers.financialController.listFinancialHighlightsProjects)
routes.get('/list/projectCost', controllers.financialController.financialHighlightsProjectCostAccountLevel)
routes.get('/list/projectCost/export', controllers.financialController.exportFinancialHighlightsProjectCostAccountLevel)

export default routes