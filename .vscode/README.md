# VSCode Configuration for GACP-ERP DSL Development

**Version:** 1.0.0  
**Date:** 2026-01-09

## 📋 Overview

This directory contains VSCode configuration files that enforce DSL generation rules and provide development assistance for the GACP-ERP project.

## 📁 Configuration Files

### 1. `settings.json` - Workspace Settings

**Purpose:** Configure VSCode and GitHub Copilot for DSL development

**Key Features:**
- **Copilot Instructions:** Embeds critical DSL generation rules directly into Copilot
- **YAML Schema Validation:** Links DSL files to their corresponding schema files
- **File Associations:** Proper YAML and Markdown handling
- **Editor Settings:** Consistent formatting (2-space indentation)
- **Spell Checker:** Pre-configured with DSL terminology

**Critical Configuration:**
```json
"github.copilot.chat.codeGeneration.instructions": [
  {
    "text": "# CRITICAL DSL GENERATION RULES..."
  }
]
```

This ensures Copilot ALWAYS sees the rules when generating code.

### 2. `extensions.json` - Recommended Extensions

**Purpose:** Ensure all required VSCode extensions are installed

**Required Extensions:**
- ✅ `github.copilot` - AI code generation
- ✅ `github.copilot-chat` - AI chat assistant
- ✅ `redhat.vscode-yaml` - YAML language support with schema validation

**Recommended Extensions:**
- `yzhang.markdown-all-in-one` - Markdown editing
- `davidanson.vscode-markdownlint` - Markdown linting
- `streetsidesoftware.code-spell-checker` - Spell checking
- `eamodio.gitlens` - Enhanced Git integration

**Installation:**
When you open the workspace, VSCode will prompt you to install recommended extensions.

### 3. `tasks.json` - Automated Tasks

**Purpose:** Provide quick access to common DSL operations

**Available Tasks:**

| Task | Command | Description |
|------|---------|-------------|
| **Validate DSL Schema** | `Ctrl+Shift+B` (default) | Validate current file against schema |
| **Validate All DSL Files** | Task menu | Validate all DSL files in workspace |
| **Check DSL File Structure** | Task menu | Quick check for required sections |
| **Count DSL Files** | Task menu | Count DSL files by type |
| **Git: Commit DSL Changes** | Task menu | Commit DSL changes with prompt |

**Running Tasks:**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Run Task"
3. Select task from list

Or use default build shortcut: `Ctrl+Shift+B`

### 4. `dsl-snippets.code-snippets` - Code Snippets

**Purpose:** Provide quick templates for DSL structures

**Available Snippets:**

| Prefix | Description |
|--------|-------------|
| `dsl-process` | Complete process file template |
| `dsl-role` | Single role entry |
| `dsl-step` | Procedure step with all fields |
| `dsl-qc` | Quality control entry |
| `dsl-safety` | Complete safety section |
| `dsl-docs` | Complete documentation section |
| `dsl-equipment` | Equipment entry |
| `dsl-material` | Material/chemical entry |
| `dsl-validate` | Validation checklist comment |
| `dsl-sep` | Section separator |

**Using Snippets:**
1. In a `.yaml` file, type the prefix (e.g., `dsl-role`)
2. Press `Tab` or `Enter`
3. Fill in the placeholders using `Tab` to navigate

## 🚀 Quick Start Guide

### First-Time Setup

1. **Open Workspace:**
   ```bash
   cd /home/noise83/Projects/GACP-ERP
   code .
   ```

2. **Install Recommended Extensions:**
   - VSCode will show a notification
   - Click "Install All"
   - Wait for installation to complete
   - Reload VSCode if prompted

3. **Verify Configuration:**
   - Open any `.yaml` file in `dsl/` folder
   - Check that YAML validation is working (see status bar)
   - Type `dsl-process` and press Tab to test snippets

### Creating a New DSL File

#### Using Copilot (Recommended)

1. **Open Copilot Chat:** `Ctrl+Alt+I` (or `Cmd+Alt+I` on Mac)

2. **Give Instructions:**
   ```
   Create DSL process file for [SOP Name] based on docs/sop/SOP_[FileName].md
   ```

3. **Copilot Will:**
   - Read the schema file automatically (per embedded instructions)
   - Read the source SOP markdown
   - Generate correctly structured DSL
   - Follow all validation rules

#### Using Snippets (Manual)

1. **Create File:**
   ```bash
   touch dsl/process/SOP-XXX-001-NAME.yaml
   ```

2. **Type `dsl-process` and press Tab**

3. **Fill in placeholders:**
   - Use `Tab` to move between fields
   - Select from dropdowns for enum values
   - Fill all required sections

4. **Validate:**
   - Press `Ctrl+Shift+B`
   - Fix any errors shown

### Validating DSL Files

#### Single File Validation

**Method 1: Build Task (Quickest)**
```
Ctrl+Shift+B
```

**Method 2: Command Palette**
1. `Ctrl+Shift+P`
2. Type "Run Task"
3. Select "Validate DSL Schema"

