import { Router } from "express";
import modelRoutes from "./model";
import workflowRoutes from "./workflow";
import taskRoutes from "./task";
import serverRoutes from "./server";

const router = Router();

router.use("/api/model", modelRoutes);
router.use("/api/workflow", workflowRoutes);
router.use("/api/task", taskRoutes);
router.use("/api/server", serverRoutes);

export default router;
