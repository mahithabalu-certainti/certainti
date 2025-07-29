import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authMiddleware'

const routes : Router = Router()

routes.put('/account', checkUserStatusMiddleware("account_settings_view_edit"), controller.settingController.settingController)
routes.put('/project', checkUserStatusMiddleware("project_settings_view_edit"),controller.settingController.settingController)

export default routes