// Converts Tiptap JSON doc to clean Markdown string

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
}

function applyMarks(text: string, marks: TiptapMark[]): string {
  let out = text;
  for (const mark of marks) {
    if (mark.type === "bold") out = `**${out}**`;
    else if (mark.type === "italic") out = `*${out}*`;
    else if (mark.type === "underline") out = `<u>${out}</u>`;
    else if (mark.type === "strike") out = `~~${out}~~`;
    else if (mark.type === "code") out = `\`${out}\``;
    else if (mark.type === "highlight") out = `==${out}==`;
    else if (mark.type === "link") {
      const href = (mark.attrs?.href as string) ?? "#";
      out = `[${out}](${href})`;
    }
  }
  return out;
}

function inlineContent(nodes: TiptapNode[] | undefined): string {
  if (!nodes) return "";
  return nodes
    .map((n) => {
      if (n.type === "text") {
        const raw = n.text ?? "";
        return n.marks?.length ? applyMarks(raw, n.marks) : raw;
      }
      if (n.type === "hardBreak") return "  \n";
      if (n.type === "image") {
        const src = (n.attrs?.src as string) ?? "";
        const alt = (n.attrs?.alt as string) ?? "";
        return `![${alt}](${src})`;
      }
      return inlineContent(n.content);
    })
    .join("");
}

function tableToMarkdown(node: TiptapNode): string {
  const rows = node.content ?? [];
  const lines: string[] = [];
  let headerDone = false;

  for (const row of rows) {
    if (row.type !== "tableRow") continue;
    const cells = row.content ?? [];
    const isHeader = cells.some((c) => c.type === "tableHeader");
    const cellTexts = cells.map((c) => inlineContent(c.content).trim().replace(/\|/g, "\\|"));
    lines.push(`| ${cellTexts.join(" | ")} |`);
    if (isHeader && !headerDone) {
      lines.push(`| ${cellTexts.map(() => "---").join(" | ")} |`);
      headerDone = true;
    }
  }

  return lines.join("\n");
}

function nodeToMarkdown(node: TiptapNode, listDepth = 0, ordered = false, index = 0): string {
  const indent = "  ".repeat(listDepth);

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((n) => nodeToMarkdown(n)).join("\n\n").trim();

    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const prefix = "#".repeat(level);
      return `${prefix} ${inlineContent(node.content)}`;
    }

    case "paragraph":
      return inlineContent(node.content);

    case "bulletList":
      return (node.content ?? [])
        .map((item, i) => nodeToMarkdown(item, listDepth, false, i))
        .join("\n");

    case "orderedList":
      return (node.content ?? [])
        .map((item, i) => nodeToMarkdown(item, listDepth, true, i))
        .join("\n");

    case "listItem": {
      const children = node.content ?? [];
      const bullet = ordered ? `${index + 1}.` : "-";
      const parts: string[] = [];
      for (const child of children) {
        if (child.type === "paragraph") {
          parts.push(`${indent}${bullet} ${inlineContent(child.content)}`);
        } else if (child.type === "bulletList" || child.type === "orderedList") {
          parts.push(nodeToMarkdown(child, listDepth + 1, child.type === "orderedList"));
        } else {
          parts.push(nodeToMarkdown(child, listDepth));
        }
      }
      return parts.join("\n");
    }

    case "blockquote": {
      const inner = (node.content ?? []).map((n) => nodeToMarkdown(n)).join("\n");
      return inner
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    }

    case "codeBlock": {
      const lang = (node.attrs?.language as string) ?? "";
      const code = inlineContent(node.content);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "horizontalRule":
      return "---";

    case "table":
      return tableToMarkdown(node);

    case "image": {
      const src = (node.attrs?.src as string) ?? "";
      const alt = (node.attrs?.alt as string) ?? "";
      return `![${alt}](${src})`;
    }

    case "text":
      return node.marks?.length ? applyMarks(node.text ?? "", node.marks) : (node.text ?? "");

    default:
      // Fallback: render children if they exist
      if (node.content?.length) {
        return (node.content ?? []).map((n) => nodeToMarkdown(n)).join("\n");
      }
      return "";
  }
}

export function tiptapToMarkdown(content: object | null | undefined): string {
  if (!content) return "";
  return nodeToMarkdown(content as TiptapNode);
}
