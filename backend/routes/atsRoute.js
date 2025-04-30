const express = require("express");
const router = express.Router();
const {
  atsReport,
  atsScoreValue,
  keyMissingValues,
  analyzeResume,
  upload,
  getReport,
} = require("../controllers/atsController");

// Get all ATS reports
router.get("/report", atsReport);

// Get a specific PDF report by filename
router.get("/reports/:filename", getReport);

// Get ATS score for a resume
router.post("/score", upload.single("resume"), atsScoreValue);

// Get missing keywords for a resume
router.post("/missing", upload.single("resume"), keyMissingValues);

// Analyze multiple resumes
router.post("/analyze", upload.array("resumes", 10), analyzeResume);

module.exports = router;
