# ATS Resume Analyzer & Job Auto Applier

This application helps job seekers improve their resumes by analyzing them against job descriptions using NLP techniques.

## Features

- Upload multiple resumes and compare them against job descriptions
- Get ATS match scores for each resume
- Identify missing keywords and skills
- Generate detailed PDF reports with suggestions for improvement
- Multi-file support for comparing different resume versions

## Setup Instructions

### Prerequisites 

- Node.js (v14 or higher)
- Python 3.8+ with pip
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**

```
git clone [repository-url]
cd job-apply-automation
```

2. **Install backend dependencies**

```
cd backend
npm install
```

3. **Install frontend dependencies**

```
cd ../frontend
npm install
```

4. **Install Python dependencies**

```
cd ../ml-models/resume_matcher
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

5. **Configure MongoDB**

Create a `.env` file in the backend directory:

```
MONGODB_URI=mongodb://localhost:27017/job-automation
PORT=5001
JWT_SECRET=your_secret_key
```

6. **Start the application**

Using the provided scripts (Windows):

```
scripts/start_server.bat
```

Or manually:

```
# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory)
npm start
```

## Troubleshooting

### Common Issues

#### 1. "Could not load spaCy model" error

This occurs when the en_core_web_sm model is not installed:

```
python -m spacy download en_core_web_sm
```

#### 2. Report download not working

Check the following:

- Server is running on port 5001
- Backend reports directory exists
- Report files are being generated correctly

Use the test script to diagnose issues:

```
node scripts/test_server.js
```

#### 3. MongoDB connection issues

Ensure MongoDB is running locally or your connection string is correct in your .env file.

#### 4. PDF generation errors

PDF generation depends on proper text extraction from documents. Check that:

- Resume files are properly formatted
- You have permissions to create files in the reports directory
- The file paths are correctly configured

## API Endpoints

- `POST /api/ats/analyze` - Analyze multiple resumes
- `GET /api/ats/reports/:filename` - Download a report
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

## Technologies Used

- Frontend: React, Material UI
- Backend: Node.js, Express
- Database: MongoDB
- ML: Python, spaCy, PyMuPDF
- Document Processing: PDF extraction and generation tools

## License

MIT

## Contact

For support or questions, please contact [work.devashishsharma09@gmail.com](mailto:work.devashishsharma09@gmail.com)
