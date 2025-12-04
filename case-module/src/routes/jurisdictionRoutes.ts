import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)
routes.get('/details', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.getJurisdictionConfiguration)

export default routes