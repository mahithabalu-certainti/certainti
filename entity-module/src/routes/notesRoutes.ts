import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router();

routes.post("/upload/notes", checkUserStatusMiddleware("NA"), upload.single('notes'), controller.notesController.createNotes);
routes.get("/list/export", checkUserStatusMiddleware("NA"), controller.notesController.exportAllNotes);
routes.get("/list", checkUserStatusMiddleware("NA"), controller.notesController.getAllNotes);
routes.get("/list/summary/export", checkUserStatusMiddleware("NA"), controller.notesController.exportAllNotesSummary);
routes.get("/list/summary", checkUserStatusMiddleware("NA"), controller.notesController.getAllNotesSummary);

export default routes;

