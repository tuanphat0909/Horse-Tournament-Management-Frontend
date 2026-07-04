# BÁO CÁO TIẾN ĐỘ DỰ ÁN
## Horse Racing Management System — Frontend

---

## 1. TỔNG QUAN DỰ ÁN

**Mục tiêu:** Xây dựng hệ thống quản lý đua ngựa toàn diện, phục vụ 5 nhóm người dùng với vai trò và chức năng khác nhau.

**Công nghệ sử dụng:**

| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router DOM 7 |
| UI / Styling | TailwindCSS 4 (dark glass-panel, gold/navy theme) |
| Animation | Framer Motion |
| Kết nối BE | `src/services/api.js` — Bearer JWT token |
| Auth | JWT lưu localStorage (`token` + `user`) |

**Kiến trúc:** FE giao tiếp với BE qua REST API (`/api` proxy → `localhost:5000`). Mỗi role có service file riêng trong `src/api/`. Tất cả response đọc theo pattern `data?.result ?? (Array.isArray(d) ? d : [])`.

---

## 2. PHÂN HỆ NGƯỜI DÙNG & CHỨC NĂNG ĐÃ HOÀN THÀNH

### 2.1 Xác thực (Auth) — HOÀN THÀNH ✅

| Chức năng | Trạng thái |
|---|---|
| Đăng nhập (JWT thật) | ✅ Hoàn thành |
| Đăng ký tài khoản | ✅ Hoàn thành |
| Đăng xuất + xóa token | ✅ Hoàn thành |
| Điều hướng theo role | ✅ Hoàn thành (Admin / Jockey / Owner / Referee / Spectator) |
| Bảo vệ route (PrivateRoute) | ✅ Hoàn thành |

---

### 2.2 ADMIN — 8/11 trang hoạt động đầy đủ

| Trang | Chức năng | Kết nối API | Trạng thái |
|---|---|---|---|
| Dashboard | Thống kê: tổng users, giải đấu, chờ duyệt, đua hôm nay | `getAccounts`, `getTournaments`, `getRegistrations`, `getRaceSchedule` | ✅ |
| Quản lý người dùng | Xem danh sách, tạo tài khoản, phân quyền | `getAccounts`, `createAccount`, `getRoles` | ✅ |
| Duyệt đăng ký | Danh sách đăng ký, lọc theo trạng thái/tìm kiếm | `getRegistrations` | ✅ |
| Trọng tài | Danh sách referee (panel phải) | `getAdminReferees` | ✅ (một phần) |
| Vi phạm | Danh sách vi phạm, tab leo thang/thông báo, thống kê | `getViolations` | ✅ |
| Dự đoán | Danh sách bet + 4 thẻ thống kê (tổng, đúng, chi trả, tỉ lệ) | `getPredictions`, `getPredictionStats` | ✅ |
| Giải đấu | Form tạo giải đấu mới | `createTournament` | ⚠️ Chỉ có form tạo, chưa có danh sách |
| Cuộc đua | Form tạo/sửa cuộc đua, thêm ngựa tham gia | `createRace`, `createRaceEntry` | ⚠️ Chỉ có form, chưa có danh sách |
| Kết quả | Form công bố kết quả, phát thưởng | `createPrizes`, `triggerPayout` | ⚠️ Chỉ có form, chưa hiện danh sách |
| Phân công Referee | Gán referee cho cuộc đua | `assignReferee`, `getRaceReferees`, `removeReferee` | ⚠️ Panel trái thiếu list race |
| Hoạt động gần đây | — | ❌ BE chưa có `GET /admin/activity-log` | ❌ |

---

### 2.3 JOCKEY — HOÀN THÀNH ✅ (6/6 trang)

| Trang | Chức năng | Kết nối API | Trạng thái |
|---|---|---|---|
| Dashboard | Thẻ: lời mời mới, đua sắp tới, số lần thắng, tổng hợp đồng | `getContracts`, `getRaceSchedule`, `getJockeyStats` | ✅ |
| Lời mời hợp đồng | Xem, nhận / từ chối hợp đồng | `getContracts`, `respondContract` | ✅ |
| Lịch thi đấu | Danh sách cuộc đua sắp tới | `getRaceSchedule` | ✅ |
| Hợp đồng | Danh sách hợp đồng theo trạng thái | `getContracts` | ✅ |
| Thống kê | Tỉ lệ thắng, top 3, hạng, lịch sử đua, biểu đồ | `getJockeyStats` | ✅ |
| Vi phạm | Danh sách vi phạm cá nhân | `getJockeyViolations` | ✅ |

---

### 2.4 OWNER (Chủ ngựa) — HOÀN THÀNH ✅ (6/6 trang)

