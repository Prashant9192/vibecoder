"use client";

import Editor from "@monaco-editor/react";
import { useEditor } from "../hooks/useEditor";

export default function MonacoEditor() {
    const { code, setCode } = useEditor();

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language="typescript"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
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