import { Router } from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router()


routes.post(
  "/create",
  checkUserStatusMiddleware("NA"),
  upload.single('file'),
  controller.dataMapperController.createDataMapper
);



export default routes