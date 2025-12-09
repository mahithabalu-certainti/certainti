import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)
routes.get('/details', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.getJurisdictionConfiguration)
routes.get('/config/details', checkUserStatusMiddleware("NA"), controller.jurisdictionController.getJurisdictionConfigDetailsById)
routes.post('/config/update', checkUserStatusMiddleware("NA"), controller.jurisdictionController.updateJurisdictionConfig)
routes.get('/config/new', checkUserStatusMiddleware("NA"), controller.jurisdictionController.getJurisdictionConfigDataForNewEntry)
routes.get('/config/list', checkUserStatusMiddleware("NA"), controller.jurisdictionController.listJurisdictionsConfigurations)
routes.get('/config/export', checkUserStatusMiddleware("NA"), controller.jurisdictionController.exportJurisdictionsConfigurations)


export default routes