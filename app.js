/* app.js - shared frontend interactions for TagIT prototype
   Handles: file preview, geolocation, report submit (simulated), toasts,
   localStorage persistence for reports and demo dashboard + authority dashboard + tag details
*/
(() => {
  const BACKEND = '/api/report';
  const DEBUG_TIMER_SECONDS = null; // 15 for testing, null = 6 min

  // ===== Toasts =====
  function showToast(msg, type = 'info', timeout = 4500) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const el = document.createElement('div');
    el.className = 'p-3 rounded-lg shadow-md bg-slate-800 border border-gray-700';
    el.innerHTML = `<div class="flex items-start gap-3"><div class="text-saffron">●</div><div>${msg}</div></div>`;
    c.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  // ===== TAG PAGE INIT (Icons, Capture List, Self Help Tips) =====
  window.tagitPageInit = function (tag) {
    const mapping = {
      Fire: {
        icon: '<i class="fa-solid fa-fire text-orange-400"></i>',
        desc: 'Active fire incident — alert the fire department immediately.',
        capture: ['Flames or smoke visibility', 'Nearby buildings or people', 'Exact address or landmark'],
        tips: [
          'Stay low to avoid smoke inhalation.',
          'Do not use elevators — use stairs.',
          'If the door handle is hot, do not open it.',
          'Cover your mouth with a wet cloth.',
          'If trapped, signal for help from a window.',
          'Never re-enter a burning building.',
          'Stop, drop, and roll if clothes catch fire.',
          'Move away from the building immediately.',
          'Call 101 for fire emergencies.',
          'Warn others nearby to evacuate.',
        ],
      },
      Violence: {
        icon: '<i class="fa-solid fa-user-shield text-red-500"></i>',
        desc: 'Report cases of physical assault, harassment, or threats.',
        capture: ['Attacker photo (if safe)', 'Exact location', 'Nearby CCTV or witnesses'],
        tips: [
          'Prioritize your safety above all.',
          'Avoid confrontation — move to a safe area.',
          'Call the police at 100 immediately.',
          'Alert others nearby or shout for help.',
          'Record evidence discreetly if safe.',
          'Note the attacker’s features and clothing.',
          'Seek medical help if injured.',
          'Inform family or trusted contacts.',
          'Do not chase or confront the attacker.',
          'Stay in a public area until help arrives.',
        ],
      },
      Health: {
        icon: '<i class="fa-solid fa-hospital text-green-400"></i>',
        desc: 'Report medical emergencies or health hazards.',
        capture: ['Condition of patient', 'Nearby landmarks', 'Possible cause or symptoms'],
        tips: [
          'Call 108 (ambulance) immediately.',
          'Check if the patient is breathing.',
          'Do not move the injured unless necessary.',
          'Apply pressure to stop visible bleeding.',
          'If unconscious but breathing, place in recovery position.',
          'Start CPR only if trained.',
          'Keep the person calm and warm.',
          'Avoid giving food or drink to unconscious patients.',
          'Inform the nearest hospital quickly.',
          'Stay until help arrives.',
        ],
      },
      SOS: {
        icon: '<i class="fa-solid fa-bullhorn text-yellow-400"></i>',
        desc: 'Emergency SOS alert for immediate help.',
        capture: ['Short video (if possible)', 'Exact location', 'Attacker or danger details'],
        tips: [
          'Move to a safe, well-lit, public place.',
          'Call 112 or 100 immediately.',
          'Share your live location with trusted contacts.',
          'Keep your phone on silent if hiding.',
          'Avoid direct confrontation.',
          'Stay calm and alert.',
          'Seek shelter in nearby stores or buildings.',
          'Signal nearby people for help.',
          'Do not engage with suspicious persons.',
          'Stay where police can locate you quickly.',
        ],
      },
      Animal: {
        icon: '<i class="fa-solid fa-paw text-teal-400"></i>',
        desc: 'Report injured, stray, or aggressive animals.',
        capture: ['Photo of the animal', 'Visible injuries', 'Exact location or landmark'],
        tips: [
          'Approach slowly and calmly.',
          'Avoid touching aggressive animals.',
          'Call local animal rescue or NGOs.',
          'Provide shade and water if possible.',
          'Use a towel to handle small injured animals.',
          'Do not feed or medicate without expert advice.',
          'Keep the animal away from traffic.',
          'Wait until rescue arrives if safe.',
          'Warn others nearby.',
          'Stay gentle and patient.',
        ],
      },
      Complaints: {
        icon: '<i class="fa-solid fa-city text-blue-400"></i>',
        desc: 'Report civic issues — water, roads, pollution, etc.',
        capture: ['Photo of issue', 'Landmark nearby', 'Street or area name'],
        tips: [
          'Avoid going near open manholes or drains.',
          'Take photos from a safe distance.',
          'Report standing sewage or flooding immediately.',
          'Avoid touching exposed electrical wires.',
          'Encourage others to report civic problems.',
          'Do not block traffic while taking photos.',
          'Keep distance from large construction equipment.',
          'Wear a mask in polluted areas.',
          'Use gloves if handling garbage.',
          'Follow up with local authorities for resolution.',
        ],
      },
      General: {
        icon: '<i class="fa-solid fa-triangle-exclamation text-gray-400"></i>',
        desc: 'Report any general civic or emergency issue.',
        capture: ['Images or video', 'Accurate address', 'Brief description'],
        tips: [
          'Stay calm and assess the situation.',
          'Ensure your safety before reporting.',
          'Avoid misinformation or exaggeration.',
          'Provide clear, factual details.',
          'Do not confront anyone involved.',
          'Take photos safely from a distance.',
          'Keep emergency numbers handy.',
          'Alert others if there is danger nearby.',
          'Encourage collective reporting.',
          'Follow up if the issue persists.',
        ],
      },
    };

    const data = mapping[tag] || mapping['General'];
    document.getElementById('tagInput').value = tag;
    document.getElementById('tagTitle').textContent = tag;
    document.getElementById('tagDesc').textContent = data.desc;
    document.getElementById('tagIcon').innerHTML = data.icon;

    const captureList = document.getElementById('captureList');
    captureList.innerHTML = '';
    data.capture.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      captureList.appendChild(li);
    });

    const tipsList = document.getElementById('selfHelpTips');
    tipsList.innerHTML = '';
    data.tips.forEach((tip) => {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsList.appendChild(li);
    });
  };

  // ===== File Upload Preview =====
  function initFileInput() {
    const dz = document.getElementById('dropzone');
    if (!dz) return;
    const fileInput = document.getElementById('fileInput');
    const pick = document.getElementById('pickFile');
    const preview = document.getElementById('preview');

    pick.addEventListener('click', () => fileInput.click());
    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('border-saffron');
    });
    dz.addEventListener('dragleave', () => dz.classList.remove('border-saffron'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('border-saffron');
      const f = e.dataTransfer.files[0];
      handleFile(f);
    });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    function handleFile(f) {
      if (!f) return;
      preview.innerHTML = '';
      const url = URL.createObjectURL(f);
      if (f.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'rounded max-h-48';
        preview.appendChild(img);
      } else {
        const vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        vid.className = 'rounded max-h-48';
        preview.appendChild(vid);
      }
      preview.dataset.fileName = f.name;
      const reader = new FileReader();
      reader.onload = () => (preview.dataset.fileData = reader.result);
      reader.readAsDataURL(f);
    }
  }

  // ===== Geolocation =====
  function initGeolocation() {
    const btn = document.getElementById('useLocation');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const disp = document.getElementById('locDisplay');
      disp.textContent = 'Getting current location...';
      try {
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
        );
        const coords = pos.coords;
        disp.textContent = `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`;
        disp.dataset.lat = coords.latitude;
        disp.dataset.lon = coords.longitude;
        showToast('Live location captured (demo)');
      } catch (err) {
        disp.textContent = 'Unable to get location (allow permissions).';
      }
    });
  }

  // ===== Report Submission =====
  function initReportForm() {
    const form = document.getElementById('reportForm');
    if (!form) return;

    const tagInput = document.getElementById('tagInput');
    const desc = document.getElementById('description');
    const address = document.getElementById('address');
    const pincode = document.getElementById('pincode');
    const submitBtn = document.getElementById('submitBtn');
    const locDisplay = document.getElementById('locDisplay');
    const preview = document.getElementById('preview');
    const timerWrap = document.getElementById('timerWrap');
    const timerDisplay = document.getElementById('timerDisplay');
    let currentTimer = null;

    form.addEventListener('submit', (e) => e.preventDefault());
    submitBtn.addEventListener('click', async () => {
      const tag = tagInput.value || 'General';
      const priority = document.getElementById('priority').value;
      const description = desc.value || '';
      const addr = address.value || '';
      const pin = pincode.value || '';

      if (!locDisplay.dataset.lat && !pin) return alert('Please use live location or enter a valid pincode.');
      if (pin && !/^\d{6}$/.test(pin)) return alert('Pincode must be 6 digits.');

      const payload = {
        tag,
        priority,
        description,
        address: addr,
        pincode: pin,
        location: locDisplay.dataset.lat ? { lat: locDisplay.dataset.lat, lon: locDisplay.dataset.lon } : null,
        mediaName: preview?.dataset.fileName || null,
        mediaData: preview?.dataset.fileData || null,
        timestamp: new Date().toISOString(),
        user: JSON.parse(localStorage.getItem('tagit_user') || 'null'),
      };

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const res = await fetch(BACKEND, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        const reports = JSON.parse(localStorage.getItem('tagit_reports') || '[]');
        const reportId = 'r_' + Date.now();
        const newReport = Object.assign({ id: reportId, status: 'Sent', authority: json.authority, serverMessage: json.message }, payload);
        reports.unshift(newReport);
        localStorage.setItem('tagit_reports', JSON.stringify(reports));
        showToast(json.message);

        if (['Violence', 'Fire', 'SOS', 'Health'].includes(tag)) {
          timerWrap.classList.remove('hidden');
          const duration = DEBUG_TIMER_SECONDS !== null ? DEBUG_TIMER_SECONDS : 6 * 60;
          let remaining = duration;
          timerDisplay.textContent = formatTime(remaining);
          if (currentTimer) clearInterval(currentTimer);
          currentTimer = setInterval(() => {
            remaining--;
            timerDisplay.textContent = formatTime(remaining);
            if (remaining <= 0) {
              clearInterval(currentTimer);
              const rs = JSON.parse(localStorage.getItem('tagit_reports') || '[]');
              const idx = rs.findIndex((r) => r.id === reportId);
              if (idx >= 0) {
                rs[idx].status = 'Backup Triggered';
                localStorage.setItem('tagit_reports', JSON.stringify(rs));
                showToast('Backup call placed to Police (simulated)');
              }
              timerWrap.classList.add('hidden');
            }
          }, 1000);
        }

        setTimeout(() => (location.href = '/dashboard.html'), 900);
      } catch (err) {
        console.error(err);
        alert('Failed to send report (demo).');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Report';
      }
    });

    function formatTime(s) {
      const mm = Math.floor(s / 60).toString().padStart(2, '0');
      const ss = Math.floor(s % 60).toString().padStart(2, '0');
      return `${mm}:${ss}`;
    }
  }

  // ===== Citizen Dashboard =====
  window.tagitDashboardInit = function () {
    const wrap = document.getElementById('reportsList');
    if (!wrap) return;
    const reports = JSON.parse(localStorage.getItem('tagit_reports') || '[]');
    if (reports.length === 0) {
      wrap.innerHTML = '<div class="p-6 bg-slate-800/40 rounded">No reports yet. Create one from the Tag pages.</div>';
      return;
    }

    wrap.innerHTML = '';
    reports.forEach((r) => {
      const el = document.createElement('div');
      el.className = 'p-4 rounded bg-slate-800/50 flex gap-4 items-start';
      el.innerHTML = `
        <div class="w-12 h-12 flex items-center justify-center rounded bg-slate-900">${iconForTag(r.tag)}</div>
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold">${r.tag} <span class="text-sm text-gray-400">· ${new Date(r.timestamp).toLocaleString()}</span></div>
              <div class="text-sm text-gray-300">${r.description || '—'}</div>
              <div class="text-xs text-gray-400 mt-1">
                Location: ${r.address ? r.address : (r.location ? 'Lat ' + r.location.lat + ', Lon ' + r.location.lon : '—')}
                · Pincode: ${r.pincode || '—'}
              </div>
            </div>
            <div class="text-right">
              <div class="inline-block px-3 py-1 rounded ${statusColor(r.status)}">${r.status}</div>
            </div>
          </div>
          <div class="mt-3">
            ${
              r.mediaData
                ? r.mediaData.startsWith('data:image')
                  ? `<img src="${r.mediaData}" class="rounded max-h-44">`
                  : `<video src="${r.mediaData}" controls class="rounded max-h-44"></video>`
                : ''
            }
          </div>
        </div>`;
      wrap.appendChild(el);
    });

    function iconForTag(tag) {
      const map = {
        Fire: '<i class="fas fa-fire"></i>',
        Violence: '<i class="fas fa-user-shield"></i>',
        SOS: '<i class="fas fa-bullhorn"></i>',
        Health: '<i class="fas fa-hospital"></i>',
        Animal: '<i class="fas fa-paw"></i>',
        Complaints: '<i class="fas fa-city"></i>',
      };
      return map[tag] || '<i class="fas fa-triangle-exclamation"></i>';
    }

    function statusColor(status) {
      const map = {
        Sent: 'bg-yellow-600 text-black',
        Accepted: 'bg-green-600 text-black',
        'Help Arriving': 'bg-green-500',
        'Backup Triggered': 'bg-red-600',
        Resolved: 'bg-slate-600',
      };
      return map[status] || 'bg-gray-600';
    }
  };

  // ===== Authority Dashboard =====
  window.tagitAuthorityDashboardInit = function () {
    const reports = JSON.parse(localStorage.getItem('tagit_reports') || '[]');
    const auth = JSON.parse(localStorage.getItem('tagit_authority') || '{}');
    const type = auth?.type || 'Police';

    let filtered = [];
    if (type === 'Police') filtered = reports;
    else if (type === 'Fire') filtered = reports.filter((r) => r.tag === 'Fire');
    else if (type === 'Health') filtered = reports.filter((r) => ['Health', 'Animal'].includes(r.tag));
    else if (type === 'Nagar Nigam' || type === 'Safety') filtered = reports.filter((r) => r.tag === 'Complaints');
    else filtered = reports;

    const overview = document.getElementById('overview');
    const reportsSection = document.getElementById('reportsSection');
    const reportsList = document.getElementById('reportsList');
    const selectedTagTitle = document.getElementById('selectedTagTitle');
    const backBtn = document.getElementById('backBtn');

    const grouped = {};
    filtered.forEach((r) => {
      const tag = r.tag || 'General';
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push(r);
    });

    overview.innerHTML = '';
    Object.keys(grouped).forEach((tag) => {
      const count = grouped[tag].length;
      const card = document.createElement('div');
      card.className =
        'bg-slate-800/60 p-6 rounded-xl shadow hover:scale-105 hover:shadow-lg transition cursor-pointer text-center';
      card.innerHTML = `<div class="text-saffron text-4xl mb-3"><i class="fa-solid fa-${tag.toLowerCase()}"></i></div>
        <h3 class="text-xl font-semibold">${tag}</h3>
        <p class="text-gray-400 mt-2 text-sm">${count} Report${count > 1 ? 's' : ''}</p>`;
      card.addEventListener('click', () => showReports(tag));
      overview.appendChild(card);
    });

    function showReports(tag) {
      selectedTagTitle.textContent = `${tag} Reports`;
      reportsList.innerHTML = '';
      (grouped[tag] || []).forEach((r) => {
        const item = document.createElement('div');
        item.className = 'p-5 rounded-lg bg-slate-800/70 border border-gray-700 hover:border-saffron/30 transition';
        const mediaHTML = r.mediaData
          ? r.mediaData.startsWith('data:image')
            ? `<img src="${r.mediaData}" class="rounded mt-3 max-h-56 border border-slate-700">`
            : `<video src="${r.mediaData}" controls class="rounded mt-3 max-h-56 border border-slate-700"></video>`
          : '';
        item.innerHTML = `
          <div class="flex justify-between items-start">
            <h4 class="text-lg font-semibold text-saffron">${r.tag}</h4>
            <div class="text-sm text-gray-400">${new Date(r.timestamp).toLocaleString()}</div>
          </div>
          <p class="mt-2 text-gray-300">${r.description || 'No description provided.'}</p>
          <p class="text-sm text-gray-400 mt-2"><i class="fa-solid fa-location-dot text-saffron mr-2"></i>${
            r.address ? r.address : (r.location ? 'Lat ' + r.location.lat + ', Lon ' + r.location.lon : '—')
          }</p>
          <p class="text-sm text-gray-400 mt-1"><i class="fa-solid fa-user text-saffron mr-2"></i>${
            r.user?.name || 'Anonymous User'
          }</p>
          ${mediaHTML}
          <div class="mt-3 text-sm text-gray-400"><strong>Status:</strong> ${r.status || 'Sent'}</div>`;
        reportsList.appendChild(item);
      });

      overview.classList.add('hidden');
      reportsSection.classList.remove('hidden');
      setTimeout(() => reportsSection.classList.add('opacity-100'), 50);
    }

    backBtn.addEventListener('click', () => {
      reportsSection.classList.remove('opacity-100');
      setTimeout(() => {
        reportsSection.classList.add('hidden');
        overview.classList.remove('hidden');
      }, 300);
    });
  };

  // ===== DOM Ready =====
  document.addEventListener('DOMContentLoaded', () => {
    initFileInput();
    initGeolocation();
    initReportForm();
  });
})();
