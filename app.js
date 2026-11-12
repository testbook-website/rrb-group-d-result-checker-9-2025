/**
 * RRB Group D (Level-1) Result Checker & Lead Capture Engine
 * Official CEN 09/2025 Level-1 Recruitment
 */

// Global configuration
const APP_CONFIG = {
  // Configured Google Sheet Webhook URL
  DEFAULT_GOOGLE_SHEET_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbzNDOMdJxM_O55Tn9a-8Iwzh3t-WchQJSUu-opfCVF2Ys2LZsZnN81VHH5WuwEAK0vd/exec",
  STORAGE_KEY_LEADS: "rrb_group_d_leads_v1",
  STORAGE_KEY_WEBHOOK: "rrb_sheet_webhook_url",
  ACTIVE_ZONE: "Bhopal",
  ACTIVE_ZONE_COUNT: 2294
};

// State
let qualifiedRollsSet = null;

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initRollsDatabase();
  setupEventListeners();
  updateAdminStats();
  checkSavedWebhook();
});

/**
 * Initialize Roll Numbers Set
 */
function initRollsDatabase() {
  if (window.BHOPAL_QUALIFIED_ROLLS && window.BHOPAL_QUALIFIED_ROLLS instanceof Set) {
    qualifiedRollsSet = window.BHOPAL_QUALIFIED_ROLLS;
    console.log(`Database ready: ${qualifiedRollsSet.size} roll numbers loaded.`);
  } else {
    // Fallback: fetch JSON if script wasn't loaded synchronously
    fetch("./bhopal_rolls.json")
      .then(res => res.json())
      .then(data => {
        qualifiedRollsSet = new Set(data);
        console.log(`Database loaded via fetch: ${qualifiedRollsSet.size} roll numbers.`);
      })
      .catch(err => {
        console.warn("Could not load bhopal_rolls.json fallback:", err);
      });
  }
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
  const form = document.getElementById("resultForm");
  const rollInput = document.getElementById("rollNumber");
  const phoneInput = document.getElementById("mobileNumber");
  const zoneSelect = document.getElementById("rrbZone");
  const sampleBtn = document.getElementById("btnSampleRoll");

  // Zone Change Event: show alert if awaited zone
  if (zoneSelect) {
    zoneSelect.addEventListener("change", handleZoneChange);
  }

  // Format and sanitize mobile number
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  // Format and sanitize roll number
  if (rollInput) {
    rollInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16);
    });
  }

  // Sample roll button
  if (sampleBtn) {
    sampleBtn.addEventListener("click", () => {
      document.getElementById("candidateName").value = "Rahul Verma";
      document.getElementById("mobileNumber").value = "9876543210";
      document.getElementById("rollNumber").value = "159251120672095"; // First qualified Bhopal roll
      document.getElementById("rrbZone").value = "Bhopal";
      handleZoneChange();
    });
  }

  // Form submission
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Admin Modal
  const openAdminBtn = document.getElementById("btnOpenAdmin");
  const closeAdminBtn = document.getElementById("btnCloseAdmin");
  const modalOverlay = document.getElementById("adminModal");
  const saveWebhookBtn = document.getElementById("btnSaveWebhook");
  const testWebhookBtn = document.getElementById("btnTestWebhook");
  const exportCsvBtn = document.getElementById("btnExportCsv");
  const copyScriptBtn = document.getElementById("btnCopyScriptCode");

  if (openAdminBtn && modalOverlay) {
    openAdminBtn.addEventListener("click", () => {
      updateAdminStats();
      modalOverlay.style.display = "flex";
    });
  }

  if (closeAdminBtn && modalOverlay) {
    closeAdminBtn.addEventListener("click", () => {
      modalOverlay.style.display = "none";
    });
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) modalOverlay.style.display = "none";
    });
  }

  if (saveWebhookBtn) {
    saveWebhookBtn.addEventListener("click", saveWebhookUrl);
  }

  if (testWebhookBtn) {
    testWebhookBtn.addEventListener("click", testWebhookConnection);
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", exportLeadsToCsv);
  }

  if (copyScriptBtn) {
    copyScriptBtn.addEventListener("click", copyAppsScriptCode);
  }
}

