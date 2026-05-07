export interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  defaultTitle: string;
  content: object;
}

export const TEMPLATES: Template[] = [
  {
    id: "feature-spec",
    name: "Feature Spec",
    description: "Define a new product feature end-to-end",
    emoji: "🚀",
    defaultTitle: "Feature Spec: [Name]",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Feature Spec" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Problem" }] },
        { type: "paragraph", content: [{ type: "text", text: "What problem does this feature solve? Who experiences it and how often?" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Goals" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Primary goal" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Secondary goal" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Non-Goals" }] },
        { type: "paragraph", content: [{ type: "text", text: "Explicitly list what this feature will NOT do to prevent scope creep." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "User Stories" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "As a [user type], I want to [action] so that [benefit]." }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Proposed Solution" }] },
        { type: "paragraph", content: [{ type: "text", text: "Describe the solution at a high level. Include wireframe links or mockups if available." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Success Metrics" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Metric 1 - target value" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Open Questions" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Question to resolve before shipping" }] }] },
        ]},
      ],
    },
  },
  {
    id: "api-contract",
    name: "API Contract",
    description: "Document an API endpoint or service interface",
    emoji: "🔌",
    defaultTitle: "API Contract: [Service]",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "API Contract" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Overview" }] },
        { type: "paragraph", content: [{ type: "text", text: "Brief description of what this API does and who its consumers are." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Base URL" }] },
        { type: "paragraph", content: [{ type: "text", text: "https://api.example.com/v1" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Authentication" }] },
        { type: "paragraph", content: [{ type: "text", text: "Describe the authentication mechanism (API key, OAuth2, JWT, etc.)." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Endpoints" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "GET /resource" }] },
        { type: "paragraph", content: [{ type: "text", text: "Returns a list of resources." }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Request Parameters" }] },
        { type: "paragraph", content: [{ type: "text", text: "Describe query parameters, path params, and request body fields." }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Response Schema" }] },
        { type: "paragraph", content: [{ type: "text", text: "Describe the response payload structure and status codes." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Error Codes" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "400 Bad Request - invalid parameters" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "401 Unauthorized - missing or invalid token" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "404 Not Found - resource does not exist" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Rate Limits" }] },
        { type: "paragraph", content: [{ type: "text", text: "Describe rate limiting rules and response headers." }] },
      ],
    },
  },
  {
    id: "rfc",
    name: "RFC",
    description: "Request for Comments - propose a technical decision",
    emoji: "💬",
    defaultTitle: "RFC: [Proposal Title]",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "RFC: [Title]" }] },
        { type: "paragraph", content: [
          { type: "text", text: "Status: ", marks: [{ type: "bold" }] },
          { type: "text", text: "Draft" },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Summary" }] },
        { type: "paragraph", content: [{ type: "text", text: "One paragraph summary of what you are proposing and why." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Motivation" }] },
        { type: "paragraph", content: [{ type: "text", text: "Why is this change needed? What pain point or opportunity drives it?" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Detailed Design" }] },
        { type: "paragraph", content: [{ type: "text", text: "Explain the proposed change in detail. Include examples, diagrams, or pseudocode as needed." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Alternatives Considered" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Alternative A - why it was rejected" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Alternative B - why it was rejected" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Drawbacks" }] },
        { type: "paragraph", content: [{ type: "text", text: "What are the downsides or risks of this proposal?" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Unresolved Questions" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "What needs to be decided before this can be implemented?" }] }] },
        ]},
      ],
    },
  },
  {
    id: "adr",
    name: "Architecture Decision Record",
    description: "Capture an architectural decision and its rationale",
    emoji: "🏗️",
    defaultTitle: "ADR-000: [Decision Title]",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "ADR-000: [Title]" }] },
        { type: "paragraph", content: [
          { type: "text", text: "Date: ", marks: [{ type: "bold" }] },
          { type: "text", text: new Date().toISOString().split("T")[0] },
          { type: "hardBreak" },
          { type: "text", text: "Status: ", marks: [{ type: "bold" }] },
          { type: "text", text: "Proposed" },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Context" }] },
        { type: "paragraph", content: [{ type: "text", text: "What is the issue that is motivating this decision or change?" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Decision" }] },
        { type: "paragraph", content: [{ type: "text", text: "State the decision. Use active voice: 'We will use X because...'" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Consequences" }] },
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Positive" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Benefit 1" }] }] },
        ]},
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Negative" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Tradeoff 1" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Alternatives Rejected" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Alternative - reason for rejection" }] }] },
        ]},
      ],
    },
  },
  {
    id: "bug-report",
    name: "Bug Report",
    description: "Document a bug with steps to reproduce and expected behavior",
    emoji: "🐛",
    defaultTitle: "Bug: [Issue Title]",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Bug Report" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Summary" }] },
        { type: "paragraph", content: [{ type: "text", text: "One sentence description of the bug." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Environment" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Version / Build: " }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Browser / OS: " }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Affected users: " }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Steps to Reproduce" }] },
        { type: "orderedList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Step 1" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Step 2" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Step 3" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Expected Behavior" }] },
        { type: "paragraph", content: [{ type: "text", text: "What should happen?" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Actual Behavior" }] },
        { type: "paragraph", content: [{ type: "text", text: "What actually happens? Include error messages, screenshots, or logs." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Root Cause (if known)" }] },
        { type: "paragraph", content: [{ type: "text", text: "Initial investigation findings." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Proposed Fix" }] },
        { type: "paragraph", content: [{ type: "text", text: "Describe the fix or link to the PR." }] },
      ],
    },
  },
  {
    id: "roadmap-item",
    name: "Roadmap Item",
    description: "Plan a quarter or milestone of product work",
    emoji: "🗺️",
    defaultTitle: "Roadmap: [Quarter / Theme]",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Roadmap Item" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Theme" }] },
        { type: "paragraph", content: [{ type: "text", text: "The one-sentence strategic bet this work represents." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Objectives" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Objective 1" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Objective 2" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Key Results" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "KR 1 - measurable outcome" }] }] },
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "KR 2 - measurable outcome" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Planned Work" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Feature or initiative" }] }] },
        ]},
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Dependencies" }] },
        { type: "paragraph", content: [{ type: "text", text: "Other teams, systems, or decisions this work depends on." }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Risks" }] },
        { type: "bulletList", content: [
          { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Risk - mitigation plan" }] }] },
        ]},
      ],
    },
  },
];
