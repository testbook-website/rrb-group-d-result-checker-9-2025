/**
 * RRB Group D (Level-1) Result Checker Widget
 * CEN 09/2025 Level-1 Posts
 * Active Zones: RRB Bhopal (2,294), RRB Patna (1,621), RRB Gorakhpur (2,333)
 */

const APP_CONFIG = {
  DEFAULT_GOOGLE_SHEET_WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbzNDOMdJxM_O55Tn9a-8Iwzh3t-WchQJSUu-opfCVF2Ys2LZsZnN81VHH5WuwEAK0vd/exec",
  STORAGE_KEY_LEADS: "rrb_group_d_leads_v1"
};

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
});

function setupEventListeners() {
  const form = document.getElementById("resultForm");
  const rollInput = document.getElementById("rollNumber");
  const phoneInput = document.getElementById("mobileNumber");
  const zoneSelect = document.getElementById("rrbZone");
  const sampleBtn = document.getElementById("btnSampleRoll");

  // Phone sanitization (digits only, max 10)
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
    });
  }

  // Roll sanitization (digits only, max 16)
  if (rollInput) {
    rollInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16);
    });
  }

  // Sample roll helper
  if (sampleBtn) {
    sampleBtn.addEventListener("click", () => {
      const zone = zoneSelect ? zoneSelect.value : "Bhopal";
      document.getElementById("candidateName").value = "Rahul Kumar";
      document.getElementById("mobileNumber").value = "9876543210";

      if (zone === "Gorakhpur") {
        document.getElementById("rollNumber").value = "199251114915558"; // Qualified Gorakhpur roll
      } else if (zone === "Patna") {
        document.getElementById("rollNumber").value = "269251162810102"; // Qualified Patna roll
      } else {
        document.getElementById("rollNumber").value = "159251120672095"; // Qualified Bhopal roll
      }
    });
  }

  // Dynamic placeholder on zone change
  if (zoneSelect) {
    zoneSelect.addEventListener("change", () => {
      const zone = zoneSelect.value;
      if (rollInput) {
        if (zone === "Gorakhpur") {
          rollInput.placeholder = "e.g. 199251114915558";
        } else if (zone === "Patna") {
          rollInput.placeholder = "e.g. 269251162810102";
        } else if (zone === "Bhopal") {
          rollInput.placeholder = "e.g. 159251120672095";
        } else {
          rollInput.placeholder = "Enter 15-digit roll number";
        }
      }
    });
  }

  // Form submit
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }
}

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

  if (!name || name.length < 2) {
    alert("Please enter a valid candidate name.");
    nameInput.focus();
    return;
  }

  if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number.");
    phoneInput.focus();
    return;
  }

  if (!rollNumber || rollNumber.length < 10) {
    alert("Please enter a valid roll number.");
    rollInput.focus();
    return;
  }

  // Button loading state
  if (submitBtn) submitBtn.disabled = true;
  if (btnSpinner) btnSpinner.style.display = "inline-block";
  if (btnText) btnText.textContent = "Checking...";

  let status = "Not in Shortlist";
  let isQualified = false;
  let isAwaitedZone = false;
  let zoneTitle = `RRB ${zone}`;
  let pdfUrl = "";

  if (zone === "Bhopal") {
    zoneTitle = "RRB Bhopal (WCR)";
    pdfUrl = "./Bhopal.pdf";
    if (window.BHOPAL_QUALIFIED_ROLLS && window.BHOPAL_QUALIFIED_ROLLS.has(rollNumber)) {
      status = "Qualified (PET Shortlisted)";
      isQualified = true;
    } else {
      status = "Not in Shortlist";
      isQualified = false;
    }
  } else if (zone === "Patna") {
    zoneTitle = "RRB Patna (ECR)";
    pdfUrl = "./Patna.pdf";
    if (window.PATNA_QUALIFIED_ROLLS && window.PATNA_QUALIFIED_ROLLS.has(rollNumber)) {
      status = "Qualified (PET Shortlisted)";
      isQualified = true;
    } else {
      status = "Not in Shortlist";
      isQualified = false;
    }
  } else if (zone === "Gorakhpur") {
    zoneTitle = "RRB Gorakhpur (NER)";
    pdfUrl = "./Gorakhpur.pdf";
    if (window.GORAKHPUR_QUALIFIED_ROLLS && window.GORAKHPUR_QUALIFIED_ROLLS.has(rollNumber)) {
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

  const leadData = {
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    name,
    mobile: mobile, // Clean 10 digits to prevent formula error in Google Sheets
    rollNumber,
    zone: zoneTitle,
    status,
    userAgent: navigator.userAgent
  };

  // 1. Silent Google Sheet Webhook Dispatch
  sendToGoogleSheet(leadData);

  // 2. Local storage backup
  saveLeadLocally(leadData);

  await new Promise(resolve => setTimeout(resolve, 400));

  // Reset button state
  if (submitBtn) submitBtn.disabled = false;
  if (btnSpinner) btnSpinner.style.display = "none";
  if (btnText) btnText.textContent = "Check Result";

  // Display Result Card
  displayResultCard({
    name,
    mobile,
    rollNumber,
    zone: zoneTitle,
    isQualified,
    isAwaitedZone,
    pdfUrl
  });
}

function displayResultCard({ name, mobile, rollNumber, zone, isQualified, isAwaitedZone, pdfUrl }) {
  const container = document.getElementById("resultContainer");
  if (!container) return;

  let html = "";

  if (isQualified) {
    html = `
      <div class="res-card qualified">
        <span class="res-badge">✓ Qualified for PET</span>
        <h3 class="res-title">Congratulations, ${escapeHtml(name)}!</h3>
        <p class="res-desc">Your roll number is shortlisted for the Physical Efficiency Test (PET) under <strong>${escapeHtml(zone)}</strong>.</p>
        <div class="res-details">
          <div class="res-row"><span class="k">Roll No:</span><span class="v" style="color:#059669;">${escapeHtml(rollNumber)}</span></div>
          <div class="res-row"><span class="k">Zone:</span><span class="v">${escapeHtml(zone)}</span></div>
          <div class="res-row"><span class="k">Status:</span><span class="v" style="color:#059669;">Shortlisted ✓</span></div>
        </div>
        <div class="res-actions">
          <a href="${pdfUrl}" download class="btn-res-action primary">📥 Official Merit PDF</a>
          <button type="button" class="btn-res-action" onclick="resetCheckForm()">🔄 Check Another</button>
        </div>
      </div>
    `;
    triggerCelebration();

  } else if (isAwaitedZone) {
    html = `
      <div class="res-card awaited">
        <span class="res-badge">⏳ Result Awaited</span>
        <h3 class="res-title">${escapeHtml(zone)} Result Soon</h3>
        <p class="res-desc">Merit list for ${escapeHtml(zone)} is expected shortly. Your details have been recorded for instant notification!</p>
        <div class="res-details">
          <div class="res-row"><span class="k">Mobile:</span><span class="v">${escapeHtml(mobile)}</span></div>
          <div class="res-row"><span class="k">Roll No:</span><span class="v">${escapeHtml(rollNumber)}</span></div>
          <div class="res-row"><span class="k">Zone:</span><span class="v">${escapeHtml(zone)}</span></div>
        </div>
        <div class="res-actions">
          <button type="button" class="btn-res-action" onclick="resetCheckForm()">🔄 Check Live Zones</button>
        </div>
      </div>
    `;

  } else {
    html = `
      <div class="res-card not-qualified">
        <span class="res-badge">Not in Current Shortlist</span>
        <h3 class="res-title">Roll Not Found in Shortlist</h3>
        <p class="res-desc">Roll number <strong>${escapeHtml(rollNumber)}</strong> was not found in the current PET merit list for ${escapeHtml(zone)}.</p>
        <div class="res-details">
          <div class="res-row"><span class="k">Roll No:</span><span class="v">${escapeHtml(rollNumber)}</span></div>
          <div class="res-row"><span class="k">Zone:</span><span class="v">${escapeHtml(zone)}</span></div>
        </div>
        <div class="res-actions">
          <a href="${pdfUrl}" download class="btn-res-action">📥 View Merit PDF</a>
          <button type="button" class="btn-res-action" onclick="resetCheckForm()">🔄 Check Another</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function resetCheckForm() {
  const container = document.getElementById("resultContainer");
  if (container) container.style.display = "none";
  const rollInput = document.getElementById("rollNumber");
  if (rollInput) {
    rollInput.value = "";
    rollInput.focus();
  }
}

function sendToGoogleSheet(leadData) {
  const webhookUrl = APP_CONFIG.DEFAULT_GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) return;

  try {
    fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leadData)
    }).catch(err => {
      console.warn("Sheet post failed, trying GET fallback:", err);
      sendViaGet(webhookUrl, leadData);
    });
  } catch (err) {
    sendViaGet(webhookUrl, leadData);
  }
}

function sendViaGet(webhookUrl, leadData) {
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
  } catch (e) {}
}

function saveLeadLocally(leadData) {
  try {
    const raw = localStorage.getItem(APP_CONFIG.STORAGE_KEY_LEADS);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(leadData);
    localStorage.setItem(APP_CONFIG.STORAGE_KEY_LEADS, JSON.stringify(list.slice(0, 100)));
  } catch (e) {}
}

function triggerCelebration() {
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

  for (let i = 0; i < 70; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
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
