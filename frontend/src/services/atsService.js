const API_URL = "http://localhost:5001/api/ats";

export const analyzeResume = async (resumeFile, jobDescription) => {
  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);

    const response = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to analyze resume");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return { error: error.message };
  }
};

export const getAtsScore = async (resumeFile, jobDescription) => {
  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);

    const response = await fetch(`${API_URL}/score`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get ATS score");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("Error getting ATS score:", error);
    return { error: error.message };
  }
};

export const getMissingKeywords = async (resumeFile, jobDescription) => {
  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);

    const response = await fetch(`${API_URL}/missing`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get missing keywords");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error("Error getting missing keywords:", error);
    return { error: error.message };
  }
};

export const getReports = async () => {
  try {
    const response = await fetch(`${API_URL}/report`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get reports");
    }

    return data;
  } catch (error) {
    console.error("Error getting reports:", error);
    return { error: error.message };
  }
};