/**
 * Handle Zone Change
 */
function handleZoneChange() {
  const zoneSelect = document.getElementById("rrbZone");
  const zoneAlert = document.getElementById("zoneAlertBox");
  if (!zoneSelect || !zoneAlert) return;

  const selectedZone = zoneSelect.value;
  if (selectedZone === "Bhopal") {
    zoneAlert.innerHTML = `
      <span style="color: #059669; font-weight: 700;">🟢 Result Live</span>:
      Official CBT Merit List for RRB Bhopal is declared (2,294 candidates shortlisted for PET).
    `;
    zoneAlert.style.borderColor = "#86efac";
    zoneAlert.style.background = "#f0fdf4";
  } else {
    zoneAlert.innerHTML = `
      <span style="color: #d97706; font-weight: 700;">⏳ Result Awaited</span>:
      RRB ${selectedZone} result is expected soon. Enter details to check and get instant notification!
    `;
    zoneAlert.style.borderColor = "#fcd34d";
    zoneAlert.style.background = "#fffbeb";
  }
}

/**
 * Handle Result Verification & Lead Capture
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("candidateName");
  const phoneInput = document.getElementById("mobileNumber");
  const rollInput = document.getElementById("rollNumber");
  const zoneSelect = document.getElementById("rrbZone");
  const submitBtn = document.getElementById("btnSubmit");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");

  const name = nameInput.value.trim();
  const mobile = phoneInput.value.trim();
  const rollNumber = rollInput.value.trim();
  const zone = zoneSelect.value;

  // Validations
  if (!name || name.length < 2) {
    alert("Please enter a valid candidate full name.");
    nameInput.focus();
    return;
  }

  if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number.");
    phoneInput.focus();
    return;
  }

  if (!rollNumber || rollNumber.length < 10) {
    alert("Please enter a valid Roll Number.");
    rollInput.focus();
    return;
  }

  // Button loading state
  if (submitBtn) submitBtn.disabled = true;
  if (btnSpinner) btnSpinner.style.display = "inline-block";
  if (btnText) btnText.textContent = "Verifying with Merit List...";

  // Determine Result Status
  let status = "Not Qualified";
  let isQualified = false;
  let isAwaitedZone = false;

  if (zone === "Bhopal") {
    // Check against qualified Set
    if (qualifiedRollsSet && qualifiedRollsSet.has(rollNumber)) {
      status = "Qualified (PET Shortlisted)";
      isQualified = true;
    } else {
      status = "Not in Shortlist";
      isQualified = false;
    }
  } else {
    status = "Result Awaited (Notification Registered)";
    isAwaitedZone = true;
  }

  const timestamp = new Date().toISOString();
  const leadData = {
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    name,
    mobile: `+91 ${mobile}`,
    rollNumber,
    zone: `RRB ${zone}`,
    status,
    userAgent: navigator.userAgent
  };

  // 1. Save to local storage leads backup
  saveLeadLocally(leadData);

  // 2. Transmit to Google Sheet Webhook (asynchronously)
  sendToGoogleSheet(leadData);

  // Small delay for smooth UI transition
  await new Promise(resolve => setTimeout(resolve, 600));

  // Reset button state
  if (submitBtn) submitBtn.disabled = false;
  if (btnSpinner) btnSpinner.style.display = "none";
  if (btnText) btnText.textContent = "🔍 Check Result & PET Status";

  // Display Result
  displayResultCard({
    name,
    mobile,
    rollNumber,
    zone,
    isQualified,
    isAwaitedZone,
    status
  });

  // Update Admin Stats counter
  updateAdminStats();
}

/**
 * Display Result Card
 */
