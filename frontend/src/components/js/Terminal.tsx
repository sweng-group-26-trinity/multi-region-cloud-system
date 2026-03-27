import { useEffect, useRef, useState } from "react";

/**
 * Characters used in the hacker scramble animation.
 * @internal
 */
const HACKER_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`";

/**
 * Returns a random character from {@link HACKER_CHARS}.
 * @internal
 */
function randomChar() {
  return HACKER_CHARS[Math.floor(Math.random() * HACKER_CHARS.length)];
}

/**
 * Represents a single line in the terminal output.
 *
 * - `output` — standard system/response text (white)
 * - `hacker` — scrambled characters shown during the hacker animation (green)
 * - `input`  — echoed user input (yellow)
 */
type TerminalLine =
  | { type: "output"; text: string }
  | { type: "hacker"; text: string }
  | { type: "input"; text: string };

/**
 * Defines a custom command that can be registered with the {@link Terminal} component.
 */
export interface TerminalCommand {
  /**
   * The command string to match, including the leading slash.
   * @example "/kill"
   */
  command: string;

  /**
   * Short description displayed in the `/help` output.
   */
  description: string;

  /**
   * Callback invoked after the command runs.
   * If {@link noHacker} is false (default), this is called after the
   * hacker scramble animation completes. If {@link noHacker} is true,
   * it is called immediately.
   */
  onExecute: () => void;

  /**
   * When `true`, skips the hacker scramble animation and executes
   * {@link onExecute} immediately.
   * @default false
   */
  noHacker?: boolean;
}

/**
 * Props for the {@link Terminal} component.
 */
export interface TerminalProps {
  /**
   * Text shown in the terminal title bar.
   * @default "terminal"
   */
  title?: string;

  /**
   * Custom commands to register in addition to the built-in
   * `/help` and `/clear` commands.
   * @default []
   */
  commands?: TerminalCommand[];

  /**
   * Lines of text displayed on mount, below the version header.
   * @default ['Type a command. Try "/help"']
   */
  initialLines?: string[];
}

/**
 * Terminal
 * --------
 * An interactive in-browser terminal widget.
 *
 * Features:
 * - Accepts typed commands and echoes them in yellow
 * - Built-in `/help` and `/clear` commands
 * - Supports custom commands via the {@link TerminalProps.commands} prop
 * - Runs a green hacker-movie scramble animation before executing commands
 * - Auto-scrolls to the latest output
 * - Focuses the input on click anywhere in the terminal
 *
 * Built-in commands:
 * - `/help`  — lists all available commands
 * - `/clear` — clears all terminal output
 *
 * This version is container-based:
 * - it fills the width and height of its parent
 * - it works inside responsive wrappers like bottom sheets on mobile
 * - it no longer hard-codes absolute positioning or fixed dimensions
 *
 * @example
 * ```tsx
 * <Terminal
 *   title="dinehub-terminal"
 *   initialLines={['Type /kill to terminate all nodes']}
 *   commands={[
 *     {
 *       command: "/kill",
 *       description: "terminate all active nodes",
 *       onExecute: () => fetch("/api/kill", { method: "POST" }),
 *     },
 *   ]}
 * />
 * ```
 */
export function Terminal({
  title = "terminal",
  commands = [],
  initialLines = ['Type a command. Try "/help"'],
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", text: "DineHub Terminal v1.0.0" },
    ...initialLines.map((t): TerminalLine => ({ type: "output", text: t })),
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  /**
   * Runs the hacker scramble animation and then invokes the supplied callback.
   *
   * @param onDone - Callback invoked once the animation finishes.
   */
  function runHackerEffect(onDone: () => void) {
    const totalFrames = 40;
    const lineCount = 12;
    let frame = 0;

    const hackerLineTexts = Array.from({ length: lineCount }, () =>
      Array.from({ length: 60 }, () => randomChar()).join(""),
    );

    setLines((prev) => [
      ...prev,
      ...hackerLineTexts.map(
        (t): TerminalLine => ({ type: "hacker", text: t }),
      ),
    ]);

    const interval = setInterval(() => {
      frame++;

      setLines((prev) => {
        const next = [...prev];

        for (let i = next.length - lineCount; i < next.length; i++) {
          const line = next[i];
          if (line?.type === "hacker") {
            next[i] = {
              type: "hacker",
              text: Array.from({ length: 60 }, () => randomChar()).join(""),
            };
          }
        }

        return next;
      });

      if (frame >= totalFrames) {
        clearInterval(interval);

        setLines((prev) => {
          const next = [...prev];
          const start = next.length - lineCount;
          next.splice(start, lineCount);

          return [
            ...next,
            { type: "output", text: ">> INITIATING SEQUENCE..." },
            { type: "output", text: ">> Processing..." },
            { type: "output", text: ">> DONE." },
          ];
        });

        onDone();
      }
    }, 60);
  }

  /**
   * Parses and dispatches a raw command string entered by the user.
   *
   * @param cmd - The raw string typed by the user.
   */
  function handleCommand(cmd: string) {
    const trimmed = cmd.trim().toLowerCase();
    setLines((prev) => [...prev, { type: "input", text: `> ${cmd}` }]);

    if (trimmed === "/clear") {
      setLines([{ type: "output", text: "Terminal cleared." }]);
      return;
    }

    if (trimmed === "/help") {
      setLines((prev) => [
        ...prev,
        { type: "output", text: "Available commands:" },
        { type: "output", text: "  /help  — show this help message" },
        { type: "output", text: "  /clear — clear terminal" },
        ...commands.map(
          (c): TerminalLine => ({
            type: "output",
            text: `  ${c.command.padEnd(8)} — ${c.description}`,
          }),
        ),
      ]);
      return;
    }

    const match = commands.find((c) => c.command.toLowerCase() === trimmed);

    if (match) {
      if (match.noHacker) {
        setLines((prev) => [
          ...prev,
          { type: "output", text: `Executing ${match.command}...` },
        ]);
        match.onExecute();
      } else {
        setBusy(true);
        setLines((prev) => [
          ...prev,
          { type: "output", text: `Executing ${match.command}...` },
        ]);

        runHackerEffect(() => {
          match.onExecute();
          setBusy(false);
        });
      }
      return;
    }

    setLines((prev) => [
      ...prev,
      {
        type: "output",
        text: `Unknown command: "${cmd}". Type /help for help.`,
      },
    ]);
  }

  /**
   * Handles Enter key submission from the input.
   *
   * @param e - React keyboard event from the input element.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !busy && input.trim()) {
      handleCommand(input);
      setInput("");
    }
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-black/75 shadow-2xl backdrop-blur-md"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Title bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-red-500" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" />
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <span className="ml-2 truncate font-mono text-[11px] text-white/50 sm:text-xs">
          {title}
        </span>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] sm:text-xs space-y-0.5">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "hacker"
                ? "tracking-widest text-green-400 opacity-80"
                : line.type === "input"
                  ? "text-yellow-300"
                  : "text-white/80"
            }
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex shrink-0 items-center gap-2 border-t border-white/10 px-4 py-2">
        <span className="font-mono text-[11px] text-green-400 sm:text-xs">
          $
        </span>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder={busy ? "executing..." : "type a command..."}
          className="flex-1 bg-transparent font-mono text-[11px] text-white outline-none placeholder:text-white/30 sm:text-xs"
        />

        {busy && (
          <span className="animate-pulse font-mono text-[11px] text-green-400 sm:text-xs">
            ▋
          </span>
        )}
      </div>
    </div>
  );
}
