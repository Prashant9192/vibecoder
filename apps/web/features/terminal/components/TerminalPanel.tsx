"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/features/theme/context/ThemeContext";
import "xterm/css/xterm.css";
import { ideLog } from "@/lib/ideLogger";
import { ideEventBus } from "@/lib/ideEventBus";
import { useFileSystemContext } from "@/features/filesystem/context/FileSystemContext";
import { Shell } from "../lib/shell";

interface TerminalPanelProps {
  onClose: () => void;
}

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const termInstance = useRef<any>(null);
  const fitAddonInstance = useRef<any>(null);
  const inputBufferRef = useRef<string>("");
  const shellRef = useRef<Shell | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const { files, addFile, createFolder, saveFile } = useFileSystemContext();

  // Initialize/Update shell when files change
  useEffect(() => {
    if (!shellRef.current) {
        shellRef.current = new Shell(files, { addFile, createFolder, saveFile });
    } else {
        // Technically we should update shell internal files ref if we want absolute real-time
        // but since we pass by reference it might work, however let's be explicit
        (shellRef.current as any).files = files;
    }
  }, [files, addFile, createFolder, saveFile]);

  useEffect(() => {
    if (!terminalRef.current) return;

    let disposed = false;
    Promise.all([
      import("xterm").then((m) => m.Terminal),
      import("xterm-addon-fit").then((m) => m.FitAddon),
    ]).then(([Terminal, FitAddon]) => {
      if (disposed || !terminalRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: theme === "dark" ? "#09090b" : "#ffffff",
          foreground: theme === "dark" ? "#fafafa" : "#09090b",
          cursor: theme === "dark" ? "#fafafa" : "#09090b",
          selectionBackground: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        allowTransparency: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      termInstance.current = term;
      fitAddonInstance.current = fitAddon;

      const writePrompt = () => {
        const prompt = shellRef.current?.getPrompt() || "$ ";
        term.write("\r\n" + prompt);
      };

      term.writeln("\x1b[1;36mVibeCoder Terminal Ready\x1b[0m");
      term.writeln('Type "help" for a list of commands.');
      term.write(shellRef.current?.getPrompt() || "$ ");

      term.onData((data: string) => {
        const charCode = data.charCodeAt(0);

        if (charCode === 13) { // Enter
          const cmd = inputBufferRef.current.trim();
          term.write("\r\n");

          if (cmd) {
            const result = shellRef.current?.execute(cmd);
            if (result) {
              if (result.output === "\x1b[2J\x1b[H") {
                term.clear();
              } else if (result.output) {
                term.writeln(result.output);
              }
            }
            commandHistoryRef.current.push(cmd);
            historyIndexRef.current = commandHistoryRef.current.length;
          }

          inputBufferRef.current = "";
          writePrompt();
        } else if (charCode === 127) { // Backspace
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            term.write("\b \b");
          }
        } else if (data === "\x1b[A") { // Up arrow
          if (historyIndexRef.current > 0) {
            historyIndexRef.current--;
            const historyCmd = commandHistoryRef.current[historyIndexRef.current];
            for (let i = 0; i < inputBufferRef.current.length; i++) term.write("\b \b");
            inputBufferRef.current = historyCmd;
            term.write(historyCmd);
          }
        } else if (data === "\x1b[B") { // Down arrow
          if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
            historyIndexRef.current++;
            const historyCmd = commandHistoryRef.current[historyIndexRef.current];
            for (let i = 0; i < inputBufferRef.current.length; i++) term.write("\b \b");
            inputBufferRef.current = historyCmd;
            term.write(historyCmd);
          } else if (historyIndexRef.current === commandHistoryRef.current.length - 1) {
            historyIndexRef.current = commandHistoryRef.current.length;
            for (let i = 0; i < inputBufferRef.current.length; i++) term.write("\b \b");
            inputBufferRef.current = "";
          }
        } else if (charCode < 32) {
          // Ignore other control characters
        } else {
          inputBufferRef.current += data;
          term.write(data);
        }
      });

      const handleResize = () => fitAddon.fit();
      window.addEventListener("resize", handleResize);

      // store cleanup ref
      (terminalRef.current as any).__cleanup = () => {
        window.removeEventListener("resize", handleResize);
        term.dispose();
      };
    });

    return () => {
      disposed = true;
      const cleanup = (terminalRef.current as any)?.__cleanup;
      if (cleanup) cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme dynamically
  useEffect(() => {
    if (termInstance.current) {
      termInstance.current.options.theme = {
        background: theme === "dark" ? "#09090b" : "#ffffff",
        foreground: theme === "dark" ? "#fafafa" : "#09090b",
        cursor: theme === "dark" ? "#fafafa" : "#09090b",
      };
    }
  }, [theme]);

  // Handle panel focus
  useEffect(() => {
    const handleFocus = () => {
        if (termInstance.current) {
            termInstance.current.focus();
        }
    };
    
    // Auto-focus when panel opens
    handleFocus();
    
    return () => {};
  }, []);

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden border-t">
      <div className="flex-1 w-full pl-4 pt-2 overflow-hidden" ref={terminalRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
