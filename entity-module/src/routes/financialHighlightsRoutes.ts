import {Router} from 'express'
import controllers from '../controllers'

const routes : Router = Router()

routes.post('/list', controllers.financialController.listFinancialHighlightsAccounts)
routes.post('/state', controllers.financialController.listFinancialHighlightsAccounts)
routes.post('/project', controllers.financialController.listFinancialHighlightsProjects)

export default routes