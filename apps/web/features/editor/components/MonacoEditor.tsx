"use client";

import Editor, { useMonaco, Monaco } from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";
import { useTheme } from "@/features/theme/context/ThemeContext";
import { useFileSystemContext } from "@/features/filesystem/context/FileSystemContext";
import { useEffect, useRef } from "react";

export default function MonacoEditor({ fileId }: { fileId?: string | null } = {}) {
    const { files, setFiles, unsavedFiles, setUnsavedFiles, setCursorPosition, lineToReveal, setLineToReveal } = useEditor();
    const targetFile = fileId ?? null;
    const { theme } = useTheme();
    const { saveFile } = useFileSystemContext();
    const monaco = useMonaco();
    const editorRef = useRef<any>(null);

    const handleSave = () => {
        if (!targetFile) return;
        const currentContent = files[targetFile] || "";
        saveFile(targetFile, currentContent);
        setUnsavedFiles(unsavedFiles.filter(f => f !== targetFile));
    };

    const handleMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
        
        // Listen to cursor position changes
        editor.onDidChangeCursorPosition((e: any) => {
            setCursorPosition({
                lineNumber: e.position.lineNumber,
                column: e.position.column
            });
        });

        // Initialize state on first mount
        const initialPos = editor.getPosition();
        if (initialPos) {
            setCursorPosition({
                lineNumber: initialPos.lineNumber,
                column: initialPos.column
            });
        }
        
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', shiftKey: true, ctrlKey: true }));
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [targetFile, files, unsavedFiles]); // dependencies so handleSave gets fresh state

    useEffect(() => {
        if (lineToReveal !== null && editorRef.current) {
            editorRef.current.revealLineInCenter(lineToReveal);
            editorRef.current.setPosition({ lineNumber: lineToReveal, column: 1 });
            // Clean up immediately so we don't accidentally re-trigger
            setLineToReveal(null);
            
            // Focus the editor
            editorRef.current.focus();
        }
    }, [lineToReveal, setLineToReveal]);

    if (!targetFile) return null;

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language="typescript"
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                value={files[targetFile] || ""}
                onMount={handleMount}
                onChange={(value) => {
                    setFiles({
                        ...files,
                        [targetFile]: value || ""
                    });
                    if (!unsavedFiles.includes(targetFile)) {
                        setUnsavedFiles([...unsavedFiles, targetFile]);
                    }
                }}
                options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                }}
            />
        </div>
    );
}