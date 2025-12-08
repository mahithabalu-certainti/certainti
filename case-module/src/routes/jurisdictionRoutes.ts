import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)
routes.get('/details', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.getJurisdictionConfiguration)
routes.get('/config/details', checkUserStatusMiddleware("NA"), controller.jurisdictionController.getJurisdictionConfigDetailsById)
routes.post('/config/update', checkUserStatusMiddleware("NA"), controller.jurisdictionController.updateJurisdictionConfig)


export default routes