"use client";

import Editor from "@monaco-editor/react";
import { useEditor } from "../context/EditorContext";

export default function MonacoEditor() {
    const { activeFile, files, setFiles } = useEditor();

    if (!activeFile) return null;

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language="typescript"
                theme="vs-dark"
                value={files[activeFile] || ""}
                onChange={(value) => setFiles({
                    ...files,
                    [activeFile]: value || ""
                })}
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