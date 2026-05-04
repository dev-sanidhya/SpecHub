"use client";

import { useMemo } from "react";
import diff_match_patch from "diff-match-patch";

interface DiffViewProps { oldText: string; newText: string; }
type DiffOp = -1 | 0 | 1;

function contentToText(content: object | null | undefined): string {
  if (!content) return "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = content as any;
    if (node.type === "text") return node.text ?? "";
    if (node.content) return node.content.map(contentToText).join(node.type === "paragraph" ? "\n" : "");
    return "";
  } catch { return ""; }
}

export function jsonToText(content: object | null | undefined): string {
  if (!content) return "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = content as any;
    if (!doc.content) return "";
    return doc.content.map((node: object) => contentToText(node)).join("\n\n").trim();
  } catch { return ""; }
}

export function DiffView({ oldText, newText }: DiffViewProps) {
  const diffs = useMemo(() => {
    const Dmp = diff_match_patch;
    const dmp = new Dmp();
    const d = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(d);
    return d as [DiffOp, string][];
  }, [oldText, newText]);

  return (
    <div className="font-mono text-sm leading-relaxed p-4 whitespace-pre-wrap break-words">
      {diffs.map(([op, text], i: number) => {
        if (op === 0) return <span key={i} className="text-foreground-2">{text}</span>;
        if (op === 1) return <span key={i} className="bg-green-500/15 text-green-600 dark:text-green-400 rounded px-0.5">{text}</span>;
        return <span key={i} className="bg-red-500/15 text-red-600 dark:text-red-400 line-through rounded px-0.5">{text}</span>;
      })}
    </div>
  );
}
