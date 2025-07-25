import {Router} from 'express'
import controllers from '../controllers'

const routes : Router = Router()

routes.post('/list', controllers.financialController.listFinancialHighlightsAccounts)

export default routes