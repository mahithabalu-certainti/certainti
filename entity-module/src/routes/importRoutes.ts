import { Router } from "express";
import controller from '../controllers'
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const router: Router = Router();

router.post('/list', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.fetchAllImportList)
router.get('/list/:account_rid/:rid', checkUserStatusMiddleware('imports_view_edit'), controller.importListController.importListByRid)
export default router