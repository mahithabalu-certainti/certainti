import { Router } from 'express'
import controller from '../controllers'
import { checkUserStatusMiddleware } from '../middlewares/authmiddleware'
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router()


routes.post(
  "/create",
  checkUserStatusMiddleware("rd_form_data_mapper_create"),
  upload.single('file'),
  controller.dataMapperController.createDataMapper
);

routes.post(
  "/list",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  controller.dataMapperController.listDataMapperForms
);

routes.post(
  "/export",
  checkUserStatusMiddleware("rd_form_data_mapper_export"),
  controller.dataMapperController.exportDataMapperForms
);

routes.get(
  "/detail/:rid",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  controller.dataMapperController.getDataMapperFormsDetail
);

routes.post(
  "/update",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  upload.single('file'),
  controller.dataMapperController.editDataMapper
);

routes.get(
  "/mappingDetail/:rid",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  controller.dataMapperController.getDataMapperFormsMappingDetail
);

routes.post(
  "/updateMapping",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  controller.dataMapperController.editDataMapperMapping
);

routes.get(
  "/objectsList",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  controller.dataMapperController.getObjectsList
);

routes.get(
  "/uploadStatus/list",
  checkUserStatusMiddleware("rd_form_data_mapper_view_edit"),
  controller.dataMapperController.listDataMapperUploadStatus
);


export default routes