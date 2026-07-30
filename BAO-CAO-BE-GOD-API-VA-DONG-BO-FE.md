# Báo cáo — God API và rà soát đồng bộ Frontend ↔ Backend

**Ngày:** 29/07/2026 · **Backend:** commit `65c86f1` (`feat: add God API for 1-click demo tournament setup`)
**Môi trường:** BE local `http://localhost:55446` + SQL Server local

---

# PHẦN 1 — Lỗi trong God API cần backend sửa

## 🔴 `POST /api/Demo/auto-setup` trả lỗi 500

**Đã kiểm chứng thực tế.**

```
POST /api/Demo/auto-setup   (token Admin)
→ HTTP 500
→ {"error":"An error occurred during demo setup.",
   "details":"An error occurred while saving the entity changes."}
```

**Lỗi thật trong log backend:**

```
SqlException: The INSERT statement conflicted with the FOREIGN KEY constraint
"FK_MedicalCheckRecord_AppUser_UserId".
The conflict occurred in database "HorseRacingManagementSystem",
table "dbo.AppUser", column 'UserId'.
```

### Nguyên nhân

`backend/src/HorseRacing.API/Services/DemoService.cs`, dòng ~89-99 — tạo phiếu khám
nhưng **không gán `UserId`** (bác sĩ thú y nào đã khám):

```csharp
var medicalCheck = new MedicalCheckRecord
{
    RegistrationId = registration.RegistrationId,
    CheckedAt = DateTime.UtcNow,
    Temperature = 38.0m,
    HeartRate = 35,
    Weight = 500.0m,
    DopingResult = "Negative",
    MedicalResult = "Pass",
    Notes = "Auto-passed for demo purposes."
    // ← thiếu UserId
};
```

Cột `MedicalCheckRecord.UserId` là `NOT NULL` và có khoá ngoại tới `AppUser`. Khi không
gán, EF gửi giá trị mặc định `0` — không có người dùng nào mang Id 0 nên INSERT bị chặn.

### Đề xuất sửa

Lấy một tài khoản bác sĩ thú y bất kỳ để gán vào phiếu khám:

```csharp
var vetRole = await _context.Roles
    .FirstOrDefaultAsync(r => r.Name == "Veterinarian");

var vet = await _context.Users
    .FirstOrDefaultAsync(u => u.RoleId == vetRole.RoleId && u.Status == "Active");

if (vet == null)
    throw new InvalidOperationException(
        "Khong tim thay tai khoan bac si thu y de gan vao phieu kham demo.");

var medicalCheck = new MedicalCheckRecord
{
    RegistrationId = registration.RegistrationId,
    UserId = vet.UserId,          // ← bổ sung
    CheckType = "Initial",        // ← nên gán rõ, cột này cũng NOT NULL
    CheckedAt = DateTime.UtcNow,
    Temperature = 38.0m,
    HeartRate = 35,
    Weight = 500.0m,
    DopingResult = "Negative",
    MedicalResult = "Pass",
    Notes = "Auto-passed for demo purposes."
};
```

### Ghi chú thêm

- `DemoService` gọi `SaveChangesAsync()` **bên trong vòng lặp** (mỗi ngựa một lần) để
  lấy `RegistrationId`. Với 12 ngựa là 12 lần ghi đĩa. Có thể gom lại bằng cách gán qua
  navigation property (`Registration = registration`) để EF tự điền khoá ngoại trong
  **một** lần `SaveChanges` — nhanh hơn và an toàn hơn khi có lỗi giữa chừng.
- Nên bọc toàn bộ trong một transaction: nếu hỏng ở ngựa thứ 7 thì hiện tại 6 ngựa đầu
  đã nằm lại trong cơ sở dữ liệu, tạo ra giải đấu dở dang.

**Frontend đã sẵn sàng** — chỉ cần backend sửa lỗi này là tính năng chạy được ngay,
không phải đổi gì thêm ở phía giao diện.

---

