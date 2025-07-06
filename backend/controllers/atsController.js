const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { exec } = require("child_process");
const express = require("express");

// Function to check and install Python dependencies
const checkPythonDependencies = async () => {
  console.log("Checking Python environment and dependencies...");

  try {
    // Check Python version
    const pythonEnv = await checkPythonEnvironment();
    console.log(`Python version: ${pythonEnv.version}`);

    // Check if spaCy is installed and install the model if needed
    console.log("Checking spaCy installation...");

    // Create a command to check if spaCy and en_core_web_sm are installed
    const checkCommand = `${pythonEnv.command} -c "import spacy; print('SpaCy version:', spacy.__version__); try: nlp = spacy.load('en_core_web_sm'); print('en_core_web_sm model is installed'); except: print('en_core_web_sm model is NOT installed')"`;

    exec(checkCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error("Error checking spaCy:", error.message);
        return;
      }

      console.log("spaCy check output:", stdout);

      // If model is not installed, try to install it
      if (stdout.includes("NOT installed")) {
        console.log("Installing spaCy model en_core_web_sm...");
        const installCommand = `${pythonEnv.command} -m spacy download en_core_web_sm`;

        exec(installCommand, (installError, installStdout, installStderr) => {
          if (installError) {
            console.error(
              "Error installing spaCy model:",
              installError.message
            );
            return;
          }

          console.log("spaCy model installation output:", installStdout);
          console.log("spaCy model en_core_web_sm has been installed");
        });
      }
    });
  } catch (error) {
    console.error("Error checking Python dependencies:", error.message);
  }
};

// Run the dependency check when the server starts
checkPythonDependencies();

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Define file filter for supported resume formats
const fileFilter = (req, file, cb) => {
  // Accept only PDF, DOCX, DOC files
  const allowedFileTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF and Word documents are allowed."),
      false
    );
  }
};

// Configure multer with size limits and file filter
exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: fileFilter,
});

