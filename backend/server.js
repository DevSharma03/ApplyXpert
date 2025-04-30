const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const atsRoute = require("./routes/atsRoute");
const authRoute = require("./routes/auth");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5500"],
    credentials: true,
  })
);

// MongoDB Connection with retry logic
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });
      console.log("MongoDB Connected Successfully");
      return true;
    } catch (err) {
      console.error(
        `MongoDB connection attempt ${retries + 1} failed:`,
        err.message
      );
      retries++;
      if (retries === MAX_RETRIES) {
        console.error("Failed to connect to MongoDB after maximum retries");
        return false;
      }
      // Wait for 2 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

// Create required directories if they don't exist
const uploadsDir = path.join(__dirname, "uploads");
const reportsDir = path.join(__dirname, "reports");
const mlReportsDir = path.join(
  __dirname,
  "../ml-models/resume_matcher/reports"
);
[uploadsDir, reportsDir].forEach((dir) => {
  if (!require("fs").existsSync(dir)) {
    require("fs").mkdirSync(dir, { recursive: true });
  }
});

// Middleware to serve static PDF files from different locations
const serveStaticPDF = (req, res, next) => {
  const filename = path.basename(req.path);

  // Check if file exists in backend/reports first
  const backendPath = path.join(reportsDir, filename);
  if (require("fs").existsSync(backendPath)) {
    // Get the file size
    const stats = require("fs").statSync(backendPath);

    if (stats.size === 0) {
      return res.status(404).json({ error: "File exists but is empty" });
    }

    // Set proper headers for download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": stats.size,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Content-Disposition",
    });

    // Use sendFile with absolute path and error handling
    return res.sendFile(backendPath, { dotfiles: "allow" }, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        if (!res.headersSent) {
          return res.status(500).json({ error: "Error sending the PDF file" });
        }
      }
    });
  }

  // Then check in ml-models/resume_matcher/reports
  const mlPath = path.join(mlReportsDir, filename);
  if (require("fs").existsSync(mlPath)) {
    // Get the file size
    const stats = require("fs").statSync(mlPath);

    if (stats.size === 0) {
      return res.status(404).json({ error: "File exists but is empty" });
    }

    // Set proper headers for download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": stats.size,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "Content-Disposition",
    });

    // Use sendFile with absolute path and error handling
    return res.sendFile(mlPath, { dotfiles: "allow" }, (err) => {
      if (err) {
        console.error(`Error sending file: ${err.message}`);
        if (!res.headersSent) {
          return res.status(500).json({ error: "Error sending the PDF file" });
        }
      }
    });
  }

  // If not found in either location, proceed to next middleware
  next();
};

// Handle PDF file requests
app.use("/api/ats/reports", serveStaticPDF);

// Fallback to static directory for other files
app.use("/api/ats/reports", express.static(reportsDir));

// Routes
app.use("/api/auth", authRoute);
app.use("/api/ats", atsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5001;

// Initialize server with DB connection
const startServer = async () => {
  const isConnected = await connectDB();
  if (!isConnected) {
    console.error("Could not start server due to database connection failure");
    process.exit(1);
  }

  app
    .listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`Frontend should connect to http://localhost:${PORT}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Please try a different port or stop the existing server.`
        );
        process.exit(1);
      } else {
        console.error("Server startup error:", err);
        process.exit(1);
      }
    });
};

startServer();
