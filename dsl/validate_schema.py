#!/usr/bin/env python3

from __future__ import annotations

import glob
import os
import sys
from dataclasses import dataclass
from typing import Any

import yaml


@dataclass
class ValidationIssue:
    file: str
    message: str


def _load_yaml(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _as_set(value: Any) -> set[str]:
    if value is None:
        return set()
    if isinstance(value, list):
        return {str(v) for v in value}
    return {str(value)}


def _get(dct: Any, *keys: str) -> Any:
    cur = dct
    for key in keys:
        if not isinstance(cur, dict) or key not in cur:
            return None
        cur = cur[key]
    return cur


def _validate_required_keys(issues: list[ValidationIssue], file: str, obj: Any, required: list[str], path: str) -> None:
    if not isinstance(obj, dict):
        issues.append(ValidationIssue(file, f"{path} must be a mapping/object"))
        return
    for key in required:
        if key not in obj:
            issues.append(ValidationIssue(file, f"Missing required key: {path}.{key}"))


def validate_process_file(schema: dict[str, Any], file_path: str, doc: Any) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []

    if not isinstance(doc, dict):
        return [ValidationIssue(file_path, "Root must be a mapping/object")]

    # Only validate schema-based files; legacy (--- style) is intentionally skipped.
    if "schema_version" not in doc:
        return []

    schema_version = doc.get("schema_version")
    if schema_version != schema.get("schema_version"):
        issues.append(
            ValidationIssue(
                file_path,
                f"schema_version mismatch: file={schema_version!r}, schema={schema.get('schema_version')!r}",
            )
        )

    metadata_required = _get(schema, "metadata", "required") or []
    process_required = _get(schema, "process", "required") or []

    metadata = doc.get("metadata")
    process = doc.get("process")

    _validate_required_keys(issues, file_path, metadata, list(metadata_required), "metadata")
    _validate_required_keys(issues, file_path, process, list(process_required), "process")

    # Enums from schema
    domains = _as_set(_get(schema, "metadata", "domains", "enum"))
    if domains and isinstance(metadata, dict):
        domain = metadata.get("domain")
        if domain is not None and str(domain) not in domains:
            issues.append(ValidationIssue(file_path, f"Invalid metadata.domain: {domain!r} (allowed: {sorted(domains)})"))

    # Local enums (not explicitly listed in schema file)
    status_allowed = {"draft", "active", "deprecated"}
    proc_type_allowed = {"sop", "work_instruction", "policy"}
    classification_allowed = {"critical", "important", "standard"}

    if isinstance(metadata, dict):
        status = metadata.get("status")
        if status is not None and str(status) not in status_allowed:
            issues.append(ValidationIssue(file_path, f"Invalid metadata.status: {status!r} (allowed: {sorted(status_allowed)})"))

        process_type = metadata.get("process_type")
        if process_type is not None and str(process_type) not in proc_type_allowed:
            issues.append(
                ValidationIssue(file_path, f"Invalid metadata.process_type: {process_type!r} (allowed: {sorted(proc_type_allowed)})")
            )

        classification = metadata.get("classification")
        if classification is not None and str(classification) not in classification_allowed:
            issues.append(
                ValidationIssue(
                    file_path, f"Invalid metadata.classification: {classification!r} (allowed: {sorted(classification_allowed)})"
                )
            )

    # Roles basic shape
    roles = doc.get("roles")
    if roles is not None:
        if not isinstance(roles, list):
            issues.append(ValidationIssue(file_path, "roles must be an array"))
        else:
            for idx, role in enumerate(roles):
                if not isinstance(role, dict):
                    issues.append(ValidationIssue(file_path, f"roles[{idx}] must be an object"))
                    continue
                for k in ("role_id", "role_name", "qualifications", "responsibilities"):
                    if k not in role:
                        issues.append(ValidationIssue(file_path, f"Missing required key: roles[{idx}].{k}"))

    # Procedure basic shape
    procedure = doc.get("procedure")
    if procedure is not None:
        if not isinstance(procedure, list):
            issues.append(ValidationIssue(file_path, "procedure must be an array"))
        else:
            for idx, step in enumerate(procedure):
                if not isinstance(step, dict):
                    issues.append(ValidationIssue(file_path, f"procedure[{idx}] must be an object"))
                    continue
                for k in ("step_number", "step_id", "action", "critical_step"):
                    if k not in step:
                        issues.append(ValidationIssue(file_path, f"Missing required key: procedure[{idx}].{k}"))

    return issues


def main() -> int:
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    schema_path = os.path.join(repo_root, "dsl", "schemas", "sop_schema.yaml")
    processes_glob = os.path.join(repo_root, "dsl", "processes", "*.yaml")

    schema = _load_yaml(schema_path)
    any_issues: list[ValidationIssue] = []

    for file_path in sorted(glob.glob(processes_glob)):
        try:
            doc = _load_yaml(file_path)
        except Exception as e:  # noqa: BLE001
            any_issues.append(ValidationIssue(file_path, f"YAML parse error: {e}"))
            continue

        any_issues.extend(validate_process_file(schema, file_path, doc))

    if any_issues:
        print("Schema validation failed:\n")
        for issue in any_issues:
            rel = os.path.relpath(issue.file, repo_root)
            print(f"- {rel}: {issue.message}")
        print(f"\nTotal issues: {len(any_issues)}")
        return 1

    print("Schema validation OK (schema-based files only).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
