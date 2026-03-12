"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useTheme } from "@/features/theme/context/ThemeContext";
import "xterm/css/xterm.css";
import { X } from "lucide-react";

interface TerminalPanelProps {
  onClose: () => void;
}

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: theme === "dark" ? "#09090b" : "#ffffff", // zinc-950 / white
        foreground: theme === "dark" ? "#fafafa" : "#09090b",
        cursor: theme === "dark" ? "#fafafa" : "#09090b",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    termInstance.current = term;
    fitAddonInstance.current = fitAddon;

    term.writeln("\x1b[1;36mVibeCoder Terminal Ready\x1b[0m");
    term.write("$ ");

    // Basic echo implementation for sim
    term.onData(data => {
      if (data === '\r') {
        term.writeln("");
        term.write("$ ");
      } else if (data === '\x7F') { // Backspace
        term.write('\b \b');
      } else {
        term.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
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

  return (
    <div className="h-64 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <h3 className="text-[11px] tracking-wider uppercase font-semibold text-zinc-500">Terminal</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
             <X size={14} />
          </button>
      </div>
      <div className="flex-1 w-full pl-4 pt-2 overflow-hidden" ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
