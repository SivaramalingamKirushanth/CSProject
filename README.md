# Student Records Manager

A simple, single-page website to maintain student records — built with plain
HTML, CSS (Bootstrap 5) and JavaScript. All data is stored in the browser's
`localStorage`, so **no backend/server or database setup is required**.

## Features

- **Login gate** — a basic admin sign-in screen before accessing the records.
- **Add / Edit / Delete / View** student records.
- **Search & filter** students by name, roll no, or class.
- **Smart sorting** on key fields, including a performance column using
  computed averages.
- **Grades tracking** — add marks per subject/term for each student and see
  an auto-computed percentage.
- **Performance overview** with badges such as Excellent, Good, and Needs
  support to quickly identify students who need attention.
- **CSV export** of the (optionally filtered) student list.
- **Backup & restore** via JSON export/import for safer record management.
- Dashboard summary cards (total students, number of classes, average
  percentage, graded entries).

## Getting Started

No build step or installation is needed. Just open [index.html](./index.html)
directly in a browser, or serve the folder with any static file server, e.g.:

```powershell
# From the project folder
python -m http.server 8000
# then visit http://localhost:8000
```

### Default login

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

Change these in the browser console if needed:

```js
localStorage.setItem('srm_admin', JSON.stringify({ username: 'myuser', password: 'mypass' }));
```

## Project Structure

```
CSProject/
├── index.html        # Single-page app: login screen + dashboard + modals
├── css/
│   └── style.css      # Custom styling on top of Bootstrap
└── js/
    ├── data.js         # localStorage data layer (students, grades, admin)
    ├── auth.js         # Client-side login/logout session handling
    └── app.js          # UI logic: rendering, CRUD, search, export
```

## ⚠️ Important Limitations

This is a **client-only demo application**:

- Data is stored in the browser's `localStorage` and is **per-browser,
  per-device** — it is not shared across users or devices, and clearing
  browser data will erase all records.
- The login screen is a **convenience UI gate only, not real security**.
  Credentials and data are visible to anyone with access to the browser's
  developer tools. Do not use this for real/sensitive student data without
  adding a proper backend, database, and authentication layer.

## Possible Next Steps

If you outgrow the local-storage version, the same UI can be backed by a
real server (e.g. Node/Express + a database) and proper authentication
(e.g. hashed passwords, sessions/JWT) for multi-user, persistent use.
