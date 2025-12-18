import { Request, Response, Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const routes: Router = Router();

routes.post("/upload/notes", checkUserStatusMiddleware("notes_create"), upload.single('notes'), controller.notesController.createNotes);
routes.get("/list/export", checkUserStatusMiddleware("notes_view_edit"), controller.notesController.exportAllNotes);
routes.get("/list", checkUserStatusMiddleware("notes_view_edit"), controller.notesController.getAllNotes);
routes.post("/list/summary/export", checkUserStatusMiddleware("notes_view_edit"), controller.notesController.exportAllNotesSummary);
routes.post("/list/summary", checkUserStatusMiddleware("notes_view_edit"), controller.notesController.getAllNotesSummary);
routes.get("/list/details", checkUserStatusMiddleware("notes_view_edit"), controller.notesController.fetchNotesDetailsById)
routes.put("/update", checkUserStatusMiddleware("notes_view_edit"), upload.single("notes"), controller.notesController.updateNotes)

export default routes;

