import { Router } from "express";
import asyncHandler from "express-async-handler";
import upload from "../middleware/upload.middleware.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";
import { User } from "../models/user.model.js";
import { analyzeWasteImage } from "../lib/gemini.process.js";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    try {
      const authUser = req.user._id;
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const { latitude, longitude, address } = req.body;

      // Analyze image via Gemini
      const analysis = await analyzeWasteImage(req.file.buffer, req.file.mimetype);

      // Save result to MongoDB
      const wasteDoc = await wasteAnalysis.create({
        analysedBy: authUser
        ,
        imageURL: `data:${req.file.mimetype};base64,${analysis.imageBase64}`,
        containsWaste: analysis.containsWaste,
        wasteCategories: analysis.wasteCategories || [],
        possibleSource: analysis.possibleSource || "Unknown",
        environmentalImpact: analysis.environmentalImpact || "Not assessed",
        confidenceLevel: analysis.confidenceLevel || "0%",
        status: analysis.containsWaste ? "valid" : "no_waste",
        errorMessage:
          analysis.errorMessage ||
          (analysis.containsWaste ? null : "No visible waste detected."),
        location: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address: address || "Unknown",
        },
      });

      // Award points
      const points = analysis.containsWaste ? 10 : 0;
      await User.findByIdAndUpdate(authUser, { $inc: { points } });

      res.status(201).json({
        success: true,
        data: wasteDoc,
        pointsAwarded: points,
      });
    } catch (error) {
      console.error("AI analysis error:", error.message);

      // Save failed attempt
      const failedDoc = await wasteAnalysis.create({
        analysedBy: req.user._id,
        imageURL: `data:${
          req.file?.mimetype
        };base64,${req.file?.buffer?.toString("base64")}`,
        containsWaste: false,
        wasteCategories: [],
        possibleSource: "N/A",
        environmentalImpact: "N/A",
        confidenceLevel: "0%",
        status: "error",
        errorMessage: error.message,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.longitude) || 0,
            parseFloat(req.body.latitude) || 0,
          ],
          address: req.body.address || "Unknown",
        },
      });

      res.status(500).json({
        success: false,
        message: "Waste analysis failed.",
        error: error.message,
        data: failedDoc,
      });
    }
  })
);

export { router as wasteAnalysisRoutes };
