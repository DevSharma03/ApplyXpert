#!/usr/bin/env python
import os
import sys
import shutil
import argparse
import glob

def error(message):
    print(f"ERROR: {message}", file=sys.stderr)
    return 1

def success(message):
    print(f"SUCCESS: {message}")
    return 0

def ensure_reports_in_backend():
    """Copy all reports from ml-models/resume_matcher/reports to backend/reports"""
    try:
        # Get the script directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Source directory (ml-models/resume_matcher/reports)
        source_dir = os.path.join(script_dir, "reports")
        
        # Target directory (backend/reports)
        project_root = os.path.dirname(os.path.dirname(script_dir))
        target_dir = os.path.join(project_root, "backend", "reports")
        
        print(f"Source directory: {source_dir}")
        print(f"Target directory: {target_dir}")
        
        # Ensure target directory exists
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            print(f"Created target directory: {target_dir}")
        
        # Check if source directory exists
        if not os.path.exists(source_dir):
            return error(f"Source directory not found: {source_dir}")
        
        # Get all PDF files in source directory
        pdf_files = glob.glob(os.path.join(source_dir, "*.pdf"))
        
        if not pdf_files:
            print("No PDF files found in source directory")
            return 0
        
        # Copy each PDF file to target directory
        copied_count = 0
        for pdf_file in pdf_files:
            filename = os.path.basename(pdf_file)
            target_file = os.path.join(target_dir, filename)
            
            try:
                shutil.copy2(pdf_file, target_file)
                copied_count += 1
                print(f"Copied: {filename}")
            except Exception as e:
                print(f"Error copying {filename}: {str(e)}")
        
        return success(f"Copied {copied_count} report(s) to backend directory")
    
    except Exception as e:
        return error(f"Failed to ensure reports in backend: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ensure reports are copied to backend directory")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    
    if args.verbose:
        print("Synchronizing reports between ml-models and backend directories...")
    
    exit_code = ensure_reports_in_backend()
    sys.exit(exit_code) 