| Trang | Chức năng | Kết nối API | Trạng thái |
|---|---|---|---|
| Dashboard | Ngựa, lịch đua, thành tích mùa giải | `getMyHorses`, `getRaceSchedule`, `getOwnerResults` | ✅ |
| Quản lý ngựa | CRUD đầy đủ: xem/tạo/sửa/xóa hồ sơ ngựa | `getMyHorses`, `createHorse`, `updateHorse`, `deleteHorse` | ✅ |
| Đăng ký thi đấu | Đăng ký ngựa vào giải, xem lịch sử đăng ký | `getMyRegistrations`, `createRegistration`, `getMyHorses` | ✅ |
| Kết quả | Thành tích thi đấu theo mùa | `getOwnerResults` | ✅ |
| Giải đấu | Xem danh sách giải đấu | `getTournaments` | ✅ |
| Jockey | Xem bảng xếp hạng, gửi đề xuất hợp đồng | `getJockeyRankings`, `getMyProposals`, `createJockeyContract` | ✅ |

---

### 2.5 REFEREE (Trọng tài) — 2/5 trang hoạt động đầy đủ

| Trang | Chức năng | Kết nối API | Trạng thái |
|---|---|---|---|
| Dashboard | Thống kê: đua hôm nay, ngựa cần kiểm tra, vi phạm, báo cáo | `getRefereeDashboard` | ✅ |
| Kiểm tra ngựa | Chọn cuộc đua → tải danh sách ngựa cần kiểm tra | `getRefereeDashboard`, `getRaceHorseChecks` | ✅ |
| Xác nhận kết quả | — | ❌ BE chưa có API | ❌ |
| Xử lý vi phạm | — | ❌ BE chưa có API | ❌ |
| Báo cáo | — | ❌ BE chưa có API | ❌ |

---

### 2.6 SPECTATOR (Khán giả) — 4/5 trang hoạt động đầy đủ

| Trang | Chức năng | Kết nối API | Trạng thái |
|---|---|---|---|
| Dashboard | Số dư ví, lịch đua, thông báo, giải đấu | `getBalance`, `getMyBets`, `getRaceSchedule`, `getTournaments`, `getNotifications` | ✅ |
| Ví điện tử | Nạp/rút tiền, lịch sử giao dịch | `getBalance`, `getWalletHistory`, `deposit`, `withdraw` | ✅ |
| Dự đoán / Đặt cược | Xem lịch đua, đặt cược, theo dõi kết quả | `getMyBets`, `placeBet`, `getRaceSchedule` | ✅ |
| Giải đấu | Danh sách giải đấu, tìm kiếm | `getTournaments` | ✅ |
| Kết quả trực tiếp | — | ❌ BE chưa có `GET /public/races/live` | ❌ |

---

## 3. TỔNG HỢP API ĐÃ KẾT NỐI

### 3.1 Các endpoint đang hoạt động (26 endpoints)

| Nhóm | Endpoint | Mục đích |
|---|---|---|
| Auth | `POST /auth/login` | Đăng nhập |
| Auth | `POST /auth/register` | Đăng ký |
| Auth | `POST /auth/logout` | Đăng xuất |
| Public | `GET /public/races/schedule` | Lịch đua |
| Public | `GET /public/tournaments` | Danh sách giải đấu |
| Public | `GET /public/rankings/jockeys` | BXH jockey |
| Public | `GET /public/rankings/horses` | BXH ngựa |
| Public | `GET /public/notifications` | Thông báo |
| Public | `PUT /public/notifications/{id}/read` | Đánh dấu đã đọc |
| Admin | `GET /admin/accounts` | Danh sách tài khoản |
| Admin | `POST /admin/accounts` | Tạo tài khoản |
| Admin | `GET /admin/roles` | Danh sách quyền |
| Admin | `GET /admin/registrations` | Đăng ký thi đấu |
| Admin | `GET /admin/referees` | Danh sách trọng tài |
| Admin | `GET /admin/violations` | Vi phạm |
| Admin | `GET /admin/predictions` | Dự đoán |
| Admin | `GET /admin/predictions/stats` | Thống kê dự đoán |
| Admin | `POST /admin/tournaments` | Tạo giải đấu |
| Admin | `POST /admin/races` | Tạo cuộc đua |
| Admin | `POST /admin/races/{id}/entries` | Thêm ngựa vào đua |
| Admin | `POST/GET/DELETE /admin/races/{id}/referees` | Phân công trọng tài |
| Admin | `POST /admin/payouts/prizes` | Tạo giải thưởng |
| Admin | `POST /admin/payouts/trigger/{id}` | Phát thưởng |
| Jockey | `GET /jockeys/contracts` | Hợp đồng |
| Jockey | `PUT /jockeys/contracts/{id}/respond` | Phản hồi hợp đồng |
| Jockey | `GET /jockeys/stats` | Thống kê cá nhân |
| Jockey | `GET /jockeys/violations` | Vi phạm cá nhân |
| Owner | `GET/POST /horses/my-horses` | Quản lý ngựa |
| Owner | `GET/PUT/DELETE /horses/{id}` | CRUD ngựa |
| Owner | `GET/POST /registrations/my-registrations` | Đăng ký thi đấu |
| Owner | `GET/POST /jockey-contracts/my-proposals` | Đề xuất hợp đồng |
| Owner | `GET /owner/results` | Kết quả thi đấu |
| Referee | `GET /referee/dashboard` | Dashboard trọng tài |
| Referee | `GET /referee/races/{id}/horse-checks` | Kiểm tra ngựa |
| Spectator | `GET /spectator/wallet/balance` | Số dư ví |
| Spectator | `GET /spectator/wallet/history` | Lịch sử giao dịch |
| Spectator | `POST /spectator/wallet/deposit` | Nạp tiền |
| Spectator | `POST /spectator/wallet/withdraw` | Rút tiền |
| Spectator | `GET /spectator/bets/my-bets` | Lịch sử đặt cược |
| Spectator | `POST /spectator/bets` | Đặt cược |

