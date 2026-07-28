// Các hàm tiện ích dùng chung cho toàn app

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatUtcDateTime(value) {
  if (!value) return "—";
  let dateStr = value;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr = dateStr + 'Z';
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Parse chuỗi datetime từ BE (UTC nhưng thường thiếu 'Z') thành Date đúng múi giờ
export function parseUtcDate(value) {
  if (!value) return null;
  let s = value;
  if (typeof s === 'string' && !s.endsWith('Z') && !s.includes('+')) {
    s = s + 'Z';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatWinProbability(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";

  const numeric = Number(value);
  const percent = numeric <= 1 ? numeric * 100 : numeric;

  return `${Math.min(Math.max(percent, 0), 100).toFixed(1)}%`;
}

export function calculateAge(birthDateString) {
  if (!birthDateString) return '—';
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function formatDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
