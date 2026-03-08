"use client";

import Editor from "@monaco-editor/react";

export default function MonacoEditor() {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        defaultValue={`function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`}
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