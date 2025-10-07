/* ================== POWER AUTOMATE: FLAT JSON + POST ================== */
/* Keep this file separate. No HTML changes needed.                       */
/* ====================================================================== */

/** 1) Your Flow URL (Manual trigger HTTP endpoint) */
const FLOW_URL =
  "https://default95f98fe368c84b46aa8f1a85191e55.9d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/36abbe82f8ad4be19371c672288fd933/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VdRyLw_fPm9vv6k0JEL4Z42LigLefSKfh2t1PaukfFg";
/** 2) Small helpers (no UI changes) */
const $id = (id) => document.getElementById(id);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const getCheckedRadio = (name) =>
  document.querySelector(`input[type="radio"][name="${name}"]:checked`)?.value || "";

/** Format YYYY-MM-DD (from <input type="date">) -> DD/MM/YYYY to match your sample */
function fmtDMY(s) {
  if (!s) return "";
  const t = String(s).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t;             // already DD/MM/YYYY
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);               // YYYY-MM-DD
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  m = t.match(/^(\d{4})-(\d{2})$/);                           // YYYY-MM -> 01/MM/YYYY
  if (m) return `01/${m[2]}/${m[1]}`;
  m = t.match(/^(\d{2})-(\d{4})$/);                           // MM-YYYY -> 01/MM/YYYY
  if (m) return `01/${m[1]}/${m[2]}`;
  m = t.match(/^(\d{4})$/);                                   // YYYY -> 01/01/YYYY
  if (m) return `01/01/${m[1]}`;
  return t.replaceAll("-", "/");
}

/** 3) Build flat JSON from DOM (IDs for header; data-field for members) */
function buildFlatJsonFromDom() {
  // --- Header (by IDs) ---
  const headerMap = {
    BRANCH: "branchName",
    SB_AC: "shgSbAccount",
    LOAN_ACC_NO: "shgLoanAccount",
    SHG_NAME: "shgName",
    SHG_VILL: "shgVillage",
    SHG_ADD: "shgAddress",
    SHG_TOTAL_MEM: "totalMembers",
    SUPPORTING_AGENCY: "supportAgency",
    DOF: "formedOn",
    NAME_ADD_NGO: "ngoName",
    NGO_PHONE: "ngoPhone",
    NGO_EMAIL: "ngoEmail",
    LOAN_AMT: "sanctionedAmount",
    BASE_RATE: "mclr",
    FAC_INT: "spread",
    REP_MON: "tenureMonths",
    ROI_TOTAL: "roiTotal",
    SAN_DT: "sanctionDate",
    EMAIL_REC: "receiptEmail"
  };

  const out = {};
  for (const [k, id] of Object.entries(headerMap)) {
    let val = $id(id)?.value ?? "";
    if (k === "DOF" || k === "SAN_DT") val = fmtDMY(val);  // date -> DD/MM/YYYY
    if (k === "SHG_TOTAL_MEM") val = String(val || "0");   // ensure string
    out[k] = val;
  }
  // RESTS: selected radio (fallback "Monthly")
  out.RESTS = getCheckedRadio("rests") || "Monthly";

  // --- Members (by .member-card + data-field) ---
  const cards = $all("#members .member-card"); // rendered count
  const nInput = Number($id("totalMembers")?.value || 0);
  const n = Math.max(1, Math.min(20, nInput || cards.length || 0));
  out.SHG_TOTAL_MEM = String(n); // align with actual

  for (let i = 1; i <= n; i++) {
    const card = cards[i - 1];
    // Helper to read data-field values inside this member card
    const get = (field) => card?.querySelector(`[data-field="${field}"]`)?.value?.trim?.() || "";
    // Radios were named dynamically as members[i][gender]/[occupation]
    const gender = getCheckedRadio(`members[${i}][gender]`) || get("gender") || "";
    const occupation = getCheckedRadio(`members[${i}][occupation]`) || get("occupation") || "";

    out[`DOB_${i}`] = fmtDMY(get("dob"));
    out[`IND_AMT_${i}`] = ""; // not present in UI; leave blank or compute if needed
    out[`REP_AMT_${i}`] = ""; // not present in UI; leave blank or compute if needed
    out[`NAME_${i}`] = get("name");
    out[`S_W_${i}`] = get("fatherName");
    out[`ADD_${i}`] = get("address");
    out[`SEX_${i}`] = gender;
    out[`PAN_V_${i}`] = (get("pan") || "").toUpperCase();
    out[`AAD_${i}`] = get("aadhaar");
    out[`CAT_${i}`] = get("category");
    out[`SB_${i}`] = get("sbAccount");
    out[`MOB_${i}`] = get("mobile");
    out[`OCC_${i}`] = occupation;
  }

  return out;
}

/** 4) POST to Flow */
async function postFlatJsonToFlow() {
  const flat = buildFlatJsonFromDom();
  const resp = await fetch(FLOW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // If you ever hit CORS preflight from file://, try:
    // headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(flat)
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Flow submission failed: ${resp.status}\n${err}`);
  }
  return resp; // caller can .json()/.text() if needed
}

//5) (Optional wiring) call from your existing submit handler:
document.getElementById('loanForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await postFlatJsonToFlow();
    alert('Submitted!');
  } catch (err) {
    alert(err?.message || 'Submit failed');
  }
});

