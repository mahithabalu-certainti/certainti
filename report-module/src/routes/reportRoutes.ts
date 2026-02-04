import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Apply auth middleware to the route
router.get("/countDetails", checkUserStatusMiddleware("NA"), controller.reportController.getCountDetails);

export default router;
