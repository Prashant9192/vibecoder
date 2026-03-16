"use client";

import { useEffect, useState } from "react";
import { useEditor } from "@/features/editor/context/EditorContext";
import { useFileSystemContext, FileNode } from "@/features/filesystem/context/FileSystemContext";
import { GitCommit, Plus, Check, FileDiff, FolderGit2 } from "lucide-react";
import { ideLog } from "@/lib/ideLogger";

type GitFileStatus = {
  id: string;
  path: string;
  name: string;
  status: "M" | "U"; // M = Modified, U = Untracked
};

function flattenFiles(nodes: FileNode[], result: FileNode[] = []): FileNode[] {
  for (const node of nodes) {
    if (node.type === "file") result.push(node);
    else if (node.children) flattenFiles(node.children, result);
  }
  return result;
}

const StatusBadge = ({ status }: { status: "M" | "U" }) => (
  <span
    className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded flex-shrink-0 ${
      status === "M"
        ? "text-amber-500 bg-amber-100 dark:bg-amber-500/20"
        : "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20"
    }`}
  >
    {status}
  </span>
);

export function GitPanel() {
  const { files: editorFiles, unsavedFiles } = useEditor();
  const { files: fileSystemFiles } = useFileSystemContext();
  const [commitMessage, setCommitMessage] = useState("");
  const [staged, setStaged] = useState<Set<string>>(new Set());
  const [committed, setCommitted] = useState<string[]>([]);

  // Build changed file list
  const allFiles = flattenFiles(fileSystemFiles);

  const changedFiles: GitFileStatus[] = allFiles
    .filter((f) => {
      const isUnsaved = unsavedFiles.includes(f.id);
      const isModified =
        editorFiles[f.id] !== undefined && editorFiles[f.id] !== (f.content || "");
      return isUnsaved || isModified;
    })
    .map((f) => ({
      id: f.id,
      path: f.path,
      name: f.name,
      status: "M" as const,
    }));

  // Files in editorFiles but NOT in the filesystem tree = untracked
  const knownIds = new Set(allFiles.map((f) => f.id));
  const untrackedFiles: GitFileStatus[] = Object.keys(editorFiles)
    .filter((id) => !knownIds.has(id))
    .map((id) => ({
      id,
      path: id,
      name: id,
      status: "U" as const,
    }));

  const allChanged = [...changedFiles, ...untrackedFiles].filter(
    (f) => !staged.has(f.id)
  );
  const stagedFiles: GitFileStatus[] = [...changedFiles, ...untrackedFiles].filter((f) =>
    staged.has(f.id)
  );

  useEffect(() => {
    if (changedFiles.length > 0 || untrackedFiles.length > 0) {
      ideLog("GIT_FILE_CHANGE_DETECTED", {
        modified: changedFiles.length,
        untracked: untrackedFiles.length,
      });
    }
  }, [changedFiles.length, untrackedFiles.length]);

  const stageFile = (id: string) => {
    ideLog("GIT_STAGE", { fileId: id });
    setStaged((prev) => new Set([...prev, id]));
  };

  const unstageFile = (id: string) => {
    ideLog("GIT_UNSTAGE", { fileId: id });
    setStaged((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const stageAll = () => {
    const ids = allChanged.map((f) => f.id);
    if (ids.length) {
      ideLog("GIT_STAGE_ALL", { fileIds: ids });
    }
    setStaged(new Set(ids));
  };

  const handleCommit = () => {
    if (!commitMessage.trim() || stagedFiles.length === 0) return;
    const message = commitMessage.trim();
    ideLog("GIT_COMMIT", {
      message,
      fileIds: stagedFiles.map((f) => f.id),
    });
    setCommitted((prev) => [message, ...prev]);
    setStaged(new Set());
    setCommitMessage("");
  };

  const FileRow = ({
    file,
    action,
    actionIcon,
    actionTitle,
  }: {
    file: GitFileStatus;
    action: () => void;
    actionIcon: React.ReactNode;
    actionTitle: string;
  }) => (
    <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-default">
      <StatusBadge status={file.status} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-zinc-800 dark:text-zinc-200 truncate">{file.name}</p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{file.path}</p>
      </div>
      <button
        title={actionTitle}
        onClick={action}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {actionIcon}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FolderGit2 size={14} className="text-zinc-500" />
          <h2 className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
            Source Control
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
          {allChanged.length + stagedFiles.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Commit Box */}
        <div className="px-3 pt-3 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message (e.g. feat: add login button)"
            rows={3}
            className="w-full text-[12px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 resize-none outline-none focus:ring-1 focus:ring-[#007FD4] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-shadow"
          />
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || stagedFiles.length === 0}
            className="mt-2 w-full text-[12px] font-medium flex items-center justify-center gap-2 py-1.5 rounded-lg transition-colors
              bg-[#007FD4] text-white hover:bg-[#0069b3] 
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#007FD4]"
          >
            <GitCommit size={13} />
            Commit {stagedFiles.length > 0 ? `(${stagedFiles.length})` : ""}
          </button>
        </div>

        {/* Staged Changes */}
        {stagedFiles.length > 0 && (
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Staged Changes
              </span>
              <span className="text-[10px] text-zinc-400">{stagedFiles.length}</span>
            </div>
            {stagedFiles.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                action={() => unstageFile(file.id)}
                actionIcon={<Check size={12} />}
                actionTitle="Unstage"
              />
            ))}
          </div>
        )}

        {/* Changes */}
        {allChanged.length > 0 && (
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Changes
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">{allChanged.length}</span>
                <button
                  title="Stage All"
                  onClick={stageAll}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
            {allChanged.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                action={() => stageFile(file.id)}
                actionIcon={<Plus size={12} />}
                actionTitle="Stage"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {allChanged.length === 0 && stagedFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-zinc-400 px-4 py-10 text-center">
            <FileDiff size={28} strokeWidth={1.5} />
            <p className="text-[12px]">No changes detected.</p>
            <p className="text-[11px]">Edit a file to see changes here.</p>
          </div>
        )}

        {/* Commit History */}
        {committed.length > 0 && (
          <div className="mt-auto flex-shrink-0 border-t border-zinc-200 dark:border-zinc-800">
            <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800/50">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                Recent Commits
              </span>
            </div>
            {committed.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2">
                <GitCommit size={12} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{msg}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
