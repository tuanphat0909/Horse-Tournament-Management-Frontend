/**
 * Kiểu dữ liệu nghiệp vụ dùng chung toàn app.
 *
 * Trước đây mỗi trang tự khai `any` hoặc tự định nghĩa lại interface riêng, nên
 * đổi field ở BE là phải dò từng file. Gom về một chỗ để đổi một lần là cả app
 * báo lỗi biên dịch đúng chỗ cần sửa.
 *
 * Field để optional khi BE không phải lúc nào cũng trả về (tùy endpoint).
 */

/* ─────────── Người dùng & vai trò ─────────── */

export type RoleKey = 'admin' | 'owner' | 'jockey' | 'referee' | 'spectator' | 'veterinarian';

export interface User {
  userId: number;
  id?: number;
  fullName: string;
  email: string;
  role: string;
  status?: string;
  createdAt?: string;
}

/* ─────────── Ngựa ─────────── */

export type HealthStatus = 'Healthy' | 'Injured' | 'Sick' | 'Recovering' | 'Retired';

export interface HorseStatistic {
  totalRaces: number;
  totalWins: number;
  totalSecondPlaces: number;
  totalThirdPlaces: number;
  averageSpeed?: number;
}

export interface Horse {
  id: number;
  name: string;
  breed: string;
  /** BE trả ngày sinh (không phải số tuổi) — dùng calculateAge() để hiển thị */
  age: string;
  gender: 'Male' | 'Female' | string;
  healthStatus?: HealthStatus | string;
  ownerId?: number;
  ownerName?: string;
  winRate?: number;
  averageTime?: number;
  statistic?: HorseStatistic;
}

/* ─────────── Giải đấu ─────────── */

export interface Prize {
  id: number;
  rankPosition: number;
  amount: number;
  ownerPercentage?: number;
  jockeyPercentage?: number;
}

export interface Round {
  roundId: number;
  tournamentId: number;
  name?: string;
  roundNumber: number;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface Tournament {
  tournamentId: number;
  name: string;
  description?: string;
  status: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  startDate?: string;
  endDate?: string;
  cancelCount?: number;
  prizes?: Prize[];
  rounds?: Round[];
  approvedRegistration?: number;
  qualifiedRegistration?: number;
}

/* ─────────── Cuộc đua ─────────── */

export interface Race {
  raceId: number;
  roundId: number;
  name?: string;
  raceDate: string;
  distanceMeter: number;
  maxLanes: number;
  status: string;
  roundName?: string;
  roundNumber?: number;
  tournamentId?: number;
  tournamentName?: string;
  hasHealthIssue?: boolean;
}

export interface RaceEntry {
  raceEntryId: number;
  raceId: number;
  registrationId: number;
  horseId: number;
  horseName?: string;
  jockeyId?: number;
  jockeyName?: string;
  laneNo: number;
  status: string;
  healthStatus?: string;
  finishPosition?: number;
  finishTime?: number;
  currentOdds?: number;
  winningProbability?: number;
}

/* ─────────── Đăng ký & hợp đồng ─────────── */

export interface Registration {
  registrationId: number;
  id?: number;
  tournamentId: number;
  tournamentName?: string;
  horseId: number;
  horseName?: string;
  ownerName?: string;
  jockeyName?: string;
  jockeyContractStatus?: string;
  status: string;
  registeredAt?: string;
  createdAt?: string;
}

export interface JockeyContract {
  contractId: number;
  id?: number;
  tournamentId: number;
  tournamentName?: string;
  horseId: number;
  horseName?: string;
  jockeyId: number;
  jockeyName?: string;
  status: string;
  rentalFee?: number;
  winningBonusPercentage?: number;
  invitationExpiredAt?: string;
  startDate?: string;
  endDate?: string;
}

/* ─────────── Y tế ─────────── */

export interface MedicalCheckRecord {
  id: number;
  registrationId: number;
  horseName?: string;
  weight: number;
  temperature?: number;
  heartRate?: number;
  dopingResult: string;
  medicalResult: string;
  notes?: string;
  checkedAt: string;
  checkType: string;
  failReason?: string;
}

/* ─────────── Ví & cược ─────────── */

export interface WalletTransaction {
  transactionId: number;
  type: string;
  amount: number;
  status?: string;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
}

export interface Bet {
  betId: number;
  id?: number;
  userId?: number;
  raceId: number;
  raceName?: string;
  horseId: number;
  horseName?: string;
  spectatorName?: string;
  amount: number;
  odds: number;
  potentialPayout?: number;
  status: string;
  createdAt: string;
}

/* ─────────── Thông báo ─────────── */

export interface AppNotification {
  id: number;
  userId: number;
  title: string;
  content: string;
  message?: string;
  type: string;
  isRead: boolean;
  referenceId?: number;
  actionUrl?: string;
  thumbnail?: string;
  createdAt: string;
  readAt?: string;
}

/* ─────────── Vi phạm & báo cáo ─────────── */

export interface RaceViolation {
  violationId: number;
  raceId?: number;
  raceName?: string;
  type: string;
  note?: string;
  penalty?: string;
  status?: string;
  createdAt?: string;
}

/* ─────────── Dạng response chung của BE ─────────── */

/** BE bọc dữ liệu trong { message, result } */
export interface ApiResponse<T> {
  message?: string;
  result: T;
}

/** Endpoint có phân trang trả về { items, totalCount } trong result */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
