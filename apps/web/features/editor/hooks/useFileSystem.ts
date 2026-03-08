import { useState } from "react";

export type FileNode = {
    name: string;
    content?: string;
    children?: FileNode[];
};

export function useFileSystem() {
    const [files, setFiles] = useState<FileNode[]>([
        {
            name: "src",
            children: [
                {
                    name: "main.ts",
                    content: `function greet(name: string) {
  return "Hello " + name;
}

console.log(greet("VibeCoder"));`,
                },
                {
                    name: "utils.ts",
                    content: `export function sum(a: number, b: number) {
  return a + b;
}`,
                },
            ],
        },
    ]);

    return {
        files,
        setFiles,
    };
}