# RRB Group D (Level-1) Result Checker 🚆

A fast, lightweight, and responsive **Railway Recruitment Board (RRB) Group D (CEN 09/2025) CBT Result & PET Shortlist Checker** web application built for instant verification and lead collection. Ready to deploy directly to **GitHub Pages**.

![RRB Group D Portal](https://img.shields.io/badge/RRB-Bhopal%20Result%20Live-059669?style=for-the-badge&logo=train)
![GitHub Pages Ready](https://img.shields.io/badge/GitHub%20Pages-Ready-2563eb?style=for-the-badge&logo=github)
![Google Sheets Webhook](https://img.shields.io/badge/Google%20Sheets-Lead%20Capture-34a853?style=for-the-badge&logo=googlesheets)

---

## ✨ Features

- **Official Bhopal Zone Results Database**: Contains all **2,294 shortlisted roll numbers** for RRB Bhopal (CEN 09/2025 Level-1 Posts) extracted directly from the official notification.
- **Light Theme & Official Indian Railways Aesthetics**: Clean white/slate background, high contrast, official blue & gold accents, responsive on mobile, tablet, and desktop.
- **Instant Result Matching**: $O(1)$ fast client-side lookup using a JavaScript `Set`. Checks qualification in under 1 millisecond.
- **Candidate Data Collection into Google Sheet**: Automatically sends candidate **Name**, **10-Digit Mobile Number**, **Roll Number**, **Zone**, and **Qualification Status** into your private Google Sheet in real-time.
- **Local CSV Lead Backup**: Every check is also saved in browser storage. Download all leads as an Excel-compatible CSV anytime via the Admin modal.
- **Multi-Zone Architecture**: Supports all 21 RRB zones. RRB Bhopal is active now; other zones capture candidate registrations with an "Alert Registered" status.
- **Printable Candidate Scorecard**: Formatted specifically for A4 printing/PDF save with `@media print` rules.
- **Official PDF Download**: Direct download button for the official `Bhopal.pdf` notification.
- **100% Static & GitHub Pages Ready**: Requires no server or backend runtime. Works out of the box with `index.html` at repository root.

---

## 🚀 How to Deploy on GitHub Pages

1. **Push this repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RRB Group D Result Checker"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click **Settings** (tab at the top).
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/(root)`.
   - Click **Save**.

3. Your website will be live in about 1 minute at:
   `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`

---

## 📊 Connecting to Google Sheets (Lead Capture)

Follow the complete step-by-step instructions in [GOOGLE_SHEET_SETUP.md](./GOOGLE_SHEET_SETUP.md).

**Quick Summary**:
1. Open [sheets.new](https://sheets.new) and create a Google Sheet.
2. Go to **Extensions** > **Apps Script** and paste the webhook script from [GOOGLE_SHEET_SETUP.md](./GOOGLE_SHEET_SETUP.md).
3. Click **Deploy** > **New deployment** > Type: **Web app** > Access: **Anyone**.
4. Paste the Web App URL in `app.js` under `DEFAULT_GOOGLE_SHEET_WEBHOOK_URL` (or paste it via the **⚙️ Sheet Setup & Leads** button on the live site).

---

## 📂 Project Structure

```
├── index.html               # Main homepage & result verification UI
├── styles.css               # Light theme styles, responsive layouts & print CSS
├── app.js                   # Form validation, lookup engine & Google Sheet webhook
├── bhopal_rolls.js          # The 2,294 official Bhopal shortlisted roll numbers (Set)
├── bhopal_rolls.json        # JSON representation of the qualified roll numbers
├── Bhopal.pdf               # Official RRB Bhopal CEN 09/2025 result notification PDF
├── GOOGLE_SHEET_SETUP.md    # 2-minute Google Sheet webhook connection guide
└── README.md                # Project documentation
```

---

## 🏃 Physical Efficiency Test (PET) Norms

- **Male Candidates**: Carry 35 kg for 100 meters in 2 minutes (1 chance) without putting it down, AND run 1000 meters in 4 minutes 15 seconds.
- **Female Candidates**: Carry 20 kg for 100 meters in 2 minutes (1 chance) without putting it down, AND run 1000 meters in 5 minutes 40 seconds.
- **Exemptions**: Benchmark Disabilities (PwBD) and Course Completed Act Apprentices (CCAA) are exempted from PET.

---

## ⚖️ Disclaimer

This portal is an informational candidate verification and assistance tool based on official Railway Recruitment Board notification CEN 09/2025. Candidates are advised to check the official regional RRB websites and West Central Railway portal (`wcr.indianrailways.gov.in`) for final appointment notices and e-call letters.
