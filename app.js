/**
 * Simple Quick Attendance & Package Tracker
 * Logic & Business Rules Implementation
 */

// Initial Default Employees
const DEFAULT_EMPLOYEES = [
  { id: 'emp-1', name: 'Lala', active: true },
  { id: 'emp-2', name: 'Atun', active: true },
  { id: 'emp-3', name: 'Indah', active: true },
  { id: 'emp-4', name: 'Pia', active: true },
  { id: 'emp-5', name: 'Fitri', active: true },
  { id: 'emp-6', name: 'Ikmah', active: true },
  { id: 'emp-7', name: 'Fani', active: true },
  { id: 'emp-8', name: 'Candra', active: true },
  { id: 'emp-9', name: 'Atar', active: true },
  { id: 'emp-10', name: 'Imam', active: true }
];

// Shift Definitions
const SHIFTS = {
  NORMAL: {
    key: 'NORMAL',
    label: 'Normal',
    hours: '08.30 – 16.30',
    duration: 8,
    class: 'active-normal',
    color: '#10b981'
  },
  JAM10: {
    key: 'JAM10',
    label: 'Masuk Jam 10',
    hours: '10.00 – 16.30',
    duration: 6.5,
    class: 'active-jam10',
    color: '#0ea5e9'
  },
  SIANG: {
    key: 'SIANG',
    label: 'Masuk Siang',
    subLabel: 'Bada Dzuhur',
    hours: '13.00 – 16.30',
    duration: 3.5,
    class: 'active-siang',
    color: '#f59e0b'
  },
  HALF: {
    key: 'HALF',
    label: 'Setengah Hari',
    subLabel: '½ Hari',
    hours: '08.30 – 12.30',
    duration: 4,
    class: 'active-half',
    color: '#8b5cf6'
  },
  ABSEN: {
    key: 'ABSEN',
    label: 'Absen',
    hours: 'Tidak Masuk',
    duration: 0,
    class: 'active-absen',
    color: '#ef4444'
  }
};

// Common overtime presets (Reguler ends at 16:30)
const OVERTIME_PRESETS = [
  { time: '17:30', label: '17.30 (+1j)', hours: 1.0 },
  { time: '18:00', label: '18.00 (+1.5j)', hours: 1.5 },
  { time: '18:30', label: '18.30 (+2j)', hours: 2.0 },
  { time: '19:00', label: '19.00 (+2.5j)', hours: 2.5 },
  { time: '19:30', label: '19.30 (+3j)', hours: 3.0 }
];

// Indonesian Day & Month Names
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// App State
class AppState {
  constructor() {
    this.employees = this.loadEmployees();
    this.attendanceData = this.loadAttendance();
    this.dailyPackages = this.loadDailyPackages();
    this.currentDate = this.getTodayDateString();
    this.theme = localStorage.getItem('quick_tracker_theme') || 'dark';
    this.recapRange = 'today';
    this.recapStartDate = this.currentDate;
    this.recapEndDate = this.currentDate;
  }

  getTodayDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  loadEmployees() {
    try {
      const data = localStorage.getItem('quick_tracker_employees');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading employees:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
  }

  saveEmployees() {
    localStorage.setItem('quick_tracker_employees', JSON.stringify(this.employees));
  }

  loadAttendance() {
    try {
      const data = localStorage.getItem('quick_tracker_attendance');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading attendance:', e);
    }
    return {};
  }

  saveAttendance() {
    localStorage.setItem('quick_tracker_attendance', JSON.stringify(this.attendanceData));
  }

  loadDailyPackages() {
    try {
      const data = localStorage.getItem('quick_tracker_daily_packages');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading daily packages:', e);
    }
    return {};
  }

  saveDailyPackages() {
    localStorage.setItem('quick_tracker_daily_packages', JSON.stringify(this.dailyPackages));
  }

  getDailyPackageCount(dateStr) {
    return parseInt(this.dailyPackages[dateStr]) || 0;
  }

  setDailyPackageCount(dateStr, count) {
    this.dailyPackages[dateStr] = Math.max(0, count);
    this.saveDailyPackages();
  }

  // Get or initialize record for a specific date
  getDayRecord(dateStr) {
    if (!this.attendanceData[dateStr]) {
      const isSun = this.isSunday(dateStr);
      const record = {};
      this.employees.forEach(emp => {
        record[emp.id] = {
          shift: isSun ? 'LIBUR' : 'NORMAL', // Sunday default Libur/Off
          absenReason: '', // 'Sakit', 'Izin', 'Alpa'
          overtime: false,
          overtimeEnd: '18:30',
          overtimeHours: 2.0,
          packages: 0,
          note: ''
        };
      });
      this.attendanceData[dateStr] = record;
      this.saveAttendance();
    } else {
      // Ensure all employees exist in record
      let updated = false;
      this.employees.forEach(emp => {
        if (!this.attendanceData[dateStr][emp.id]) {
          const isSun = this.isSunday(dateStr);
          this.attendanceData[dateStr][emp.id] = {
            shift: isSun ? 'LIBUR' : 'NORMAL',
            absenReason: '',
            overtime: false,
            overtimeEnd: '18:30',
            overtimeHours: 2.0,
            packages: 0,
            note: ''
          };
          updated = true;
        }
      });
      if (updated) this.saveAttendance();
    }
    return this.attendanceData[dateStr];
  }

  isSunday(dateStr) {
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.getDay() === 0;
  }
}

// Instantiate state
const state = new AppState();

/* ==========================================================================
   Helper Functions (Date & Overtime Calculations)
   ========================================================================== */

/**
 * Format date string (YYYY-MM-DD) to Indonesian formatted title
 * E.g. "Sabtu, 24 Oktober 2026"
 */
function formatIndonesianDate(dateStr) {
  const parts = dateStr.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const dayName = DAYS_ID[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTHS_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Calculate Overtime duration: Jam Selesai Lembur - 16.30 = Total Durasi Lembur (Jam)
 * E.g. 18:30 - 16:30 = 2.0 jam
 * E.g. 19:00 - 16:30 = 2.5 jam
 * E.g. 20:30 - 16:30 = 4.0 jam
 */
function calculateOvertimeDuration(endTimeStr) {
  if (!endTimeStr) return 0;
  const parts = endTimeStr.split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;

  // Regular end time = 16:30 (16.5 hours in decimal)
  const regularEndMinutes = 16 * 60 + 30; // 990 minutes
  const endMinutes = h * 60 + m;

  if (endMinutes <= regularEndMinutes) {
    return 0;
  }

  const diffMinutes = endMinutes - regularEndMinutes;
  const diffHours = diffMinutes / 60;
  // Round to 1 decimal place
  return Math.round(diffHours * 10) / 10;
}

/**
 * Add or subtract days from a YYYY-MM-DD date string
 */
function offsetDateString(dateStr, offsetDays) {
  const parts = dateStr.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' 
        ? '<polyline points="20 6 9 17 4 12"></polyline>' 
        : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

/* ==========================================================================
   DOM & UI Rendering
   ========================================================================== */

function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const darkIcon = document.querySelector('.theme-icon-dark');
  const lightIcon = document.querySelector('.theme-icon-light');
  if (state.theme === 'light') {
    darkIcon.style.display = 'none';
    lightIcon.style.display = 'inline-block';
  } else {
    darkIcon.style.display = 'inline-block';
    lightIcon.style.display = 'none';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('quick_tracker_theme', state.theme);
  initTheme();
}

/**
 * Render Day Status Banner
 */
function renderDayBanner() {
  const isSun = state.isSunday(state.currentDate);
  const formatted = formatIndonesianDate(state.currentDate);

  document.getElementById('current-date-text').textContent = formatted;
  document.getElementById('date-input-picker').value = state.currentDate;
  document.getElementById('day-title-text').textContent = formatted;

  const badgeType = document.getElementById('day-badge-type');
  const subtitle = document.getElementById('day-subtitle-text');

  if (isSun) {
    badgeType.textContent = 'HARI MINGGU (LIBUR / OFF)';
    badgeType.className = 'day-pill pill-sunday';
    subtitle.textContent = 'Hari Minggu otomatis diset libur. Dapat diatur masuk jika ada operasional khusus/lembur.';
  } else {
    badgeType.textContent = 'HARI KERJA (SENIN - SABTU)';
    badgeType.className = 'day-pill';
    subtitle.textContent = '6 Hari Kerja. Jam Operasional Reguler: 08.30 – 16.30.';
  }
}

/**
 * Render Daily Attendance List for Current Date
 */
function renderDailyAttendance() {
  renderDayBanner();

  // Load nilai paket admin hari ini ke input
  const adminPkgInput = document.getElementById('admin-pkg-input');
  if (adminPkgInput) {
    adminPkgInput.value = state.getDailyPackageCount(state.currentDate);
  }
  const container = document.getElementById('attendance-list-container');
  const dayRecord = state.getDayRecord(state.currentDate);
  const isSun = state.isSunday(state.currentDate);

  const activeEmployees = state.employees.filter(e => e.active !== false);
  document.getElementById('badge-total-employees').textContent = activeEmployees.length;

  const searchTerm = (document.getElementById('filter-employee-search').value || '').trim().toLowerCase();

  let html = '';

  activeEmployees.forEach((emp, index) => {
    if (searchTerm && !emp.name.toLowerCase().includes(searchTerm)) {
      return;
    }

    const data = dayRecord[emp.id] || {
      shift: isSun ? 'LIBUR' : 'NORMAL',
      absenReason: '',
      overtime: false,
      overtimeEnd: '18:30',
      overtimeHours: 2.0,
      packages: 0
    };

    const isLembur = !!data.overtime;
    const currentShift = data.shift || (isSun ? 'LIBUR' : 'NORMAL');
    const isAbsen = currentShift === 'ABSEN';
    const isLibur = currentShift === 'LIBUR';

    // Generate shift buttons
    let shiftButtonsHtml = `
      <button type="button" class="pill-option ${currentShift === 'NORMAL' ? 'active-normal' : ''}" 
        onclick="setEmployeeShift('${emp.id}', 'NORMAL')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Normal (08.30-16.30)
      </button>

      <button type="button" class="pill-option ${currentShift === 'JAM10' ? 'active-jam10' : ''}" 
        onclick="setEmployeeShift('${emp.id}', 'JAM10')">
        Jam 10 (10.00-16.30)
      </button>

      <button type="button" class="pill-option ${currentShift === 'SIANG' ? 'active-siang' : ''}" 
        onclick="setEmployeeShift('${emp.id}', 'SIANG')">
        Masuk Siang (13.00-16.30)
      </button>

      <button type="button" class="pill-option ${currentShift === 'HALF' ? 'active-half' : ''}" 
        onclick="setEmployeeShift('${emp.id}', 'HALF')">
        ½ Hari (08.30-12.30)
      </button>

      <button type="button" class="pill-option ${isAbsen ? 'active-absen' : ''}" 
        onclick="setEmployeeShift('${emp.id}', 'ABSEN')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        Absen
      </button>
    `;

    if (isSun) {
      shiftButtonsHtml = `
        <button type="button" class="pill-option ${isLibur ? 'active-absen' : ''}" 
          onclick="setEmployeeShift('${emp.id}', 'LIBUR')">
          🏖️ Libur Minggu
        </button>
      ` + shiftButtonsHtml;
    }

    // Absen reason pills
    let reasonPickerHtml = '';
    if (isAbsen) {
      const reason = data.absenReason || 'Izin';
      reasonPickerHtml = `
        <div class="absen-reason-picker">
          <button type="button" class="reason-btn ${reason === 'Izin' ? 'active' : ''}" onclick="setAbsenReason('${emp.id}', 'Izin')">Izin</button>
          <button type="button" class="reason-btn ${reason === 'Sakit' ? 'active' : ''}" onclick="setAbsenReason('${emp.id}', 'Sakit')">Sakit</button>
          <button type="button" class="reason-btn ${reason === 'Alpa' ? 'active' : ''}" onclick="setAbsenReason('${emp.id}', 'Alpa')">Alpa</button>
        </div>
      `;
    }

    // Overtime Presets buttons
    const curEnd = data.overtimeEnd || '18:30';
    const curHours = calculateOvertimeDuration(curEnd);

    const otPresetsHtml = OVERTIME_PRESETS.map(p => `
      <button type="button" class="ot-pill-btn ${p.time === curEnd ? 'active' : ''}"
        onclick="setEmployeeOvertimeTime('${emp.id}', '${p.time}')">
        ${p.label}
      </button>
    `).join('');

    html += `
      <div class="emp-row" id="row-${emp.id}">
        <!-- Col 1: Identity -->
        <div class="emp-identity">
          <div class="emp-avatar">${emp.name.charAt(0).toUpperCase()}</div>
          <div class="emp-details">
            <div class="emp-name">${escapeHtml(emp.name)}</div>
            <div class="emp-subtext">${getShiftDurationLabel(currentShift, data.absenReason)}</div>
          </div>
        </div>

        <!-- Col 2: Quick Shift Buttons -->
        <div class="shift-pills-group">
          ${shiftButtonsHtml}
          ${reasonPickerHtml}
        </div>

        <!-- Col 3: Overtime Calculation -->
        <div class="overtime-cell">
          <div class="ot-toggle-row">
            <label class="toggle-switch">
              <input type="checkbox" id="ot-toggle-${emp.id}" ${isLembur ? 'checked' : ''} 
                onchange="toggleEmployeeOvertime('${emp.id}', this.checked)">
              <span class="toggle-slider"></span>
            </label>
            <label for="ot-toggle-${emp.id}" class="ot-label">Lembur</label>
            ${isLembur ? `
              <span class="ot-result-pill">
                ${curEnd} = +${curHours} Jam
              </span>
            ` : ''}
          </div>

          ${isLembur ? `
            <div class="ot-presets-wrap">
              ${otPresetsHtml}
              <input type="time" class="ot-custom-time" value="${curEnd}" 
                title="Pilih Jam Selesai Kustom" 
                onchange="setEmployeeOvertimeTime('${emp.id}', this.value)">
            </div>
          ` : ''}
        </div>


      </div>
    `;
  });

  if (activeEmployees.length === 0) {
    html = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Belum ada karyawan aktif. Buka tab <strong>Daftar Karyawan</strong> untuk menambahkan.</div>`;
  }

  container.innerHTML = html;
  updateQuickMetrics();
}

/**
 * Return friendly text for current shift badge
 */
function getShiftDurationLabel(shiftKey, reason) {
  if (shiftKey === 'NORMAL') return '08.30 – 16.30 (8 Jam)';
  if (shiftKey === 'JAM10') return '10.00 – 16.30 (6.5 Jam)';
  if (shiftKey === 'SIANG') return '13.00 – 16.30 (3.5 Jam)';
  if (shiftKey === 'HALF') return '08.30 – 12.30 (4 Jam)';
  if (shiftKey === 'LIBUR') return 'Hari Libur (Off)';
  if (shiftKey === 'ABSEN') return `Tidak Masuk (${reason || 'Izin'})`;
  return shiftKey;
}

/**
 * Update the Top 4 Metric Cards in Real-time
 */
function updateQuickMetrics() {
  const dayRecord = state.getDayRecord(state.currentDate);
  const activeEmployees = state.employees.filter(e => e.active !== false);
  const totalEmployees = activeEmployees.length;

  let hadirCount = 0;
  let totalOtHours = 0;
  let otPersonCount = 0;
  let absenCount = 0;

  activeEmployees.forEach(emp => {
    const data = dayRecord[emp.id];
    if (!data) return;

    if (['NORMAL', 'JAM10', 'SIANG', 'HALF'].includes(data.shift)) {
      hadirCount++;
    } else if (data.shift === 'ABSEN') {
      absenCount++;
    }

    if (data.overtime) {
      const otHours = calculateOvertimeDuration(data.overtimeEnd);
      totalOtHours += otHours;
      if (otHours > 0) otPersonCount++;
    }
  });

  document.getElementById('stat-total-hadir').textContent = hadirCount;
  document.getElementById('stat-ratio-hadir').textContent = `/ ${totalEmployees} Karyawan`;

  document.getElementById('stat-total-lembur').textContent = totalOtHours.toFixed(1).replace('.0', '');
  document.getElementById('stat-count-lembur').textContent = `Jam (${otPersonCount} orang)`;

  document.getElementById('stat-total-absen').textContent = absenCount;

  // Update kartu paket admin
  updateAdminPaketDisplay();

  // Flash indicator to show saved
  const ind = document.getElementById('save-indicator');
  ind.style.opacity = '1';
}

/* ==========================================================================
   User Interaction Actions
   ========================================================================== */

window.setEmployeeShift = function(empId, shiftKey) {
  const dayRecord = state.getDayRecord(state.currentDate);
  if (!dayRecord[empId]) return;

  dayRecord[empId].shift = shiftKey;
  if (shiftKey === 'ABSEN' && !dayRecord[empId].absenReason) {
    dayRecord[empId].absenReason = 'Izin';
  }

  // If set to absen, automatically disable overtime
  if (shiftKey === 'ABSEN' || shiftKey === 'LIBUR') {
    dayRecord[empId].overtime = false;
  }

  state.saveAttendance();
  renderDailyAttendance();
};

window.setAbsenReason = function(empId, reason) {
  const dayRecord = state.getDayRecord(state.currentDate);
  if (!dayRecord[empId]) return;
  dayRecord[empId].absenReason = reason;
  state.saveAttendance();
  renderDailyAttendance();
};

window.toggleEmployeeOvertime = function(empId, isChecked) {
  const dayRecord = state.getDayRecord(state.currentDate);
  if (!dayRecord[empId]) return;

  dayRecord[empId].overtime = isChecked;
  if (isChecked) {
    if (!dayRecord[empId].overtimeEnd) {
      dayRecord[empId].overtimeEnd = '18:30';
    }
    dayRecord[empId].overtimeHours = calculateOvertimeDuration(dayRecord[empId].overtimeEnd);

    // If employee was Absen, flip them to Normal since they're working overtime
    if (dayRecord[empId].shift === 'ABSEN' || dayRecord[empId].shift === 'LIBUR') {
      dayRecord[empId].shift = 'NORMAL';
    }
  }

  state.saveAttendance();
  renderDailyAttendance();
};

window.setEmployeeOvertimeTime = function(empId, timeStr) {
  const dayRecord = state.getDayRecord(state.currentDate);
  if (!dayRecord[empId]) return;

  dayRecord[empId].overtime = true;
  dayRecord[empId].overtimeEnd = timeStr;
  dayRecord[empId].overtimeHours = calculateOvertimeDuration(timeStr);

  state.saveAttendance();
  renderDailyAttendance();
};

window.adjustPackage = function(empId, delta) {
  const dayRecord = state.getDayRecord(state.currentDate);
  if (!dayRecord[empId]) return;

  const current = parseInt(dayRecord[empId].packages) || 0;
  const updated = Math.max(0, current + delta);
  dayRecord[empId].packages = updated;

  state.saveAttendance();
  const inputEl = document.getElementById(`pkg-input-${empId}`);
  if (inputEl) inputEl.value = updated;
  updateQuickMetrics();
  renderDailyAttendance();
};

window.setPackageCount = function(empId, val) {
  const dayRecord = state.getDayRecord(state.currentDate);
  if (!dayRecord[empId]) return;

  const count = Math.max(0, parseInt(val) || 0);
  dayRecord[empId].packages = count;

  state.saveAttendance();
  updateQuickMetrics();
  renderDailyAttendance();
};

/**
 * Admin Daily Package Controls
 * Fungsi ini dipanggil dari kartu "Paket Terkirim Hari Ini" di tab Absensi
 */
window.adjustDailyPackage = function(delta) {
  const current = state.getDailyPackageCount(state.currentDate);
  const updated = Math.max(0, current + delta);
  state.setDailyPackageCount(state.currentDate, updated);

  const inputEl = document.getElementById('admin-pkg-input');
  if (inputEl) inputEl.value = updated;
  updateAdminPaketDisplay();
};

window.setDailyPackageCount = function(val) {
  const count = Math.max(0, parseInt(val) || 0);
  state.setDailyPackageCount(state.currentDate, count);

  const inputEl = document.getElementById('admin-pkg-input');
  if (inputEl) inputEl.value = count;
  updateAdminPaketDisplay();
};

/**
 * Update tampilan kartu paket admin (sub-teks total)
 */
function updateAdminPaketDisplay() {
  const count = state.getDailyPackageCount(state.currentDate);
  const subEl = document.getElementById('stat-paket-sub');
  if (subEl) {
    subEl.textContent = count > 0
      ? `${count.toLocaleString('id-ID')} paket tercatat hari ini`
      : 'Hitung paket ekspedisi toko hari ini';
  }
  // Update hidden elements yang dipakai updateQuickMetrics
  const totalEl = document.getElementById('stat-total-paket');
  if (totalEl) totalEl.textContent = count;
}

/**
 * 1-Click Action: Set Semua Hadir Normal
 */
function setAllHadirNormal() {
  const dayRecord = state.getDayRecord(state.currentDate);
  const activeEmployees = state.employees.filter(e => e.active !== false);

  activeEmployees.forEach(emp => {
    if (!dayRecord[emp.id]) {
      dayRecord[emp.id] = {};
    }
    dayRecord[emp.id].shift = 'NORMAL';
    dayRecord[emp.id].absenReason = '';
  });

  state.saveAttendance();
  renderDailyAttendance();
  showToast(`Semua (${activeEmployees.length}) karyawan diset Hadir Normal (08.30 – 16.30)!`, 'success');
}

/**
 * WhatsApp Formatted Summary Copy
 */
function copyWhatsAppSummary() {
  const formattedDate = formatIndonesianDate(state.currentDate);
  const dayRecord = state.getDayRecord(state.currentDate);
  const activeEmployees = state.employees.filter(e => e.active !== false);

  let hadirList = [];
  let lemburList = [];
  let absenList = [];
  let totalPaket = 0;
  let totalJamLembur = 0;

  activeEmployees.forEach(emp => {
    const data = dayRecord[emp.id] || {};
    const shift = data.shift || 'NORMAL';
    const pkg = parseInt(data.packages) || 0;
    totalPaket += pkg;

    if (['NORMAL', 'JAM10', 'SIANG', 'HALF'].includes(shift)) {
      const shiftName = SHIFTS[shift] ? SHIFTS[shift].label : shift;
      let text = `• *${emp.name}*: ${shiftName} (${pkg} paket)`;
      if (data.overtime) {
        const otHours = calculateOvertimeDuration(data.overtimeEnd);
        totalJamLembur += otHours;
        text += ` | *Lembur s/d ${data.overtimeEnd} (+${otHours}j)*`;
        lemburList.push(`• *${emp.name}*: s/d ${data.overtimeEnd} (+${otHours} Jam)`);
      }
      hadirList.push(text);
    } else if (shift === 'ABSEN') {
      absenList.push(`• *${emp.name}*: ${data.absenReason || 'Izin'}`);
    } else if (shift === 'LIBUR') {
      absenList.push(`• *${emp.name}*: Libur Minggu`);
    }
  });

  let message = `📋 *LAPORAN ABSENSI & PAKET TOKO*\n`;
  message += `📅 *Hari / Tanggal:* ${formattedDate}\n\n`;

  message += `📊 *RINGKASAN:*\n`;
  message += `✅ Hadir: ${hadirList.length} orang\n`;
  message += `📦 Total Paket: ${totalPaket} paket\n`;
  message += `⏱️ Lembur: ${lemburList.length} orang (${totalJamLembur} Jam)\n`;
  message += `❌ Tidak Masuk: ${absenList.length} orang\n\n`;

  message += `👥 *DETAIL KEHADIRAN & PAKET:*\n`;
  if (hadirList.length > 0) {
    message += hadirList.join('\n') + '\n\n';
  } else {
    message += `(Tidak ada karyawan hadir)\n\n`;
  }

  if (lemburList.length > 0) {
    message += `🔥 *KARYAWAN LEMBUR:*\n`;
    message += lemburList.join('\n') + '\n\n';
  }

  if (absenList.length > 0) {
    message += `⚠️ *TIDAK MASUK / OFF:*\n`;
    message += absenList.join('\n') + '\n\n';
  }

  message += `_Dicatat otomatis via Quick Attendance & Package Tracker_`;

  navigator.clipboard.writeText(message).then(() => {
    showToast('Format WhatsApp berhasil disalin ke Clipboard!', 'success');
  }).catch(() => {
    // Fallback prompt
    prompt('Salin teks laporan WhatsApp:', message);
  });
}

/* ==========================================================================
   Tab 2: Recap & Report Generation
   ========================================================================== */

function getDatesInRange(startStr, endStr) {
  const dates = [];
  let current = new Date(startStr);
  const end = new Date(endStr);

  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function calculateRecapPeriodDates() {
  const today = state.getTodayDateString();
  const d = new Date(today);

  if (state.recapRange === 'today') {
    state.recapStartDate = today;
    state.recapEndDate = today;
    document.getElementById('recap-period-label').textContent = `Menampilkan Rekap: Hari Ini (${formatIndonesianDate(today)})`;
  } else if (state.recapRange === 'this-week') {
    // Monday of this week to Saturday
    const currentDay = d.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(d);
    monday.setDate(d.getDate() + distanceToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const formatYMD = date => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    state.recapStartDate = formatYMD(monday);
    state.recapEndDate = formatYMD(saturday);
    document.getElementById('recap-period-label').textContent = 
      `Menampilkan Rekap: Minggu Ini (Senin ${formatYMD(monday)} s/d Sabtu ${formatYMD(saturday)})`;
  } else if (state.recapRange === 'this-month') {
    const y = d.getFullYear();
    const m = d.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    const formatYMD = date => {
      const yr = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const dy = String(date.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${dy}`;
    };

    state.recapStartDate = formatYMD(firstDay);
    state.recapEndDate = formatYMD(lastDay);
    document.getElementById('recap-period-label').textContent = 
      `Menampilkan Rekap: Bulan Ini (${MONTHS_ID[m]} ${y})`;
  } else if (state.recapRange === 'custom') {
    document.getElementById('recap-period-label').textContent = 
      `Menampilkan Rekap: ${state.recapStartDate} s/d ${state.recapEndDate}`;
  }
}

function renderRecap() {
  calculateRecapPeriodDates();
  const dateList = getDatesInRange(state.recapStartDate, state.recapEndDate);
  const activeEmployees = state.employees.filter(e => e.active !== false);

  // Aggregation per employee
  const empStats = {};
  activeEmployees.forEach(e => {
    empStats[e.id] = {
      name: e.name,
      normal: 0,
      jam10: 0,
      siang: 0,
      half: 0,
      lemburHours: 0,
      packages: 0,
      sakit: 0,
      izin: 0,
      alpa: 0,
      totalHadir: 0
    };
  });

  // Daily log entries for detailed view
  const logEntries = [];

  dateList.forEach(dateStr => {
    const dayData = state.attendanceData[dateStr];
    if (!dayData) return;

    const parts = dateStr.split('-');
    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = DAYS_ID[dt.getDay()];

    activeEmployees.forEach(emp => {
      const row = dayData[emp.id];
      if (!row) return;

      const st = empStats[emp.id];
      if (!st) return;

      const shift = row.shift;
      const isLembur = !!row.overtime;
      const otHours = isLembur ? calculateOvertimeDuration(row.overtimeEnd) : 0;
      const pkg = parseInt(row.packages) || 0;

      st.packages += pkg;
      st.lemburHours += otHours;

      let shiftLabel = '-';
      let hoursRange = '-';

      if (shift === 'NORMAL') {
        st.normal++;
        st.totalHadir++;
        shiftLabel = 'Normal (8 Jam)';
        hoursRange = '08.30 – 16.30';
      } else if (shift === 'JAM10') {
        st.jam10++;
        st.totalHadir++;
        shiftLabel = 'Masuk Jam 10 (6.5 Jam)';
        hoursRange = '10.00 – 16.30';
      } else if (shift === 'SIANG') {
        st.siang++;
        st.totalHadir++;
        shiftLabel = 'Masuk Siang (3.5 Jam)';
        hoursRange = '13.00 – 16.30';
      } else if (shift === 'HALF') {
        st.half++;
        st.totalHadir++;
        shiftLabel = 'Setengah Hari (4 Jam)';
        hoursRange = '08.30 – 12.30';
      } else if (shift === 'ABSEN') {
        const reason = row.absenReason || 'Izin';
        if (reason === 'Sakit') st.sakit++;
        else if (reason === 'Izin') st.izin++;
        else st.alpa++;
        shiftLabel = `Absen (${reason})`;
        hoursRange = 'Tidak Masuk';
      } else if (shift === 'LIBUR') {
        shiftLabel = 'Libur Minggu';
        hoursRange = 'Off';
      }

      logEntries.push({
        date: dateStr,
        dayName: dayName,
        name: emp.name,
        shiftLabel: shiftLabel,
        hoursRange: hoursRange,
        overtimeEnd: isLembur ? row.overtimeEnd : '-',
        otHours: otHours,
        packages: pkg,
        note: row.absenReason || '-'
      });
    });
  });

  // Calculate Overall Totals
  let grandTotalHadir = 0;
  let grandTotalLembur = 0;
  let grandTotalPaket = 0;
  let topPerformer = '-';
  let topPerformerCount = 0;

  let tbodyHtml = '';
  let index = 1;

  Object.values(empStats).forEach(st => {
    grandTotalHadir += st.totalHadir;
    grandTotalLembur += st.lemburHours;
    grandTotalPaket += st.packages;

    if (st.packages > topPerformerCount) {
      topPerformerCount = st.packages;
      topPerformer = st.name;
    }

    tbodyHtml += `
      <tr>
        <td>${index++}</td>
        <td><strong>${escapeHtml(st.name)}</strong></td>
        <td><span class="legend-dot dot-normal"></span> ${st.normal}</td>
        <td><span class="legend-dot dot-jam10"></span> ${st.jam10}</td>
        <td><span class="legend-dot dot-siang"></span> ${st.siang}</td>
        <td><span class="legend-dot dot-half"></span> ${st.half}</td>
        <td><strong class="text-purple">${st.lemburHours.toFixed(1).replace('.0', '')} Jam</strong></td>
        <td><strong class="text-blue">${st.packages.toLocaleString('id-ID')}</strong></td>
        <td>${st.sakit}</td>
        <td>${st.izin}</td>
        <td>${st.alpa}</td>
      </tr>
    `;
  });

  document.getElementById('tbody-recap-summary').innerHTML = tbodyHtml;

  // Footer Totals
  document.getElementById('tfoot-recap-summary').innerHTML = `
    <tr>
      <td colspan="2">TOTAL KESELURUHAN</td>
      <td colspan="4"><strong>${grandTotalHadir} Kehadiran</strong></td>
      <td><strong class="text-purple">${grandTotalLembur.toFixed(1).replace('.0', '')} Jam</strong></td>
      <td><strong class="text-blue">${grandTotalPaket.toLocaleString('id-ID')} Paket</strong></td>
      <td colspan="3"></td>
    </tr>
  `;

  // Mini summary cards
  // Hitung total paket admin untuk periode ini
  let grandTotalAdminPaket = 0;
  dateList.forEach(dateStr => {
    grandTotalAdminPaket += state.getDailyPackageCount(dateStr);
  });
  const dayCount = dateList.length;
  const avgPaketPerDay = dayCount > 0 ? (grandTotalAdminPaket / dayCount).toFixed(1).replace('.0', '') : '0';

  document.getElementById('recap-sum-hadir').textContent = grandTotalHadir;
  document.getElementById('recap-sum-lembur').textContent = `${grandTotalLembur.toFixed(1).replace('.0', '')} Jam`;
  document.getElementById('recap-sum-paket').textContent = grandTotalAdminPaket.toLocaleString('id-ID');
  document.getElementById('recap-sum-avg-paket').textContent = avgPaketPerDay;
  document.getElementById('recap-sum-paket-sub').textContent = `Paket / Hari (${dayCount} hari)`;

  // Render Tabel Rekapitulasi Paket Toko Harian (Admin)
  let dailyPkgHtml = '';
  let totalPaketAdmin = 0;
  dateList.forEach(dateStr => {
    const parts = dateStr.split('-');
    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = DAYS_ID[dt.getDay()];
    const pkgCount = state.getDailyPackageCount(dateStr);
    totalPaketAdmin += pkgCount;
    const isSun = dt.getDay() === 0;
    const statusBadge = pkgCount > 0
      ? `<span style="color:#10b981;font-weight:700;">✓ Tercatat</span>`
      : (isSun ? `<span style="color:var(--text-muted);">Libur Minggu</span>` : `<span style="color:var(--text-muted);">Belum dicatat</span>`);
    dailyPkgHtml += `
      <tr>
        <td>${dateStr}</td>
        <td>${dayName}</td>
        <td><strong class="text-blue">${pkgCount.toLocaleString('id-ID')}</strong></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });
  if (dateList.length === 0) {
    dailyPkgHtml = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">Tidak ada data pada periode ini.</td></tr>`;
  }
  // Tambahkan baris total
  dailyPkgHtml += `
    <tr style="font-weight:700; background: var(--bg-secondary);">
      <td colspan="2">TOTAL</td>
      <td class="text-blue">${totalPaketAdmin.toLocaleString('id-ID')} Paket</td>
      <td></td>
    </tr>
  `;
  document.getElementById('tbody-recap-daily-packages').innerHTML = dailyPkgHtml;

  // Render Log Detail
  let logHtml = '';
  logEntries.forEach(log => {
    logHtml += `
      <tr>
        <td>${log.date}</td>
        <td>${log.dayName}</td>
        <td><strong>${escapeHtml(log.name)}</strong></td>
        <td>${log.shiftLabel}</td>
        <td>${log.hoursRange}</td>
        <td>${log.overtimeEnd}</td>
        <td>${log.otHours > 0 ? `<strong>+${log.otHours} Jam</strong>` : '-'}</td>
        <td>${log.note}</td>
      </tr>
    `;
  });

  if (logEntries.length === 0) {
    logHtml = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">Belum ada catatan presensi pada rentang tanggal ini.</td></tr>`;
  }
  document.getElementById('tbody-recap-logs').innerHTML = logHtml;
}

/**
 * Export Recap to CSV File
 */
function exportRecapToCSV() {
  const dateList = getDatesInRange(state.recapStartDate, state.recapEndDate);
  const activeEmployees = state.employees.filter(e => e.active !== false);

  let csv = 'Tanggal,Hari,Nama Karyawan,Shift,Jam Masuk-Keluar,Status Lembur,Jam Pulang Lembur,Durasi Lembur (Jam),Jumlah Paket Terkirim,Keterangan\n';

  dateList.forEach(dateStr => {
    const dayData = state.attendanceData[dateStr];
    if (!dayData) return;

    const parts = dateStr.split('-');
    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = DAYS_ID[dt.getDay()];

    activeEmployees.forEach(emp => {
      const row = dayData[emp.id];
      if (!row) return;

      const isLembur = !!row.overtime;
      const otHours = isLembur ? calculateOvertimeDuration(row.overtimeEnd) : 0;
      const shift = row.shift || 'NORMAL';
      let hoursRange = '-';

      if (shift === 'NORMAL') hoursRange = '08.30 - 16.30';
      else if (shift === 'JAM10') hoursRange = '10.00 - 16.30';
      else if (shift === 'SIANG') hoursRange = '13.00 - 16.30';
      else if (shift === 'HALF') hoursRange = '08.30 - 12.30';
      else if (shift === 'ABSEN') hoursRange = 'Tidak Masuk';
      else if (shift === 'LIBUR') hoursRange = 'Libur Minggu';

      const line = [
        `"${dateStr}"`,
        `"${dayName}"`,
        `"${emp.name.replace(/"/g, '""')}"`,
        `"${shift}"`,
        `"${hoursRange}"`,
        `"${isLembur ? 'Ya' : 'Tidak'}"`,
        `"${isLembur ? row.overtimeEnd : '-'}"`,
        `"${otHours}"`,
        `"${row.packages || 0}"`,
        `"${(row.absenReason || row.note || '-').replace(/"/g, '""')}"`
      ];
      csv += line.join(',') + '\n';
    });
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Absensi_Paket_${state.recapStartDate}_sd_${state.recapEndDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('File CSV berhasil diunduh!', 'success');
}

/* ==========================================================================
   Tab 3: Employee Management
   ========================================================================== */

function renderEmployeeManagement() {
  const container = document.getElementById('employee-grid-container');
  let html = '';

  state.employees.forEach((emp, idx) => {
    html += `
      <div class="emp-card" id="emp-card-${emp.id}">
        <div class="emp-card-left">
          <div class="emp-card-num">#${idx + 1}</div>
          <div class="emp-avatar">${emp.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 700; font-size: 1rem;">${escapeHtml(emp.name)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${emp.active !== false ? 'Aktif' : 'Non-aktif'}</div>
          </div>
        </div>
        <div class="emp-card-actions">
          <button type="button" class="btn-card-action" title="Edit Nama" onclick="openEditEmployeeModal('${emp.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button type="button" class="btn-card-action btn-del" title="Hapus Karyawan" onclick="confirmDeleteEmployee('${emp.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.openEditEmployeeModal = function(empId) {
  const emp = state.employees.find(e => e.id === empId);
  if (!emp) return;

  document.getElementById('modal-employee-title').textContent = 'Edit Nama Karyawan';
  document.getElementById('input-employee-id').value = emp.id;
  document.getElementById('input-employee-name').value = emp.name;
  document.getElementById('modal-employee').classList.add('active');
  document.getElementById('input-employee-name').focus();
};

window.confirmDeleteEmployee = function(empId) {
  const emp = state.employees.find(e => e.id === empId);
  if (!emp) return;

  openConfirmModal(`Hapus karyawan "${emp.name}" dari sistem? Data presensi sebelumnya tetap tersimpan.`, () => {
    state.employees = state.employees.filter(e => e.id !== empId);
    state.saveEmployees();
    renderEmployeeManagement();
    renderDailyAttendance();
    showToast(`Karyawan "${emp.name}" telah dihapus`, 'info');
  });
};

/* ==========================================================================
   Modals & Dialogs
   ========================================================================== */

let confirmCallback = null;

function openConfirmModal(message, callback) {
  document.getElementById('confirm-modal-message').textContent = message;
  confirmCallback = callback;
  document.getElementById('modal-confirm').classList.add('active');
}

function closeConfirmModal() {
  document.getElementById('modal-confirm').classList.remove('active');
  confirmCallback = null;
}

/* ==========================================================================
   Backup & Restore Functions
   ========================================================================== */

function backupJsonData() {
  const fullData = {
    appName: 'Simple Quick Attendance & Package Tracker',
    version: '1.0',
    exportDate: new Date().toISOString(),
    employees: state.employees,
    attendance: state.attendanceData
  };

  const jsonStr = JSON.stringify(fullData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Attendance_Tracker_${state.getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('File cadangan JSON berhasil diunduh!', 'success');
}

function restoreJsonData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.employees && Array.isArray(data.employees)) {
        state.employees = data.employees;
        state.saveEmployees();
      }
      if (data.attendance && typeof data.attendance === 'object') {
        state.attendanceData = data.attendance;
        state.saveAttendance();
      }
      renderDailyAttendance();
      renderEmployeeManagement();
      renderRecap();
      showToast('Data berhasil dipulihkan dari file JSON!', 'success');
    } catch (err) {
      alert('Gagal memulihkan file. Pastikan format JSON valid.');
    }
  };
  reader.readAsText(file);
}

function resetToDefaultEmployees() {
  openConfirmModal('Kembalikan daftar karyawan ke 10 karyawan bawaan (Lala, Atun, Indah, Pia, Fitri, Ikmah, Fani, Candra, Atar, Imam)?', () => {
    state.employees = JSON.parse(JSON.stringify(DEFAULT_EMPLOYEES));
    state.saveEmployees();
    renderEmployeeManagement();
    renderDailyAttendance();
    showToast('Daftar karyawan telah direset ke 10 nama bawaan!', 'success');
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}

/* ==========================================================================
   Event Listeners & Initialization
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'tab-recap') {
        renderRecap();
      } else if (targetId === 'tab-employees') {
        renderEmployeeManagement();
      } else if (targetId === 'tab-attendance') {
        renderDailyAttendance();
      }

      // Tutup sidebar di layar HP/tablet setelah tab dipilih
      const sidebar = document.getElementById('app-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (window.innerWidth <= 900 && sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      }
    });
  });

  // Mobile Sidebar Toggle Button & Backdrop
  const sidebarEl = document.getElementById('app-sidebar');
  const overlayEl = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('btn-sidebar-toggle');
  if (toggleBtn && sidebarEl && overlayEl) {
    const toggleSidebar = () => {
      sidebarEl.classList.toggle('open');
      overlayEl.classList.toggle('active');
    };
    toggleBtn.addEventListener('click', toggleSidebar);
    overlayEl.addEventListener('click', toggleSidebar);
  }

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Date Navigation
  document.getElementById('btn-prev-day').addEventListener('click', () => {
    state.currentDate = offsetDateString(state.currentDate, -1);
    renderDailyAttendance();
  });

  document.getElementById('btn-next-day').addEventListener('click', () => {
    state.currentDate = offsetDateString(state.currentDate, 1);
    renderDailyAttendance();
  });

  document.getElementById('btn-today').addEventListener('click', () => {
    state.currentDate = state.getTodayDateString();
    renderDailyAttendance();
  });

  document.getElementById('date-input-picker').addEventListener('change', (e) => {
    if (e.target.value) {
      state.currentDate = e.target.value;
      renderDailyAttendance();
    }
  });

  // Action Buttons
  document.getElementById('btn-quick-all-normal').addEventListener('click', setAllHadirNormal);
  document.getElementById('btn-whatsapp-share').addEventListener('click', copyWhatsAppSummary);
  document.getElementById('btn-save-attendance-manual').addEventListener('click', () => {
    state.saveAttendance();
    showToast('Data presensi & paket hari ini telah tersimpan!', 'success');
  });

  // Search filter in attendance sheet
  document.getElementById('filter-employee-search').addEventListener('input', () => {
    renderDailyAttendance();
  });

  // Recap Range Filter Chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const range = chip.getAttribute('data-range');
      state.recapRange = range;

      const customBox = document.getElementById('custom-range-container');
      if (range === 'custom') {
        customBox.style.display = 'flex';
        document.getElementById('recap-date-start').value = state.recapStartDate;
        document.getElementById('recap-date-end').value = state.recapEndDate;
      } else {
        customBox.style.display = 'none';
        renderRecap();
      }
    });
  });

  document.getElementById('btn-apply-custom-range').addEventListener('click', () => {
    const s = document.getElementById('recap-date-start').value;
    const e = document.getElementById('recap-date-end').value;
    if (s && e) {
      if (s > e) {
        alert('Tanggal awal tidak boleh lebih besar dari tanggal akhir!');
        return;
      }
      state.recapStartDate = s;
      state.recapEndDate = e;
      renderRecap();
    }
  });

  // Export & Print Buttons
  document.getElementById('btn-export-csv').addEventListener('click', exportRecapToCSV);
  document.getElementById('btn-print-recap').addEventListener('click', () => {
    window.print();
  });

  // Employee Add Modal
  document.getElementById('btn-open-add-employee').addEventListener('click', () => {
    document.getElementById('modal-employee-title').textContent = 'Tambah Karyawan Baru';
    document.getElementById('input-employee-id').value = '';
    document.getElementById('input-employee-name').value = '';
    document.getElementById('modal-employee').classList.add('active');
    document.getElementById('input-employee-name').focus();
  });

  document.getElementById('btn-close-employee-modal').addEventListener('click', () => {
    document.getElementById('modal-employee').classList.remove('active');
  });

  document.getElementById('btn-cancel-employee').addEventListener('click', () => {
    document.getElementById('modal-employee').classList.remove('active');
  });

  document.getElementById('form-employee').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-employee-name').value.trim();
    const id = document.getElementById('input-employee-id').value;

    if (!name) return;

    if (id) {
      // Edit
      const emp = state.employees.find(e => e.id === id);
      if (emp) {
        emp.name = name;
        showToast(`Nama karyawan diubah menjadi "${name}"`, 'success');
      }
    } else {
      // Add new
      const newId = 'emp-' + Date.now();
      state.employees.push({
        id: newId,
        name: name,
        active: true
      });
      showToast(`Karyawan "${name}" berhasil ditambahkan!`, 'success');
    }

    state.saveEmployees();
    document.getElementById('modal-employee').classList.remove('active');
    renderEmployeeManagement();
    renderDailyAttendance();
  });

  // Confirmation Modal
  document.getElementById('btn-close-confirm-modal').addEventListener('click', closeConfirmModal);
  document.getElementById('btn-confirm-cancel').addEventListener('click', closeConfirmModal);
  document.getElementById('btn-confirm-ok').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });

  // Backup & Restore
  document.getElementById('btn-backup-json').addEventListener('click', backupJsonData);
  document.getElementById('file-restore-json').addEventListener('change', restoreJsonData);
  document.getElementById('btn-reset-demo').addEventListener('click', resetToDefaultEmployees);

  // Initial render
  renderDailyAttendance();
  renderEmployeeManagement();
});
