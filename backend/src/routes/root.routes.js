import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { wasteAnalysisRoutes } from "./wasteAnalysis.routes.js";
import { teamRoutes } from "./team.routes.js";
import { collectorRoutes } from "./collector.routes.js";
import { truckRoutes } from "./Truck..routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/waste-analysis", wasteAnalysisRoutes);
router.use("/teams", teamRoutes);
router.use("/collector", collectorRoutes);
router.use("/truck",truckRoutes );

export { router as rootRouter };
