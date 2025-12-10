import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)
routes.get('/details', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.getJurisdictionConfiguration)
routes.get('/config/details', checkUserStatusMiddleware("NA"), controller.jurisdictionController.getJurisdictionConfigDetailsById)
routes.get('/config/details/new', checkUserStatusMiddleware("NA"), controller.jurisdictionController.getJurisdictionConfigDataForCreate)
routes.post('/config/update', checkUserStatusMiddleware("NA"), controller.jurisdictionController.updateJurisdictionConfig)
routes.post('/config/create', checkUserStatusMiddleware("NA"), controller.jurisdictionController.createJurisdictionConfig)
routes.get('/config/list', checkUserStatusMiddleware("NA"), controller.jurisdictionController.listJurisdictionsConfigurations)
routes.get('/config/export', checkUserStatusMiddleware("NA"), controller.jurisdictionController.exportJurisdictionsConfigurations)


export default routes