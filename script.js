(() => {
  // ============================================================
  // Small utilities
  // ============================================================
  function debounce(fn, wait = 50) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
  }
  function sanitizeFileName(s) {
    return (s || 'SHG').replace(/[<>:"/\\?\*\x00-\x1F]/g, '').replace(/\s+/g, ' ')
      .trim().slice(0, 80).replace(/\s/g, '_');
  }
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
    });
  }
  function showToast(msg, ok=false) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.style.background = ok ? '#065f46' : '#111827';
    t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 2200);
  }
  // Radios
  function getRadioValue(name) {
    const el = document.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`);
    return el ? el.value : '';
  }
  function setRadioValue(name, value) {
    document.querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)
      .forEach(el => el.checked = (el.value === value));
  }

  // ============================================================
  // ROI auto-calc
  // ============================================================
  const mclrEl = document.getElementById('mclr');
  const spreadEl = document.getElementById('spread');
  const roiEl = document.getElementById('roiTotal');
  function updateROI() {
    const m = parseFloat(mclrEl?.value || 0), s = parseFloat(spreadEl?.value || 0);
    if (roiEl) roiEl.value = (m + s).toFixed(2);
  }
  mclrEl?.addEventListener('input', updateROI);
  spreadEl?.addEventListener('input', updateROI);
  updateROI();

  // ============================================================
  // Members dynamic render (1-based indexing)
  // ============================================================
  const membersWrap = document.getElementById('members');
  const tpl = document.getElementById('memberTemplate');
  const totalMembersEl = document.getElementById('totalMembers');

  // Build a single member card node for given index (1-based)
  function buildMemberNode(idx) {
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.member-card');
    // Title
    card.querySelector('.member-title').textContent = `Member ${idx}`;
    // QR box
    const qrInput = card.querySelector('[data-field="qr"]');
    qrInput.name = `members[${idx}][qr]`;
    qrInput.id = `member_${idx}_qr`;
    // Name
    const nameInput = card.querySelector('[data-field="name"]');
    nameInput.name = `members[${idx}][name]`;
    nameInput.id = `member_${idx}_name`;
    // Father
    const fatherEl = card.querySelector('[data-field="fatherName"]');
    fatherEl.name = `members[${idx}][fatherName]`;
    fatherEl.id = `member_${idx}_father`;
    // Address
    const addrEl = card.querySelector('[data-field="address"]');
    addrEl.name = `members[${idx}][address]`;
    addrEl.id = `member_${idx}_address`;
    // Gender radios (placeholder -> real name/id)
    card.querySelectorAll('input[type="radio"][name="GEN_PLACEHOLDER"]').forEach((r, rIdx) => {
      r.name = `members[${idx}][gender]`;
      r.id = `member_${idx}_gender_${rIdx}`;
    });
    // DOB
    const dobEl = card.querySelector('[data-field="dob"]');
    dobEl.name = `members[${idx}][dob]`;
    dobEl.id = `member_${idx}_dob`;
    // Aadhaar
    const aadhaarEl = card.querySelector('[data-field="aadhaar"]');
    aadhaarEl.name = `members[${idx}][aadhaar]`;
    aadhaarEl.id = `member_${idx}_aadhaar`;
    aadhaarEl.addEventListener('input', () => {
      aadhaarEl.value = aadhaarEl.value.replace(/\D/g, '').slice(0, 12);
    });
    // PAN
    const panEl = card.querySelector('[data-field="pan"]');
    panEl.name = `members[${idx}][pan]`;
    panEl.id = `member_${idx}_pan`;
    panEl.addEventListener('input', () => { panEl.value = panEl.value.toUpperCase(); });
    // Category
    const categorySelect = card.querySelector('[data-field="category"]');
    categorySelect.name = `members[${idx}][category]`;
    categorySelect.id = `member_${idx}_category`;
    // SB Account
    const sbEl = card.querySelector('[data-field="sbAccount"]');
    sbEl.name = `members[${idx}][sbAccount]`;
    sbEl.id = `member_${idx}_sb`;
    // Mobile
    const mobEl = card.querySelector('[data-field="mobile"]');
    mobEl.name = `members[${idx}][mobile]`;
    mobEl.id = `member_${idx}_mobile`;
    mobEl.addEventListener('input', () => {
      mobEl.value = mobEl.value.replace(/\D/g, '').slice(0, 10);
    });
    // Occupation radios
    card.querySelectorAll('input[type="radio"][name="OCC_PLACEHOLDER"]').forEach((r, rIdx) => {
      r.name = `members[${idx}][occupation]`;
      r.id = `member_${idx}_occ_${rIdx}`;
    });
    return node;
  }
  // Full render (clears and rebuilds) - keep for initial load or JSON load
  function renderMembers(n) {
    if (!membersWrap || !tpl) return;
    membersWrap.innerHTML = '';
    const count = Math.max(1, Math.min(20, Number(n) || 20));
    for (let idx = 1; idx <= count; idx++) membersWrap.appendChild(buildMemberNode(idx));
  }
  // Preserve existing entries on increase; confirm on decrease
  function ensureMemberCount(target) {
    if (!membersWrap || !tpl) return;
    const current = membersWrap.children.length || 0;
    const next = Math.max(1, Math.min(20, Number(target) || 1));
    if (next === current) return;
    if (next > current) {
      // Append ONLY the additional members; existing data is preserved
      for (let idx = current + 1; idx <= next; idx++) {
        membersWrap.appendChild(buildMemberNode(idx));
      }
      return;
    }
    // next < current -> confirm removal
    const ok = confirm(`Reduce members from ${current} to ${next}? Entries ${next+1}..${current} will be removed.`);
    if (!ok) { if (totalMembersEl) totalMembersEl.value = current; return; }
    for (let i = current; i > next; i--) {
      membersWrap.removeChild(membersWrap.lastElementChild);
    }
  }
  // Initial render & changes
  renderMembers(totalMembersEl?.value || 20);
  totalMembersEl?.addEventListener('change', (e) => {
    const desired = Math.max(1, Math.min(20, Number(e.target.value) || 20));
    ensureMemberCount(desired);
    // Make sure the box shows the actual count after any user cancel
    e.target.value = membersWrap?.children.length || desired;
  });

  // ============================================================
  // Serialize to JSON (DOM uses 1-based; JSON array remains 0-based)
  // ============================================================
  const form = document.getElementById('loanForm');
  async function getFormData(options = { includeFiles: false }) {
    const includeFiles = !!options.includeFiles;
    const data = {
      shg: {
        branchName: document.getElementById('branchName')?.value || '',
        shgName: document.getElementById('shgName')?.value || '',
        shgVillage: document.getElementById('shgVillage')?.value || '',
        shgAddress: document.getElementById('shgAddress')?.value || '',
        formedOn: document.getElementById('formedOn')?.value || '',
        totalMembers: Number(document.getElementById('totalMembers')?.value || 0),
        applicationDate: document.getElementById('applicationDate')?.value || '',
        sanctionDate: document.getElementById('sanctionDate')?.value || '',
        supportAgency: document.getElementById('supportAgency')?.value || '',
        ngoName: document.getElementById('ngoName')?.value || '',
        ngoPhone: document.getElementById('ngoPhone')?.value || '',
        ngoEmail: document.getElementById('ngoEmail')?.value || '',
        shgSbAccount: document.getElementById('shgSbAccount')?.value || '',
        shgLoanAccount: document.getElementById('shgLoanAccount')?.value || '',
        sanctionedAmount: Number(document.getElementById('sanctionedAmount')?.value || 0),
        mclr: Number(document.getElementById('mclr')?.value || 0),
        spread: Number(document.getElementById('spread')?.value || 0),
        roiTotal: Number(document.getElementById('roiTotal')?.value || 0),
        receiptEmail: document.getElementById('receiptEmail')?.value || '',
        rests: getRadioValue('rests'),
        tenureMonths: Number(document.getElementById('tenureMonths')?.value || 0),
      },
      members: []
    };
    const n = data.shg.totalMembers || (membersWrap?.children.length || 0);
    const filePromises = [];
    for (let idx = 1; idx <= n; idx++) {
      const member = {
        name: document.querySelector(`[name="members[${idx}][name]"]`)?.value || '',
        fatherName:document.querySelector(`[name="members[${idx}][fatherName]"]`)?.value || '',
        address: document.querySelector(`[name="members[${idx}][address]"]`)?.value || '',
        gender: getRadioValue(`members[${idx}][gender]`),
        dob: document.querySelector(`[name="members[${idx}][dob]"]`)?.value || '',
        aadhaar: document.querySelector(`[name="members[${idx}][aadhaar]"]`)?.value || '',
        pan: document.querySelector(`[name="members[${idx}][pan]"]`)?.value || '',
        category: document.querySelector(`[name="members[${idx}][category]"]`)?.value || '',
        sbAccount: document.querySelector(`[name="members[${idx}][sbAccount]"]`)?.value || '',
        mobile: document.querySelector(`[name="members[${idx}][mobile]"]`)?.value || '',
        occupation:getRadioValue(`members[${idx}][occupation]`),
        qr: null
      };
      if (includeFiles) {
        const qrInput = document.querySelector(`[name="members[${idx}][qr]"]`);
        if (qrInput?.files?.[0]) {
          const f = qrInput.files[0];
          filePromises.push(
            fileToDataUrl(f).then(dataUrl => ({ arrIndex: idx - 1, qr: { name: f.name, type: f.type, dataUrl } }))
          );
        }
      }
      data.members.push(member);
    }
    if (filePromises.length) {
      const results = await Promise.all(filePromises);
      results.forEach(({ arrIndex, qr }) => { if (data.members[arrIndex]) data.members[arrIndex].qr = qr; });
    }
    return data;
  }

  // ======== Power Automate (HTTP trigger) integration ========
  // Use your Flow URL here (if your trigger is "Anyone with the endpoint", include the ?sig=... token).
  // const FLOW_URL =
  //   "https://default95f98fe368c84b46aa8f1a85191e55.9d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a9e45c0d3c5c4a47aeff03481cca6159/triggers/manual/paths/invoke?api-version=1";

  // /**
  //  * Validate -> build JSON via getFormData -> POST to Flow -> notify.
  //  * NOTE: If you hit CORS preflight issues, set header to "Content-Type": "text/plain".
  //  */
  // async function submitFormToFlow() {
  //   const form = document.getElementById("loanForm");
  //   if (!form) { alert("Form not found."); return; }

  //   if (!form.checkValidity()) { form.reportValidity(); return; }

  //   // Build JSON using your helper (includes all 1..20 members)
  //   const payload = await getFormData({ includeFiles: false });

  //   // Keep totalMembers aligned with actual count (safety)
  //   if (Array.isArray(payload.members)) {
  //     payload.shg.totalMembers = Math.max(1, Math.min(20, payload.members.length));
  //   }

  //   // UI lock on submit button (if present)
  //   const btn = document.getElementById("submitBtn");
  //   if (btn) {
  //     btn.disabled = true;
  //     btn.dataset.originalText = btn.textContent;
  //     btn.textContent = "Submitting…";
  //   }

  //   try {
  //     const resp = await fetch(FLOW_URL, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" }, // try "text/plain" if CORS preflight blocks
  //       body: JSON.stringify(payload)
  //     });

  //     if (!resp.ok) {
  //       const err = await resp.text().catch(() => "");
  //       throw new Error(`Flow submission failed: ${resp.status}\n${err}`);
  //     }

  //     // Some flows return JSON; some return 200/202 with no body
  //     let msg = "Submitted successfully!";
  //     try {
  //       const data = await resp.json();
  //       if (data?.id || data?.reference || data?.url) {
  //         msg = `Submitted! Reference: ${data.id || data.reference || data.url}`;
  //       }
  //     } catch { /* ignore non‑JSON body */ }

  //     alert(msg);
  //   } catch (e) {
  //     console.error(e);
  //     alert(e?.message || "Network error while submitting.");
  //   } finally {
  //     if (btn) {
  //       btn.disabled = false;
  //       btn.textContent = btn.dataset.originalText || "Submit";
  //     }
  //   }
  // }

  // ============================================================
  // Save/Load and form wiring
  // ============================================================
  function downloadJson(data) {
    const shgName = data?.shg?.shgName || 'SHG';
    const fileName = sanitizeFileName(shgName) + ' - SHG Loan.json';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  async function saveJson(includeFiles) {
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const data = await getFormData({ includeFiles }); downloadJson(data);
  }
  async function setFormData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON structure.');
    const s = data.shg || {};
    const byId = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
    byId('branchName', s.branchName);
    byId('shgName', s.shgName);
    byId('shgVillage', s.shgVillage);
    byId('shgAddress', s.shgAddress);
    byId('formedOn', s.formedOn);
    byId('applicationDate', s.applicationDate);
    byId('sanctionDate', s.sanctionDate);
    byId('supportAgency', s.supportAgency);
    byId('ngoName', s.ngoName);
    byId('ngoPhone', s.ngoPhone);
    byId('ngoEmail', s.ngoEmail);
    byId('shgSbAccount', s.shgSbAccount);
    byId('shgLoanAccount', s.shgLoanAccount);
    byId('sanctionedAmount', s.sanctionedAmount);
    byId('mclr', s.mclr);
    byId('spread', s.spread);
    updateROI();
    byId('roiTotal', s.roiTotal);
    byId('receiptEmail', s.receiptEmail);
    setRadioValue('rests', s.rests);
    byId('tenureMonths', s.tenureMonths);
    const n = Array.isArray(data.members) ? data.members.length : (s.totalMembers || 0);
    const safeN = Math.min(Math.max(n, 1), 20);
    if (totalMembersEl) totalMembersEl.value = String(safeN);
    renderMembers(safeN);
    for (let idx = 1; idx <= safeN; idx++) {
      const m = data.members?.[idx - 1] || {};
      const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = val ?? ''; };
      set(`[name="members[${idx}][name]"]`, m.name);
      set(`[name="members[${idx}][fatherName]"]`, m.fatherName);
      set(`[name="members[${idx}][address]"]`, m.address);
      set(`[name="members[${idx}][dob]"]`, m.dob);
      set(`[name="members[${idx}][aadhaar]"]`, m.aadhaar);
      set(`[name="members[${idx}][pan]"]`, (m.pan || '').toUpperCase());
      set(`[name="members[${idx}][category]"]`, m.category);
      set(`[name="members[${idx}][sbAccount]"]`, m.sbAccount);
      set(`[name="members[${idx}][mobile]"]`, m.mobile);
      setRadioValue(`members[${idx}][gender]`, m.gender ?? '');
      setRadioValue(`members[${idx}][occupation]`, m.occupation ?? '');
      if (m.qr?.dataUrl) {
        const qrInput = document.querySelector(`[name="members[${idx}][qr]"]`);
        if (qrInput && !qrInput.nextElementSibling?.classList?.contains('qr-preview')) {
          const link = document.createElement('a');
          link.href = m.qr.dataUrl; link.textContent = m.qr.name || 'QR attachment';
          link.target = '_blank'; link.rel = 'noopener';
          const small = document.createElement('div');
          small.className = 'qr-preview muted'; small.style.marginTop = '.25rem';
          small.appendChild(link); qrInput.insertAdjacentElement('afterend', small);
        }
      }
    }
  }
  // Wire buttons & submit
  const saveBtn = document.getElementById('saveJsonBtn');
  const saveWithFilesBtn = document.getElementById('saveJsonWithFilesBtn');
  const loadBtn = document.getElementById('loadJsonBtn');
  const filePicker = document.getElementById('jsonFilePicker');
  saveBtn?.addEventListener('click', () => saveJson(false));
  saveWithFilesBtn?.addEventListener('click', () => saveJson(true));
  if (loadBtn && filePicker) {
    loadBtn.addEventListener('click', () => filePicker.click());
    filePicker.addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try { const text = await file.text(); const data = JSON.parse(text); await setFormData(data); alert('Data loaded successfully!'); }
      catch (err) { console.error(err); alert('Invalid JSON file. Please check and try again.'); }
      finally { e.target.value = ''; }
    });
  }

  // ---- Remove any inline onclick to avoid double execution ----
  // document.getElementById("submitBtn")?.removeAttribute("onclick");

  // // ---- Unified submit: push data to Power Automate ----
  // form?.addEventListener('submit', async (e) => {
  //   e.preventDefault();
  //   e.stopImmediatePropagation();
  //   await submitFormToFlow();
  // });

  // ============================================================
  // Aadhaar Secure-QR (decimal) + Aadhaar XML (PLBD) integration
  // ============================================================
  // --- Helpers from your XML logic (adapted to 1-based fields) ---
  function decodeHTMLEntities(text) {
    const ta = document.createElement('textarea'); ta.innerHTML = text; return ta.value;
  }
  function extractPLBDElement(input) {
    if (!input) throw new Error('Empty input');
    let s = input.replace(/^\uFEFF/, '').trim();
    s = s.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '');
    let m = s.match(/\<\s*PrintLetterBarcodeData\b[^\>]*\/\s*\>/i);
    if (m) return m[0];
    m = s.match(/\<\s*PrintLetterBarcodeData\b[^\>]*\>[\s\S]*?\<\s*\/\s*PrintLetterBarcodeData\s*\>/i);
    if (m) return m[0];
    throw new Error('Could not find <PrintLetterBarcodeData ...> element');
  }
  // NEW: extract ALL PLBD elements from a paste (supports multi-paste)
  function extractAllPLBDElements(input) {
    if (!input) return [];
    let s = input.replace(/^\uFEFF/, '').trim();
    // Remove all XML declarations
    s = s.replace(/\s*<\?xml[\s\S]*?\?>\s*/gi, '');
    // Match both self-closing and paired PLBD elements
    const re = /\<\s*PrintLetterBarcodeData\b[^\>]*\/\s*\>|\<\s*PrintLetterBarcodeData\b[^\>]*\>[\s\S]*?\<\s*\/\s*PrintLetterBarcodeData\s*\>/gi;
    const matches = s.match(re);
    return matches || [];
  }
  function parseAttributesFromElement(elementString) {
    const openTagMatch = elementString.match(/\<\s*PrintLetterBarcodeData\b([^\>]*)\>/i);
    if (!openTagMatch) throw new Error('Malformed PLBD element');
    const attrString = openTagMatch[1] || '';
    const attrs = {}; const regex = /([:\w\-]+)\s*=\s*\"([^\"]*)\"/g; let match;
    while ((match = regex.exec(attrString)) !== null) attrs[match[1]] = match[2];
    return attrs;
  }
  // Clean guardian name: remove C/O, D/O, S/O, W/O, etc.
  function trimGuardianPrefix(co) {
    if (!co) return '';
    const s = String(co).trim();
    // Simple normalization: remove common prefixes "S/O", "D/O", "C/O", "W/O", "Father:", "Husband:", etc.
    const re1 = /^(?:[CDSW])\s*\/?\s*O\s*[:\-]?\s*(.+)$/i;
    const m1 = s.match(re1); if (m1) return m1[1].trim();
    const re2 = /^(Father|Husband|Wife|Guardian|Care\s*of)\s*[:\-]?\s*(.+)$/i;
    const m2 = s.match(re2); if (m2) return m2[2].trim();
    return s;
  }
  function mapGenderToFullText(g) {
    const t = (g || '').trim().toUpperCase();
    if (t === 'M' || t === 'MALE') return 'Male';
    if (t === 'F' || t === 'FEMALE') return 'Female';
    if (t === 'T' || t === 'TRANSGENDER' || t === 'OTHER' || t === 'O') return 'Other';
    if (t.startsWith('M')) return 'Male';
    if (t.startsWith('F')) return 'Female';
    if (t.startsWith('T') || t.startsWith('O')) return 'Other';
    return '';
  }
  function dedupeParts(parts) {
    const out = []; const seen = new Set();
    for (const p of parts) {
      const v = (p || '').toString().trim(); if (!v) continue;
      const k = v.toLowerCase(); if (!seen.has(k)) { seen.add(k); out.push(v); }
    }
    return out;
  }
  // Normalize DOB into either date input (YYYY-MM-DD) or readable DD/MM/YYYY
  function normalizeDobForInput(raw, el) {
    const src = (raw || '').trim().replace(/\//g, '-').replace(/[.]/g, '-');
    const dmy = src.match(/^(\d{2})\-(\d{2})\-(\d{4})$/);
    const ymd = src.match(/^(\d{4})\-(\d{2})\-(\d{2})$/);
    const yearOnly = src.match(/^(\d{4})$/);
    const mmYYYY = src.match(/^(\d{2})\-(\d{4})$/); // MM-YYYY
    const yyyyMM = src.match(/^(\d{4})\-(\d{2})$/); // YYYY-MM
    if (el && el.type === 'date') {
      if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
      if (ymd) return src;
      if (yearOnly) return `${yearOnly[1]}-01-01`;
      if (mmYYYY) return `${mmYYYY[2]}-${mmYYYY[1]}-01`;
      if (yyyyMM) return `${yyyyMM[1]}-${yyyyMM[2]}-01`;
      return src;
    } else {
      if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
      if (dmy) return `${dmy[1]}/${dmy[2]}/${dmy[3]}`;
      if (yearOnly) return `01/01/${yearOnly[1]}`;
      if (mmYYYY) return `01/${mmYYYY[1]}/${mmYYYY[2]}`;
      if (yyyyMM) return `01/${yyyyMM[2]}/${yyyyMM[1]}`;
      return src.replace(/\-/g, '/');
    }
  }
  // --- Secure-QR decimal parsing (needs pako) ---
  function requirePako() { return typeof pako !== 'undefined'; }
  function decimalToBytesBE(decStr) {
    const s = (decStr || '').trim();
    if (!/^\d+$/.test(s)) throw new Error('Input is not an all-digits decimal string.');
    let x = BigInt(s); if (x === 0n) return new Uint8Array([0]);
    const out = []; while (x > 0n) { out.push(Number(x % 256n)); x = x / 256n; } out.reverse();
    return new Uint8Array(out);
  }
  function smartDecompress(bytes) {
    if (!requirePako()) return bytes;
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) return pako.ungzip(bytes);
    try { return pako.inflate(bytes); } catch(e) {}
    try { return pako.inflateRaw(bytes); } catch(e) {}
    return bytes;
  }
  function tokenize(payload, maxTokens = 18) {
    const tokens = [], delimIdx = []; let start = 0;
    for (let i = 0; i < payload.length && tokens.length < maxTokens; i++) {
      if (payload[i] === 0xFF) {
        tokens.push(new TextDecoder('latin1').decode(payload.subarray(start, i)));
        delimIdx.push(i); start = i + 1;
      }
    }
    return { tokens, delimIdx, nextIndex: (delimIdx.length ? delimIdx[delimIdx.length - 1] + 1 : 0) };
  }
  function computeBaseIndex(tokens) {
    let base = 0;
    if (/^V\d+$/i.test(tokens[0])) base = 1;
    const isStatus = (x) => /^[0-3]$/.test(x || '');
    if (!isStatus(tokens[base]) && isStatus(tokens[base + 1])) base += 1;
    const looksLikeRef = (x) => /^\d{21}$/.test(x || '');
    if (!looksLikeRef(tokens[base + 1]) && looksLikeRef(tokens[base + 2])) base += 1;
    return { base };
  }
  function parseAadhaarSecureQrDecimal(decStr) {
    // Keys observed in UIDAI secure-QR payloads we used earlier
    const KEYS = [
      "email_mobile_status","referenceid","name","dob","gender",
      "careof","district","landmark","house","location",
      "pincode","postoffice","state","street","subdistrict","vtc"
    ];
    const decompressed = smartDecompress(decimalToBytesBE(decStr));
    const { tokens } = tokenize(decompressed, 18);
    const { base } = computeBaseIndex(tokens);
    const out = {};
    for (let i = 0; i < 16; i++) out[KEYS[i]] = tokens[base + i];
    // Build rich address with de-duplication and pincode
    const parts = dedupeParts([
      out.house, // door no
      out.street, // street
      out.landmark || out.location, // landmark or location
      out.vtc, // village/town/city
      out.postoffice, // post office
      out.subdistrict, // taluk/tehsil
      out.district,
      out.state
    ]);
    out.addressLine = parts.join(', ');
    return out;
  }
  // --- General fill for a member row (works for both decimal & XML paths) ---
  function qsByName(idx, field) { return document.querySelector(`[name="members[${idx}][${field}]"]`); }
  function qId(idx, suffix) { return document.getElementById(`member_${idx}_${suffix}`); }
  function setValuePreferName(idx, field, value, idSuffix) {
    const byName = qsByName(idx, field); if (byName) { byName.value = value ?? ''; return byName; }
    const byId = qId(idx, idSuffix); if (byId) { byId.value = value ?? ''; return byId; }
    return null;
  }
  function setGenderRadio(idx, parsedGender) {
    const name = `members[${idx}][gender]`;
    const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
    if (!radios.length) return;
    const full = mapGenderToFullText(parsedGender) || '';
    const letter = (parsedGender || '').trim().toUpperCase().charAt(0);
    let done = false;
    radios.forEach(r => { if (!done && r.value === full) { r.checked = true; done = true; } });
    if (!done && letter) radios.forEach(r => { if (!done && r.value.toUpperCase().startsWith(letter)) { r.checked = true; done = true; }});
    if (!done && letter) radios.forEach(r => { if (!done && r.value.toUpperCase() === letter) { r.checked = true; done = true; }});
  }
  function fillMemberForm(idx, parsed) {
    // Name
    setValuePreferName(idx, 'name', parsed.name || parsed.NAME || '', 'name');
    // Father/Guardian - remove C/O, D/O, S/O etc.
    const care = parsed.careof || parsed.co || parsed.careOf || parsed.guardian || '';
    const guardian = trimGuardianPrefix(care);
    setValuePreferName(idx, 'fatherName', guardian, 'father');
    // Address
    let addressLine = parsed.addressLine;
    if (!addressLine) {
      // Build from available parts if addressLine wasn't provided
      const parts = dedupeParts([
        parsed.house || parsed.houseNo || parsed.House,
        parsed.street || parsed.streetName || parsed.Street,
        parsed.landmark || parsed.lm || parsed.loc || parsed.location,
        parsed.vtc, parsed.po,
        parsed.subdistrict || parsed.subdist,
        parsed.district || parsed.dist,
        parsed.state
      ]);
      addressLine = parts.join(', ');
    }
    setValuePreferName(idx, 'address', addressLine || '', 'address');
    // DOB
    const dobRaw = parsed.dob || parsed.DOB || '';
    const dobInput = qsByName(idx, 'dob') || qId(idx, 'dob');
    if (dobInput) dobInput.value = normalizeDobForInput(dobRaw, dobInput);
    // Gender
    setGenderRadio(idx, parsed.gender || parsed.GENDER);
    // Aadhaar (only XML reliably has uid; decimal payload usually does not expose UID)
    const uid = parsed.uid || parsed.UID || parsed.aadhaar || '';
    if (uid) setValuePreferName(idx, 'aadhaar', uid, 'aadhaar');
  }
  // --- Detect and parse content pasted into the QR box (1..20) ---
  function tryParseAndFill(idx, raw, statusEl) {
    const s = (raw || '').trim();
    if (!s) return;
    // Case 1: pure decimal => Secure-QR parse
    if (/^\d+$/.test(s)) {
      try {
        const parsed = parseAadhaarSecureQrDecimal(s); // decimal path
        fillMemberForm(idx, parsed);
        if (statusEl) { statusEl.textContent = 'Done'; statusEl.className = 'status ok'; }
        return true;
      } catch (e) {
        if (statusEl) { statusEl.textContent = 'Waiting for valid Aadhaar QR decimal or XML…'; statusEl.className = 'status muted'; }
        return false;
      }
    }
    // Case 2: looks like XML or HTML-encoded XML => PLBD parse (supports multi-paste)
    if (s.includes('\<PrintLetterBarcodeData') || s.includes('<PrintLetterBarcodeData')) {
      try {
        const decoded = decodeHTMLEntities(s);
        const elements = extractAllPLBDElements(decoded);
        if (!elements.length) throw new Error('No PLBD elements found');
        const startIdx = idx || 1;
        const needCount = startIdx + elements.length - 1;
        // Ensure enough member cards exist to fill
        if (typeof ensureMemberCount === 'function') {
          const currentCards = (membersWrap?.children.length) || 0;
          if (needCount > currentCards) ensureMemberCount(needCount);
        }
        elements.forEach((element, k) => {
          const attrs = parseAttributesFromElement(element);
          // Map PLBD attributes
          const parsed = {
            name: attrs.name,
            gender: attrs.gender,
            // include 'yob' to support year-only DOBs
            dob: attrs.dob || attrs.dobd || attrs.dob_d || attrs.yob,
            uid: attrs.uid,
            co: attrs.co || attrs.careof || attrs.guardian || attrs.gname,
            // Address attributes (normalize keys)
            house: attrs.house,
            street: attrs.street,
            lm: attrs.lm,
            loc: attrs.loc,
            vtc: attrs.vtc,
            po: attrs.po,
            subdistrict: attrs.subdist,
            district: attrs.dist,
            state: attrs.state,
            // pincode: attrs.pc || attrs.pincode || attrs.pin,
            addressLine: null
          };
          // Build de-duplicated address + pincode
          const addrParts = dedupeParts([
            parsed.house,
            parsed.street,
            parsed.lm || parsed.loc,
            parsed.vtc,
            parsed.po,
            parsed.subdistrict,
            parsed.district,
            parsed.state
          ]);
          parsed.addressLine = addrParts.join(', ');
          fillMemberForm(startIdx + k, parsed);
        });
        if (statusEl) { statusEl.textContent = 'Done'; statusEl.className = 'status ok'; }
        return true;
      } catch (e) {
        if (statusEl) { statusEl.textContent = 'Paste valid Aadhaar XML (PLBD) or Secure-QR decimal'; statusEl.className = 'status err'; }
        return false;
      }
    }
    // Unknown content
    if (statusEl) { statusEl.textContent = 'Please paste Secure-QR decimal or Aadhaar XML'; statusEl.className = 'status err'; }
    return false;
  }
  // ============================================================
  // Delegated listener: one box accepts decimal OR XML (1..20)
  // ============================================================
  document.addEventListener('input', debounce((e) => {
    const inputEl = e.target;
    if (!(inputEl instanceof HTMLInputElement)) return;
    const isQrName = inputEl.name && /^members\[\d+\]\[qr\]$/.test(inputEl.name);
    const isQrId = inputEl.id && /^member_\d+_qr$/.test(inputEl.id);
    if (!isQrName && !isQrId) return;
    let idx = null;
    const mByName = inputEl.name?.match(/^members\[(\d+)\]\[qr\]$/);
    if (mByName) idx = Number(mByName[1]);
    const mById = inputEl.id?.match(/^member_(\d+)_qr$/);
    if (!idx && mById) idx = Number(mById[1]);
    const card = inputEl.closest('.member-card');
    const statusEl = card?.querySelector('.status');
    const success = tryParseAndFill(idx, inputEl.value, statusEl);
    if (success) inputEl.value = ''; // clear after successful parse
  }, 50));
})();
