import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import PreviewIcon from "@mui/icons-material/Preview";
import CompareIcon from "@mui/icons-material/Compare";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import "../Styling/ATS_score.css";

const API_BASE_URL = "http://localhost:5001";

const ATS_Score = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [processingFiles, setProcessingFiles] = useState([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const clearMessages = () => {
    setError(null);
    setUploadError(null);
    setSuccessMessage(null);
  };

  const handleFileChange = (e) => {
    clearMessages();
    const selectedFiles = Array.from(e.target.files);

    // Validate file types
    const invalidFiles = selectedFiles.filter((file) => {
      const fileType = file.type.toLowerCase();
      return (
        !fileType.includes("pdf") &&
        !fileType.includes("msword") &&
        !fileType.includes("wordprocessingml")
      );
    });

    if (invalidFiles.length > 0) {
      setUploadError("Please upload only PDF or Word documents.");
      return;
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > 10 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setUploadError("Files must be smaller than 10MB.");
      return;
    }

    // Check total number of files
    if (files.length + selectedFiles.length > 10) {
      setUploadError("You can upload a maximum of 10 files.");
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    showSnackbar(`Successfully added ${selectedFiles.length} file(s)`);
  };

  const handleRemoveFile = (index) => {
    clearMessages();
    setFiles(files.filter((_, i) => i !== index));
    showSnackbar("File removed", "info");
  };

  const handleDescriptionChange = (e) => {
    clearMessages();
    setJobDescription(e.target.value);
  };

  const handleClearAll = () => {
    setFiles([]);
    setJobDescription("");
    setResults([]);
    clearMessages();
    showSnackbar("All fields cleared", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one resume.");
      return;
    }

    setLoading(true);
    setProcessingFiles([...files]);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("resumes", file);
      });
      formData.append("jobDescription", jobDescription);

      const response = await fetch(`${API_BASE_URL}/api/ats/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to analyze resumes"
        );
      }

      const data = await response.json();

      // Handle the new response format
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        const errorResults = data.results.filter(
          (result) => result.error || !result.success
        );

        if (errorResults.length > 0) {
          if (errorResults.length === data.results.length) {
            setError(
              "Failed to analyze resumes. Please try again or contact support."
            );
          } else {
            setError(
              `Some resumes could not be analyzed: ${errorResults
                .map((r) => r.filename)
                .join(", ")}`
            );
          }
        } else {
          showSnackbar(
            `Successfully analyzed ${data.results.length} resume(s)!`
          );
        }
      } else if (Array.isArray(data)) {
        // Handle old response format for backward compatibility
        setResults(data);
        const errorResults = data.filter((result) => result.error);
        if (errorResults.length > 0) {
          setError(
            `Some resumes could not be analyzed: ${errorResults
              .map((r) => r.filename)
              .join(", ")}`
          );
        } else {
          showSnackbar("Analysis completed successfully!");
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || "An error occurred while analyzing the resumes.");
    } finally {
      setLoading(false);
      setProcessingFiles([]);
    }
  };

  // Helper function to process report URLs
  const getReportUrl = (result) => {
    if (!result) {
      console.log("getReportUrl: Result is null or undefined");
      return null;
    }

    // Try to get the URL from either report_url or report_path
    let reportUrl = result.report_url || result.report_path;

    if (!reportUrl) {
      console.log("getReportUrl: No report URL or path in result");
      return null;
    }

    try {
      // Remove any invalid characters that might cause issues
      reportUrl = reportUrl.replace(/[\r\n\t]/g, "");

      // Clean up any double slashes except after http:// or https://
      reportUrl = reportUrl.replace(/([^:])\/\//g, "$1/");

      // Make sure URL has a leading slash if it's a relative path
      if (!reportUrl.startsWith("http") && !reportUrl.startsWith("/")) {
        reportUrl = `/${reportUrl}`;
      }

      // For relative URLs, add the API base URL
      if (!reportUrl.startsWith("http")) {
        reportUrl = `${API_BASE_URL}${reportUrl}`;
      }

      // Encode any special characters in the filename portion
      // First split the URL to get the path
      const urlParts = reportUrl.split("/");

      // The last part is the filename which may need encoding
      if (urlParts.length > 0) {
        const filename = urlParts[urlParts.length - 1];
        // Only encode the filename part, not the whole URL
        const encodedFilename = encodeURIComponent(filename);
        urlParts[urlParts.length - 1] = encodedFilename;

        // Rejoin the URL with encoded filename
        reportUrl = urlParts.join("/");
      }

      console.log("Final processed report URL:", reportUrl);
      return reportUrl;
    } catch (error) {
      console.error("Error processing report URL:", error);
      // Return the original URL if there was an error during processing
      return result.report_url || result.report_path;
    }
  };

  const handleDownloadReport = async (result) => {
    if (!result) {
      setError("Invalid report information");
      return;
    }

    setIsReportLoading(true);
    setError(null);
    try {
      const reportUrl = getReportUrl(result);
      if (!reportUrl) {
        throw new Error("No report URL available for this result");
      }

      console.log("Downloading report from:", reportUrl);

      // Generate a filename from the result data if needed
      const filename =
        result.original_filename || result.filename || "resume_report.pdf";
      const downloadFilename = `${filename.replace(
        /\.[^/.]+$/,
        ""
      )}_report.pdf`;

      // Try multiple methods to ensure download works

      // Method 1: Direct window.open
      window.open(reportUrl, "_blank");
      showSnackbar("Report download initiated");

      // Method 2: Create a download link
      setTimeout(() => {
        try {
          const link = document.createElement("a");
          link.href = reportUrl;
          link.target = "_blank";
          link.download = downloadFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (fallbackErr) {
          console.error("Fallback download method error:", fallbackErr);
        }
      }, 500);

      // Method 3: Use fetch API as ultimate fallback
      setTimeout(async () => {
        try {
          const response = await fetch(reportUrl);
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = downloadFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        } catch (fetchErr) {
          console.error("Fetch fallback error:", fetchErr);
          // If all methods fail, show specific error
          setError(
            "Download failed. Please try again or check console for details."
          );
        }
      }, 1000);
    } catch (err) {
      console.error("Download error:", err);
      setError(`Failed to download report: ${err.message}`);

      // Extra fallback for debugging
      if (result.report_filename) {
        console.log("Report filename from result:", result.report_filename);
      }
      if (result.report_path) {
        console.log("Report path from result:", result.report_path);
      }
      if (result.report_url) {
        console.log("Report URL from result:", result.report_url);
      }
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleViewReport = async (result) => {
    if (!result) {
      setError("Invalid report information");
      return;
    }

    setIsReportLoading(true);
    setError(null);
    try {
      const reportUrl = getReportUrl(result);
      if (!reportUrl) {
        throw new Error("No report URL available for this result");
      }

      console.log("Viewing report from:", reportUrl);

      // Try to open directly first
      const opened = window.open(reportUrl, "_blank");

      // If the window.open failed (popup blocked, etc)
      if (!opened && typeof opened !== "undefined") {
        // Create a fallback link
        const link = document.createElement("a");
        link.href = reportUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showSnackbar("Report opened in new tab");
    } catch (err) {
      console.error("View error:", err);
      setError(`Failed to view report: ${err.message}`);

      // Log additional details for debugging
      if (result.report_path) {
        console.log("Report path from result:", result.report_path);
      }
      if (result.report_url) {
        console.log("Report URL from result:", result.report_url);
      }
    } finally {
      setIsReportLoading(false);
    }
  };

  // Helper function to get score color
  const getScoreColor = (score) => {
    if (score >= 80) return "#4caf50"; // Green
    if (score >= 60) return "#ff9800"; // Orange
    return "#f44336"; // Red
  };

  // Helper function to get score text
  const getScoreText = (score) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Needs Improvement";
  };

  return (
    <Container maxWidth="lg" className="ats-score-container">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} className="ats-score-card">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Typography
                variant="h4"
                className="ats-score-title"
                gutterBottom={isMobile}
              >
                ATS Resume Matcher
              </Typography>
              {(files.length > 0 || results.length > 0) && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleClearAll}
                  disabled={loading}
                  sx={{ mt: isMobile ? 1 : 0 }}
                >
                  Clear All
                </Button>
              )}
            </Box>

            <form onSubmit={handleSubmit} className="upload-form">
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Upload Resumes
                </Typography>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="resume-upload"
                  disabled={loading}
                />
                <label htmlFor="resume-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={loading}
                    fullWidth
                  >
                    Choose Files
                  </Button>
                </label>
                {files.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Files ({files.length}):
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        maxHeight: "150px",
                        overflowY: "auto",
                        p: 1,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                      }}
                    >
                      {files.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => handleRemoveFile(index)}
                          sx={{ m: 0.5 }}
                          disabled={loading}
                          deleteIcon={<DeleteIcon />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {uploadError && (
                <Alert
                  severity="error"
                  sx={{ mt: 2, mb: 2 }}
                  onClose={() => setUploadError(null)}
                >
                  {uploadError}
                </Alert>
              )}

              {successMessage && (
                <Alert
                  severity="success"
                  sx={{ mt: 2, mb: 2 }}
                  onClose={() => setSuccessMessage(null)}
                >
                  {successMessage}
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                label="Job Description"
                value={jobDescription}
                onChange={handleDescriptionChange}
                disabled={loading}
                className="textarea-input"
                sx={{ mb: 3 }}
                placeholder="Paste the job description here..."
                helperText="For best results, include the full job description with requirements"
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || files.length === 0}
                className="submit-button"
                startIcon={
                  loading ? <CircularProgress size={20} /> : <CompareIcon />
                }
              >
                {loading
                  ? `Analyzing (${processingFiles.length} remaining)...`
                  : "Analyze Resumes"}
              </Button>
            </form>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            {loading && processingFiles.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography>
                  Analyzing resumes... {processingFiles.length} remaining
                </Typography>
                <LinearProgress />
              </Box>
            )}

            {results.length > 0 && (
              <Box sx={{ mt: 4 }} className="analysis-results-section">
                <Typography
                  variant="h5"
                  gutterBottom
                  className="analysis-results-title"
                >
                  Analysis Results{" "}
                  {results.length > 1 ? `(${results.length} resumes)` : ""}
                </Typography>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  className="analysis-results-subtitle"
                >
                  Resumes ranked by match score:
                </Typography>

                {results.map((result, index) => (
                  <Card
                    key={index}
                    sx={{
                      mt: 2,
                      transition: "transform 0.2s",
                    }}
                    className={`result-card ${
                      index === 0 && results.length > 1 ? "top-match" : ""
                    }`}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          flexDirection: isMobile ? "column" : "row",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            component="div"
                            className="result-filename"
                          >
                            {result.displayName ||
                              result.original_filename ||
                              result.filename}
                          </Typography>
                          {result.error ? (
                            <Typography
                              variant="body1"
                              color="error"
                              sx={{ mt: 1 }}
                            >
                              Error: {result.error}
                            </Typography>
                          ) : (
                            <>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 1,
                                  gap: 2,
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="subtitle1"
                                    className="score-label"
                                  >
                                    ATS Match Score:
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: "relative",
                                        display: "inline-flex",
                                        mr: 2,
                                      }}
                                    >
                                      <CircularProgress
                                        variant="determinate"
                                        value={result.score || 0}
                                        size={60}
                                        thickness={5}
                                        sx={{
                                          color: getScoreColor(
                                            result.score || 0
                                          ),
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          top: 0,
                                          left: 0,
                                          bottom: 0,
                                          right: 0,
                                          position: "absolute",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          component="div"
                                          color="text.secondary"
                                          sx={{ fontWeight: "bold" }}
                                        >
                                          {result.score || 0}%
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: getScoreColor(result.score || 0),
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {getScoreText(result.score || 0)}
                                    </Typography>
                                  </Box>
                                </Box>

                                {result.section_scores &&
                                  Object.keys(result.section_scores).length >
                                    0 && (
                                    <Box className="section-scores-container">
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ mb: 1 }}
                                        className="score-label"
                                      >
                                        Section Scores:
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 0.5,
                                        }}
                                      >
                                        {Object.entries(
                                          result.section_scores
                                        ).map(([section, score]) => (
                                          <Tooltip
                                            key={section}
                                            title={`${
                                              section.charAt(0).toUpperCase() +
                                              section.slice(1)
                                            }: ${score}%`}
                                            arrow
                                            placement="top"
                                          >
                                            <Box className="section-score-item">
                                              <span className="section-score-label">
                                                {section
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  section.slice(1)}
                                                :
                                              </span>
                                              <span className="section-score-value">
                                                {score}%
                                              </span>
                                            </Box>
                                          </Tooltip>
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                              </Box>

                              {result.missing_keywords && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography
                                    variant="subtitle1"
                                    className="section-title"
                                    gutterBottom
                                  >
                                    Missing Keywords:
                                  </Typography>
                                  {Object.entries(result.missing_keywords).map(
                                    ([category, keywords]) =>
                                      keywords &&
                                      Array.isArray(keywords) &&
                                      keywords.length > 0 && (
                                        <Box key={category} sx={{ mb: 1 }}>
                                          <Typography
                                            variant="subtitle2"
                                            sx={{
                                              textTransform: "capitalize",
                                            }}
                                            className="score-label"
                                          >
                                            {category.replace("_", " ")}:
                                          </Typography>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: 0.5,
                                            }}
                                          >
                                            {keywords.map((keyword, idx) => (
                                              <Chip
                                                key={idx}
                                                label={keyword || ""}
                                                size="small"
                                                className="error-chip"
                                              />
                                            ))}
                                          </Box>
                                        </Box>
                                      )
                                  )}
                                  {!Object.entries(
                                    result.missing_keywords
                                  ).some(
                                    ([_, keywords]) =>
                                      keywords &&
                                      Array.isArray(keywords) &&
                                      keywords.length > 0
                                  ) && (
                                    <Typography variant="body2">
                                      No significant missing keywords found
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              {result.suggestions &&
                                Array.isArray(result.suggestions) &&
                                result.suggestions.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography
                                      variant="subtitle1"
                                      className="section-title"
                                      gutterBottom
                                    >
                                      Improvement Suggestions:
                                    </Typography>
                                    <ul
                                      style={{
                                        paddingLeft: "20px",
                                        margin: "8px 0",
                                      }}
                                    >
                                      {result.suggestions.map(
                                        (suggestion, idx) => (
                                          <li key={idx}>
                                            <Typography variant="body2">
                                              {suggestion || ""}
                                            </Typography>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </Box>
                                )}
                            </>
                          )}
                        </Box>

                        {!result.error && (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              minWidth: isMobile ? "100%" : "auto",
                            }}
                          >
                            <Button
                              variant="contained"
                              startIcon={
                                isReportLoading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <DownloadIcon />
                                )
                              }
                              onClick={() => handleDownloadReport(result)}
                              disabled={isReportLoading}
                              fullWidth={isMobile}
                              className="action-button"
                            >
                              {isReportLoading
                                ? "Downloading..."
                                : "Download Report"}
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={
                                isReportLoading ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <PreviewIcon />
                                )
                              }
                              onClick={() => handleViewReport(result)}
                              disabled={isReportLoading}
                              fullWidth={isMobile}
                              className="action-button"
                            >
                              {isReportLoading ? "Loading..." : "View Report"}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {isReportLoading && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ATS_Score;
