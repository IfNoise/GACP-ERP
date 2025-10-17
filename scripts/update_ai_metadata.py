#!/usr/bin/env python3
"""
Script to update AI metadata in documentation frontmatter.
Compliant with AI_Assisted_Documentation_Policy.md
"""

import os
import re
from pathlib import Path
from datetime import datetime
import yaml

# AI metadata template according to policy
AI_METADATA_TEMPLATE = """
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
"""

# Documents to skip (already have proper metadata or are special cases)
SKIP_DOCUMENTS = [
    'docs/reports/DATA_DICTIONARY_COMPLIANCE_AUDIT.md',
    'docs/reports/DS_COMPLIANCE_MATRIX.md',
    'docs/reports/DATA_DICTIONARY_SUMMARY.md',
    'docs/reports/DATA_DICTIONARY_QUICK_START.md',
    'docs/reports/DS_V2_IMPLEMENTATION_SUMMARY.md',
    'docs/reports/CONTRACT_SPECIFICATIONS_UPDATE_PLAN.md',
    'docs/reports/DOCUMENTATION_STATUS_REPORT.md',
    'docs/reports/POST_DS_V2_ACTION_PLAN.md',
]

def find_markdown_files(root_dir):
    """Find all markdown files with frontmatter that don't have AI metadata"""
    md_files = []
    for path in Path(root_dir).rglob("*.md"):
        # Skip documents that don't need update
        rel_path = str(path.relative_to(Path(root_dir).parent))
        if any(skip in rel_path for skip in SKIP_DOCUMENTS):
            continue
            
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Check if file has frontmatter with status field
                if re.search(r'^---\n.*?status:\s*.*?^---', content, re.MULTILINE | re.DOTALL):
                    # Skip if already has AI metadata
                    if 'ai_assisted:' not in content:
                        md_files.append(path)
        except Exception as e:
            print(f"Error reading {path}: {e}")
    return md_files

def update_frontmatter(file_path):
    """Update frontmatter with AI metadata"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract existing frontmatter (handle malformed frontmatter)
        frontmatter_match = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
        
        if not frontmatter_match:
            print(f"⚠️  No frontmatter found in {file_path}")
            return False
        
        existing_frontmatter = frontmatter_match.group(1)
        document_content = frontmatter_match.group(2)
        
        # Check if AI metadata already exists
        if 'ai_assisted:' in existing_frontmatter:
            print(f"✓  AI metadata already exists in {file_path}")
            return False
        
        # Check if frontmatter is malformed (contains content outside YAML)
        if re.search(r'#{2,}', existing_frontmatter) or '```' in existing_frontmatter:
            print(f"⚠️  Malformed frontmatter in {file_path} - skipping")
            return False
        
        # Don't change existing status field - it's for document lifecycle
        updated_frontmatter = existing_frontmatter
        
        # Add AI metadata (simple version)
        ai_metadata = AI_METADATA_TEMPLATE
        
        # Construct new content
        new_content = f"---\n{updated_frontmatter}{ai_metadata}---\n{document_content}"
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✓  Updated {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating {file_path}: {e}")
        return False

def main():
    """Main execution"""
    print("=" * 80)
    print("AI Metadata Updater")
    print("Compliant with: AI_Assisted_Documentation_Policy.md")
    print("=" * 80)
    print()
    
    # Find repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    docs_dir = repo_root / "docs"
    
    print(f"Scanning: {docs_dir}")
    print()
    
    # Find all markdown files with status: "approved" or "draft"
    md_files = find_markdown_files(docs_dir)
    
    print(f"Found {len(md_files)} documents to update")
    print()
    
    if not md_files:
        print("No files to update.")
        return
    
    # Show files to be updated
    print("Files to be updated:")
    for i, file_path in enumerate(md_files, 1):
        rel_path = file_path.relative_to(repo_root)
        print(f"  {i:2d}. {rel_path}")
    print()
    
    # Ask for confirmation
    response = input("Proceed with update? [y/N]: ").strip().lower()
    if response != 'y':
        print("Aborted.")
        return
    
    print()
    print("Updating files...")
    print("-" * 80)
    
    # Update files
    updated_count = 0
    for file_path in md_files:
        rel_path = file_path.relative_to(repo_root)
        if update_frontmatter(file_path):
            updated_count += 1
    
    print("-" * 80)
    print()
    print(f"Summary: {updated_count}/{len(md_files)} files updated")
    print()
    print("Next steps (per AI_Assisted_Documentation_Policy.md):")
    print("1. Review each document for technical accuracy")
    print("2. Set author_verified: true after verification")
    print("3. Submit for QA review")
    print("4. QA sets qa_approved: true and document_status: 'approved'")
    print("5. Document becomes controlled copy")
    print()

if __name__ == "__main__":
    main()
