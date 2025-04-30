# ATS Resume Analyzer

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

For support or questions, please contact [yourname@example.com](mailto:yourname@example.com)

JD:

Job Title: Full Stack Web Developer (React & Node.js)
Job Description:
We are seeking a highly motivated Full Stack Web Developer with strong proficiency in JavaScript, React.js, Node.js, and Express.js to join our growing tech team. The ideal candidate will have hands-on experience building responsive and scalable web applications from the ground up. You’ll work on cross-functional teams to design, develop, and deploy dynamic solutions for real-world use cases.

Responsibilitis:
Design and implement responsive web applications using React.js, JavaScript, HTML5, and CSS3.
Develop robust backend APIs with Node.js and Express.js, and manage data using MongoDB and MySQL.
Integrate RESTful APIs with front-end components ensuring high performance and responsiveness.
Collaborate with designers and other developers to build seamless, user-friendly features.
Utilize version control systems (Git/GitHub) for code management and collaboration.
Optimize applications for maximum speed, scalability, and maintainability.
Use Google Cloud Platform (GCP) and hosting services like Vercel/Netlify for deployment and cloud integration.
Implement authentication (JWT), role-based access control, and WebSocket features where needed.
Write clean, maintainable, and well-documented code.
Participate in agile development cycles, code reviews, and continuous integration workflows.

Requirements:
Strong foundation in JavaScript, HTML5, and CSS3.
Experience with React.js, Redux, Next.js, and TailwindCSS.
Backend development experience using Node.js, Express.js, MongoDB, MySQL, and Mongoose.
Familiarity with EJS Templates and full-stack rendering concepts.
Proficient in using RESTful APIs, Git, GitHub, and deployment tools.
Understanding of cloud services like Google Cloud Platform (GCP).
Good communication, problem-solving, and teamwork skills.
Bachelor's degree in Computer Science, AI & Data Science, or a related field (or pursuing).

Preferred Skills (Nice to Have):
Knowledge of Python and AI agent integration.
Experience working on OCR-based tools and real-time applications.
Exposure to ERP systems, event management platforms, or medical web applications.
Certifications in Full Stack Web Development, Google IT Automation, or Data Analysis.
