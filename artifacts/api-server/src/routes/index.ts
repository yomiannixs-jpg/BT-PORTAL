import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import programsRouter from "./programs";
import coursesRouter from "./courses";
import assignmentsRouter from "./assignments";
import gradesRouter from "./grades";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(programsRouter);
router.use(coursesRouter);
router.use(assignmentsRouter);
router.use(gradesRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);

export default router;
