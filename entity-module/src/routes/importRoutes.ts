import { Router } from "express";
import controller from '../controllers'
const router: Router = Router();

router.post('/list', controller.importListController.fetchAllImportList)

export default router