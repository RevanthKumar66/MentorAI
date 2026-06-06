import os
import re
from typing import Tuple, Dict

# Allowed extensions and their mapped categories
ALLOWED_EXTENSIONS = {
    # Documents
    "pdf": "document",
    "docx": "document",
    "txt": "document",
    "md": "document",
    # Datasets
    "csv": "dataset",
    "json": "dataset",
    "xml": "dataset",
    "yaml": "dataset",
    "yml": "dataset",
    "parquet": "dataset",
    "feather": "dataset",
    # Code
    "py": "code",
    "js": "code",
    "jsx": "code",
    "ts": "code",
    "tsx": "code",
    "java": "code",
    "cpp": "code",
    "c": "code",
    "go": "code",
    "rs": "code",
    "sql": "code",
    "r": "code",
    "rmd": "code",
    # Notebooks
    "ipynb": "notebook",
    # Spreadsheets
    "xlsx": "spreadsheet",
    # Presentations
    "pptx": "presentation",
}

# 100 MB Limit
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

def sanitize_filename(filename: str) -> str:
    """Sanitizes a filename to prevent directory traversal and clean special characters."""
    # Extract only the base name (no paths)
    base_name = os.path.basename(filename)
    
    # Strip any characters that are not alphanumeric, dots, hyphens, or underscores
    # Keep Unicode letters/numbers if possible, but keep it safe
    sanitized = re.sub(r"[^\w\.\-]", "_", base_name)
    
    # Avoid empty names or single dots
    if not sanitized or sanitized in (".", ".."):
        sanitized = "unnamed_file"
        
    return sanitized

def validate_file(filename: str, file_size: int, mime_type: str) -> Tuple[bool, str, str]:
    """Validates file extension, size, and returns classification category.
    
    Returns:
        (is_valid, error_message, category)
    """
    # Check file size
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds the maximum limit of 100 MB (current size: {file_size / (1024*1024):.2f} MB)", ""

    # Parse and validate extension
    parts = filename.rsplit(".", 1)
    if len(parts) < 2:
        return False, "File lacks an extension", ""
        
    ext = parts[1].lower().strip()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file extension: .{ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS.keys()))}", ""

    category = ALLOWED_EXTENSIONS[ext]
    return True, "", category
