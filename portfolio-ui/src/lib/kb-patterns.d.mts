/**
 * Types for kb-patterns.mjs.
 *
 * Hand-written rather than generated: the implementation is plain ESM so that
 * scripts/fetch-knowledge.mjs (Node, no build step) and src/kb.ts (Worker, bundled
 * by esbuild) can share one copy of the PII rules. A declaration file gives the
 * TypeScript side types without turning on allowJs.
 */

/** Names of the PII categories found in `text`, or [] when clean. */
export declare function findPii(text: string): string[];

/** NFKC + dash/space folding, so patterns only ever see ASCII separators. */
export declare function normalise(text: string): string;

/** Google Docs markdown cleanup. Applies `normalise` first. */
export declare function tidy(md: string): string;

/** Rule names, in order. Used by the cross-consumer drift test. */
export declare const PII_RULE_NAMES: readonly string[];
