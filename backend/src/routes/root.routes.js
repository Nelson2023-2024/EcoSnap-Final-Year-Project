import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { wasteAnalysisRoutes } from "./wasteAnalysis.routes.js";
import { teamRoutes } from "./team.routes.js";
import { userRoutes } from "./user.routes.js";
import { truckRoutes } from "./Truck.routes.js";
import { productRoutes } from "./product.routes.js";
import { redeemRoutes } from "./redeem.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/waste-analysis", wasteAnalysisRoutes);
router.use("/teams", teamRoutes);
router.use("/truck", truckRoutes);
// router.use("/dispatch",dispatchRoutes);
router.use("/product", productRoutes);
router.use("/redeem", redeemRoutes);
router.use("/user", userRoutes);

export { router as rootRouter };
