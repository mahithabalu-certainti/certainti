import {Router} from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'

const routes : Router = Router()

routes.get('/getConfig', checkUserStatusMiddleware("NA"), controller.rdFormMapperController.processRdFormMapperRequests)
routes.post("/process/initiate", checkUserStatusMiddleware("NA"), controller.rdFormMapperController.initiateRDFormFillerProcess);
routes.get("/preview", checkUserStatusMiddleware("NA"), controller.rdFormMapperController.getRdFormMapperResults);

export default routes