import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import unitsRouter from "./units";
import usersRouter from "./users";
import eyeCallsRouter from "./eyeCalls";
import dashboardRouter from "./dashboard";
import publicFormRouter from "./publicForm";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(unitsRouter);
router.use(usersRouter);
router.use(eyeCallsRouter);
router.use(dashboardRouter);
router.use(publicFormRouter);

export default router;
