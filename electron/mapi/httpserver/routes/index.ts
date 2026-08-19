import { Router } from "express";
import serverRoutes from "./server";
import workflowRoutes from "./workflow";
import toolsRoutes from "./tools";

const router = Router();

router.use("/api/server", serverRoutes);
router.use("/api/workflow", workflowRoutes);
router.use("/api/tools", toolsRoutes);

export default router;
