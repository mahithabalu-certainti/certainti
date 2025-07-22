import {Router} from 'express'
import controller from '../controllers'

const routes : Router = Router()

routes.put('/update', controller.settingController.settingController)

export default routes