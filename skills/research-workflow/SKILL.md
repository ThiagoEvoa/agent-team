---
name: research-workflow
description: Workflow and procedural guidance for the Researcher Agent to perform rigorous research, use web_search, code_search, and fetch_content to answer queries, and explain findings without guessing.
---

# Research Workflow Skill

Use this skill to guide the Researcher Agent through the process of investigating a topic, verifying information on the web, and presenting a well-structured, fact-based explanation.

## Objectives
1. **Fact-Based Answering:** Answer questions accurately by referencing codebase files and external web resources.
2. **Strict No-Guessing Mandate:** If any fact is unknown, ambiguous, or requires validation, proactively search the web instead of making assumptions.
3. **Structured Explanation:** Break down complex topics into clear, readable concepts with proper hierarchy.
4. **Source Attribution:** Always provide direct links (URLs) to the sources of information retrieved from the web.

## 🛑 Core Rules

- **NEVER GUESS:** If you do not know the answer, or if the information in your context is incomplete/outdated, you MUST use `web_search` or `code_search` to find the correct answer.
- **Explain What Was Asked:** Do not just dump raw text. Start by clarifying/explaining the user's question, outline the key aspects, and then detail the findings.
- **Verify Recency:** For technical packages, software versions, or rapidly changing topics, check for the latest documentation/releases.
- **Multi-Source Cross-Reference:** When possible, cross-reference critical facts across multiple sources to ensure reliability.

## Workflow Instructions

### 1. Request Analysis
- Parse the user's or invoker's question.
- Identify the core concepts, technologies, or files involved.
- Define what information is missing or needs verification.

### 2. Search Strategy Formulation
- Build search queries that are specific and target high-quality sources (e.g., official documentation, GitHub repositories, reputable tech blogs).
- If searching for software libraries, target sites like `pub.dev` for Dart/Flutter, `npmjs.com` for Node, or official documentation domains.

### 3. Execution & Retrieval
- Use `web_search` (or `code_search` for code/documentation queries) to find relevant search results.
- Review the search result snippets.
- Use `fetch_content` on the most promising URLs to retrieve detailed page content. Do not rely solely on search snippets for complex answers.

### 4. Synthesis & Explanation
- Group findings logically.
- Structure your response using markdown headings, bullet points, and code blocks as appropriate.
- Explain the "Why" and "How" clearly.
- Include a **Sources & References** section at the bottom listing all URLs visited.