function displayResultCard({ name, mobile, rollNumber, zone, isQualified, isAwaitedZone, status }) {
  const container = document.getElementById("resultContainer");
  if (!container) return;

  let html = "";

  if (isQualified) {
    // Qualified Card
    html = `
      <div class="result-box qualified" id="printableScorecard">
        <div class="result-header-badge">
          <span>✓</span> Provisionally Shortlisted for PET
        </div>
        <h3 class="result-title">CONGRATULATIONS, ${escapeHtml(name.toUpperCase())}!</h3>
        <p class="result-subtitle">
          Based on your CBT performance in CEN 09/2025 (Level-1 Posts), you have successfully qualified for the <strong>Physical Efficiency Test (PET)</strong> under <strong>RRB Bhopal</strong>.
        </p>

        <table class="candidate-table">
          <tr>
            <td class="label-cell">Candidate Name</td>
            <td class="value-cell">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td class="label-cell">Roll Number</td>
            <td class="value-cell" style="font-family: monospace; font-size: 1rem; color: #059669;">${escapeHtml(rollNumber)}</td>
          </tr>
          <tr>
            <td class="label-cell">Selected RRB Zone</td>
            <td class="value-cell">RRB Bhopal (West Central Railway)</td>
          </tr>
          <tr>
            <td class="label-cell">Recruitment Notification</td>
            <td class="value-cell">CEN 09/2025 (Level-1 Posts 7th CPC)</td>
          </tr>
          <tr>
            <td class="label-cell">Qualification Status</td>
            <td class="value-cell" style="color: #059669; font-weight: 800;">QUALIFIED FOR PET ✓</td>
          </tr>
        </table>

        <div class="pet-info-box">
          <h4>🏃 Mandatory Physical Efficiency Test (PET) Standards:</h4>
          <ul>
            <li><strong>Male Candidates:</strong> Lift and carry 35 kg weight for 100 meters in 2 minutes in one chance without putting the weight down, AND run 1000 meters in 4 minutes 15 seconds in one chance.</li>
            <li><strong>Female Candidates:</strong> Lift and carry 20 kg weight for 100 meters in 2 minutes in one chance without putting the weight down, AND run 1000 meters in 5 minutes 40 seconds in one chance.</li>
            <li><strong>Important:</strong> PET will be conducted by Railway Recruitment Cell (RRC), West Central Railway, Jabalpur (<a href="https://wcr.indianrailways.gov.in" target="_blank" style="color: #166534; font-weight: 600;">wcr.indianrailways.gov.in</a>). E-call letters will be issued shortly.</li>
          </ul>
        </div>

        <div class="result-actions">
          <a href="./Bhopal.pdf" download="RRB_Bhopal_Group_D_Result.pdf" class="btn-action-primary">
            📥 Download Official PDF
          </a>
          <button type="button" class="btn-secondary" onclick="window.print()">
            🖨️ Print Scorecard
          </button>
          <button type="button" class="btn-secondary" onclick="resetCheckForm()">
            🔄 Check Another Roll
          </button>
        </div>
      </div>
    `;

    // Trigger Confetti Celebration!
    triggerCelebration();

  } else if (isAwaitedZone) {
    // Result Awaited Card
    html = `
      <div class="result-box awaited">
        <div class="result-header-badge">
          <span>⏳</span> Result Awaited - Notification Saved
        </div>
        <h3 class="result-title">RRB ${escapeHtml(zone.toUpperCase())} RESULT AWAITED</h3>
        <p class="result-subtitle">
          Railway Recruitment Board is releasing CEN 09/2025 results zone-wise. Currently, the merit list for <strong>RRB Bhopal</strong> is out. Results for <strong>RRB ${escapeHtml(zone)}</strong> are expected to be announced shortly.
        </p>

        <table class="candidate-table">
          <tr>
            <td class="label-cell">Candidate Name</td>
            <td class="value-cell">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td class="label-cell">Mobile Number</td>
            <td class="value-cell">+91 ${escapeHtml(mobile)}</td>
          </tr>
          <tr>
            <td class="label-cell">Roll Number</td>
            <td class="value-cell" style="font-family: monospace;">${escapeHtml(rollNumber)}</td>
          </tr>
          <tr>
            <td class="label-cell">Zone Requested</td>
            <td class="value-cell">RRB ${escapeHtml(zone)}</td>
          </tr>
          <tr>
            <td class="label-cell">Alert Status</td>
            <td class="value-cell" style="color: #1e40af; font-weight: 700;">REGISTERED FOR INSTANT ALERT</td>
          </tr>
        </table>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.85rem; color: #1e3a8a;">
          🔔 Your registration has been recorded! We will check the official merit list as soon as RRB ${escapeHtml(zone)} releases it and alert you.
        </div>

        <div class="result-actions">
          <button type="button" class="btn-secondary" onclick="resetCheckForm()">
            🔄 Check Bhopal Result
          </button>
        </div>
      </div>
    `;

  } else {
    // Not Qualified Card
    html = `
      <div class="result-box not-qualified">
        <div class="result-header-badge">
          <span>✕</span> Not in Current Shortlist
        </div>
        <h3 class="result-title">ROLL NUMBER NOT FOUND IN SHORTLIST</h3>
        <p class="result-subtitle">
          Roll Number <strong>${escapeHtml(rollNumber)}</strong> is not present in the provisional PET shortlist for <strong>RRB Bhopal</strong> (CEN 09/2025 Level-1).
        </p>

        <table class="candidate-table">
          <tr>
            <td class="label-cell">Candidate Name</td>
            <td class="value-cell">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td class="label-cell">Roll Number</td>
            <td class="value-cell" style="font-family: monospace;">${escapeHtml(rollNumber)}</td>
          </tr>
          <tr>
            <td class="label-cell">Zone Checked</td>
            <td class="value-cell">RRB Bhopal</td>
          </tr>
          <tr>
            <td class="label-cell">Result Status</td>
            <td class="value-cell" style="color: #b91c1c; font-weight: 700;">NOT SHORTLISTED FOR PET</td>
          </tr>
        </table>

        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.85rem; color: #9f1239;">
          ℹ️ <strong>Note on Individual Marks & Percentile Score:</strong><br>
          All candidates can view their normalized marks and percentile score by logging into the official RRB website with their Registration Number and Date of Birth (DDMMYYYY). The official scorecard link will be active shortly.
        </div>

        <div class="result-actions">
          <a href="./Bhopal.pdf" download="RRB_Bhopal_Group_D_Result.pdf" class="btn-secondary">
            📥 View Bhopal PDF List
          </a>
          <button type="button" class="btn-secondary" onclick="resetCheckForm()">
            🔄 Check Another Roll Number
          </button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Reset Check Form
 */
function resetCheckForm() {
  const container = document.getElementById("resultContainer");
  if (container) container.style.display = "none";
  const rollInput = document.getElementById("rollNumber");
  if (rollInput) {
    rollInput.value = "";
    rollInput.focus();
  }
}

/**
 * Local Storage Management for Leads
 */
function saveLeadLocally(leadData) {
  try {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY_LEADS);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(leadData); // Add latest to beginning
    localStorage.setItem(APP_CONFIG.STORAGE_KEY_LEADS, JSON.stringify(list));
  } catch (e) {
    console.error("Local storage error:", e);
  }
}

function getStoredLeads() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY_LEADS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Send Data to Google Sheets Webhook
 */
function sendToGoogleSheet(leadData) {
  const webhookUrl = localStorage.getItem(APP_CONFIG.STORAGE_KEY_WEBHOOK) || APP_CONFIG.DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    console.log("No Google Sheet Webhook configured yet. Lead saved in local storage.");
    return;
  }

  // 1. Try sending via POST with no-cors mode (standard for Google Apps Script Web Apps)
  try {
    fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leadData)
    }).catch(err => {
      console.warn("POST to Google Sheet failed, trying GET fallback:", err);
      // Fallback: send via GET query string
      sendViaGetFallback(webhookUrl, leadData);
    });
  } catch (err) {
    sendViaGetFallback(webhookUrl, leadData);
  }
}

function sendViaGetFallback(webhookUrl, leadData) {
  try {
    const params = new URLSearchParams({
      timestamp: leadData.timestamp,
      name: leadData.name,
      mobile: leadData.mobile,
      rollNumber: leadData.rollNumber,
      zone: leadData.zone,
      status: leadData.status
    });
    fetch(`${webhookUrl}?${params.toString()}`, { mode: "no-cors" });
  } catch (e) {
    console.error("Webhook fallback error:", e);
  }
}

/**
 * Admin Panel & Webhook Management
 */
function checkSavedWebhook() {
  const savedUrl = localStorage.getItem(APP_CONFIG.STORAGE_KEY_WEBHOOK) || APP_CONFIG.DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  const input = document.getElementById("adminWebhookUrl");
  if (input && savedUrl) {
    input.value = savedUrl;
  }
}

function saveWebhookUrl() {
  const input = document.getElementById("adminWebhookUrl");
  const statusSpan = document.getElementById("webhookSaveStatus");
  if (!input) return;

  const url = input.value.trim();
  localStorage.setItem(APP_CONFIG.STORAGE_KEY_WEBHOOK, url);

  if (statusSpan) {
    statusSpan.textContent = "Saved successfully!";
    statusSpan.style.color = "#059669";
    setTimeout(() => { statusSpan.textContent = ""; }, 3000);
  }
}

async function testWebhookConnection() {
  const input = document.getElementById("adminWebhookUrl");
  const statusSpan = document.getElementById("webhookSaveStatus");
  const url = input ? input.value.trim() : "";

  if (!url || !url.startsWith("http")) {
    alert("Please enter a valid Google Apps Script Web App URL first.");
    return;
  }

  if (statusSpan) {
    statusSpan.textContent = "Sending test row...";
    statusSpan.style.color = "#2563eb";
  }

  const testPayload = {
    timestamp: new Date().toLocaleString("en-IN"),
    name: "TEST USER (System Check)",
    mobile: "+91 9999999999",
    rollNumber: "159251120672095",
    zone: "RRB Bhopal",
    status: "Webhook Connection Test",
    userAgent: navigator.userAgent
  };

  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload)
    });

    if (statusSpan) {
      statusSpan.textContent = "✓ Test row sent! Check your Google Sheet.";
      statusSpan.style.color = "#059669";
    }
  } catch (err) {
    if (statusSpan) {
      statusSpan.textContent = "Error testing webhook: " + err.message;
      statusSpan.style.color = "#dc2626";
    }
  }
}

function updateAdminStats() {
  const leads = getStoredLeads();
  const totalEl = document.getElementById("statTotalLeads");
  const qualifiedEl = document.getElementById("statQualifiedLeads");
  const awaitedEl = document.getElementById("statAwaitedLeads");

  if (totalEl) totalEl.textContent = leads.length;
  if (qualifiedEl) {
    const qCount = leads.filter(l => l.status && l.status.includes("Qualified")).length;
    qualifiedEl.textContent = qCount;
  }
  if (awaitedEl) {
    const aCount = leads.filter(l => l.status && l.status.includes("Awaited")).length;
    awaitedEl.textContent = aCount;
  }
}

/**
 * Export Leads to CSV File
 */
function exportLeadsToCsv() {
  const leads = getStoredLeads();
  if (leads.length === 0) {
    alert("No lead entries recorded yet in local storage.");
    return;
  }

  const headers = ["Timestamp", "Candidate Name", "Mobile Number", "Roll Number", "Zone", "Status", "User Agent"];
  const rows = leads.map(l => [
    `"${(l.timestamp || "").replace(/"/g, '""')}"`,
    `"${(l.name || "").replace(/"/g, '""')}"`,
    `"${(l.mobile || "").replace(/"/g, '""')}"`,
    `"${(l.rollNumber || "").replace(/"/g, '""')}"`,
    `"${(l.zone || "").replace(/"/g, '""')}"`,
    `"${(l.status || "").replace(/"/g, '""')}"`,
    `"${(l.userAgent || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `RRB_Group_D_Candidate_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy Google Apps Script Code
 */
function copyAppsScriptCode() {
  const codeEl = document.getElementById("appsScriptCodeSnippet");
  if (!codeEl) return;
  const text = codeEl.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = document.getElementById("btnCopyScriptCode");
    if (copyBtn) {
      const original = copyBtn.textContent;
      copyBtn.textContent = "✓ Copied!";
      setTimeout(() => { copyBtn.textContent = original; }, 2000);
    }
  });
}

/**
 * Lightweight Self-Contained Confetti Animation
 */
function triggerCelebration() {
  // If external canvas-confetti library is loaded, use it
  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    return;
  }

  // Pure lightweight fallback confetti on canvas
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.015 + 0.015
    });
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // Gravity
      p.alpha -= p.decay;
      if (p.alpha > 0) {
        active = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });

    if (active) {
      requestAnimationFrame(frame);
    } else {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Utility: HTML Escape
 */
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}

