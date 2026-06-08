import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import programsRouter from "./programs";
import coursesRouter from "./courses";
import assignmentsRouter from "./assignments";
import gradesRouter from "./grades";
import announcementsRouter from "./announcements";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import transcriptsRouter from "./transcripts";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(studentsRouter);
router.use(programsRouter);
router.use(coursesRouter);
router.use(assignmentsRouter);
router.use(gradesRouter);
router.use(announcementsRouter);
router.use(dashboardRouter);
router.use(transcriptsRouter);
router.use(messagesRouter);

export default router;
