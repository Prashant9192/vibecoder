"use client";

import { useEditor } from "@/features/editor/context/EditorContext";

const getLanguage = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return "TypeScript";
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return "JavaScript";
    if (fileName.endsWith('.css')) return "CSS";
    if (fileName.endsWith('.md')) return "Markdown";
    if (fileName.endsWith('.json')) return "JSON";
    if (fileName.endsWith('.html')) return "HTML";
    return "Plain Text";
};

export default function StatusBar() {
    const { editorGroups, activeGroup, cursorPosition } = useEditor();
    const activeFile = editorGroups[activeGroup].activeFile;

    const fileName = activeFile ? activeFile.split('/').pop() : "";
    const language = activeFile ? getLanguage(activeFile) : "";

    return (
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs flex items-center justify-between px-3 flex-shrink-0 select-none z-20 transition-colors">
            <div className="flex items-center">
                {fileName && <span>{fileName}</span>}
            </div>
            <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
                {activeFile && cursorPosition && (
                    <span>Ln {cursorPosition.lineNumber}, Col {cursorPosition.column}</span>
                )}
                {activeFile && (
                    <span>{language}</span>
                )}
            </div>
        </div>
    );
}
