# Birthday Manager

A modern, serverless, monorepo solution to organize, remember, and manage birthdays, milestones, and gift ideas.

- **Backend / Serverless Automation (`/gas`)**: A Google Apps Script managed via `@google/clasp` connected to a Google Spreadsheet database. It automatically syncs Google Contacts nightly and delivers daily morning digests via email.
- **Frontend SPA (`/src`)**: A client-side Single Page Application built with **React 18 + TypeScript + Vite + Tailwind CSS**, hosted on **GitHub Pages**. It connects directly to the Google Spreadsheet using Google Identity Services (GIS) and Google Sheets API.

---

## 1. Monorepo Architecture

```
birthdays-manager/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated CI/CD build & deploy to GitHub Pages
├── gas/
│   ├── appsscript.json           # Google Apps Script manifest (Timezone & People API)
│   ├── Code.js                   # GAS backend: triggers, contact sync, and email digest
│   └── .clasp.json.example       # Clasp configuration template
├── src/
│   ├── components/               # React components (Highlights, ContactList, NoteModal, etc.)
│   ├── services/                 # Google Auth (GIS), Google Picker, Sheets API & Birthday calculations
│   ├── types/                    # TypeScript interfaces and Google API type declarations
│   ├── App.tsx                   # Main SPA container
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind CSS directives
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript configuration (excludes /gas)
├── vite.config.ts                # Vite configuration (GitHub Pages relative base)
└── README.md
```

---

## 2. Database Specification (Google Spreadsheet)

The database is a Google Spreadsheet containing a sheet named `Birthdays`. Row 1 contains the headers, followed by rows representing each contact across 8 columns (A–H):

| Col | Field | Type | Description |
|---|---|---|---|
| **A** | `id` | String | Unique Google Contact `resourceName` (e.g. `people/c12345`). |
| **B** | `first_name` | String | Given name or display name. |
| **C** | `last_name` | String | Family name. |
| **D** | `birth_date` | String | `YYYY-MM-DD` (e.g. `1990-05-14`) or `--MM-DD` (e.g. `--05-14`) if year is unknown. Stored as raw text or prefixed with `'` to avoid spreadsheet date formula interpretation errors. |
| **E** | `email` | String | Primary email address. |
| **F** | `gift` | Boolean (Checkbox) | Indicates whether a gift should be prepared for this person. |
| **G** | `gift_done` | Boolean (Checkbox) | Indicates whether the gift has been purchased for the current year. |
| **H** | `note` | String (Markdown) | Gift ideas, wishlist, hobbies, sizes, or notes in Markdown format. |

---

## 3. Google Cloud Console Setup

To connect the frontend SPA and the Apps Script to Google APIs, configure a Google Cloud project:

### Step 1: Create or Select a Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `birthday-manager-app`).

### Step 2: Enable Required APIs
Navigate to **APIs & Services > Library** and enable:
- **Google Sheets API**
- **Google Picker API**
- **Google People API**
- **Google Drive API**

### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (or Internal for Google Workspace accounts).
3. Fill in App Name, Support Email, and Developer Contact Email.
4. Under **Scopes**, add:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Under **Test Users**, add your personal Google account email address.

### Step 4: Create Credentials
1. **OAuth 2.0 Client ID**:
   - Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   - Application Type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:5173`
     - `https://<YOUR-GITHUB-USERNAME>.github.io`
   - Copy the generated **Client ID**.
2. **API Key**:
   - Go to **Create Credentials > API Key**.
   - (Recommended) Restrict the key to **Google Sheets API** and **Google Picker API**.
   - Copy the generated **API Key**.

---

## 4. Google Apps Script Backend Setup (`/gas`)

The script in `/gas/Code.js` automates:
1. **Nightly Contact Synchronization (`syncContactsNightly` at 03:00 Europe/Rome)**:
   - Fetches contacts with birthdays from Google Contacts (Google People API).
   - Upserts contacts into the `Birthdays` sheet by `id`.
   - **Preserves existing** `gift`, `gift_done`, and `note` values.
   - **Automatic Annual Reset**: If a contact's birthday occurred yesterday and `gift_done` was `true`, it is automatically reset to `false` for the upcoming year.
   - Formats columns F and G as interactive checkboxes.
