  // ---------- Page navigation ----------
  const pages = {
    'settings': { sectionId: 'page-settings', title: 'Settings' },
    'list': { sectionId: 'page-list', title: 'Job requisition approvals' },
    'requester': { sectionId: 'page-requester', title: 'Job requisition approvals' },
    'submitted': { sectionId: 'page-submitted', title: 'Job requisition approvals' },
    'detail-seq': { sectionId: 'page-detail-seq', title: 'Job requisition approvals' },
    'detail-alt': { sectionId: 'page-detail-alt', title: 'Job requisition approvals' },
    'detail-approved': { sectionId: 'page-detail-approved', title: 'Job requisition approvals' },
    'detail-legacy': { sectionId: 'page-detail-legacy', title: 'Job requisition approvals' },
  };

  function goPage(key) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const p = pages[key];
    document.getElementById(p.sectionId).classList.add('active');
    document.getElementById('topbar-title').textContent = p.title;
    window.scrollTo({ top: 0, behavior: 'instant' });
    // also keep tour banner in sync
    syncTourFromPage(key);
  }

  // ---------- Tour ----------
  const tourSteps = [
    {
      page: 'settings',
      name: 'Step 1 — Admin: Configure settings page',
      desc: 'Set up a sequential or alternative chain on a requisition form template'
    },
    {
      page: 'list',
      name: 'Case 2 — Approvals list',
      desc: 'Overview of all requisitions with chain progress visible at a glance'
    },
    {
      page: 'requester',
      name: 'Case 3 — Requester: Submit with chain preview',
      desc: 'Requester sees the locked chain before submitting'
    },
    {
      page: 'submitted',
      name: 'Case 3 (cont.) — Submission confirmation',
      desc: 'Requester sees who is being notified first'
    },
    {
      page: 'detail-seq',
      name: 'Case 4 — Approver acts on sequential chain',
      desc: 'Step 2 approver decides — approve & forward, or reject & return'
    },
    {
      page: 'detail-alt',
      name: 'Case 4 (cont.) — Alternative chain decision',
      desc: 'Any of 3 approvers — first decision wins'
    },
    {
      page: 'detail-approved',
      name: 'Final state — Fully approved',
      desc: 'Complete chain history and audit trail'
    }
  ];
  let tourIdx = 0;

  function renderTour() {
    document.getElementById('tour-step-name').textContent = tourSteps[tourIdx].name;
    document.getElementById('tour-step-desc').textContent = tourSteps[tourIdx].desc;
    document.getElementById('tour-progress').textContent = `${tourIdx + 1} / ${tourSteps.length}`;
    document.getElementById('tour-prev').disabled = tourIdx === 0;
    document.getElementById('tour-next').disabled = tourIdx === tourSteps.length - 1;
  }
  document.getElementById('tour-prev').addEventListener('click', () => {
    if (tourIdx > 0) { tourIdx--; goPage(tourSteps[tourIdx].page); renderTour(); }
  });
  document.getElementById('tour-next').addEventListener('click', () => {
    if (tourIdx < tourSteps.length - 1) { tourIdx++; goPage(tourSteps[tourIdx].page); renderTour(); }
  });
  function syncTourFromPage(pageKey) {
    const i = tourSteps.findIndex(s => s.page === pageKey);
    if (i >= 0) { tourIdx = i; renderTour(); }
  }
  function hideTour() {
    document.querySelector('.tour-banner').style.display = 'none';
  }
  renderTour();

  // ---------- Mode switch (Sequential / Alternative) ----------
  function switchMode(mode) {
    document.getElementById('mode-sequential').style.display = mode === 'sequential' ? '' : 'none';
    document.getElementById('mode-alternative').style.display = mode === 'alternative' ? '' : 'none';
    document.getElementById('mode-seq-btn').classList.toggle('active', mode === 'sequential');
    document.getElementById('mode-alt-btn').classList.toggle('active', mode === 'alternative');
  }

  // ---------- Global state ----------
  let adminMode = false;
  let currentApprovalView = 'standard';
  let selectedReqForm = 'standard-panf';
  let chainEditState = null;

  // ---------- Requisition form data ----------
  const reqFormData = {
    'standard-panf': {
      name: 'Standard_PANF',
      mode: 'sequential',
      steps: [
        { label: 'Team Lead',       person: 'Sinan Guercan',     initials: 'SG', cls: 'sg' },
        { label: 'Department Head', person: 'Adrian-D. Kodja',   initials: 'AK', cls: 'ak' },
        { label: 'CFO sign-off',    person: 'Lucas LuxusNewman', initials: 'LL', cls: 'll' }
      ]
    },
    'panf-metacrew': {
      name: 'PANF metacrew Gruppe',
      mode: 'alternative',
      approvers: [
        { name: 'Sinan Guercan',    role: 'Team Lead',           initials: 'SG', cls: 'sg' },
        { name: 'Apurva C',         role: 'Director, Talent',    initials: 'AC', cls: 'ac' },
        { name: 'Adrian-D. Kodja',  role: 'Head of Engineering', initials: 'AK', cls: 'ak' }
      ]
    },
    'panf-sg-service': {
      name: 'PANF SG Service',
      mode: 'single',
      approvers: [
        { name: 'Assigned approver', role: 'Determined at submission', initials: '?', cls: 'fallback' }
      ]
    }
  };

  // ---------- Approval view toggle (Standard / Booked) — settings page ----------
  function setApprovalView(type) {
    currentApprovalView = type;
    const vs = document.getElementById('view-standard');
    const vb = document.getElementById('view-booked');
    if (vs) vs.style.display = type === 'standard' ? '' : 'none';
    if (vb) vb.style.display = type === 'booked'   ? '' : 'none';
    const ts = document.getElementById('avtab-standard');
    const tb = document.getElementById('avtab-booked');
    if (ts) ts.classList.toggle('active', type === 'standard');
    if (tb) tb.classList.toggle('active', type === 'booked');
    // Sync requester page
    selectedReqForm = 'standard-panf';
    chainEditState = null;
    updateFormSelector();
    renderChainPanel();
  }

  // ---------- Admin mode toggle ----------
  function setAdminMode(isAdmin) {
    adminMode = isAdmin;
    document.getElementById('amtbtn-user').classList.toggle('active', !isAdmin);
    const adminBtn = document.getElementById('amtbtn-admin');
    adminBtn.classList.toggle('active', isAdmin);
    adminBtn.classList.toggle('is-admin', isAdmin);
    chainEditState = null;
    if (isAdmin) initChainEditState(selectedReqForm);
    renderChainPanel();
  }

  // ---------- Chain edit state ----------
  function initChainEditState(formKey) {
    const form = reqFormData[formKey];
    chainEditState = {
      mode: form.mode === 'alternative' ? 'alternative' : 'sequential',
      overridden: false,
      steps: form.steps   ? form.steps.map(s => ({...s}))   : [],
      altApprovers: form.approvers ? form.approvers.map(a => ({...a})) :
                    (form.steps ? form.steps.map(s => ({name:s.person,role:s.label,initials:s.initials,cls:s.cls})) : [])
    };
  }

  // ---------- Form selector ----------
  function updateFormSelector() {
    const sel = document.getElementById('req-form-select');
    const grp = document.getElementById('req-form-group');
    if (!sel) return;
    if (currentApprovalView === 'booked') {
      sel.disabled = false;
      if (grp) grp.style.opacity = '';
      sel.innerHTML = `
        <option value="standard-panf">Standard_PANF</option>
        <option value="panf-metacrew">PANF metacrew Gruppe</option>
        <option value="panf-sg-service">PANF SG Service</option>
      `;
    } else {
      sel.disabled = true;
      if (grp) grp.style.opacity = '0.7';
      sel.innerHTML = `<option value="standard-panf">Standard_PANF</option>`;
      selectedReqForm = 'standard-panf';
    }
    sel.value = selectedReqForm;
    updateFormSubtitle();
  }

  function onReqFormChange(formKey) {
    selectedReqForm = formKey;
    chainEditState = null;
    if (adminMode) initChainEditState(formKey);
    updateFormSubtitle();
    renderChainPanel();
  }

  function updateFormSubtitle() {
    const el = document.getElementById('req-subtitle');
    if (!el) return;
    const form = reqFormData[selectedReqForm];
    const adminNote = adminMode ? 'Admin override active — chain is editable.' : 'Approval chain is pre-configured by your administrator.';
    el.innerHTML = `Form: <strong>${form.name}</strong>. ${adminNote}`;
  }

  // ---------- Chain panel rendering ----------
  function renderChainPanel() {
    const card = document.getElementById('req-chain-card');
    if (!card) return;
    if (adminMode) {
      if (!chainEditState) initChainEditState(selectedReqForm);
      card.innerHTML = buildEditablePanel();
    } else {
      card.innerHTML = buildLockedPanel();
    }
  }

  function buildLockedPanel() {
    const form = reqFormData[selectedReqForm];
    let chainHTML = '';
    let headerText = '';
    let noticeText = '';
    if (form.mode === 'sequential') {
      headerText = `Locked sequence (${form.steps.length} steps)`;
      chainHTML = `<div class="chain-preview-steps">${form.steps.map((s,i) => `
        <div class="chain-preview-step">
          <div class="step-num">${i+1}</div>
          <div style="flex:1;"><div class="step-name">${s.label}</div><div class="step-people">${s.person}</div></div>
        </div>`).join('')}</div>`;
      noticeText = `Once submitted, <strong>${form.steps[0].person.split(' ')[0]}</strong> will be notified first. Each approver only sees the requisition after the previous step approves.`;
    } else if (form.mode === 'alternative') {
      headerText = `Alternative (Any 1 of ${form.approvers.length})`;
      chainHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
          ${form.approvers.map(a=>`<div style="display:inline-flex;align-items:center;gap:6px;background:var(--neutral-bg);border:1px solid var(--border);border-radius:999px;padding:4px 10px 4px 4px;font-size:12.5px;">
            <div class="flow-av ${a.cls}" style="width:20px;height:20px;font-size:8px;">${a.initials}</div>${a.name}</div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:5px;margin-top:8px;font-size:11.5px;color:var(--text-muted);">
          <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          First to decide wins
        </div>`;
      noticeText = `Once submitted, all ${form.approvers.length} approvers are notified simultaneously. <strong>First decision wins.</strong>`;
    } else {
      headerText = 'Single Approver (Fallback)';
      chainHTML = `<div style="color:var(--text-muted);font-size:13px;font-style:italic;margin-top:6px;">Approver will be assigned at submission time.</div>`;
      noticeText = `Once submitted, a single approver will be assigned and notified.`;
    }
    const modeDesc = form.mode === 'sequential' ? 'Sequential — each step must approve in order.' : form.mode === 'alternative' ? 'Alternative — any one approver can decide.' : 'Single fallback approver.';
    return `<div class="card" style="padding:20px 22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <h3 style="margin:0;font-size:14px;font-weight:700;">Approval chain</h3>
      </div>
      <div style="color:var(--text-muted);font-size:12px;margin-bottom:16px;">Pre-configured by Admin. ${modeDesc}</div>
      <div class="chain-preview" style="margin-top:0;">
        <div class="chain-preview-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          ${headerText}
          <span class="chain-preview-locked">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Locked
          </span>
        </div>
        ${chainHTML}
      </div>
      <div class="inline-notice info" style="margin-top:16px;">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>${noticeText}</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;">
        <button class="btn btn-secondary" style="flex:1;">Save as draft</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitRequisition()">Submit for approval</button>
      </div>
    </div>`;
  }

  function buildEditablePanel() {
    const form = reqFormData[selectedReqForm];
    const cs = chainEditState;
    const isSeq = cs.mode === 'sequential';
    const seqHTML = cs.steps.length ? cs.steps.map((s,i) => `
      <div class="edit-step">
        <div class="step-badge">${i+1}</div>
        <div class="edit-step-info">
          <div class="edit-step-role">${s.label}</div>
          <div class="edit-step-person">
            <span class="flow-av ${s.cls}" style="width:20px;height:20px;font-size:8px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">${s.initials}</span>
            ${s.person}
          </div>
        </div>
        <button class="remove-step-btn" onclick="removeEditStep(${i})" title="Remove">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      ${i < cs.steps.length-1 ? '<div class="edit-step-arrow"><svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>' : ''}
    `).join('') : '<div style="color:var(--text-muted);font-size:12.5px;font-style:italic;padding:8px 0;">No steps added yet.</div>';

    const altHTML = cs.altApprovers.length ? `
      <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px;">Any 1 of the following must approve:</div>
      ${cs.altApprovers.map((a,i) => `
        <div class="edit-step">
          <span class="flow-av ${a.cls}" style="width:22px;height:22px;font-size:8.5px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;flex-shrink:0;">${a.initials}</span>
          <div class="edit-step-info" style="flex:1;">
            <div class="edit-step-person" style="font-weight:600;">${a.name}</div>
            <div class="edit-step-role">${a.role}</div>
          </div>
          <button class="remove-step-btn" onclick="removeEditAltApprover(${i})" title="Remove">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`).join('')}
    ` : '<div style="color:var(--text-muted);font-size:12.5px;font-style:italic;padding:8px 0;">No approvers added yet.</div>';

    const overrideNotice = cs.overridden ? `
      <div class="chain-override-notice">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>Chain overridden from <strong>${form.name}</strong> template. Changes apply to this requisition only.</span>
      </div>` : '';

    return `<div class="card" style="padding:20px 22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <h3 style="margin:0;font-size:14px;font-weight:700;">Approval chain</h3>
        <span class="admin-panel-badge">
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Admin override
        </span>
      </div>
      <div style="color:var(--text-muted);font-size:12px;margin-bottom:14px;">Override the approval chain for this requisition only.</div>
      ${overrideNotice}
      <div class="chain-edit-bar">
        <button class="cem-btn ${isSeq?'active':''}" onclick="switchEditMode('sequential')">Sequential</button>
        <button class="cem-btn ${!isSeq?'active':''}" onclick="switchEditMode('alternative')">Alternative</button>
      </div>
      <div id="edit-seq-view" style="display:${isSeq?'':'none'};">
        ${seqHTML}
        <button class="add-chain-btn" onclick="addEditStep()">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add step
        </button>
      </div>
      <div id="edit-alt-view" style="display:${isSeq?'none':''};">
        ${altHTML}
        <button class="add-chain-btn" onclick="addAltApprover()">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add approver
        </button>
      </div>
      <div style="display:flex;gap:10px;margin-top:18px;">
        <button class="btn btn-secondary" style="flex:1;">Save as draft</button>
        <button class="btn btn-primary" style="flex:1;" onclick="submitRequisition()">Submit for approval</button>
      </div>
    </div>`;
  }

  // ---------- Inline chain editing ----------
  function switchEditMode(mode) {
    if (!chainEditState) return;
    if (chainEditState.mode === mode) return;
    chainEditState.mode = mode;
    chainEditState.overridden = true;
    const form = reqFormData[selectedReqForm];
    if (mode === 'sequential' && chainEditState.steps.length === 0) {
      chainEditState.steps = form.steps ? form.steps.map(s=>({...s})) : [];
    }
    if (mode === 'alternative' && chainEditState.altApprovers.length === 0) {
      chainEditState.altApprovers = form.approvers ? form.approvers.map(a=>({...a})) :
        (form.steps ? form.steps.map(s=>({name:s.person,role:s.label,initials:s.initials,cls:s.cls})) : []);
    }
    renderChainPanel();
  }

  function addEditStep() {
    if (!chainEditState || chainEditState.steps.length >= 5) return;
    chainEditState.steps.push({ label: 'New step', person: 'Select approver', initials: '+', cls: 'fallback' });
    chainEditState.overridden = true;
    renderChainPanel();
  }

  function removeEditStep(idx) {
    if (!chainEditState || chainEditState.steps.length <= 1) return;
    chainEditState.steps.splice(idx, 1);
    chainEditState.overridden = true;
    renderChainPanel();
  }

  function addAltApprover() {
    if (!chainEditState || chainEditState.altApprovers.length >= 5) return;
    chainEditState.altApprovers.push({ name: 'Select approver', role: '', initials: '+', cls: 'fallback' });
    chainEditState.overridden = true;
    renderChainPanel();
  }

  function removeEditAltApprover(idx) {
    if (!chainEditState || chainEditState.altApprovers.length <= 1) return;
    chainEditState.altApprovers.splice(idx, 1);
    chainEditState.overridden = true;
    renderChainPanel();
  }

  // ---------- Form selection on admin page ----------
  const formConfigs = {
    'standard-panf':    { name: 'Standard_PANF',          mode: 'sequential' },
    'standard-default': { name: 'Standard Approval Form',  mode: 'sequential' },
    'panf-metacrew':    { name: 'PANF metacrew Gruppe',    mode: 'alternative' },
    'panf-sg-service':  { name: 'PANF SG Service',         mode: 'alternative' }
  };
  function selectFormRow(row) {
    document.querySelectorAll('.ac-row').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
  }

  // ---------- Chain config modal ----------
  function openChainModal(formKey) {
    const cfg = formConfigs[formKey];
    document.getElementById('chain-modal-title').textContent = 'Configure approval chain';
    document.getElementById('chain-modal-subtitle').textContent =
      `Form: ${cfg.name} — every requisition using this form will follow the configured chain.`;
    switchMode(cfg.mode);
    updateStepLimitUI();
    updateAltCountLabel();
    document.getElementById('chain-config-modal').classList.add('show');
    // also highlight the row
    const row = document.querySelector(`.ac-row[data-form="${formKey}"]`);
    if (row) { document.querySelectorAll('.ac-row').forEach(r => r.classList.remove('selected')); row.classList.add('selected'); }
  }
  function closeChainModal() {
    document.getElementById('chain-config-modal').classList.remove('show');
  }

  // ---------- Sequential chain builder ----------
  const MAX_STEPS = 3;

  function updateStepLimitUI() {
    const chain = document.getElementById('seq-chain-builder');
    const count = chain.querySelectorAll('.seq-step').length;
    const addBtn = document.querySelector('#add-step-row .btn');
    const notice = document.getElementById('step-limit-msg');
    if (count >= MAX_STEPS) {
      addBtn.disabled = true;
      addBtn.style.opacity = '0.4';
      notice.style.display = 'flex';
    } else {
      addBtn.disabled = false;
      addBtn.style.opacity = '';
      notice.style.display = 'none';
    }
  }

  function addStep() {
    const chain = document.getElementById('seq-chain-builder');
    const addBtnRow = document.getElementById('add-step-row');
    const count = chain.querySelectorAll('.seq-step').length;
    if (count >= MAX_STEPS) { return; }
    const stepNum = count + 1;

    const arrow = document.createElement('div');
    arrow.className = 'seq-arrow';
    arrow.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;

    const step = document.createElement('div');
    step.className = 'seq-step';
    step.innerHTML = `
      <div class="seq-step-header">
        <div class="seq-step-number">${stepNum}</div>
        <input class="seq-step-title" value="New step" style="border:none; background:transparent; outline:none; font-weight:600; font-size:14px; flex:1;">
        <div class="seq-step-actions">
          <button class="icon-btn danger" onclick="removeStep(this)" title="Remove step">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>
      </div>
      <div class="seq-step-body">
        <button class="add-approver-select" style="width:100%;">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add an approver
        </button>
      </div>
    `;

    chain.insertBefore(arrow, addBtnRow);
    chain.insertBefore(step, addBtnRow);
    updateStepLimitUI();
  }

  function removeStep(btn) {
    const step = btn.closest('.seq-step');
    const prev = step.previousElementSibling;
    if (prev && prev.classList.contains('seq-arrow')) prev.remove();
    step.remove();
    renumberSteps();
    updateStepLimitUI();
  }

  function renumberSteps() {
    document.querySelectorAll('#seq-chain-builder .seq-step').forEach((s, i) => {
      s.querySelector('.seq-step-number').textContent = i + 1;
    });
  }

  // ---------- Alternative chain builder ----------
  const MAX_ALT = 3;

  function updateAltCountLabel() {
    const count = document.querySelectorAll('#alt-approvers-list .alt-approver-card').length;
    const label = document.getElementById('alt-count-label');
    label.textContent = count >= MAX_ALT
      ? `${count} of ${MAX_ALT} approvers added (maximum)`
      : `${count} of ${MAX_ALT} approvers added`;
  }

  function removeAltApprover(btn) {
    btn.closest('.alt-approver-card').remove();
    updateAltCountLabel();
  }

  // ---------- Decision selection ----------
  function selectDecision(el, type) {
    const wrapper = el.closest('.decision-card');
    wrapper.querySelectorAll('.decide-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');

    const submitBtn = wrapper.querySelector('button.btn-primary');
    submitBtn.disabled = false;

    // Sequential page — toggle comment box
    if (type === 'approve' || type === 'reject') {
      const cw = document.getElementById('comment-wrapper-seq');
      const lbl = document.getElementById('comment-label-seq');
      cw.style.display = '';
      lbl.textContent = type === 'reject' ? 'Reason for rejection (required)' : 'Comment for next approver (optional)';
      submitBtn.textContent = type === 'reject' ? 'Reject & return' : 'Approve & forward';
      submitBtn.classList.toggle('btn-primary', type !== 'reject');
      submitBtn.classList.toggle('btn-danger', type === 'reject');
      submitBtn.dataset.action = type;
    }
    // Alternative page
    if (type === 'approve-alt' || type === 'reject-alt') {
      document.getElementById('comment-wrapper-alt').style.display = '';
      submitBtn.textContent = type === 'reject-alt' ? 'Reject & return' : 'Approve';
      submitBtn.classList.toggle('btn-primary', type !== 'reject-alt');
      submitBtn.classList.toggle('btn-danger', type === 'reject-alt');
      submitBtn.dataset.action = type;
    }
  }

  function submitDecisionSeq() {
    const btn = document.getElementById('submit-decision-seq');
    const action = btn.dataset.action;
    if (action === 'reject') {
      openModal('modal-reject');
    } else {
      // Approve — show success, advance progress
      showToast('Step 2 approved', 'Lucas LuxusNewman has been notified as Step 3 approver.', 'success');

      // Add new activity entry
      const list = document.getElementById('activity-list-seq');
      const item = document.createElement('div');
      item.className = 'activity-item';
      const comment = document.getElementById('comment-text-seq').value;
      item.innerHTML = `
        <div class="avatar-circle avatar-lg">AK</div>
        <div class="activity-content">
          <div class="activity-meta"><span class="activity-name">Adrian-D. Kodja (you)</span></div>
          <div class="activity-time" style="margin-bottom: 4px;">Just now</div>
          <div class="activity-action">Approved — Step 2 of 3</div>
          ${comment ? `<div class="activity-comment">${comment}</div>` : ''}
        </div>
      `;
      list.insertBefore(item, list.firstChild);

      // Disable form
      btn.disabled = true;
      btn.textContent = '✓ Decision submitted';
      document.querySelectorAll('#page-detail-seq .decide-option').forEach(o => o.style.pointerEvents = 'none');

      // Update progress viz
      const stepIcons = document.querySelectorAll('#page-detail-seq .chain-progress .progress-step-icon');
      stepIcons[1].classList.remove('current');
      stepIcons[1].classList.add('done');
      stepIcons[1].innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;
      const stepLines = document.querySelectorAll('#page-detail-seq .chain-progress .progress-step-line');
      if (stepLines[1]) stepLines[1].classList.add('done');
      stepIcons[2].classList.remove('pending');
      stepIcons[2].classList.add('current');
      document.querySelectorAll('#page-detail-seq .chain-progress .progress-step-label')[1].innerHTML = 'Step 2 · Approved';
      document.querySelectorAll('#page-detail-seq .chain-progress .progress-step-label')[2].innerHTML = 'Step 3 · In progress';
    }
  }

  function confirmReject() {
    closeModal('modal-reject');
    showToast('Requisition rejected', 'Returned to Rakesh Admin. The chain has stopped.', 'error');

    const list = document.getElementById('activity-list-seq');
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="avatar-circle avatar-lg" style="background: var(--rejected-bg); color: var(--rejected-text);">AK</div>
      <div class="activity-content">
        <div class="activity-meta"><span class="activity-name">Adrian-D. Kodja (you)</span></div>
        <div class="activity-time" style="margin-bottom: 4px;">Just now</div>
        <div class="activity-action" style="color: var(--rejected-text);">Rejected — Step 2 of 3 · Chain stopped, returned to requester</div>
        <div class="activity-comment">Salary is above the band for this level. Please align with HR before resubmitting.</div>
      </div>
    `;
    list.insertBefore(item, list.firstChild);

    // Update status
    document.querySelectorAll('#page-detail-seq .pill').forEach(p => {
      p.className = 'pill pill-rejected';
      p.innerHTML = `<svg class="icon" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> Rejected — returned`;
    });
    // Mark step 2 in progress viz as rejected
    const stepIcons = document.querySelectorAll('#page-detail-seq .chain-progress .progress-step-icon');
    stepIcons[1].classList.remove('current');
    stepIcons[1].classList.add('rejected');
    stepIcons[1].innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    document.querySelectorAll('#page-detail-seq .chain-progress .progress-step-label')[1].innerHTML = 'Step 2 · Rejected';

    // Disable form
    document.getElementById('submit-decision-seq').disabled = true;
    document.getElementById('submit-decision-seq').textContent = '✓ Decision submitted';
    document.querySelectorAll('#page-detail-seq .decide-option').forEach(o => o.style.pointerEvents = 'none');
  }

  // ---------- Submit requisition ----------
  function submitRequisition() {
    showToast('Requisition submitted', 'Step 1 approver (Sinan Guercan) has been notified.', 'success');
    setTimeout(() => goPage('submitted'), 300);
  }

  function resetRequester() {
    selectedReqForm = 'standard-panf';
    chainEditState = null;
    if (adminMode) initChainEditState(selectedReqForm);
    updateFormSelector();
    renderChainPanel();
  }

  // ---------- Save chain (admin) ----------
  function saveChain() {
    closeChainModal();
    showToast('Approval chain saved', 'The chain is now bound to the selected form. Changes apply to future requisitions only.');
  }

  // ---------- Modals ----------
  function openModal(id) {
    document.getElementById(id).classList.add('show');
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
  }

  // ---------- Toasts ----------
  function showToast(title, msg, type = 'success') {
    const container = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = `toast ${type === 'error' ? 'error' : ''}`;
    t.innerHTML = `
      <svg width="18" height="18" fill="none" stroke="${type === 'error' ? 'var(--rejected-dot)' : 'var(--approved-dot)'}" stroke-width="2.4" viewBox="0 0 24 24" style="flex-shrink:0;">
        ${type === 'error'
          ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
          : '<polyline points="20 6 9 17 4 12"/>'}
      </svg>
      <div>
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${msg}</div>
      </div>
    `;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = 'all .25s'; }, 4000);
    setTimeout(() => t.remove(), 4400);
  }

  // close modal on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.addEventListener('click', (e) => {
      if (e.target === b) b.classList.remove('show');
    });
  });
