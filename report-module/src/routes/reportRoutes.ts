import { Router } from "express";
import controller from "../controllers";
import { checkUserStatusMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/countDetails", checkUserStatusMiddleware("NA"), controller.reportController.getCountDetails);
router.post("/meetingList", checkUserStatusMiddleware("NA"), controller.reportController.getMeetingList);
router.post("/meetingListExport", checkUserStatusMiddleware("NA"), controller.reportController.exportMeetingList);
router.post("/weeklyProductivityList", checkUserStatusMiddleware("NA"), controller.reportController.getWeeklyProductivityList);
router.post("/weeklyProductivityExport", checkUserStatusMiddleware("NA"), controller.reportController.exportWeeklyProductivity);

router.post("/upcomingTasksList", checkUserStatusMiddleware("NA"), controller.reportController.getUpcomingTasksList);
router.post("/upcomingTasksExport", checkUserStatusMiddleware("NA"), controller.reportController.exportUpcomingTasks);

router.post("/dueTodayOverdueTasksList", checkUserStatusMiddleware("NA"), controller.reportController.getDueTodayOverdueTasksList);
router.post("/dueTodayOverdueTasksExport", checkUserStatusMiddleware("NA"), controller.reportController.exportDueTodayOverdueTasks);

router.post("/openTasksList", checkUserStatusMiddleware("NA"), controller.reportController.getOpenTasksList);
router.post("/openTasksExport", checkUserStatusMiddleware("NA"), controller.reportController.exportOpenTasks);

router.post("/completedTasksThisWeekList", checkUserStatusMiddleware("NA"), controller.reportController.getCompletedTasksThisWeekList);
router.post("/completedTasksThisWeekExport", checkUserStatusMiddleware("NA"), controller.reportController.exportCompletedTasksThisWeek);

router.post("/pendingFollowUpsList", checkUserStatusMiddleware("NA"), controller.reportController.getPendingFollowUpsList);
router.post("/pendingFollowUpsExport", checkUserStatusMiddleware("NA"), controller.reportController.exportPendingFollowUps);

router.post("/overdueApprovalsList", checkUserStatusMiddleware("NA"), controller.reportController.getOverdueApprovalsList);
router.post("/overdueApprovalsExport", checkUserStatusMiddleware("NA"), controller.reportController.exportOverdueApprovals);

router.post("/overallProjectValue", checkUserStatusMiddleware("NA"), controller.reportController.getOverallProjectValue);

router.post("/globalLevelChart", checkUserStatusMiddleware("NA"), controller.reportController.getGlobalLevelChart);

router.post("/casesByHealthStatus", checkUserStatusMiddleware("NA"), controller.reportController.getCasesByHealthStatus);



export default router;
