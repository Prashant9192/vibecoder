import { FileNode } from "@/features/filesystem/context/FileSystemContext";
import { ideLog } from "@/lib/ideLogger";

export interface ShellResult {
  output: string;
  newCwd?: string;
  error?: boolean;
}

export class Shell {
  private cwd: string = "/src";
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor(
    private files: FileNode[],
    private actions: {
      addFile: (name: string, path: string) => void;
      createFolder: (name: string, path: string) => void;
      saveFile: (path: string, content: string) => void;
    }
  ) {}

  public execute(commandLine: string): ShellResult {
    const args = commandLine.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    const params = args.slice(1);

    if (!cmd) return { output: "" };

    this.history.push(commandLine);
    this.historyIndex = this.history.length;

    switch (cmd) {
      case "help":
        return {
          output: `Available commands:
  ls [path]       List files
  cd <path>       Change directory
  pwd             Print working directory
  mkdir <name>    Create a folder
  touch <name>    Create a file
  cat <file>      Display file content
  clear           Clear the terminal
  echo [text]     Echo text
  help            Show this help`,
        };

      case "pwd":
        return { output: this.cwd };

      case "ls":
        return this.ls(params[0] || ".");

      case "cd":
        return this.cd(params[0] || "/src");

      case "mkdir":
        if (!params[0]) return { output: "mkdir: missing operand", error: true };
        this.actions.createFolder(params[0], this.cwd);
        return { output: "" };

      case "touch":
        if (!params[0]) return { output: "touch: missing operand", error: true };
        this.actions.addFile(params[0], this.cwd);
        return { output: "" };

      case "cat":
        if (!params[0]) return { output: "cat: missing operand", error: true };
        return this.cat(params[0]);

      case "echo":
        return { output: params.join(" ") };

      case "clear":
        return { output: "\x1b[2J\x1b[H" }; // ANSI clear screen and home cursor

      default:
        return { output: `command not found: ${cmd}`, error: true };
    }
  }

  public getPrompt(): string {
    const folderName = this.cwd === "/" ? "/" : this.cwd.split("/").pop();
    return `\x1b[1;32mvibecoder\x1b[0m \x1b[1;34m${folderName}\x1b[m $ `;
  }

  public getCwd(): string {
    return this.cwd;
  }

  private ls(path: string): ShellResult {
    const targetPath = this.resolvePath(path);
    const node = this.findNode(targetPath);

    if (!node) return { output: `ls: ${path}: No such file or directory`, error: true };
    if (node.type === "file") return { output: node.name };

    const children = node.children || [];
    if (children.length === 0) return { output: "" };

    const output = children
      .map((c) => (c.type === "folder" ? `\x1b[1;34m${c.name}/\x1b[0m` : c.name))
      .join("  ");

    return { output };
  }

  private cd(path: string): ShellResult {
    const targetPath = this.resolvePath(path);
    const node = this.findNode(targetPath);

    if (!node) return { output: `cd: ${path}: No such file or directory`, error: true };
    if (node.type === "file") return { output: `cd: ${path}: Not a directory`, error: true };

    this.cwd = targetPath;
    return { output: "", newCwd: targetPath };
  }

  private cat(path: string): ShellResult {
    const targetPath = this.resolvePath(path);
    const node = this.findNode(targetPath);

    if (!node) return { output: `cat: ${path}: No such file or directory`, error: true };
    if (node.type === "folder") return { output: `cat: ${path}: Is a directory`, error: true };

    return { output: node.content || "" };
  }

  private resolvePath(path: string): string {
    if (path === "/") return "/";
    if (path.startsWith("/")) return path;

    const parts = this.cwd.split("/").filter(Boolean);
    const relativeParts = path.split("/").filter(Boolean);

    for (const part of relativeParts) {
      if (part === "..") {
        parts.pop();
      } else if (part !== ".") {
        parts.push(part);
      }
    }

    return "/" + parts.join("/");
  }

  private findNode(path: string): FileNode | undefined {
    if (path === "/") return { id: "root", name: "root", path: "/", type: "folder", children: this.files };
    
    const findRecursive = (nodes: FileNode[], targetPath: string): FileNode | undefined => {
      for (const node of nodes) {
        if (node.path === targetPath) return node;
        if (node.type === "folder" && node.children) {
          const found = findRecursive(node.children, targetPath);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findRecursive(this.files, path);
  }
}