// Helper function to sanitize job description text for command line
const sanitizeJobDescription = (text) => {
  if (!text) return "";

  // Replace problematic characters with their safe alternatives
  // These are especially important for command line passing
  let sanitized = text
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/`/g, "\\`") // Escape backticks
    .replace(/\$/g, "\\$") // Escape dollar signs
    .replace(/\r\n|\n|\r/g, " ") // Replace newlines with spaces
    .replace(/\t/g, " "); // Replace tabs with spaces

  // Replace common problematic Unicode characters
  const replacements = {
    "\u2022": "-", // bullet
    "\u2023": "-", // triangular bullet
    "\u2043": "-", // hyphen bullet
    "\u2219": "-", // bullet operator
    "\u25CF": "-", // black circle
    "\u25E6": "-", // white bullet
    "\u25AA": "-", // black small square
    "\u25AB": "-", // white small square
    "\u2013": "-", // en dash
    "\u2014": "-", // em dash
    "\u2018": "'", // left single quote
    "\u2019": "'", // right single quote
    "\u201C": '"', // left double quote
    "\u201D": '"', // right double quote
    "\u2026": "...", // ellipsis
    "\u00A0": " ", // non-breaking space
    "\u00A9": "(c)", // copyright
    "\u00AE": "(r)", // registered trademark
    "\u2122": "(tm)", // trademark
    "\u00B1": "+/-", // plus-minus sign
    "\u2212": "-", // minus sign
    "\u00D7": "x", // multiplication sign
    "\u00F7": "/", // division sign
    "\u20AC": "EUR", // euro sign
    "\u00A3": "GBP", // pound sign
    "\u00A5": "JPY", // yen sign
    "\u00A2": "c", // cent sign
    "\u2713": "√", // check mark
    "\u2714": "√", // heavy check mark
    "\u2716": "x", // heavy multiplication x
    "\u2717": "x", // ballot x
    "\u2718": "x", // heavy ballot x
    "\u271A": "+", // heavy plus sign
    "\u271B": "+", // open centre cross
    "\u271C": "+", // heavy open centre cross
    "\u271D": "+", // latin cross
    "\u271E": "+", // shadowed white latin cross
    "\u271F": "+", // outlined latin cross
    "\u00B6": "¶", // pilcrow sign (paragraph)
    "\u00A7": "§", // section sign
    "\u2020": "†", // dagger
    "\u2021": "‡", // double dagger
    "\u2248": "~", // almost equal to
    "\u2260": "!=", // not equal to
    "\u226E": "<", // less-than
    "\u226F": ">", // greater-than
    // Use Unicode escape sequences for problematic characters
    "\u2022": "-", // bullet point (•)
    "\u2013": "-", // en dash (–)
    "\u2014": "-", // em dash (—)
    "\u2018": "'", // left single quote (')
    "\u2019": "'", // right single quote (')
    "\u201C": '"', // left double quote (")
    "\u201D": '"', // right double quote (")
    "\u2026": "...", // ellipsis (…)
  };

  for (const [char, replacement] of Object.entries(replacements)) {
    sanitized = sanitized.replace(new RegExp(char, "g"), replacement);
  }

  // Handle any remaining non-ASCII characters
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, (match) => {
    console.warn(
      `Replacing non-ASCII character: ${match} (Unicode: ${match
        .charCodeAt(0)
        .toString(16)})`
    );
    return " ";
  });

  // Final cleanup - ensure there are no invalid sequences
  sanitized = sanitized.replace(/\\+(?![ntr$"`])/g, "\\"); // Fix multiple escapes not followed by special chars
  sanitized = sanitized.replace(/\s+/g, " ").trim(); // Normalize whitespace

  return sanitized;
};

// Check Python environment
const checkPythonEnvironment = () => {
  return new Promise((resolve) => {
    exec("python --version", (error, stdout, stderr) => {
      if (error) {
        // Try python3 if python fails
        exec("python3 --version", (error2, stdout2, stderr2) => {
          if (error2) {
            resolve({
              command: "python",
              version: "unknown",
              error: true,
            });
          } else {
            resolve({
              command: "python3",
              version: stdout2.trim(),
              error: false,
            });
          }
        });
      } else {
        resolve({
          command: "python",
          version: stdout.trim(),
          error: false,
        });
      }
    });
  });
};

// Helper function to run Python script with improved error handling
const runPythonScript = async (
  scriptPath,
  filePath,
  jobDescription,
  originalFilename = null
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check Python environment
      const pythonEnv = await checkPythonEnvironment();
      const pythonCommand = pythonEnv.command;

      // Ensure script path exists
      if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python script not found at: ${scriptPath}`));
      }

      // Create reports directory if it doesn't exist
      const reportsDir = path.join(__dirname, "../reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Test if directory is writeable
      try {
        const testFile = path.join(reportsDir, "test_write.txt");
        fs.writeFileSync(testFile, "Test write access", { flag: "w" });
        fs.unlinkSync(testFile);
      } catch (error) {
        console.error(`Error: Reports directory is not writeable`);
      }

      // Sanitize job description for command line
      const sanitizedJobDescription = sanitizeJobDescription(jobDescription);

      // Sanitize original filename if provided
      let safeOriginalFilename = "";
      if (originalFilename) {
        // Replace problematic characters
        safeOriginalFilename = originalFilename
          .replace(/"/g, '\\"') // Escape double quotes
          .replace(/[<>:"|?*]/g, "_") // Replace Windows invalid filename chars
          .replace(/\r\n|\r|\n/g, " ") // Replace newlines with spaces
          .replace(/\t/g, " "); // Replace tabs with spaces
      }

      // Add original filename as an additional parameter if provided
      const filenameArg = originalFilename
        ? ` --original-filename "${safeOriginalFilename}"`
        : "";

      // Add output directory parameter to redirect output to backend/reports
      // Convert backslashes to forward slashes for Python compatibility
      const safeReportsDir = reportsDir.replace(/\\/g, "/");
      const outputDirArg = ` --output-dir "${safeReportsDir}"`;

      // Set encoding for proper handling of special characters
      const options = {
        encoding: "utf8",
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large outputs
        windowsHide: true, // Hide command window on Windows
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8", // Force Python to use UTF-8 for I/O
          PYTHONLEGACYWINDOWSFSENCODING: "0", // Use UTF-8 for filesystem on Windows
          PYTHONWARNINGS: "ignore", // Suppress Python warnings
        },
      };

      // Run the Python script with the file path and job description as arguments
      // Normalize file paths for consistent handling
      const normalizedScriptPath = scriptPath.replace(/\\/g, "/");
      const normalizedFilePath = filePath.replace(/\\/g, "/");

      const command = `${pythonCommand} "${normalizedScriptPath}" "${normalizedFilePath}" "${sanitizedJobDescription}"${filenameArg}${outputDirArg}`;

      // Reduced logging - don't log the full command
      // console.log(`Executing: ${command}`);

      const pythonProcess = exec(command, options, (error, stdout, stderr) => {
        if (error) {
          console.error(`Python script error: ${error.message}`);
          return reject(error);
        }

        // Don't log stderr unless it contains critical errors
        // Only log stderr if it contains critical error information
        if (stderr && stderr.includes("Error:")) {
          console.error(`Python critical error: ${stderr}`);
        }

        try {
          // Attempt to parse the JSON output
          let jsonResult = null;

          // Look for valid JSON in the output
          const jsonMatches = stdout.match(/({[\s\S]*})/);
          if (jsonMatches && jsonMatches[0]) {
            try {
              jsonResult = JSON.parse(jsonMatches[0]);
              // Don't log success messages
              // console.log("Successfully parsed JSON result");
            } catch (innerError) {
              console.warn(`JSON parsing error: ${innerError.message}`);
            }
          }

          // If no match worked, try to find any JSON object
          if (!jsonResult) {
            const jsonStart = stdout.indexOf("{");
            const jsonEnd = stdout.lastIndexOf("}");

            if (jsonStart === -1 || jsonEnd === -1) {
              // Reduce log verbosity, just output the error
              console.error("Could not find valid JSON in output");
              return reject(new Error("Invalid JSON output format"));
            }

            const jsonString = stdout.substring(jsonStart, jsonEnd + 1);
            try {
              jsonResult = JSON.parse(jsonString);
              // Don't log success messages
              // console.log("Successfully parsed JSON using substring method");
            } catch (parseError) {
              console.error(`Failed to parse JSON: ${parseError.message}`);
              return reject(parseError);
            }
          }

          // Normalize report paths to ensure consistency
          if (jsonResult.report_path) {
            // Replace any backslashes with forward slashes
            jsonResult.report_path = jsonResult.report_path.replace(/\\/g, "/");

            // Extract the filename from the path
            const reportFilename = path.basename(jsonResult.report_path);

            // Set a proper report URL for API access
            jsonResult.report_url = `/api/ats/reports/${reportFilename}`;

            // If a report was generated, copy it to the backend reports directory
            try {
              const sourceReportPath = jsonResult.report_path;
              const targetReportPath = path.join(reportsDir, reportFilename);

              // Check if the source file exists and is different from target
              if (
                fs.existsSync(sourceReportPath) &&
                sourceReportPath !== targetReportPath &&
                path.dirname(sourceReportPath) !== reportsDir
              ) {
                fs.copyFileSync(sourceReportPath, targetReportPath);
                console.log(
                  `Copied report from ${sourceReportPath} to ${targetReportPath}`
                );
              }
            } catch (copyError) {
              console.error(`Error copying report: ${copyError.message}`);
              // Continue execution even if copy fails
            }
          }

          // Skip debug info unless explicitly in development mode
          if (
            process.env.NODE_ENV === "development" &&
            process.env.DEBUG === "true"
          ) {
            jsonResult._debug = {
              command: command,
              pythonVersion: pythonEnv.version,
              scriptPath: scriptPath,
            };
          }

          return resolve(jsonResult);
        } catch (parseError) {
          console.error(`JSON parsing error: ${parseError.message}`);
          return reject(parseError);
        }
      });

      // Add timeout to prevent hanging
      const timeoutMs = 180000; // 3 minutes
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error(`Python script execution timed out after 3 minutes`));
      }, timeoutMs);

      pythonProcess.on("exit", () => {
        clearTimeout(timeout);
      });
    } catch (execError) {
      console.error(`Error executing Python script: ${execError.message}`);
      return reject(execError);
    }
  });
};

// Ensure necessary directories exist
const ensureDirectories = () => {
  const reportsDir = path.join(__dirname, "../reports");
  if (!fs.existsSync(reportsDir)) {
    try {
      fs.mkdirSync(reportsDir, { recursive: true });
    } catch (error) {
      console.error(`Error creating reports directory: ${error.message}`);
    }
  }
};

// Run this when the module is loaded
ensureDirectories();

// Analyze resume
exports.analyzeResume = async (req, res) => {
  try {
    // Validate if resume file and job description are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one resume file.",
      });
    }

    if (!req.body.jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Please provide a job description.",
      });
    }

    // Get job description
    const jobDescription = req.body.jobDescription;

    // Use only the enhanced analyzer
    const scriptPath = path.join(
      __dirname,
      "../../ml-models/resume_matcher/enhanced_analyzer.py"
    );

    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return res.status(500).json({
        success: false,
        message:
          "Enhanced analyzer script not found. Please check the installation.",
      });
    }

    // Array to store the analysis results for each resume
    const results = [];

    // Process each resume file
    for (const file of req.files) {
      try {
        const filePath = file.path;

        // Run the Python script and get the analysis result
        const result = await runPythonScript(
          scriptPath,
          filePath,
          jobDescription,
          file.originalname
        );

        // Add the result to the array with proper error handling
        if (result.error) {
          results.push({
            filename: file.originalname,
            displayName: file.originalname,
            error: result.error,
            score: 0,
            success: false,
          });
        } else {
          // Ensure both report_path and report_url exist for backward compatibility
          if (result.report_path && !result.report_url) {
            result.report_url = result.report_path;
          } else if (result.report_url && !result.report_path) {
            result.report_path = result.report_url;
          }

          // Add the result to the array with proper filename
          results.push({
            ...result,
            filename: file.originalname || result.filename,
            displayName: file.originalname,
            tempFilename: file.filename,
            success: true,
          });
        }
      } catch (fileError) {
        // Add error result for this file
        results.push({
          filename: file.originalname,
          displayName: file.originalname,
          error: fileError.message,
          score: 0,
          success: false,
        });
      }
    }

    // Sort results by score (descending)
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return res.status(200).json({
      success: true,
      results: results,
    });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error occurred during resume analysis",
      error: error.message,
    });
  }
};

exports.atsReport = async (req, res) => {
  try {
    const reportPath = path.join(__dirname, "../reports");

    // Check if directory exists
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: "Reports directory not found" });
    }

    // Read directory and filter out non-PDF files
    const allFiles = fs.readdirSync(reportPath);
    const reports = allFiles.filter((file) => file.endsWith(".pdf"));

    res.json({ reports });
  } catch (error) {
    console.error("Error retrieving reports:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.atsScoreValue = async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res
        .status(400)
        .json({ error: "Missing resume or job description" });
    }

    const pythonScriptPath = path.join(
      __dirname,
      "../../ml-models/resume_matcher/enhanced_analyzer.py"
    );

    const result = await runPythonScript(
      pythonScriptPath,
      req.file.path,
      req.body.jobDescription
    );

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ score: result.score });
  } catch (error) {
    console.error("Error getting ATS score:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.keyMissingValues = async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res
        .status(400)
        .json({ error: "Missing resume or job description" });
    }

    const pythonScriptPath = path.join(
      __dirname,
      "../../ml-models/resume_matcher/enhanced_analyzer.py"
    );

    const result = await runPythonScript(
      pythonScriptPath,
      req.file.path,
      req.body.jobDescription
    );

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      missingKeywords: result.missing_keywords || result.missing_skills || [],
      suggestions: result.suggestions || [],
      sectionScores: result.section_scores || {},
      semanticSimilarity: result.semantic_similarity || 0,
      keywordMatch: result.keyword_match || 0,
    });
  } catch (error) {
    console.error("Error getting missing keywords:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Serve report file
exports.getReport = async (req, res) => {
  try {
    const reportName = req.params.filename;

    if (!reportName) {
      console.log("Report request missing filename parameter");
      return res.status(400).json({
        success: false,
        message: "No report filename specified",
      });
    }

    // Security check - validate the filename has a pdf extension and contains no path traversal
    if (
      !reportName.endsWith(".pdf") ||
      reportName.includes("..") ||
      reportName.includes("/") ||
      reportName.includes("\\")
    ) {
      console.log(`Rejected invalid report filename: ${reportName}`);
      return res.status(400).json({
        success: false,
        message: "Invalid report filename",
      });
    }

    // Ensure reports directory exists
    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      console.log(`Created reports directory: ${reportsDir}`);
    }

    // Normalize filenames in case they contain URL-encoded characters
    let normalizedFilename;
    try {
      // Decode URL-encoded characters
      normalizedFilename = decodeURIComponent(reportName);
    } catch (e) {
      // If decoding fails, use the original name
      normalizedFilename = reportName;
    }

    // Check the reports directory first
    const reportPath = path.join(reportsDir, normalizedFilename);

    if (fs.existsSync(reportPath)) {
      console.log(`Serving report from backend directory: ${reportPath}`);
      return res.sendFile(reportPath, {
        headers: { "Content-Type": "application/pdf" },
      });
    }

    // If not found, check in the ml-models directory
    const mlReportsDir = path.join(
      __dirname,
      "../../ml-models/resume_matcher/reports"
    );
    const mlReportPath = path.join(mlReportsDir, normalizedFilename);

    if (fs.existsSync(mlReportPath)) {
      console.log(`Found report in ml-models directory: ${mlReportPath}`);

      // Try to copy the file to the backend reports directory
      try {
        fs.copyFileSync(mlReportPath, reportPath);
        console.log(`Copied report to backend directory: ${reportPath}`);
      } catch (copyError) {
        console.error(`Error copying report: ${copyError.message}`);
        // Continue even if copy fails, we'll serve from original location
      }

      // Serve the file from wherever it exists
      const fileToServe = fs.existsSync(reportPath) ? reportPath : mlReportPath;
      console.log(`Serving report from: ${fileToServe}`);
      return res.sendFile(fileToServe, {
        headers: { "Content-Type": "application/pdf" },
      });
    }

    // Try again with the filename encoded or decoded (opposite of what we tried first)
    // This handles cases where the filename might have been URL-encoded in different ways
    let alternateFilename;
    try {
      if (normalizedFilename === reportName) {
        // If we previously used the original, try decoded
        alternateFilename = decodeURIComponent(reportName);
      } else {
        // If we previously decoded, try the original
        alternateFilename = reportName;
      }

      // Check both directories with the alternate filename
      const altBackendPath = path.join(reportsDir, alternateFilename);
      if (fs.existsSync(altBackendPath)) {
        console.log(
          `Serving report using alternate filename: ${altBackendPath}`
        );
        return res.sendFile(altBackendPath, {
          headers: { "Content-Type": "application/pdf" },
        });
      }

      const altMlPath = path.join(mlReportsDir, alternateFilename);
      if (fs.existsSync(altMlPath)) {
        console.log(
          `Serving report from ml-models using alternate filename: ${altMlPath}`
        );
        return res.sendFile(altMlPath, {
          headers: { "Content-Type": "application/pdf" },
        });
      }
    } catch (altError) {
      console.error(`Error trying alternate filename: ${altError.message}`);
    }

    // Report not found in either location
    console.log(`Report not found: ${reportName}`);
    return res.status(404).json({
      success: false,
      message: "Report file not found",
    });
  } catch (error) {
    console.error(`Error serving report: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while serving report",
      error: error.message,
    });
  }
};
