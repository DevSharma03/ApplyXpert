import os
import re
import json
import sys
import traceback
import io
import argparse
from datetime import datetime
from collections import Counter
import math
import random

# Third-party imports
import spacy
from fpdf import FPDF
import fitz  # PyMuPDF

# Fix console encoding for Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='backslashreplace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='backslashreplace')

# Get the absolute directory of the script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Define reports directory relative to the script
REPORTS_DIR = os.path.join(SCRIPT_DIR, "reports")
# Ensure reports directory exists
os.makedirs(REPORTS_DIR, exist_ok=True)

# Key skills by category
TECH_SKILLS = {
    "programming_languages": [
        "javascript", "typescript", "python", "java", "c++", "c#", "php", "ruby", "go", 
        "swift", "kotlin", "scala", "rust", "perl", "r", "dart"
    ],
    "frontend": [
        "react", "angular", "vue", "next.js", "html", "css", "sass", "less", "bootstrap",
        "tailwind", "material-ui", "styled-components", "redux", "jquery", "webpack", 
        "babel", "dom", "responsive design", "ui/ux", "pwa", "spa"
    ],
    "backend": [
        "node.js", "express", "django", "flask", "spring", "laravel", "rails", "fastapi", 
        "graphql", "rest api", "restful", "microservices", "serverless", "asp.net"
    ],
    "database": [
        "sql", "mysql", "postgresql", "mongodb", "firebase", "oracle", "sqlite", "nosql", 
        "dynamodb", "redis", "elasticsearch", "cassandra", "neo4j", "couchdb", "mariadb"
    ],
    "devops": [
        "docker", "kubernetes", "jenkins", "ci/cd", "aws", "azure", "gcp", "heroku", "vercel",
        "netlify", "ansible", "terraform", "github actions", "travis", "gitlab ci"
    ],
    "tools": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence", "slack", "npm", "yarn",
        "pip", "gradle", "maven", "jupyter", "postman", "figma", "sketch", "adobe xd"
    ],
    "concepts": [
        "agile", "scrum", "tdd", "bdd", "oop", "functional programming", "algorithms", 
        "data structures", "design patterns", "rest", "solid", "mvc", "mvvm", "clean code"
    ]
}

SOFT_SKILLS = [
    "communication", "teamwork", "leadership", "problem solving", "critical thinking",
    "time management", "adaptability", "collaboration", "creativity", "attention to detail",
    "project management", "mentoring", "negotiation", "presentation", "stakeholder management"
]

# Add these additional domain-specific skills after the TECH_SKILLS definition
DOMAIN_SKILLS = {
    "healthcare": [
        "healthcare", "medical", "clinical", "patient care", "hipaa", "ehr", "emr", 
        "telemedicine", "health informatics", "healthcare analytics", "public health"
    ],
    "finance": [
        "finance", "accounting", "banking", "financial analysis", "trading", "investment", 
        "portfolio management", "risk assessment", "financial modeling", "stocks", "bonds"
    ],
    "marketing": [
        "marketing", "advertising", "social media", "seo", "content marketing", "brand management",
        "market research", "digital marketing", "analytics", "crm", "customer acquisition"
    ],
    "data_science": [
        "data science", "machine learning", "deep learning", "neural networks", "nlp", "computer vision",
        "statistics", "big data", "data mining", "data visualization", "predictive modeling", "pytorch", "tensorflow"
    ],
    "cyber_security": [
        "cyber security", "security", "network security", "penetration testing", "ethical hacking",
        "vulnerability assessment", "firewall", "encryption", "incident response", "security audit"
    ],
    "design": [
        "design", "ux", "ui", "user experience", "user interface", "graphic design", "interaction design",
        "wireframing", "prototyping", "usability testing", "design thinking", "accessibility"
    ]
}

# Flatten the tech skills for easier lookup
ALL_TECH_SKILLS = []
for category in TECH_SKILLS:
    ALL_TECH_SKILLS.extend(TECH_SKILLS[category])

# After the ALL_TECH_SKILLS aggregation, add this code
ALL_DOMAIN_SKILLS = []
for category in DOMAIN_SKILLS:
    ALL_DOMAIN_SKILLS.extend(DOMAIN_SKILLS[category])

def error_response(message):
    """Return a standardized error response"""
    print(f"ERROR: {message}", file=sys.stderr)
    return {"error": message, "success": False}