# PHẦN 2 — Đối chiếu tài liệu `FRONTEND-API-CHANGES-v2.md`

Backend có kèm tài liệu hướng dẫn frontend cần đổi gì. Tôi đã đối chiếu từng mục với
tình trạng thật của hệ thống.

## ⚠️ Đường dẫn trong tài liệu không khớp thực tế

Tài liệu ghi các đường dẫn mới, nhưng khi gọi thử thì **tất cả đều trả 404**:

| Đường dẫn trong tài liệu | Thực tế | Đường dẫn đang chạy |
|---|---|---|
| `POST /api/financials/wallet/withdraw` | ❌ 404 | `/api/spectator/wallet/withdraw`, `/api/owner/wallet/withdraw` |
| `POST /api/betting/place` | ❌ 404 | `/api/spectator/bets` |
| `POST /api/medical-checks` | ❌ 404 | `/api/MedicalCheck` |
| `POST /api/tournaments/register` | ❌ 404 | `/api/registrations` |

Các đường dẫn **cũ vẫn hoạt động bình thường** (đã kiểm tra, đều trả 200). Nên frontend
**không cần đổi endpoint**.

👉 **Đề nghị backend cập nhật lại tài liệu** cho khớp đường dẫn thật, tránh nhóm khác
đọc rồi sửa nhầm.

## ✅ Các thay đổi nghiệp vụ — đã xác nhận có thật

Backend đã sửa **đúng những lỗ hổng** mà báo cáo trước đó nêu ra:

| Mục | Nội dung | Trạng thái |
|---|---|---|
| 1 | Rút tiền theo cơ chế tạm giữ (trừ ngay, chờ duyệt) | ✅ Đã làm |
| 2 | Chống race condition ví bằng `RowVersion` | ✅ Đã làm |
| 3 | Mỗi cuộc đua chỉ được cược một ngựa + mức cược tối thiểu | ✅ Đã làm |
| 4 | Khoá tài khoản trả về mảng `blockers` | ✅ **Đã kiểm chứng** |
| 5 | Đăng ký giải kiểm tra sức khoẻ + trùng lịch | ✅ Đã làm |
| 6 | Lỗi khám sức khoẻ liệt kê chi tiết | ✅ Đã làm |

**Kiểm chứng mục 4** — khoá tài khoản đang có ràng buộc:

```
PUT /api/admin/users/426/status
→ HTTP 400
→ {"message":"Cannot lock user due to constraints.",
   "blockers":["User wallet has a positive balance of 42000.00."]}
```

So với lần kiểm thử trước (khoá được ngay, không cảnh báo gì) thì đây là **cải thiện lớn**.

---

# PHẦN 3 — Phần frontend còn thiếu, đã bổ sung

## 3.1 Không hiển thị danh sách `blockers` ❗

**Vấn đề:** backend trả về mảng `blockers` liệt kê từng lý do, nhưng `parseApiError()`
chỉ lấy trường `message`. Quản trị viên chỉ thấy *"Cannot lock user due to constraints."*
— **không biết vướng cái gì**, đúng bằng việc không báo gì.

**Đã sửa** trong `src/api/authService.js` — bóc thêm mảng `blockers`:

```js
const blockers = parsed.blockers ?? parsed.result?.blockers;
if (Array.isArray(blockers) && blockers.length) {
  const details = blockers.filter(Boolean).map(b => `• ${b}`).join('\n');
  return base ? `${base}\n${details}` : details;
}
```

Sửa ở `parseApiError` nên **mọi màn hình đều tự hiển thị được**, không phải sửa từng trang.

**Đã sửa kèm:** khung thông báo (toast) trước đây không giữ ký tự xuống dòng nên nhiều
lý do bị dồn thành một dòng dài. Thêm `whitespace-pre-line` vào
`src/context/NotificationContext.jsx`.

Kết quả hiển thị:

```
Cannot lock user due to constraints.
• User wallet has a positive balance of 42000.00.
```

