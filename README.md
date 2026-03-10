# STRATEGIC REVIEW BOARD (Synthetic Focus Groups)

**Version: 2.0.0**

This document serves as the absolute source of truth and complete context for the Strategic Review Board project. It must be read thoroughly by any AI assistant at the start of a new session to understand the application's architecture, dependencies, deployment workflows, and design philosophy.

---

## 1. Project Overview & Architecture

The Strategic Review Board is a web application designed to simulate focus groups using AI personas (advisors). Users can upload documents (images/PDFs) or enter text, select specific AI personas, and receive targeted feedback from the perspective of those personas.

### Technical Stack

- **Frontend**: Pure HTML5, CSS3 (Vanilla), and Vanilla JavaScript (`app.js`). NO JS FRAMEWORKS (No React, Vue, etc.) are used for the UI.
- **Styling**: Brutalist/Cyber-brutalist aesthetic. High-contrast colors, sharp borders, `Unbounded` font for headers, `JetBrains Mono` for tech details, and `Lora` for reading text.
- **Backend API**: **Vercel Serverless Functions** (Node.js). Located in the `/api/` directory.
- **Database**: **Upstash Redis** (via Vercel KV Integration), accessed using the `@upstash/redis` SDK.
- **External API**: Google Gemini Flash 2.5 API (handled entirely client-side).

---

## 2. Core Features & Implementation Details

### A. Frontend Interactions (`app.js`)

- **File Handling**: Supports Drag & Drop and standard file input. Files are converted to Base64 before being sent to the Gemini API.
- **Persona Filtering**: The UI builds checkboxes dynamically from `PERSONAS` in `data.js`. The main loop only generates reports for the selected advisors.
- **Progress Animation**: A brutalist diagonal-stripe block animation (`#progressBarFill`) ensures high visibility during the evaluation phase.
- **Markdown Parsing**: Uses `marked.js` (loaded via CDN) to render Gemini's markdown responses into clean HTML.

### B. PDF Export (Native Print)

We DO NOT use client-side PDF generation libraries like `jsPDF` or `html2pdf.js` because they struggle with Cyrillic (Ukrainian) fonts and CSS grid layouts.

- **Solution**: The "Download PDF" button opens a hidden `window.open` tab, injects a pure HTML/CSS representation of the report using `@media print` rules, and triggers the browser's native `window.print()` dialogue. This guarantees 100% text fidelity and layout control.

### C. Copy to Clipboard

A secondary icon button near the PDF export allows users to instantly copy the raw text of the generated report to their clipboard, featuring a 2-second visual timeout (green checkmark).

---

## 3. Database & Google Sheets Integration

The application silently logs all generated reports into a database so they can be aggregated in Google Sheets.

### The Flow

1. **Frontend Save**: When an advisor finishes generating a response in `app.js`, a silent `POST` request is sent to `/api/save`.
2. **Vercel Serverless `save.js`**: Receives the payload (Brief, Advisor Name, Advisor Role, Report Text) and pushes it into an Upstash Redis list named `evaluations` using `redis.lpush()`.
3. **Vercel Serverless `export.js`**: An endpoint (`/api/export?key=focus2026`) that responds to `GET` requests. It reads the top 100 entries from Redis and formats them into strict CSV format.
4. **Google Sheets**: The user's Google Sheet uses the formula `=IMPORTDATA("https://strategic-review-board.vercel.app/api/export?key=focus2026")` to pull the CSV data dynamically.

### Upstash Redis Caveat

The project explicitly uses the `@upstash/redis` SDK in `package.json`, **NOT** `@vercel/kv`. This is because the user manually connected an Upstash database instance on the Free tier via the Vercel Dashboard integrations panel, which injects variables compatible directly with the Upstash SDK (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).

---

## 4. Deployment & GitHub Workflow

This project is deployed automatically via **Vercel**, linked to a **GitHub** repository (`STRATEGIC-REVIEW-BOARD`).

### Important Rules for AI Assistants

1. **Never use local `npm install` or persistent terminal commands.** The user's local Windows terminal frequently freezes on blocking commands.
2. **Manage Dependencies via `package.json`**: Always declare dependencies (like `@upstash/redis`) in `package.json`. Vercel will automatically install them during the cloud build process.
3. **Deployment Trigger**: To deploy new features or backend changes, simply use the `mcp_GitKraken_git_add_or_commit` and `mcp_GitKraken_git_push` tools to push the code to the `main` branch. Vercel will auto-deploy immediately.

### Environment Variables (Vercel Dashboard)

- **Upstash Keys**: Automatically managed by the Vercel Integration.
- **`EXPORT_SECRET_KEY`**: (Optional) Used in `export.js` to secure the CSV endpoint. Currently defaults to `focus2026` in code if not set in the Vercel dashboard.

---

## 5. Known Limitations & Future Roadmap

- The Gemini API key is currently hardcoded in `data.js`. For true public deployment, this must be refactored to require user input or be moved entirely to a serverless backend proxy to protect the key.
- The Redis log only exports the last 100 entries to prevent memory limits on the free tier and `IMPORTDATA` size restrictions.
