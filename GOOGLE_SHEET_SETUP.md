# How to Connect RRB Group D Result Checker to Google Sheets

This guide shows you how to automatically collect every candidate submission (**Name**, **Mobile Number**, **Roll Number**, **Selected Zone**, **Result Status**, and **Timestamp**) into your own Google Sheet.

---

## Step 1: Create a Google Sheet

1. Go to [sheets.new](https://sheets.new) (creates a new Google Sheet).
2. Name the sheet: **RRB Group D Candidate Leads 2026**.
3. In **Row 1**, set up these column headers:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **Timestamp** | **Candidate Name** | **Mobile Number** | **Roll Number** | **RRB Zone** | **Result Status** | **Browser / Device** |

---

## Step 2: Open Apps Script

1. In the top menu of your Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any existing code in the editor (`myFunction`).
3. Paste the following complete script:

```javascript
/**
 * RRB Group D Result Checker - Webhook Receiver
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.name || "",
      data.mobile || "",
      data.rollNumber || "",
      data.zone || "",
      data.status || "",
      data.userAgent || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return doPost({ postData: { contents: JSON.stringify(e.parameter) } });
}
```

4. Press `Ctrl + S` (or click the 💾 floppy disk icon) to save.

---

## Step 3: Deploy as Web App

1. In the top-right corner of the Apps Script window, click the blue **Deploy** button > **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Configure the settings:
   - **Description**: `RRB Lead Collector`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Crucial: must be set to "Anyone" so the static website can submit data without Google sign-in prompt)*.
4. Click **Deploy**.
5. If Google asks to **Authorize access**:
   - Click *Authorize Access*
   - Choose your Google account
   - Click *Advanced* (small text at bottom)
   - Click *Go to Untitled project (unsafe)*
   - Click *Allow*
6. Copy the **Web App URL** provided (it looks like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 4: Connect the Webhook to Your Result Checker

You have two easy ways to link your Web App URL:

### Option A: In the Browser (Instant, No Code Editing Needed)
1. Open your website (`index.html`).
2. Scroll to the footer and click **⚙️ Sheet Setup & Leads**.
3. Paste your Web App URL into the text box and click **Save URL**.
4. Click **Test Sheet** — you will immediately see a test row appear in your Google Sheet!

### Option B: Set as Default in `app.js` (Recommended for GitHub Pages)
Open `app.js` and paste your URL into `DEFAULT_GOOGLE_SHEET_WEBHOOK_URL`:
```javascript
const APP_CONFIG = {
  DEFAULT_GOOGLE_SHEET_WEBHOOK_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  ...
};
```
Commit and push to GitHub. Every visitor will now submit directly into your Google Sheet!

---

## Backup: Download Leads as CSV Anytime
Even before connecting Google Sheets, the tool automatically stores all submissions in the browser's `localStorage`. You can click **Download All Captured Leads (CSV)** inside the **⚙️ Sheet Setup & Leads** popup at any time to export the full data.

