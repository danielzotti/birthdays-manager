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

## 3. Step-by-Step Initial Setup Guide (Spreadsheet & Credentials)

Follow this end-to-end guide to set up your Google Spreadsheet database and generate the required credentials for `.env`.

### Part A: Create the Google Spreadsheet Database

1. Open [Google Drive](https://drive.google.com/).
2. Click **New (+)** > **Google Sheets** > **Blank spreadsheet**.
3. Name the spreadsheet at the top left (e.g. **`Birthday Database`**).
4. At the bottom tab bar, double-click the default sheet tab (*Sheet1*) and rename it to **`Birthdays`**.
5. *(Optional)* Add the header row in Row 1 (columns A through H):
   `id`, `first_name`, `last_name`, `birth_date`, `email`, `gift`, `gift_done`, `note`.
   *(If left empty, the Google Apps Script will automatically populate the headers on its first run).*
6. **Get your Apps Script ID**:
   - In the spreadsheet menu, click **Extensions > Apps Script**. This automatically creates an Apps Script project bound to this specific spreadsheet.
   - In the Apps Script editor that opens, click the **Gear icon (Project Settings)** on the left sidebar.
   - Find the section **IDs** and copy the **Script ID** (a long alphanumeric string).
   - In your local project repository, create `gas/.clasp.json` from the example template:
     ```bash
     cp gas/.clasp.json.example gas/.clasp.json
     ```
   - Open `gas/.clasp.json` and paste your copied ID into `scriptId`:
     ```json
     {
       "scriptId": "YOUR_COPIED_SCRIPT_ID_HERE",
       "rootDir": "./gas"
     }
     ```

---

### Part B: Obtain the `.env` Credentials in Google Cloud Console

Your `.env` file requires two values:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key
```

Follow these click-by-click steps in the [Google Cloud Console](https://console.cloud.google.com/):

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the **Project Dropdown** and select **New Project**.
3. Enter a Project Name (e.g. **`Birthday Manager`**) and click **Create**.
4. Once created, make sure the project is selected in the top bar.

#### Step 2: Enable the Required APIs
1. Open the navigation menu and go to **APIs & Services > Library**.
2. Search for and click **Enable** for each of the following 4 APIs:
   - **Google Sheets API** (reads and writes rows in your spreadsheet)
   - **Google Picker API** (displays the file selector to choose the spreadsheet)
   - **Google People API** (imports contacts with birthdays)
   - **Google Drive API** (grants access to file selection)

#### Step 3: Configure the OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (accessible to any Google account) and click **Create**.
3. In **App Information**:
   - **App name**: `Birthday Manager`
   - **User support email**: your Google account email
   - **Developer contact information**: your Google account email
4. Click **Save and Continue**.
5. In **Scopes**:
   - Click **Add or Remove Scopes**.
   - Select the following scopes:
     - `https://www.googleapis.com/auth/spreadsheets`
     - `https://www.googleapis.com/auth/drive.file`
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click **Update** and then **Save and Continue**.
6. In **Test Users**:
   - Click **+ Add Users** and type your personal Google account email address.
   - Click **Add**, then click **Save and Continue**.
   *(While your app is in testing mode, only authorized test users can sign in).*
7. Review the summary and click **Back to Dashboard**.

#### Step 4: Generate the OAuth Client ID (`VITE_GOOGLE_CLIENT_ID`)
1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Choose **Application type**: **Web application**.
4. Set **Name**: `Birthday Manager Web Client`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:3000` (for local development)
   - `http://localhost:5173` (standard Vite default port)
   - `https://<YOUR-GITHUB-USERNAME>.github.io` (for GitHub Pages hosting)
6. Leave **Authorized redirect URIs** empty (the app uses the client-side popup Token Model).
7. Click **Create**.
8. A modal dialog will present your **Client ID** (formatted like `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).
9. Copy this value and paste it into `.env` as:
   ```env
   VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```

#### Step 5: Generate the API Key (`VITE_GOOGLE_API_KEY`)
1. On the same **Credentials** page, click **+ Create Credentials** > **API key**.
2. A modal will display your new API key (starts with `AIzaSy...`).
3. Copy this key and paste it into `.env` as:
   ```env
   VITE_GOOGLE_API_KEY=AIzaSy...
   ```
4. *(Recommended Security Step)* Click **Edit API key** on the newly created key:
   - Under **API restrictions**, select **Restrict key**.
   - Check **Google Sheets API** and **Google Picker API**.
   - Click **Save**.

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
5. Every push to the `master` branch will automatically build and deploy the SPA to:
   `https://<YOUR-USERNAME>.github.io/birthdays-manager/`

---

## 8. License

MIT
