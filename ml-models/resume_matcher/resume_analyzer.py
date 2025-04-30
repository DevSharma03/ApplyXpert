import re
import sys
import os
import time
from fpdf import FPDF

def sanitize_text(text):
    if text is None:
        return ""
    
    try:
        # Convert to string if not already
        text = str(text)
        
        text = text.strip()
        
        text = re.sub(r'[•●■◆★☆►▼▲▶◀]', '-', text)
        
        text = re.sub(r'\s+', ' ', text)
        
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]', '', text)
        
        text = text.encode('ascii', errors='replace').decode('ascii')
        
        text = re.sub(r'[^\x20-\x7E]', '', text)
        
        return text.strip()
    except Exception as e:
        print(f"Error sanitizing text: {str(e)}", file=sys.stderr)
        # Return empty string as fallback for severe errors
        return "" 

def generate_pdf_report(filename, score, missing_keywords, suggestions, resume_text, job_text, out_dir=None, original_filename=None):
    # Use sanitize_text for the filename to avoid encoding issues
    safe_filename = sanitize_text(filename)
    if not safe_filename:
        safe_filename = "resume_analysis_report"
    
    if out_dir is None:
        out_dir = "reports"
    
    try:
        # Create the directory if it doesn't exist
        if not os.path.exists(out_dir):
            os.makedirs(out_dir)

        pdf = FPDF()
        pdf.add_page()
        
        # Set up the PDF
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.set_font("Arial", size=12)
        
        # Header
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(0, 10, "Resume Analysis Report", ln=True, align='C')
        pdf.ln(5)
        
        # Original filename if provided
        if original_filename:
            safe_original_filename = sanitize_text(original_filename)
            if safe_original_filename:
                pdf.set_font("Arial", 'I', 10)
                pdf.cell(0, 10, f"Resume: {safe_original_filename}", ln=True)
                pdf.ln(5)
        
        # Score section
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(0, 10, "ATS Match Score", ln=True)
        pdf.ln(2)
        
        # Format score as percentage
        score_percent = round(score * 100)
        
        # Determine color based on score
        if score_percent >= 70:
            pdf.set_text_color(0, 128, 0)  # Green for good scores
        elif score_percent >= 40:
            pdf.set_text_color(255, 165, 0)  # Orange for medium scores
        else:
            pdf.set_text_color(255, 0, 0)  # Red for low scores
            
        pdf.set_font("Arial", 'B', 22)
        pdf.cell(0, 10, f"{score_percent}%", ln=True)
        
        # Reset text color
        pdf.set_text_color(0, 0, 0)
        pdf.ln(10)
        
        # Missing Keywords Section
        if missing_keywords:
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(0, 10, "Missing Keywords", ln=True)
            pdf.ln(2)
            
            pdf.set_font("Arial", '', 10)
            pdf.multi_cell(0, 5, "These keywords were found in the job description but not in your resume:")
            pdf.ln(2)
            
            # List the missing keywords
            for category, keywords in missing_keywords.items():
                if keywords:  # Only add categories with missing keywords
                    safe_category = sanitize_text(category)
                    if safe_category:
                        pdf.set_font("Arial", 'B', 11)
                        pdf.cell(0, 6, safe_category, ln=True)
                        
                        pdf.set_font("Arial", '', 10)
                        for keyword in keywords:
                            safe_keyword = sanitize_text(keyword)
                            if safe_keyword:
                                pdf.cell(10, 5, "-", ln=0)
                                pdf.cell(0, 5, safe_keyword, ln=True)
                        pdf.ln(2)
            pdf.ln(5)
        
        # Suggestions Section
        if suggestions:
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(0, 10, "Improvement Suggestions", ln=True)
            pdf.ln(2)
            
            pdf.set_font("Arial", '', 10)
            for suggestion in suggestions:
                safe_suggestion = sanitize_text(suggestion)
                if safe_suggestion:
                    pdf.cell(10, 5, "-", ln=0)
                    pdf.multi_cell(0, 5, safe_suggestion)
                    pdf.ln(2)
        
        # Get PDF output path
        report_path = os.path.join(out_dir, f"{safe_filename}_report.pdf")
        
        # Try to save the report
        try:
            pdf.output(report_path)
            print(f"Report generated successfully: {report_path}")
            return report_path
        except Exception as e:
            print(f"Error saving PDF with filename '{safe_filename}': {str(e)}. Trying with generic filename.")
            # Try with a very simple filename
            report_path = os.path.join(out_dir, f"resume_report_{int(time.time())}.pdf")
            pdf.output(report_path)
            return report_path
            
    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
        # Create an emergency report with minimal content
        try:
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            pdf.cell(0, 10, "Resume Analysis Report", ln=True, align='C')
            pdf.cell(0, 10, f"Score: {round(score * 100)}%", ln=True)
            pdf.cell(0, 10, "Error: Could not generate full report", ln=True)
            
            # Include error message (safely)
            safe_error = sanitize_text(str(e))
            if safe_error:
                pdf.multi_cell(0, 5, f"Error details: {safe_error}")
            
            # Get emergency PDF output path
            emergency_path = os.path.join(out_dir, f"emergency_report_{int(time.time())}.pdf")
            pdf.output(emergency_path)
            print(f"Emergency report generated: {emergency_path}")
            return emergency_path
        except Exception as inner_e:
            print(f"Failed to create emergency report: {str(inner_e)}")
            return None 