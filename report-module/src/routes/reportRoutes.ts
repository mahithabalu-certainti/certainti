import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/countDetails", checkUserStatusMiddleware("NA"), controller.reportController.getCountDetails);
router.get("/meetingList", checkUserStatusMiddleware("NA"), controller.reportController.getMeetingList);
router.get("/meetingListExport", checkUserStatusMiddleware("NA"), controller.reportController.exportMeetingList);
router.get("/weeklyProductivityList", checkUserStatusMiddleware("NA"), controller.reportController.getWeeklyProductivityList);
router.get("/weeklyProductivityExport", checkUserStatusMiddleware("NA"), controller.reportController.exportWeeklyProductivity);

router.get("/upcomingTasksList", checkUserStatusMiddleware("NA"), controller.reportController.getUpcomingTasksList);
router.get("/upcomingTasksExport", checkUserStatusMiddleware("NA"), controller.reportController.exportUpcomingTasks);

router.get("/dueTodayOverdueTasksList", checkUserStatusMiddleware("NA"), controller.reportController.getDueTodayOverdueTasksList);
router.get("/dueTodayOverdueTasksExport", checkUserStatusMiddleware("NA"), controller.reportController.exportDueTodayOverdueTasks);

router.get("/openTasksList", checkUserStatusMiddleware("NA"), controller.reportController.getOpenTasksList);
router.get("/openTasksExport", checkUserStatusMiddleware("NA"), controller.reportController.exportOpenTasks);

router.get("/completedTasksThisWeekList", checkUserStatusMiddleware("NA"), controller.reportController.getCompletedTasksThisWeekList);
router.get("/completedTasksThisWeekExport", checkUserStatusMiddleware("NA"), controller.reportController.exportCompletedTasksThisWeek);

router.get("/pendingFollowUpsList", checkUserStatusMiddleware("NA"), controller.reportController.getPendingFollowUpsList);
router.get("/pendingFollowUpsExport", checkUserStatusMiddleware("NA"), controller.reportController.exportPendingFollowUps);

router.get("/overdueApprovalsList", checkUserStatusMiddleware("NA"), controller.reportController.getOverdueApprovalsList);
router.get("/overdueApprovalsExport", checkUserStatusMiddleware("NA"), controller.reportController.exportOverdueApprovals);

router.get("/overallProjectValue", checkUserStatusMiddleware("NA"), controller.reportController.getOverallProjectValue);

router.get("/globalLevelChart", checkUserStatusMiddleware("NA"), controller.reportController.getGlobalLevelChart);

router.get("/casesByHealthStatus", checkUserStatusMiddleware("NA"), controller.reportController.getCasesByHealthStatus);



export default router;