#### All Files Validation

1. `Ctrl+Shift+P`
2. Type "Run Task"
3. Select "Validate All DSL Files"

### Git Workflow

#### Committing DSL Changes

**Method 1: Using Task**
1. `Ctrl+Shift+P`
2. Type "Run Task"
3. Select "Git: Commit DSL Changes"
4. Enter commit message when prompted

**Method 2: Command Line**
```bash
git add dsl/
git commit -m "feat(dsl): Add SOP-XXX-001 files"
git push
```

## 📖 DSL Generation Rules

### Critical Rules (Enforced by Copilot)

The `settings.json` file embeds these critical rules directly into Copilot's instructions:

1. **ALWAYS read schema file first**
   - Process: `dsl/schemas/sop_schema.yaml`
   - Forms: `dsl/schemas/form_schema.yaml`
   - Checklists: `dsl/schemas/checklist_schema.yaml`
   - Reports: `dsl/schemas/report_schema.yaml`
   - Training: `dsl/schemas/training_schema.yaml`

2. **Review golden example:** `dsl/process/SOP-AUDIT-001-AUDIT_TRAIL.yaml`

3. **Follow complete rules:** `dsl/DSL_GENERATION_RULES.md`

### Validation Checklist

Before committing any DSL file:

**Metadata:**
- ✅ `process_id` present
- ✅ `process_type` is valid enum
- ✅ `version` present
- ✅ `status` is valid enum
- ✅ `domain` is valid enum
- ✅ `classification` is valid enum
- ❌ NO `title` field
- ❌ NO `department` field

**Structure:**
- ✅ `process` section present
- ✅ `roles` is array of objects
- ✅ `procedure` (SINGULAR, not `procedures`)
- ✅ `quality_controls` section present
- ✅ `safety` section present
- ✅ `documentation` section present
- ✅ `deviations` section present

## 🔧 Troubleshooting

### Issue: Copilot Not Following Rules

**Symptom:** Copilot generates DSL with wrong structure

**Solution:**
1. Reload VSCode window: `Ctrl+Shift+P` → "Reload Window"
2. Check that `settings.json` has correct instructions
3. In Copilot chat, explicitly say: "Follow DSL_GENERATION_RULES.md"

### Issue: YAML Validation Not Working

**Symptom:** No errors shown for invalid YAML

**Solution:**
1. Check that `redhat.vscode-yaml` extension is installed
2. Verify `settings.json` has `yaml.schemas` configured
3. Check output panel: "View" → "Output" → Select "YAML Support"

### Issue: Snippets Not Working

**Symptom:** Typing `dsl-process` doesn't show snippet

**Solution:**
1. Ensure file has `.yaml` extension
2. Check language mode in status bar (should be "YAML")
3. Reload window: `Ctrl+Shift+P` → "Reload Window"

### Issue: Schema Validation Errors

**Symptom:** Red squiggly lines in YAML file

**Solution:**
1. Read the error message (hover over red line)
2. Compare with schema file
3. Check `DSL_GENERATION_RULES.md` for correct structure
4. Use golden example `SOP-AUDIT-001-AUDIT_TRAIL.yaml` as reference

## 📚 Related Documentation

- **DSL Generation Rules:** `/dsl/DSL_GENERATION_RULES.md` (Complete guide)
- **Schema Files:** `/dsl/schemas/*.yaml` (Schema definitions)
- **Golden Example:** `/dsl/process/SOP-AUDIT-001-AUDIT_TRAIL.yaml`
- **Conversion Guide:** `/dsl/GENERATION_GUIDE.md`
- **Document Mapping:** `/dsl/DOCUMENT_MAPPING.md`

## 🎯 Best Practices

### DO:
✅ Always let Copilot read schema file first  
✅ Use validation task before committing  
✅ Use snippets for consistent structure  
✅ Check golden example when unsure  
✅ Commit DSL files separately from code  
✅ Use descriptive commit messages  

### DON'T:
❌ Create DSL files without checking schema  
❌ Commit unvalidated DSL files  
❌ Manually type repetitive structures (use snippets)  
❌ Ignore validation errors  
❌ Mix different domains in one commit  
❌ Forget to update version numbers  

## 🔄 Updating Configuration

If you need to update these configuration files:

1. **Edit the file** (e.g., `settings.json`)
2. **Reload VSCode window:** `Ctrl+Shift+P` → "Reload Window"
3. **Test the changes** with a sample DSL file
4. **Commit the configuration:**
   ```bash
   git add .vscode/
   git commit -m "chore(config): Update VSCode configuration"
   ```

## 📞 Support

If you encounter issues not covered here:

1. Check `/dsl/DSL_GENERATION_RULES.md` for detailed guidance
2. Review golden example: `/dsl/process/SOP-AUDIT-001-AUDIT_TRAIL.yaml`
3. Validate against schema: `/dsl/schemas/sop_schema.yaml`
4. Ask Copilot to follow the rules explicitly

---

**Last Updated:** 2026-01-09  
**Configuration Version:** 1.0.0
