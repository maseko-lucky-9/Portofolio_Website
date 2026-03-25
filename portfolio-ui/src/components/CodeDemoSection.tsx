import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Play, Copy, Check, Terminal } from "lucide-react";
import { codeExamples } from "@/data/codeExamples";
import { useTheme } from "@/contexts/ThemeContext";

const springTransition = { type: "spring", stiffness: 260, damping: 26 };

export function CodeDemoSection() {
  const [activeExample, setActiveExample] = useState(codeExamples[0]);
  const [output, setOutput] = useState<string>(activeExample.output || "");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    setOutput("Running...");

    // Simulate code execution
    setTimeout(() => {
      setOutput(activeExample.output || "Code executed successfully!");
      setIsRunning(false);
    }, 1000);
  }, [activeExample]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(activeExample.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeExample]);

  return (
    <section id="code-demo" className="py-20 bg-muted/30 section-mesh">
      <div className="section-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={springTransition}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Live Code
          </span>
          <h2 className="section-title">Interactive Code Demo</h2>
          <p className="section-subtitle mx-auto">
            Explore my coding style with live examples. Try running the code to see it in
            action.
          </p>
        </motion.div>

        {/* Example Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...springTransition, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {codeExamples.map((example) => (
            <button
              key={example.id}
              onClick={() => {
                setActiveExample(example);
                setOutput(example.output || "");
              }}
              className={`inline-flex items-center rounded-xl px-4 py-2 font-medium text-sm transition-all ${
                activeExample.id === example.id
                  ? "text-primary-foreground"
                  : "border hover:border-primary"
              }`}
              style={{
                ...(activeExample.id === example.id
                  ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }
                  : { background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }),
                transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {example.title}
            </button>
          ))}
        </motion.div>

        {/* Code Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ ...springTransition, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="code-editor-wrapper">
            {/* Editor Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ background: "hsl(var(--muted) / 0.5)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-sm font-medium">{activeExample.title}</span>
                <span className="text-xs text-muted-foreground">
                  {activeExample.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg transition-all hover:bg-accent"
                  style={{ transition: "all 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  aria-label="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-secondary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-secondary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{
                    background: "var(--gradient-secondary)",
                    boxShadow: "var(--shadow-glow-secondary)",
                  }}
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? "Running..." : "Run Code"}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="h-96">
              <Editor
                height="100%"
                language={activeExample.language}
                value={activeExample.code}
                theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  readOnly: true,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>

            {/* Output */}
            <div className="border-t" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <div
                className="flex items-center gap-2 px-4 py-2 border-b"
                style={{ background: "hsl(var(--muted) / 0.5)" }}
              >
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Output</span>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto max-h-40">
                <code className={isRunning ? "text-muted-foreground" : "text-foreground"}>
                  {output}
                </code>
              </pre>
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {activeExample.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
