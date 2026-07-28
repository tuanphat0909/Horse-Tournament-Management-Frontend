// Lọc thông báo theo role: BE gửi theo userId nhưng vẫn có thông báo chung
// (kết quả đua, cược...) không liên quan tới vai trò đang đăng nhập.
// Dùng chung cho cả chuông trên Topbar lẫn trang Notifications của từng role.

/** Chuẩn hóa role thô từ BE (HorseOwner, SystemAdministrator...) về key nội bộ. */
export function toRoleKey(role) {
  const lower = (role ?? '').toLowerCase();
  if (lower === 'horseowner' || lower === 'owner') return 'owner';
  if (lower === 'systemadministrator' || lower === 'admin') return 'admin';
  if (lower === 'vet' || lower === 'veterinarian') return 'veterinarian';
  if (lower === 'jockey' || lower === 'referee' || lower === 'spectator') return lower;
  return 'spectator';
}

// Đường dẫn riêng của từng role — thông báo trỏ vào khu vực của role khác thì ẩn.
const ROLE_URL_PREFIX = {
  admin: '/admin/',
  owner: '/owner/',
  jockey: '/jockey/',
  referee: '/referee/',
  spectator: '/spectator/',
  veterinarian: '/vet/',
};

// Loại thông báo mỗi role KHÔNG quan tâm (ngoài phần lọc theo actionUrl).
const BLOCKED_TYPES = {
  admin: ['bet'],
  owner: ['bet'],
  jockey: ['bet'],
  referee: ['bet'],
  veterinarian: ['bet', 'race'],
};

// Tiêu đề thông báo dành riêng cho khán giả — role khác không cần thấy.
const SPECTATOR_ONLY_TITLES = ['race results published', 'bet won', 'bet lost', 'prediction result'];

export function isNotiForRole(noti, roleKey) {
  const type = (noti.type ?? '').toLowerCase();
  const title = (noti.title ?? '').toLowerCase();
  const url = (noti.actionUrl ?? '').toLowerCase();

  if ((BLOCKED_TYPES[roleKey] ?? []).includes(type)) return false;
  if (roleKey !== 'spectator' && SPECTATOR_ONLY_TITLES.includes(title)) return false;

  // actionUrl trỏ vào khu vực của role khác → không phải việc của role này.
  if (url) {
    const own = ROLE_URL_PREFIX[roleKey];
    const belongsToOther = Object.entries(ROLE_URL_PREFIX).some(([key, prefix]) => key !== roleKey && url.includes(prefix));
    if (belongsToOther && !url.includes(own)) return false;
  }

  return true;
}

export function filterNotisForRole(list, roleKey) {
  return list.filter((n) => isNotiForRole(n, roleKey));
}