## 3.2 Chống bấm chồng nút tiền — đã có sẵn ✅

Tài liệu backend yêu cầu khoá nút khi đang gọi API để tránh lỗi race condition.
Kiểm tra lại thì **frontend đã làm sẵn** ở tất cả các nút liên quan tới tiền:

| Màn hình | Điều kiện khoá nút |
|---|---|
| Rút tiền (Owner / Spectator) | `disabled={!isValid \|\| loading}` |
| Nạp tiền (Owner / Spectator) | `disabled={coinsPreview <= 0 \|\| depositLoading \|\| isLocked}` |
| Đặt cược | `disabled={betFormik.isSubmitting}` |
| Ví hệ thống (Admin) | `disabled={actionLoading}` |

Không cần sửa gì thêm.

## 3.3 Các thông báo lỗi mới — hiển thị được ngay ✅

Những lỗi mới của backend (cược trùng ngựa, mức cược tối thiểu, ngựa đang chấn thương,
trùng lịch giải, chi tiết khám sức khoẻ) đều trả về ở trường `message` chuẩn, nên
`parseApiError()` hiện tại **đọc và hiển thị được ngay**, không cần sửa gì.

---

# PHẦN 4 — Tính năng God Mode đã làm ở frontend

**Phím tắt `Ctrl + Space`** trên trang *Quản lý giải đấu* của Admin.

| Thành phần | Tập tin |
|---|---|
| Hook xử lý phím tắt, gọi API, bắn pháo hoa | `src/hooks/useDemoSetup.js` |
| Màn hình chặn khi đang chạy | `src/components/ui/DemoSetupOverlay.jsx` |
| Hàm gọi API | `src/api/adminService.js` → `setupDemoTournament()` |
| Gắn vào trang | `src/pages/admin/AdminTournamentsPage.jsx` |

**Luồng chạy:**

1. Nhấn `Ctrl + Space` → hook bắt phím (bỏ qua nếu con trỏ đang ở trong ô nhập liệu,
   tránh cướp phím của người dùng)
2. Hiện màn hình chặn *"Đang giả lập dữ liệu giải đấu…"* kèm vòng quay
3. Gọi `POST /api/Demo/auto-setup`
4. Thành công → tắt màn hình chặn, **bắn pháo hoa** từ hai bên mép màn hình trong 2 giây
5. Hiện thông báo thành công kèm tên giải vừa tạo
6. Tự tải lại danh sách giải đấu để thấy ngay giải mới

**Chi tiết đã xử lý:**
- Chặn bấm chồng: đang chạy thì nhấn tiếp không có tác dụng
- Tôn trọng thiết lập giảm chuyển động của hệ điều hành (`disableForReducedMotion`)
- Lỗi thì hiện thông báo lỗi thay vì pháo hoa
- Gỡ bỏ trình lắng nghe phím khi rời trang

**Đã kiểm tra:** `npm run build` và ESLint đều sạch; cả 4 tập tin liên quan biên dịch
được qua dev server. Riêng phần pháo hoa chưa chạy thử với dữ liệu thật vì God API của
backend đang lỗi 500 (Phần 1) — đã thử với phản hồi giả lập thì luồng chạy đúng.

---

# Tổng hợp

| # | Nội dung | Bên xử lý |
|---|---|---|
| 1 | God API lỗi 500 — thiếu `UserId` khi tạo phiếu khám | 🔴 **Backend** |
| 2 | Tài liệu `FRONTEND-API-CHANGES-v2.md` ghi sai đường dẫn (404) | 🟡 **Backend** |
| 3 | Không hiển thị mảng `blockers` | ✅ Frontend — đã sửa |
| 4 | Toast không giữ xuống dòng | ✅ Frontend — đã sửa |
| 5 | Tính năng God Mode (Ctrl + Space) | ✅ Frontend — đã làm |

**Việc backend cần làm để tính năng chạy được:** sửa mục 1. Frontend đã sẵn sàng.
