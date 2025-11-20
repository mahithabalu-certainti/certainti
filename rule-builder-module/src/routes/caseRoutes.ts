import { Router } from "express";
import * as CaseController from "../controllers/caseController";

const router = Router();

router.post("/", CaseController.createCase);
router.get("/", CaseController.getAllCases);
router.get("/:caseId", CaseController.getCaseById);
router.put("/:caseId", CaseController.updateCase);
router.delete("/:caseId", CaseController.deleteCase);

export default router;
