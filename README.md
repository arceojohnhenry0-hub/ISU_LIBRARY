# 📚 ISU Web-Based Library Management System

A static, no-build website for **Isabela State University** (College of Computing Studies, ICT) that makes finding, borrowing, renewing, and returning books easier for students and library staff.

> **Live demo:** `https://<your-username>.github.io/<repo-name>/` (see [Deploy](#deploy-to-github-pages))

## Features

| For students | For librarians |
|---|---|
| Search by title, author, category; filter by category and availability | Everything students can do |
| Per-title copy counts (e.g. "1 of 3 available") | Add and delete titles (`Manage Inventory`) |
| Borrow (7-day loans, max 3 books), renew once, return | See all loans and all transaction history |
| Overdue badges and personal history | Reply to students as the library helper |
| Ask the helper about a book — it answers with live availability | |

Also: responsive layout, keyboard and screen-reader friendly (skip link, focus styles, dialog semantics), safe HTML escaping, and automatic data recovery if saved data is corrupted.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | any email, e.g. `student@isu.edu.ph` | any 4+ characters |
| Librarian | `librarian@isu.edu.ph` | `library123` |

> ⚠️ **Demo mode only.** Accounts and data live in your browser's `localStorage` and are not secure or shared between devices.

## Run locally

Requires Node 18+ (no packages to install):

```bash
npm start        # then visit http://localhost:3000
```

## Deploy to Render (Web Service)

1. Push the project to GitHub (files at the repo root, with the `public/` folder).
2. In Render: **New → Web Service** and pick the repo.
3. Use these settings:

| Field | Value |
|---|---|
| Runtime | Node |
| Branch | `main` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance type | Free |

4. Click **Create Web Service**. Render redeploys on every push.

(Or use **New → Blueprint**; `render.yaml` has these settings.)

> Free instances sleep after inactivity, so the first visit may take ~30–60 seconds.

## Deploy to GitHub Pages

**Settings → Pages → Source: GitHub Actions** (the included workflow publishes the `public/` folder).

## Project structure

```
package.json   Node config (npm install / npm start)
server.js      tiny static server (no dependencies)
render.yaml    Render blueprint
public/
  index.html   page structure and content
  styles.css   styling (responsive)
  app.js       state, loans, roles, chat helper
.github/workflows/pages.yml   GitHub Pages deployment
```

## Going beyond demo mode

GitHub Pages is static hosting, so shared accounts and a shared inventory need a backend. State is kept in one object (`state` in `app.js`) behind `load()`/`save()`, so swapping in **Firebase Authentication + Cloud Firestore** (or another backend) only requires replacing those functions and the login handler.

## Research basis

Built from the team's preliminary research: manual record-keeping makes searching, borrowing, and inventory tracking slow and error-prone; students need to check availability remotely; staff need organized records. Problem statement: *How can the system make borrowing and returning books easier and more convenient for students and library staff?*

**Researchers:** Dela Cruz, Zedtrix Ezekiel · Ferrer, Hannah Lae · Ferrer, Julian · Mijares, Nobe Sheen · Paulo, Justine · Rasote, Dazel · Reyes, Inqil · Sanchez, Ivan · Tomas, Jasmin

**References**
- Abdulrazaq, M. B., & Mustafa, O. M. (2017). Designing and implementing an online library management system. *Science Journal of University of Zakho, 5*(3), 278–284.
- Budiarto, A. J., Wijaya, N., Heriawan, R., Kurniadi, F. I., & Juarto, B. (2023). Design and implementation of a web-based library management system. *2023 ICCTEIE*, Bandar Lampung, Indonesia.

## License

[MIT](LICENSE)
