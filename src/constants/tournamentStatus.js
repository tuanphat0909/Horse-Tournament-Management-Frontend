/**
 * Nhãn + màu cho từng trạng thái giải đấu.
 * Trước đây bảng này được chép nguyên si ở nhiều trang (Owner, Spectator...),
 * thêm một trạng thái mới là phải sửa từng file. Gom về một chỗ để sửa một lần.
 */

const TOURNAMENT_STATUS_CONFIG = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Upcoming', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
  'registration open': { label: 'Registration Open', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  'registration closed': { label: 'Registration Closed', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', dot: 'bg-zinc-400' },
  'medical checking': { label: 'Medical Checking', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  'ready to arrange': { label: 'Ready To Arrange', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', dot: 'bg-indigo-400' },
  'pre round': { label: 'Pre Round', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', dot: 'bg-purple-400' },
  'final round': { label: 'Final Round', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', dot: 'bg-pink-400' },
  'prize distribution': { label: 'Prize Distribution', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  pendingregistration: { label: 'Awaiting Registrations', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  pendingscheduling: { label: 'Awaiting Scheduling', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
};

/** Thứ tự ưu tiên khi sắp xếp theo trạng thái (số nhỏ = lên trước) */
const TOURNAMENT_STATUS_ORDER = {
  active: 0,
  'registration open': 1,
  'registration closed': 2,
  'medical checking': 3,
  'ready to arrange': 4,
  'pre round': 5,
  'final round': 6,
  'prize distribution': 7,
  upcoming: 8,
  completed: 9,
  cancelled: 10,
};

/**
 * Backend viết tên trạng thái không thống nhất: chỗ có dấu cách ("Registration Closed"),
 * chỗ viết liền ("RegistrationClosed"). Bỏ hết dấu cách trước khi tra bảng để cả hai
 * cách viết đều ra đúng nhãn, thay vì rơi về giá trị mặc định và hiện sai trạng thái.
 */
function chuanHoa(status) {
  return String(status ?? '').toLowerCase().replace(/[\s_-]/g, '');
}

const CONFIG_THEO_KHOA_CHUAN = Object.fromEntries(
  Object.entries(TOURNAMENT_STATUS_CONFIG).map(([k, v]) => [chuanHoa(k), v])
);
const ORDER_THEO_KHOA_CHUAN = Object.fromEntries(
  Object.entries(TOURNAMENT_STATUS_ORDER).map(([k, v]) => [chuanHoa(k), v])
);

export function getTournamentStatusStyle(status) {
  return CONFIG_THEO_KHOA_CHUAN[chuanHoa(status)] ?? TOURNAMENT_STATUS_CONFIG.upcoming;
}

export function getStatusOrder(status) {
  return ORDER_THEO_KHOA_CHUAN[chuanHoa(status)] ?? 11;
}
