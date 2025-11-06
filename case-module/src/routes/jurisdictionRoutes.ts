import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("NA"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)
routes.get('/details/:accountRid/:caseRid', checkUserStatusMiddleware("NA"), controller.jurisdictionController.getJurisdictionConfiguration)

export default routes