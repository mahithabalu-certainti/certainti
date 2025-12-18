import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.post('/add', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.addOrUpdateJurisdictionConfiguration)
routes.get('/details', checkUserStatusMiddleware("case_jurisdiction_settings_view_edit"), controller.jurisdictionController.getJurisdictionConfiguration)
routes.get('/config/details', checkUserStatusMiddleware("manage_jurisdiction_rule_view_edit"), controller.jurisdictionController.getJurisdictionConfigDetailsById)
routes.get('/config/details/new', checkUserStatusMiddleware("manage_jurisdiction_rule_view_edit"), controller.jurisdictionController.getJurisdictionConfigDataForCreate)
routes.post('/config/update', checkUserStatusMiddleware("manage_jurisdiction_rule_view_edit"), controller.jurisdictionController.updateJurisdictionConfig)
routes.post('/config/create', checkUserStatusMiddleware("manage_jurisdiction_rule_create"), controller.jurisdictionController.createJurisdictionConfig)
routes.get('/config/list', checkUserStatusMiddleware("manage_jurisdiction_rule_view_edit"), controller.jurisdictionController.listJurisdictionsConfigurations)
routes.get('/config/export', checkUserStatusMiddleware("manage_jurisdiction_rule_export"), controller.jurisdictionController.exportJurisdictionsConfigurations)


export default routes