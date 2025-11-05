import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("NA"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)

export default routes