def sanitize_text(text, is_filepath=False):
    """Sanitize text to ensure it can be safely encoded in JSON and PDF output"""
    if text is None:
        return ""
    
    if not isinstance(text, str):
        text = str(text)
    
    # For filepaths, use minimal sanitization to preserve path structure
    if is_filepath:
        # Remove control characters, but keep path separators
        cleaned = ''.join(c if c.isprintable() or c.isspace() or c == '/' or c == '\\' else '_' for c in text)
        # Replace multiple consecutive underscores with a single one
        cleaned = re.sub(r'_+', '_', cleaned)
        # Replace any problematic characters for Windows filenames
        for char in ['<', '>', ':', '"', '|', '?', '*']:
            cleaned = cleaned.replace(char, '_')
        return cleaned
    
    # First, replace problematic characters
    replacements = {
        '\ufffd': '?',      # Replace replacement character with ?
        '\u0000': '',       # Remove null bytes
        '\u2022': '-',      # Replace bullet points with hyphens
        '\u2023': '-',      # Replace triangle bullet with hyphen
        '\u2043': '-',      # Replace hyphen bullet with hyphen
        '\u2219': '-',      # Replace bullet operator with hyphen
        '\u25CF': '-',      # Replace black circle with hyphen
        '\u25E6': '-',      # Replace white bullet with hyphen
        '\u25AA': '-',      # Replace black small square with hyphen
        '\u25AB': '-',      # Replace white small square with hyphen
        '•': '-',           # Replace standard bullet with hyphen
        '–': '-',           # Replace en dash with hyphen
        '—': '-',           # Replace em dash with hyphen
        ''': "'",          
        ''': "'",           # Replace smart single quote with regular quote
        '"': '"',           # Replace smart double quote with regular quote
        '"': '"',           # Replace smart double quote with regular quote
        '…': '...',         # Replace ellipsis with dots
        '\r': ' ',          # Replace carriage returns with spaces
        '\t': ' ',          # Replace tabs with spaces
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    # Try to normalize encoding
    try:
        # First encode to UTF-8 to handle as many characters as possible
        cleaned = text.encode('utf-8', errors='replace').decode('utf-8')
        
        # Convert to ASCII for maximum compatibility, particularly with FPDF
        result = cleaned.encode('ascii', errors='replace').decode('ascii')
        
        # Final cleanup of any remaining non-printable chars
        result = ''.join(c if c.isprintable() or c.isspace() else '?' for c in result)
        
        return result
    except Exception as e:
        print(f"Warning: Encoding error in sanitize_text: {str(e)}", file=sys.stderr)
        # Last resort - strip all non-ASCII characters
        return re.sub(r'[^\x00-\x7F]+', '?', text)

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file with improved encoding handling"""
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            try:
                # Get text with careful encoding handling
                page_text = page.get_text()
                # Clean unprintable characters
                page_text = ''.join(c if c.isprintable() or c.isspace() else ' ' for c in page_text)
                text += page_text + "\n"
            except Exception as e:
                print(f"Warning: Error extracting text from page: {str(e)}", file=sys.stderr)
                continue
        doc.close()
    except Exception as e:
        print(f"Error extracting PDF text: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
    
    # Handle common encoding issues
    try:
        # Replace common problematic characters
        text = text.replace('\ufffd', '?')     # Replace replacement character
        text = text.replace('\u0000', '')      # Remove null bytes
        text = text.replace('\u2022', '-')     # Replace bullet points with hyphens
        text = text.replace('\u2023', '-')     # Replace triangular bullet with hyphen
        text = text.replace('\u2043', '-')     # Replace hyphen bullet with hyphen
        text = text.replace('\u2219', '-')     # Replace bullet operator with hyphen
        text = text.replace('•', '-')          # Replace standard bullet with hyphen
        
        # Try to normalize encoding to ensure consistency
        text = text.encode('utf-8', errors='replace').decode('utf-8')
    except Exception as e:
        print(f"Warning: Error handling special characters: {str(e)}", file=sys.stderr)
    
    return text

def clean_text(text):
    """Clean and normalize text for processing"""
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters and extra whitespace
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def identify_resume_sections(text):
    """Identify and extract different sections of a resume with improved detection"""
    # Common section headers in resumes with more variations
    section_patterns = {
        'summary': r'(summary|profile|objective|about me|professional\s+summary|career\s+objective)',
        'experience': r'(experience|work\s+experience|employment|work\s+history|professional\s+experience|career\s+history)',
        'education': r'(education|academic|qualification|educational\s+background|academic\s+achievements)',
        'skills': r'(skills|technical\s+skills|competencies|expertise|core\s+competencies|qualifications|key\s+skills)',
        'projects': r'(projects|key\s+projects|professional\s+projects|personal\s+projects)',
        'certifications': r'(certifications|certificates|accreditations|professional\s+certifications)',
        'languages': r'(languages|language\s+proficiency|language\s+skills)',
        'interests': r'(interests|hobbies|activities|personal\s+interests)',
        'references': r'(references|recommendations|endorsements)'
    }
    
    # Find sections in the text
    sections = {}
    lines = text.split('\n')
    current_section = 'header'
    sections[current_section] = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        line_lower = line.lower()
        
        # Check if this line is a section header
        found_section = False
        for section, pattern in section_patterns.items():
            if re.search(fr'^\s*{pattern}\s*(:|\n|\Z|$)', line_lower):
                current_section = section
                found_section = True
                sections[current_section] = []
                break
                
        # Also check for section headers with all caps or followed by a line of dashes/underscores
        if not found_section and i < len(lines) - 1:
            next_line = lines[i+1].strip()
            if (line.isupper() and len(line) > 3) or re.match(r'^[-_=]{3,}$', next_line):
                for section, pattern in section_patterns.items():
                    clean_line = line_lower.replace(':', '')
                    if re.search(pattern, clean_line):
                        current_section = section
                        found_section = True
                        sections[current_section] = []
                        # Skip the divider line if present
                        if re.match(r'^[-_=]{3,}$', next_line):
                            i += 1
                        break
        
        # If not a section header, add to current section
        if not found_section:
            sections[current_section].append(line)
        
        i += 1
    
    # Convert lists of lines back to text
    for section in sections:
        sections[section] = '\n'.join(sections[section])
    
    return sections

def extract_keywords(doc, min_length=3):
    """Extract important keywords from a spaCy document"""
    # Skip stopwords and punctuation
    keywords = [token.lemma_ for token in doc 
                if not token.is_stop and not token.is_punct 
                and len(token.text) >= min_length]
    
    # Get most common words
    word_freq = Counter(keywords)
    return word_freq

def calculate_term_frequency(words, doc_length):
    """Calculate term frequency (TF) for each word"""
    return {word: count/doc_length for word, count in words.items()}

def calculate_tfidf(resume_tf, job_tf, resume_keywords, job_keywords):
    """Calculate TF-IDF for matching skills"""
    # All unique words
    all_words = set(resume_keywords.keys()) | set(job_keywords.keys())
    
    # Calculate IDF
    corpus_size = 2  # Just two documents: resume and job description
    idf = {}
    for word in all_words:
        doc_count = 0
        if word in resume_keywords:
            doc_count += 1
        if word in job_keywords:
            doc_count += 1
        idf[word] = math.log(corpus_size / (1 + doc_count))
    
    # Calculate TF-IDF
    resume_tfidf = {word: resume_tf.get(word, 0) * idf.get(word, 0) for word in all_words}
    job_tfidf = {word: job_tf.get(word, 0) * idf.get(word, 0) for word in all_words}
    
    return resume_tfidf, job_tfidf

def calculate_section_match_score(resume_section, job_description, nlp):
    """Calculate how well a resume section matches the job description"""
    if not resume_section or not job_description:
        return 0
    
    # Process texts
    resume_doc = nlp(clean_text(resume_section))
    job_doc = nlp(clean_text(job_description))
    
    # Calculate semantic similarity if both sections have vector representations
    if resume_doc.has_vector and job_doc.has_vector:
        return resume_doc.similarity(job_doc)
    else:
        # Fallback to keyword matching
        resume_words = set(token.lemma_ for token in resume_doc if not token.is_stop and not token.is_punct)
        job_words = set(token.lemma_ for token in job_doc if not token.is_stop and not token.is_punct)
        
        if not job_words:
            return 0
            
        intersection = resume_words.intersection(job_words)
        return len(intersection) / len(job_words)

def extract_skills(text, nlp, skill_list=None):
    """Extract skills from text using NLP and a predefined skill list"""
    if not text:
        return []
    
    # If no skill list provided, use all skills
    if skill_list is None:
        skill_list = ALL_TECH_SKILLS + ALL_DOMAIN_SKILLS + SOFT_SKILLS
    
    # Clean and process the text
    clean = clean_text(text)
    doc = nlp(clean)
    
    found_skills = []
    
    # Extract skills using direct matching with word boundaries
    for skill in skill_list:
        if re.search(r'\b' + re.escape(skill) + r'\b', clean):
            found_skills.append(skill)
    
    # Extract skills using lemmatization for better matching
    lemmatized_text = ' '.join([token.lemma_ for token in doc])
    for skill in skill_list:
        # Don't check again for already found skills
        if skill not in found_skills:
            # Check for lemmatized skill
            skill_tokens = nlp(skill)
            skill_lemmas = ' '.join([token.lemma_ for token in skill_tokens])
            if re.search(r'\b' + re.escape(skill_lemmas) + r'\b', lemmatized_text):
                found_skills.append(skill)
    
    # Also try to find skills by checking for n-grams in the text
    words = clean.split()
    for n in range(2, 4):  # Try bigrams and trigrams
        for i in range(len(words) - n + 1):
            ngram = ' '.join(words[i:i+n])
            for skill in skill_list:
                if skill.lower() == ngram and skill not in found_skills:
                    found_skills.append(skill)
    
    return found_skills

def categorize_skills(skills):
    """Categorize skills into different areas"""
    categorized = {
        "technical": {},
        "domain": {},
        "soft": []
    }
    
    # Categorize technical skills
    for skill in skills:
        skill_lower = skill.lower()
        
        # Check soft skills first
        if skill_lower in SOFT_SKILLS:
            categorized["soft"].append(skill)
            continue
        
        # Check domain skills
        domain_found = False
        for domain, domain_skills in DOMAIN_SKILLS.items():
            if skill_lower in domain_skills:
                if domain not in categorized["domain"]:
                    categorized["domain"][domain] = []
                categorized["domain"][domain].append(skill)
                domain_found = True
                break
        
        if domain_found:
            continue
        
        # Check technical categories
        for category, category_skills in TECH_SKILLS.items():
            if skill_lower in category_skills:
                if category not in categorized["technical"]:
                    categorized["technical"][category] = []
                categorized["technical"][category].append(skill)
                break
    
    return categorized

def analyze_resume_detailed(resume_text, job_description, nlp):
    """Perform detailed analysis of a resume against a job description"""
    # Extract and clean resume sections
    resume_sections = identify_resume_sections(resume_text)
    
    # Get core texts
    clean_resume = clean_text(resume_text)
    clean_job = clean_text(job_description)
    
    # Process with spaCy
    resume_doc = nlp(clean_resume)
    job_doc = nlp(clean_job)
    
    # Extract keywords with frequencies
    resume_keywords = extract_keywords(resume_doc)
    job_keywords = extract_keywords(job_doc)
    
    # Calculate term frequencies
    resume_length = max(1, len(resume_doc))
    job_length = max(1, len(job_doc))
    resume_tf = calculate_term_frequency(resume_keywords, resume_length)
    job_tf = calculate_term_frequency(job_keywords, job_length)
    
    # Calculate TF-IDF
    resume_tfidf, job_tfidf = calculate_tfidf(resume_tf, job_tf, resume_keywords, job_keywords)
    
    # Calculate section-based scores
    section_scores = {}
    for section, content in resume_sections.items():
        section_scores[section] = calculate_section_match_score(content, job_description, nlp)
    
    # Extract all skills from job description
    job_skills = extract_skills(job_description, nlp)
    
    # Extract skills from resume
    resume_skills = extract_skills(resume_text, nlp)
    
    # Find missing skills
    missing_skills = [skill for skill in job_skills if skill.lower() not in [s.lower() for s in resume_skills]]
    
    # Get all skills found in resume
    found_skills = resume_skills
    
    # Get domain skills
    domain_skills_in_job = extract_skills(job_description, nlp, ALL_DOMAIN_SKILLS)
    domain_skills_in_resume = extract_skills(resume_text, nlp, ALL_DOMAIN_SKILLS)
    
    # Calculate special domain match score (gives a bonus for industry-specific skills)
    domain_score = 0
    if domain_skills_in_job:
        matching_domain = len([s for s in domain_skills_in_resume if s.lower() in [js.lower() for js in domain_skills_in_job]])
        domain_score = matching_domain / len(domain_skills_in_job) if domain_skills_in_job else 0
    
    # Calculate overall score with improved weighted components
    # 1. Semantic similarity (25%)
    semantic_score = resume_doc.similarity(job_doc) if resume_doc.has_vector and job_doc.has_vector else 0
    
    # 2. Keyword match (25%)
    skill_match = len([s for s in found_skills if s.lower() in [js.lower() for js in job_skills]])
    keyword_score = skill_match / max(1, len(job_skills)) if job_skills else 0
    
    # 3. Experience section match (20%)
    experience_score = section_scores.get('experience', 0)
    
    # 4. Skills section match (15%)
    skills_score = section_scores.get('skills', 0)
    
    # 5. Domain-specific match (15%)
    # This will help differentiate resumes significantly
    
    # Calculate final weighted score
    final_score = (
        semantic_score * 0.25 + 
        keyword_score * 0.25 + 
        experience_score * 0.20 + 
        skills_score * 0.15 +
        domain_score * 0.15
    ) * 100
    
    # Add small random factor for differentiation (±5%)
    random_factor = random.uniform(-1.0, 1.0)
    final_score = max(0, min(100, final_score + random_factor))
    
    # Prepare result
    result = {
        "score": round(final_score, 1),
        "section_scores": {k: round(v * 100, 1) for k, v in section_scores.items()},
        "missing_skills": missing_skills,
        "found_skills": categorize_skills(found_skills),
        "semantic_similarity": round(semantic_score * 100, 1),
        "keyword_match": round(keyword_score * 100, 1),
        "domain_match": round(domain_score * 100, 1)
    }
    
    return result

def generate_suggestions(missing_skills, resume_sections, score):
    """Generate personalized suggestions based on resume analysis"""
    suggestions = []
    
    # Generate different suggestions based on score ranges
    if score < 40:
        suggestions.append("Your resume needs significant improvements to match this job description.")
    elif score < 70:
        suggestions.append("Your resume partially matches the job requirements but could be improved.")
    else:
        suggestions.append("Your resume matches well with the job description with some minor gaps.")
    
    # Add skill-based suggestions
    if missing_skills:
        if len(missing_skills) <= 3:
            skills_str = ", ".join(missing_skills)
            suggestions.append(f"Add these missing skills to your resume: {skills_str}")
        else:
            top_skills = missing_skills[:3]
            skills_str = ", ".join(top_skills)
            suggestions.append(f"Consider adding these key missing skills: {skills_str} (and {len(missing_skills)-3} more)")
    
    # Section-specific suggestions
    if 'experience' in resume_sections:
        if len(resume_sections['experience'].split()) < 100:
            suggestions.append("Expand your work experience section with more details about your achievements and responsibilities.")
    else:
        suggestions.append("Add a detailed work experience section to your resume.")
    
    if 'skills' in resume_sections:
        if len(resume_sections['skills'].split()) < 50:
            suggestions.append("Enhance your skills section with more specific technical and soft skills relevant to the position.")
    else:
        suggestions.append("Add a dedicated skills section highlighting your technical expertise and soft skills.")
    
    # General suggestions
    suggestions.append("Quantify your achievements with specific metrics and numbers where possible.")
    suggestions.append("Tailor your resume summary to highlight your most relevant experience for this specific role.")
    
    return suggestions[:5]  # Limit to 5 suggestions

def generate_pdf_report(filename, analysis_result, resume_text, job_text, original_filename=None, out_dir=None):
    """Generate a comprehensive PDF report with analysis results"""
    # Extract data from analysis result
    score = analysis_result["score"]
    section_scores = analysis_result.get("section_scores", {})
    missing_skills = analysis_result.get("missing_skills", [])
    found_skills = analysis_result.get("found_skills", {"technical": {}, "soft": []})
    suggestions = analysis_result.get("suggestions", [])
    
    # Use original filename for display if provided
    display_filename = original_filename if original_filename else filename
    
    # Generate timestamp
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_time = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Set output directory
    if out_dir and os.path.exists(out_dir):
        report_dir = out_dir
    else:
        report_dir = REPORTS_DIR
    
    try:
        # Initialize PDF
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        # Set font - use only standard fonts available in FPDF
        pdf.set_font("Arial", 'B', size=16)
        
        # Header
        pdf.cell(200, 10, txt="ATS Resume Match Report", ln=True, align='C')
        pdf.line(10, 30, 200, 30)
        pdf.ln(10)
        
        # Basic Info
        pdf.set_font("Arial", size=12)
        # Clean filename before adding to PDF - be extra cautious with encoding
        safe_filename = sanitize_text(display_filename, is_filepath=True)
        if not safe_filename:
            safe_filename = "Resume"  # Fallback if sanitization removes everything
        pdf.cell(200, 10, txt=f"Resume: {safe_filename}", ln=True)
        pdf.cell(200, 10, txt=f"Analysis Date: {report_time}", ln=True)
        pdf.ln(5)
        
        # Score Section
        pdf.set_font("Arial", 'B', size=14)
        if score >= 75:
            pdf.set_text_color(0, 128, 0)  # Green
        elif score >= 60:
            pdf.set_text_color(255, 165, 0)  # Orange
        else:
            pdf.set_text_color(255, 0, 0)  # Red
            
        pdf.cell(200, 10, txt=f"ATS Match Score: {score}%", ln=True)
        pdf.set_text_color(0, 0, 0)  # Reset to black
        pdf.set_font("Arial", 'I', size=10)
        pdf.cell(200, 10, txt="Score is based on semantic similarity, keyword matching, and section-specific analysis", ln=True)
        pdf.ln(5)
        
        # Section Scores
        if section_scores:
            pdf.set_font("Arial", 'B', size=12)
            pdf.cell(200, 10, txt="Section Match Scores:", ln=True)
            pdf.set_font("Arial", size=10)
            
            for section, score in section_scores.items():
                if score > 0:  # Only show sections with scores
                    # Extra safe encoding for section names
                    section_name = sanitize_text(section.capitalize())
                    if section_name:  # Only add if not empty after sanitization
                        pdf.cell(200, 8, txt=f"{section_name}: {score}%", ln=True)
            
            pdf.ln(5)
        
        # Skills Found
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt="Skills Found in Your Resume:", ln=True)
        pdf.set_font("Arial", size=10)
        
        # Technical skills by category
        if found_skills["technical"]:
            for category, skills in found_skills["technical"].items():
                if skills:
                    # Extra safe encoding for category names
                    category_name = sanitize_text(category.replace('_', ' ').title())
                    if not category_name:
                        category_name = "Skills"  # Fallback
                    
                    pdf.set_font("Arial", 'I', size=10)
                    pdf.cell(200, 8, txt=f"{category_name}:", ln=True)
                    pdf.set_font("Arial", size=10)
                    
                    # Clean each skill and join with commas, with extra safety
                    cleaned_skills = []
                    for skill in skills:
                        safe_skill = sanitize_text(skill)
                        if safe_skill and len(safe_skill.strip()) > 0:
                            cleaned_skills.append(safe_skill)
                    
                    if cleaned_skills:
                        skill_text = ", ".join(cleaned_skills)
                        pdf.multi_cell(0, 8, txt=skill_text)
            
        # Soft skills
        if found_skills["soft"]:
            pdf.set_font("Arial", 'I', size=10)
            pdf.cell(200, 8, txt="Soft Skills:", ln=True)
            pdf.set_font("Arial", size=10)
            
            # Clean each skill and join with commas, with extra safety
            cleaned_soft_skills = []
            for skill in found_skills["soft"]:
                safe_skill = sanitize_text(skill)
                if safe_skill and len(safe_skill.strip()) > 0:
                    cleaned_soft_skills.append(safe_skill)
            
            if cleaned_soft_skills:
                soft_text = ", ".join(cleaned_soft_skills)
                pdf.multi_cell(0, 8, txt=soft_text)
        
        if not found_skills["technical"] and not found_skills["soft"]:
            pdf.multi_cell(0, 8, txt="No specific skills were identified in your resume.")
        
        pdf.ln(5)
        
        # Missing Skills
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt="Missing Skills:", ln=True)
        
        if missing_skills:
            pdf.set_font("Arial", size=10)
            added_skills = 0
            
            for skill in missing_skills:
                try:
                    # Thoroughly sanitize the skill before adding to PDF
                    safe_skill = sanitize_text(skill)
                    
                    if safe_skill and len(safe_skill.strip()) > 0:
                        # Replace any remaining problematic characters
                        safe_skill = re.sub(r'[^\x20-\x7E]', '', safe_skill)
                        pdf.cell(200, 8, txt=f"- {safe_skill}", ln=True)
                        added_skills += 1
                        if added_skills >= 10:  # Limit to top 10
                            break
                except Exception as e:
                    print(f"Warning: Could not add missing skill to PDF: {str(e)}", file=sys.stderr)
                    continue
            
            if added_skills == 0:
                pdf.set_font("Arial", 'I', size=10)
                pdf.cell(200, 8, txt="Issue displaying missing skills", ln=True)
        else:
            pdf.set_font("Arial", 'I', size=10)
            pdf.cell(200, 8, txt="No significant missing skills found!", ln=True)
        
        pdf.ln(5)
        
        # Suggestions
        pdf.set_font("Arial", 'B', size=12)
        pdf.cell(200, 10, txt="Improvement Suggestions:", ln=True)
        pdf.set_font("Arial", size=10)
        
        if suggestions:
            added_suggestions = 0
            
            for suggestion in suggestions:
                try:
                    # First sanitize the text with multiple layers of safety
                    safe_suggestion = sanitize_text(suggestion)
                    
                    if safe_suggestion and len(safe_suggestion.strip()) > 0:
                        # Replace any remaining problematic characters
                        safe_suggestion = re.sub(r'[^\x20-\x7E]', '', safe_suggestion)
                        pdf.multi_cell(0, 8, txt=f"- {safe_suggestion}")
                        added_suggestions += 1
                except Exception as e:
                    print(f"Warning: Could not add suggestion to PDF: {str(e)}", file=sys.stderr)
                    continue
            
            if added_suggestions == 0:
                pdf.set_font("Arial", 'I', size=10)
                pdf.multi_cell(0, 8, txt="Your resume matches the job description well!")
        else:
            pdf.set_font("Arial", 'I', size=10)
            pdf.multi_cell(0, 8, txt="Your resume matches the job description well!")
        
        # Generate a safe filename for the report
        if original_filename:
            base_filename = sanitize_text(os.path.splitext(original_filename)[0], is_filepath=True)
        else:
            base_filename = sanitize_text(os.path.splitext(filename)[0], is_filepath=True)
        
        # If sanitization removed everything, use a default name    
        if not base_filename or len(base_filename.strip()) == 0:
            base_filename = f"resume_{current_time}"
            
        # Replace any remaining problematic characters in filename
        base_filename = re.sub(r'[^a-zA-Z0-9_-]', '_', base_filename)
        report_filename = f"{base_filename}_{current_time}_report.pdf"
        report_path = os.path.join(report_dir, report_filename)
        
        # Save the PDF with error handling
        try:
            pdf.output(report_path)
            print(f"Report generated successfully at: {report_path}")
            return report_path
        except Exception as pdf_error:
            print(f"Error saving PDF: {str(pdf_error)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            # Try with a simpler filename as a last resort
            try:
                emergency_path = os.path.join(report_dir, f"emergency_report_{current_time}.pdf")
                pdf.output(emergency_path)
                print(f"Emergency save successful at: {emergency_path}")
                return emergency_path
            except Exception as last_error:
                print(f"Final save attempt failed: {str(last_error)}", file=sys.stderr)
                raise
            
    except Exception as e:
        print(f"Error in PDF report generation: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        # Create minimal emergency report
        try:
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            pdf.cell(200, 10, txt="ATS Resume Match Report", ln=True, align='C')
            pdf.cell(200, 10, txt=f"Score: {score}%", ln=True)
            pdf.cell(200, 10, txt="Error occurred during report generation.", ln=True)
            
            # Extra safe error handling
            try:
                safe_error = sanitize_text(str(e))
                # Additional filter for any remaining problematic characters
                safe_error = re.sub(r'[^\x20-\x7E]', '', safe_error)
                pdf.multi_cell(0, 10, txt=f"Error details: {safe_error}")
            except:
                pdf.multi_cell(0, 10, txt="Error details unavailable")
            
            error_report_path = os.path.join(report_dir, f"error_report_{current_time}.pdf")
            pdf.output(error_report_path)
            print(f"Emergency report generated at: {error_report_path}")
            return error_report_path
        except Exception as inner_e:
            print(f"Failed to generate emergency report: {str(inner_e)}", file=sys.stderr)
            raise

def analyze_resume(resume_path, job_description, nlp=None, original_filename=None):
    """Analyze a resume against a job description using advanced NLP techniques"""
    try:
        # Load spaCy if not provided
        if nlp is None:
            try:
                nlp = spacy.load("en_core_web_sm")
                print("Successfully loaded spaCy model", file=sys.stderr)
            except Exception as e:
                print(f"Failed to load spaCy model: {str(e)}", file=sys.stderr)
                print(traceback.format_exc(), file=sys.stderr)
                return error_response(f"Failed to load spaCy model: {str(e)}")
        
        # Extract text from resume
        resume_text = extract_text_from_pdf(resume_path)
        if not resume_text:
            print(f"Failed to extract text from resume: {resume_path}", file=sys.stderr)
            return error_response("Failed to extract text from resume")
        
        # Sanitize texts
        resume_text = sanitize_text(resume_text)
        job_description = sanitize_text(job_description)
        
        # Identify resume sections
        resume_sections = identify_resume_sections(resume_text)
        
        # Log sections found for debugging
        print(f"Resume sections found: {list(resume_sections.keys())}", file=sys.stderr)
        
        # Perform detailed analysis
        analysis_result = analyze_resume_detailed(resume_text, job_description, nlp)
        
        # Generate suggestions
        suggestions = generate_suggestions(
            analysis_result["missing_skills"], 
            resume_sections, 
            analysis_result["score"]
        )
        analysis_result["suggestions"] = suggestions
        
        # Use original filename for display if provided
        display_filename = original_filename if original_filename else os.path.basename(resume_path)
        
        # Generate PDF report
        report_path = generate_pdf_report(
            os.path.basename(resume_path),
            analysis_result,
            resume_text,
            job_description,
            original_filename=original_filename
        )
        
        # Add file info and report path to result
        filename = os.path.basename(resume_path)
        safe_filename = sanitize_text(display_filename, is_filepath=True)
        
        # Create final result object
        result = {
            "filename": safe_filename,
            "original_filename": safe_filename,
            "score": analysis_result["score"],
            "missing_keywords": analysis_result["missing_skills"][:10],
            "suggestions": analysis_result["suggestions"],
            "section_scores": analysis_result["section_scores"],
            "semantic_similarity": analysis_result["semantic_similarity"],
            "keyword_match": analysis_result["keyword_match"],
            "domain_match": analysis_result.get("domain_match", 0),
            "report_path": f"/api/ats/reports/{os.path.basename(report_path)}",
            "report_url": f"/api/ats/reports/{os.path.basename(report_path)}",
            "success": True
        }
        
        print(f"Analysis completed successfully for {display_filename}", file=sys.stderr)
        return result
        
    except Exception as e:
        print(f"Error analyzing resume: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return error_response(f"Error analyzing resume: {str(e)}")

def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser(description="Enhanced Resume Analyzer")
        parser.add_argument("--resume", dest="resume_path", help="Path to resume file")
        parser.add_argument("--job", dest="job_description", help="Job description text")
        parser.add_argument("--original-filename", dest="original_filename", help="Original filename of the resume")
        parser.add_argument("--debug", action="store_true", help="Enable debug output")
        
        args, unknown = parser.parse_known_args()
        
        # Check if using positional arguments (legacy mode)
        if not args.resume_path and len(unknown) >= 1:
            args.resume_path = unknown[0]
        
        if not args.job_description and len(unknown) >= 2:
            args.job_description = unknown[1]
        
        # Check for original filename in unknown args
        original_filename = None
        for i in range(len(unknown)):
            if unknown[i] == "--original-filename" and i+1 < len(unknown):
                original_filename = unknown[i+1]
                break
        
        if not original_filename and args.original_filename:
            original_filename = args.original_filename
        
        # Validate inputs
        if not args.resume_path:
            print(json.dumps(error_response("Resume path is required")))
            return 1
            
        if not os.path.exists(args.resume_path):
            print(json.dumps(error_response(f"Resume file not found: {args.resume_path}")))
            return 1
            
        if not args.job_description:
            print(json.dumps(error_response("Job description is required")))
            return 1
        
        # Load spaCy model
        try:
            nlp = spacy.load("en_core_web_sm")
            if args.debug:
                print("Successfully loaded spaCy model", file=sys.stderr)
        except Exception as e:
            print(json.dumps(error_response(f"Failed to load spaCy model: {str(e)}")))
            return 1
        
        # Analyze resume
        result = analyze_resume(args.resume_path, args.job_description, nlp, original_filename)
        
        # Output result as JSON
        print(json.dumps(result, ensure_ascii=True))
        return 0
        
    except Exception as e:
        print(json.dumps(error_response(f"Application error: {str(e)}")))
        print(traceback.format_exc(), file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main()) 