---

## 4. NHỮNG GÌ CÒN THIẾU / CHƯA LÀM ĐƯỢC

### 4.1 Chờ Backend bổ sung API

| Endpoint cần thêm | Trang FE đang chờ | Ảnh hưởng |
|---|---|---|
| `GET /public/races/live` | SpectatorLiveResultsPage, SpectatorDashboard | Không xem được đua trực tiếp |
| `GET /admin/activity-log` | AdminDashboardPage | Không có nhật ký hoạt động |
| `GET /admin/tournaments` | AdminTournamentsPage | Không xem được danh sách giải đấu đã tạo |
| `GET /admin/races` | AdminRacesPage | Không xem được danh sách cuộc đua đã tạo |
| `GET /admin/results` | AdminResultsPage | Không xem kết quả chờ/đã công bố |
| `GET /referee/violations` | RefereeViolationsPage | Trọng tài không xem được vi phạm |
| `GET /referee/results` | RefereeConfirmResultsPage | Không xác nhận được kết quả |
| `GET /referee/reports` | RefereeReportsPage | Không có danh sách báo cáo |
| `GET /public/races/{id}/horses` | SpectatorPredictionsPage | Dropdown chọn ngựa khi đặt cược |
| `GET /public/tournaments/{id}` | Nhiều trang | Chi tiết từng giải đấu |

### 4.2 Tính năng FE chưa xây dựng

| Tính năng | Lý do chưa làm |
|---|---|
| Trang chi tiết cuộc đua (xem ngựa tham gia, kết quả) | Chưa có API chi tiết race |
| Thông báo real-time (WebSocket) | Chưa có trong scope hiện tại |
| Phân trang (pagination) cho danh sách dài | Chưa có API hỗ trợ `?page=&limit=` |
| Tải ảnh ngựa / avatar người dùng | Chưa có API upload |
| Admin: panel trái AdminRefereesPage (race chưa/đã phân công) | BE chưa có API |
| Jockey: panel "Thành tích gần đây" ở dashboard | BE chưa có API |
| Owner: panel "Hoạt động gần đây" ở dashboard | BE chưa có API |

---

## 5. ĐÁNH GIÁ KHẢ NĂNG DEMO

| Role | Mức độ sẵn sàng | Ghi chú |
|---|---|---|
| **Owner** | ⭐⭐⭐⭐⭐ Hoàn chỉnh | CRUD ngựa, đăng ký, hợp đồng jockey, kết quả — đầy đủ nhất |
| **Jockey** | ⭐⭐⭐⭐⭐ Hoàn chỉnh | Hợp đồng, thống kê, vi phạm, lịch đua — đủ để demo |
| **Spectator** | ⭐⭐⭐⭐ Tốt | Ví, đặt cược, giải đấu — chỉ thiếu live race |
| **Admin** | ⭐⭐⭐ Trung bình | Dashboard + duyệt đăng ký + vi phạm tốt; thiếu list giải đấu/cuộc đua |
| **Referee** | ⭐⭐ Cần cải thiện | Chỉ demo được Dashboard + Kiểm tra ngựa |

---

## 6. TÓM TẮT SỐ LIỆU

| Hạng mục | Số lượng |
|---|---|
| Tổng số trang (pages) | 36 |
| Trang kết nối API đầy đủ | 26 |
| Trang kết nối API một phần | 4 |
| Trang chờ BE bổ sung API | 6 |
| Tổng endpoint đã kết nối | ~40 |
| Endpoint đang chờ BE | ~10 |
| Service files | 7 (auth, admin, jockey, owner, referee, spectator, public) |

---

*Báo cáo được tổng hợp theo trạng thái thực tế của source code tại nhánh `feat/connect-new-api-endpoints`.*
