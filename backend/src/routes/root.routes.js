import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { wasteAnalysisRoutes } from "./wasteAnalysis.routes.js";
import { teamRoutes } from "./team.routes.js";
import { userRoutes } from "./user.routes.js";
import { truckRoutes } from "./Truck.routes.js";
import { productRoutes } from "./product.routes.js";
import { redeemRoutes } from "./redeem.routes.js";
import { dispatchRoutes } from "./dispatch.routes.js";
import { userDashboardRoutes } from "./dashboard.user.route.js";
import { notificationRoutes } from "./notification.route.js";
import { analyticsRoutes } from "./dashboard.admin.route.js";
import { authCollectorRoutes } from "./auth.collector.routes.js";
import { collectorDispatchRoutes } from "./collector.dispatch.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/waste-analysis", wasteAnalysisRoutes);
router.use("/teams", teamRoutes);
router.use("/truck", truckRoutes);
router.use("/dispatch", dispatchRoutes);
router.use("/product", productRoutes);
router.use("/redeem", redeemRoutes);
router.use("/user", userRoutes);
router.use("/admin-dashboard", analyticsRoutes);
router.use("/user-dashboard", userDashboardRoutes);
router.use("/notification", notificationRoutes);
router.use("/collector-auth", authCollectorRoutes);
router.use("/collector", collectorDispatchRoutes);

export { router as rootRouter };
