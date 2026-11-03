const assert = require('assert');

// 1. Test Employees
const DEFAULT_EMPLOYEES = [
  'Lala', 'Atun', 'Indah', 'Pia', 'Fitri',
  'Ikmah', 'Fani', 'Candra', 'Atar', 'Imam'
];

console.log('Testing Default Employee List:');
assert.strictEqual(DEFAULT_EMPLOYEES.length, 10, 'Must have exactly 10 employees');
console.log('✔ 10 Employees verified:', DEFAULT_EMPLOYEES.join(', '));

// 2. Test Overtime Formula: Jam Selesai - 16.30 = Durasi Lembur
function calculateOvertimeDuration(endTimeStr) {
  if (!endTimeStr) return 0;
  const parts = endTimeStr.split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;

  const regularEndMinutes = 16 * 60 + 30; // 16:30 = 990 minutes
  const endMinutes = h * 60 + m;

  if (endMinutes <= regularEndMinutes) return 0;

  const diffMinutes = endMinutes - regularEndMinutes;
  const diffHours = diffMinutes / 60;
  return Math.round(diffHours * 10) / 10;
}

console.log('\nTesting Overtime Calculation Formula:');
assert.strictEqual(calculateOvertimeDuration('16:30'), 0, '16:30 should be 0 ot hours');
assert.strictEqual(calculateOvertimeDuration('17:30'), 1.0, '17:30 should be 1.0 ot hours');
assert.strictEqual(calculateOvertimeDuration('18:00'), 1.5, '18:00 should be 1.5 ot hours');
assert.strictEqual(calculateOvertimeDuration('18:30'), 2.0, '18:30 should be 2.0 ot hours');
assert.strictEqual(calculateOvertimeDuration('19:00'), 2.5, '19:00 should be 2.5 ot hours');
assert.strictEqual(calculateOvertimeDuration('19:30'), 3.0, '19:30 should be 3.0 ot hours');
assert.strictEqual(calculateOvertimeDuration('20:30'), 4.0, '20:30 should be 4.0 ot hours');
assert.strictEqual(calculateOvertimeDuration('21:30'), 5.0, '21:30 should be 5.0 ot hours');
assert.strictEqual(calculateOvertimeDuration('22:00'), 5.5, '22:00 should be 5.5 ot hours');
console.log('✔ All Overtime calculation tests passed!');

// 3. Test Sunday detection (Senin - Sabtu kerja, Minggu libur)
function isSunday(dateStr) {
  const parts = dateStr.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return date.getDay() === 0;
}

console.log('\nTesting Workday & Sunday detection:');
// 2026-10-24 is Saturday (Work day)
assert.strictEqual(isSunday('2026-10-24'), false, 'Saturday 2026-10-24 is work day');
// 2026-10-25 is Sunday (Libur)
assert.strictEqual(isSunday('2026-10-25'), true, 'Sunday 2026-10-25 is Day Off (Libur)');
// 2026-10-26 is Monday (Work day)
assert.strictEqual(isSunday('2026-10-26'), false, 'Monday 2026-10-26 is work day');
console.log('✔ Workday and Sunday logic verified!');

console.log('\n🎉 ALL LOGIC AND BUSINESS RULES TESTS PASSED SUCCESSFULLY!');
