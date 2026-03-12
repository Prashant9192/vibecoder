"use client";

import { useMemo } from "react";
import { useEditor } from "@/features/editor/context/EditorContext";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react";

export type Problem = {
  file: string;
  line: number;
  message: string;
  severity: "error" | "warning";
};

interface ProblemsPanelProps {
  onClose: () => void;
}

function flattenFiles(nodes: FileNode[], result: FileNode[] = []): FileNode[] {
  for (const node of nodes) {
    if (node.type === "file") result.push(node);
    else if (node.children) flattenFiles(node.children, result);
  }
  return result;
}

// Patterns that simulate real-world linting/TS diagnostics
const PATTERNS: { regex: RegExp; message: string; severity: "error" | "warning" }[] = [
  { regex: /console\.log\(/g,       message: "Unexpected console statement",                severity: "warning" },
  { regex: /var\s+/g,               message: "Use 'const' or 'let' instead of 'var'",       severity: "warning" },
  { regex: /==\s/g,                 message: "Use '===' instead of '=='",                   severity: "warning" },
  { regex: /!=\s/g,                 message: "Use '!==' instead of '!='",                   severity: "warning" },
  { regex: /any(?:\s|;|,|\))/g,     message: "Avoid using 'any' type",                      severity: "warning" },
  { regex: /TODO:/gi,               message: "TODO comment detected",                        severity: "warning" },
  { regex: /FIXME:/gi,              message: "FIXME comment detected",                       severity: "error"   },
  { regex: /debugger;/g,            message: "Unexpected 'debugger' statement",              severity: "error"   },
  { regex: /\bthrowing\b/g,         message: "Potential typo: did you mean 'throw'?",        severity: "error"   },
];

function detectProblems(filePath: string, content: string): Problem[] {
  const results: Problem[] = [];
  const lines = content.split("\n");

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    for (const { regex, message, severity } of PATTERNS) {
      // Reset lastIndex for global regexes
      regex.lastIndex = 0;
      if (regex.test(line)) {
        results.push({
          file: filePath,
          line: lineIdx + 1,
          message,
          severity,
        });
      }
    }
  }
  return results;
}

export function ProblemsPanel({ onClose }: ProblemsPanelProps) {
  const { files: editorFiles, openFile, setLineToReveal } = useEditor();
  const { files: fileSystemFiles } = useFileSystemContext();

  const problems = useMemo<Problem[]>(() => {
    const allFs = flattenFiles(fileSystemFiles);
    const allProblems: Problem[] = [];

    // Scan files that are loaded in the editor (picks up live unsaved changes)
    for (const [path, content] of Object.entries(editorFiles)) {
      allProblems.push(...detectProblems(path, content));
    }

    // Also scan unedited filesystem files that haven't been loaded yet
    for (const fsFile of allFs) {
      if (!editorFiles[fsFile.path] && fsFile.content) {
        allProblems.push(...detectProblems(fsFile.path, fsFile.content));
      }
    }

    // Sort: errors first, then by file path
    return allProblems.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
      return a.file.localeCompare(b.file);
    });
  }, [editorFiles, fileSystemFiles]);

  const errorCount   = problems.filter((p) => p.severity === "error").length;
  const warningCount = problems.filter((p) => p.severity === "warning").length;

  const handleNavigate = (problem: Problem) => {
    openFile(problem.file);
    // Defer reveal so Monaco can mount the file first
    setTimeout(() => setLineToReveal(problem.line), 80);
  };

  return (
    <div className="h-56 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col flex-shrink-0">
      {/* Tab-style header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 h-8 flex-shrink-0">
        <div className="flex items-center gap-3 h-full">
          <span className="text-[11px] tracking-wider uppercase font-semibold text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100 h-full flex items-center">
            Problems
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle size={12} />
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <AlertTriangle size={12} />
                {warningCount}
              </span>
            )}
            {errorCount === 0 && warningCount === 0 && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 size={12} />
                No problems
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors p-0.5 rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
            <CheckCircle2 size={22} strokeWidth={1.5} />
            <p className="text-[12px]">No problems detected in workspace.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {problems.map((problem, i) => (
              <button
                key={`${problem.file}-${problem.line}-${i}`}
                onClick={() => handleNavigate(problem)}
                className="group flex items-start gap-3 px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors w-full focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800/60"
              >
                {/* Severity icon */}
                <span className="mt-0.5 flex-shrink-0">
                  {problem.severity === "error" ? (
                    <AlertCircle size={14} className="text-red-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-500" />
                  )}
                </span>

                {/* Message */}
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
                    {problem.message}
                  </span>
                  <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {problem.file}
                    <span className="mx-1">·</span>
                    Line {problem.line}
                  </span>
                </span>

                {/* Line number badge */}
                <span className="flex-shrink-0 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded mt-0.5">
                  Ln {problem.line}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
