"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/features/theme/context/ThemeContext";
import "xterm/css/xterm.css";
import { ideLog } from "@/lib/ideLogger";
import { ideEventBus } from "@/lib/ideEventBus";

interface TerminalPanelProps {
  onClose: () => void;
}

export function TerminalPanel({ onClose }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const termInstance = useRef<any>(null);
  const fitAddonInstance = useRef<any>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Dynamically import xterm to guarantee client-only execution
    // This prevents the `self is not defined` SSR crash during Fast Refresh
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
        },
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      termInstance.current = term;
      fitAddonInstance.current = fitAddon;

      ideLog("TERMINAL_OPEN", undefined);
      ideEventBus.emit("TERMINAL_OPEN", undefined);

      term.writeln("\x1b[1;36mVibeCoder Terminal Ready\x1b[0m");
      term.write("$ ");

      term.onData((data: string) => {
        if (data === "\r") {
          term.writeln("");
          term.write("$ ");
        } else if (data === "\x7F") {
          term.write("\b \b");
        } else {
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

  // Update theme dynamically when it changes
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
    <div className="h-full bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
      <div className="flex-1 w-full pl-4 pt-2 overflow-hidden" ref={terminalRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
