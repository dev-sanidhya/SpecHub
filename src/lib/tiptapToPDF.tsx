/**
 * Converts a Tiptap JSON document to a @react-pdf/renderer PDF stream.
 * Runs server-side only (Node.js runtime).
 */

import React from "react";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Style = Record<string, any>;

// Prevent hyphenation
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 64,
    paddingHorizontal: 72,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
    lineHeight: 1.6,
  },
  h1: { fontSize: 24, fontFamily: "Helvetica-Bold", marginBottom: 10, marginTop: 18, color: "#111" },
  h2: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 16, color: "#111" },
  h3: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 14, color: "#111" },
  h4: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4, marginTop: 12, color: "#111" },
  paragraph: { marginBottom: 8, lineHeight: 1.7 },
  listItem: { flexDirection: "row", marginBottom: 4, paddingLeft: 12 },
  bullet: { width: 16, fontFamily: "Helvetica", color: "#555" },
  listText: { flex: 1, lineHeight: 1.7 },
  orderedNumber: { width: 20, fontFamily: "Helvetica", color: "#555" },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
    paddingLeft: 12,
    marginBottom: 8,
    color: "#555",
  },
  codeBlock: {
    backgroundColor: "#f4f4f5",
    padding: 10,
    marginBottom: 8,
    fontFamily: "Courier",
    fontSize: 9.5,
    lineHeight: 1.5,
  },
  inlineCode: {
    fontFamily: "Courier",
    fontSize: 9.5,
    backgroundColor: "#f4f4f5",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    marginVertical: 12,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  boldItalic: { fontFamily: "Helvetica-BoldOblique" },
  underline: { textDecoration: "underline" },
  strike: { textDecoration: "line-through" },
  docTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#111",
  },
  docMeta: {
    fontSize: 9,
    color: "#888",
    marginBottom: 32,
  },
});

// ---------------------------------------------------------------------------
// Inline text node converter
// ---------------------------------------------------------------------------

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

function buildTextStyle(marks: TiptapMark[]): Style {
  const hasBold = marks.some((m) => m.type === "bold");
  const hasItalic = marks.some((m) => m.type === "italic");
  const hasUnderline = marks.some((m) => m.type === "underline");
  const hasStrike = marks.some((m) => m.type === "strike");
  const hasCode = marks.some((m) => m.type === "code");

  let style: Style = {};
  if (hasBold && hasItalic) style = { ...style, ...styles.boldItalic };
  else if (hasBold) style = { ...style, ...styles.bold };
  else if (hasItalic) style = { ...style, ...styles.italic };
  if (hasUnderline) style = { ...style, ...styles.underline };
  if (hasStrike) style = { ...style, ...styles.strike };
  if (hasCode) style = { ...style, ...styles.inlineCode };
  return style;
}

function inlineText(node: TiptapNode, key: string | number): React.ReactElement {
  const marks = node.marks ?? [];
  const textStyle = buildTextStyle(marks);
  return (
    <Text key={key} style={textStyle}>
      {node.text ?? ""}
    </Text>
  );
}

function inlineContent(nodes: TiptapNode[] | undefined): React.ReactElement[] {
  if (!nodes) return [];
  return nodes.map((n, i) => {
    if (n.type === "text") return inlineText(n, i);
    if (n.type === "hardBreak") return <Text key={i}>{"\n"}</Text>;
    if (n.content) return <Text key={i}>{inlineContent(n.content)}</Text>;
    return <Text key={i}>{n.text ?? ""}</Text>;
  });
}

// ---------------------------------------------------------------------------
// Block node converter
// ---------------------------------------------------------------------------

function blockNode(node: TiptapNode, idx: number): React.ReactElement | null {
  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      const headingStyle =
        level === 1 ? styles.h1
        : level === 2 ? styles.h2
        : level === 3 ? styles.h3
        : styles.h4;
      return (
        <Text key={idx} style={headingStyle}>
          {inlineContent(node.content)}
        </Text>
      );
    }

    case "paragraph":
      return (
        <Text key={idx} style={styles.paragraph}>
          {inlineContent(node.content)}
        </Text>
      );

    case "bulletList":
      return (
        <View key={idx}>
          {(node.content ?? []).map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bullet}>{"•  "}</Text>
              <Text style={styles.listText}>
                {inlineContent(item.content?.[0]?.content)}
              </Text>
            </View>
          ))}
        </View>
      );

    case "orderedList": {
      const start = (node.attrs?.start as number) ?? 1;
      return (
        <View key={idx}>
          {(node.content ?? []).map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.orderedNumber}>{`${start + i}.`}</Text>
              <Text style={styles.listText}>
                {inlineContent(item.content?.[0]?.content)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    case "blockquote":
      return (
        <View key={idx} style={styles.blockquote}>
          {(node.content ?? []).map((child, i) => (
            <Text key={i} style={styles.paragraph}>
              {inlineContent(child.content)}
            </Text>
          ))}
        </View>
      );

    case "codeBlock":
      return (
        <View key={idx} style={styles.codeBlock}>
          <Text>{inlineContent(node.content)}</Text>
        </View>
      );

    case "horizontalRule":
      return <View key={idx} style={styles.hr} />;

    default:
      if (node.content) {
        return (
          <View key={idx}>
            {node.content.map((child, i) => blockNode(child, i))}
          </View>
        );
      }
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API - returns a ReadableStream for streaming response
// ---------------------------------------------------------------------------

export async function tiptapToPDF(
  docTitle: string,
  versionNumber: number,
  tiptapJson: object,
  meta?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const doc = tiptapJson as TiptapNode;
  const blocks = (doc.content ?? [])
    .map((node, i) => blockNode(node, i))
    .filter(Boolean) as React.ReactElement[];

  const element = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.docTitle}>{docTitle}</Text>
        <Text style={styles.docMeta}>
          {meta ?? `Version ${versionNumber}`}
        </Text>
        {blocks}
      </Page>
    </Document>
  );

  // In @react-pdf/renderer v4, toBuffer() returns a ReadableStream
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  return pdf(element).toBuffer() as any;
}