2. **Daily Morning Digest (`sendMorningDigest` at 07:00 Europe/Rome)**:
   - Checks birthdays today (`daysUntil === 0`).
   - Checks upcoming birthdays in the next 10 days (`1 <= daysUntil <= 10`).
   - Checks urgent gifts to buy within 14 days (`gift === true`, `gift_done === false`, `daysUntil <= 14`).
   - Identifies contacts missing a birth year (`--MM-DD`) whose birthday falls within 14 days.
   - Computes milestone ages (`10, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100`).
   - Sends a styled HTML email to the active user when birthdays or pending gifts exist.

### Deploying with Clasp

1. Install clasp globally or use the devDependency:
   ```bash
   npx @google/clasp login
   ```
2. Create or link a Google Spreadsheet:
   - Create a new Google Spreadsheet in Google Drive (e.g. named `Birthday Database`).
   - Open **Extensions > Apps Script** in the spreadsheet to get the Script ID from **Project Settings > Script ID**, or create a standalone script:
     ```bash
     npx @google/clasp create --type sheets --title "Birthday Manager Automation" --rootDir ./gas
     ```
3. Copy `.clasp.json.example` to `gas/.clasp.json` and insert your `scriptId`:
   ```json
   {
     "scriptId": "YOUR_APPS_SCRIPT_ID_HERE",
     "rootDir": "./gas"
   }
   ```
4. Push code to Apps Script:
   ```bash
   npx @google/clasp push
   ```
5. Open the Apps Script editor:
   ```bash
   npx @google/clasp open
   ```
6. In the Apps Script editor, run the **`setupTriggers()`** function once. Authorize the necessary permissions when prompted. This schedules the `03:00` nightly sync and `07:00` morning digest triggers.

---

## 5. Frontend SPA Setup (`/src`)

### Local Development

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/birthdays-manager.git
   cd birthdays-manager
   npm install
   ```
2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-google-api-key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 6. Frontend Features & User Flow

1. **Authentication**:
   - Secure client-side authentication via Google Identity Services (GIS) Token Model.
2. **Onboarding & File Picker**:
   - On first login, click **"Select Google Spreadsheet"** to open the Google Picker (filtered to Spreadsheets).
   - The selected `spreadsheetId` and file name are saved in `localStorage`.
   - The top navigation bar displays the connected file with an external link and a **"Change File"** button to re-open the picker at any time.
3. **Highlights Dashboard**:
   - **Birthdays Today**: Highlighted celebratory card with turning age and milestone badges.
   - **Gifts to Buy (Next 14 Days)**: Urgent pending gifts with a 1-click **"Bought"** button for immediate update.
   - **Next 10 Days**: Upcoming birthdays sorted chronologically.
4. **Full Directory & Filters**:
   - Real-time search across first name, last name, email, and Markdown notes.
   - Filter tabs: *All*, *Gifts to Buy*, *Milestones This Year*, and *Missing Birth Year*.
5. **Milestone & Missing Year Badges**:
   - **🌟 Milestone Badges**: Highlighted badge when turning `10, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100`.
   - **⚠️ Missing Year Warnings**: Contacts stored as `--MM-DD` display a warning badge with a direct link to `contacts.google.com` for quick correction.
6. **Direct Google Sheets Synchronization**:
   - Interactive toggles for `gift` ("Need Gift") and `gift_done` ("Purchased") with optimistic UI updates and instant `spreadsheets.values.update` Google Sheets API calls.
   - **Markdown Note Editor**: Edit and preview gift ideas, wishlists, and notes with formatted live preview, synced to column H (`note`).

---

## 7. Deployment to GitHub Pages

An automated GitHub Actions workflow is pre-configured in `.github/workflows/deploy.yml`.

### Setup Steps:
1. Push your repository to GitHub.
2. Navigate to your repository's **Settings > Secrets and variables > Actions**.
3. Add the following repository secrets:
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
   - `VITE_GOOGLE_API_KEY`: Your Google Cloud API Key.
4. Go to **Settings > Pages** and set:
   - **Build and deployment > Source**: **GitHub Actions**.
5. Every push to the `main` branch will automatically build and deploy the SPA to:
   `https://<YOUR-USERNAME>.github.io/birthdays-manager/`

---

## 8. License

MIT
