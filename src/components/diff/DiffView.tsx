"use client";

import { useMemo } from "react";
import diff_match_patch from "diff-match-patch";
import { cn } from "@/lib/utils";

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

  const segments = diffs.flatMap(([op, text]) =>
    text.split("\n").map((line, index, arr) => ({
      op,
      text: line,
      endsWithBreak: index < arr.length - 1,
    }))
  );

  return (
    <div className="overflow-auto bg-surface">
      <div className="min-w-full divide-y divide-border/60 font-mono text-sm">
        {segments.map((segment, index) => {
          const marker = segment.op === 1 ? "+" : segment.op === -1 ? "-" : " ";
          const tone =
            segment.op === 1
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : segment.op === -1
                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                : "text-foreground-2";

          return (
            <div key={`${index}-${segment.text}`} className={cn("grid grid-cols-[40px_1fr] gap-0", tone)}>
              <div className="border-r border-border/60 px-3 py-2 text-center opacity-60">{marker}</div>
              <div className={cn("px-4 py-2 whitespace-pre-wrap break-words", segment.op === -1 && "line-through")}>
                {segment.text || " "}
                {segment.endsWithBreak ? "\n" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
