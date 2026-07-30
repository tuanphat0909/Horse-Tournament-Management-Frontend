# Báo cáo gửi Backend

**Ngày:** 30/07/2026
**Môi trường kiểm thử:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`
**Phiên bản backend:** commit `65c86f1` (God API) — đã pull mới nhất

Tất cả lỗi bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

---

# PHẦN 1 — Lỗi cần sửa

## 🔴 1.1. Khoá tài khoản: ràng buộc nghiệp vụ không bao giờ chạy

Đây là lỗi nghiêm trọng nhất. Tính năng đã được công bố là "đã fix" nhưng thực tế chỉ
chặn được mỗi tiền trong ví.

### Kiểm chứng

```
Đưa ví về 0 để chỉ còn ràng buộc nghiệp vụ, rồi thử khoá:

owner@gmail.com  — đang có ngựa đăng ký giải     → KHOÁ ĐƯỢC ❌
jockey@gmail.com — đang có hợp đồng Active       → KHOÁ ĐƯỢC ❌
```

### Nguyên nhân 1 — sai tên vai trò

`UserRepository.cs` dòng 137:

```csharp
else if (role == "Owner")        // cơ sở dữ liệu lưu là "HorseOwner"
{
    if (await HasUpcomingOwnerAssignmentsAsync(userId))
        blockers.Add("User has horses actively registered in ongoing tournaments.");
}
```

Bảng `Role` thực tế:

```
RoleId | Name
1      | Admin
2      | HorseOwner     ← không phải "Owner"
3      | Jockey
4      | Referee
5      | Spectator
6      | Veterinarian
```

Điều kiện không bao giờ đúng → **chưa từng kiểm tra ngựa của chủ ngựa**.

### Nguyên nhân 2 — sai tên trạng thái giải

Dòng 91-105 liệt kê các trạng thái được coi là "đang diễn ra":

```
Pending, Scheduled, InProgress, PendingRegistration, PendingScheduling
```

Nhưng trạng thái **thật** trong hệ thống là:

```
PendingScheduling · Registration Open · Registration Suspended
Completed · PendingAdminAttention · Active · Upcoming · AwaitingResults
```

→ `Pending`, `Scheduled`, `InProgress` **không tồn tại**. Ngược lại `Active` (giải đang
đua thật) và `Registration Open` lại **bị bỏ sót**.

Hai lỗi cộng lại khiến ba ràng buộc nghiệp vụ (nài ngựa có hợp đồng, chủ ngựa có ngựa
thi đấu, trọng tài được phân công) gần như không bao giờ chặn được. Chỉ còn hai ràng
buộc chạy đúng vì không phụ thuộc vai trò: **ví còn tiền** và **còn cược chưa chốt**.

### Đề xuất

```csharp
// Sửa 1 — nhận cả hai cách gọi
else if (role == "HorseOwner" || role == "Owner")

// Sửa 2 — đảo ngược logic: giải nào chưa kết thúc thì coi là đang diễn ra
var dangDienRa = !(t.Status == "Completed" || t.Status == "Cancelled");
```

Cách đảo ngược an toàn hơn liệt kê: sau này thêm trạng thái mới cũng không bị sót.

---

## 🔴 1.2. God API lỗi 500 — thiếu `UserId` khi tạo phiếu khám

```
POST /api/Demo/auto-setup  (token Admin)
→ HTTP 500
→ SqlException: The INSERT statement conflicted with the FOREIGN KEY constraint
  "FK_MedicalCheckRecord_AppUser_UserId"
```

`HorseRacing.API/Services/DemoService.cs` dòng ~89-99 tạo phiếu khám nhưng **không gán
`UserId`** (bác sĩ thú y nào đã khám). Cột này `NOT NULL` và có khoá ngoại tới `AppUser`;
khi không gán, EF gửi giá trị mặc định `0` — không có người dùng nào mang Id 0 nên INSERT
bị chặn.

### Đề xuất

```csharp
var vetRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Veterinarian");
var vet = await _context.Users
    .FirstOrDefaultAsync(u => u.RoleId == vetRole.RoleId && u.Status == "Active");

if (vet == null)
    throw new InvalidOperationException(
        "Khong tim thay tai khoan bac si thu y de gan vao phieu kham demo.");

var medicalCheck = new MedicalCheckRecord
{
    RegistrationId = registration.RegistrationId,
    UserId = vet.UserId,          // ← bổ sung
    CheckType = "Initial",        // ← cột này cũng NOT NULL, nên gán rõ
    CheckedAt = DateTime.UtcNow,
    Temperature = 38.0m,
    HeartRate = 35,
    Weight = 500.0m,
    DopingResult = "Negative",
    MedicalResult = "Pass",
    Notes = "Auto-passed for demo purposes."
};
```

**Ghi chú thêm:** `DemoService` gọi `SaveChangesAsync()` bên trong vòng lặp (12 ngựa = 12
lần ghi đĩa). Nên gán qua navigation property (`Registration = registration`) để EF tự
điền khoá ngoại trong **một** lần lưu, và bọc toàn bộ trong một transaction — hiện tại
nếu hỏng ở ngựa thứ 7 thì 6 ngựa đầu đã nằm lại trong cơ sở dữ liệu, tạo ra giải dở dang.

**Frontend đã làm xong phần giao diện** (phím tắt, màn hình chờ, pháo hoa, tải lại danh
sách) — chỉ chờ sửa lỗi này là chạy được ngay.

---

## 🔴 1.3. `Forbid()` nuốt mất lời báo lỗi

`OwnerController.cs` dòng 151:

```csharp
catch (InvalidOperationException)
{
    return Forbid();      // 403 với thân phản hồi RỖNG
}
```

### Kiểm chứng

```
DELETE /api/horses/{id}   (ngựa đang đăng ký giải)
→ HTTP 403, thân phản hồi: (rỗng)
```

Tầng service viết câu giải thích rất rõ — *"Cannot delete this horse because it has
active registrations, upcoming races, or active contracts."* — nhưng bị vứt đi trên
đường ra. Chủ ngựa bấm xoá, thấy lỗi mà **không biết vì sao**, giao diện cũng không có
gì để hiển thị.

Thêm nữa 403 mang nghĩa *"không có quyền"*, dễ khiến người dùng tưởng bị chặn quyền chứ
không phải do ngựa đang bận.

### Đề xuất

```csharp
catch (InvalidOperationException ex)
{
    // Ngựa đang có ràng buộc là lỗi nghiệp vụ, không phải lỗi phân quyền
    return BadRequest(new { message = ex.Message });
}
```

Nên rà thêm các controller khác xem còn chỗ nào dùng `Forbid()` nuốt thông báo tương tự.

---

## 🟡 1.4. Tên trường trong phản hồi lỗi không thống nhất

| Nơi | Trường chứa câu lỗi |
|---|---|
| Phần lớn controller | `message` |
| `DemoController` | `error` + `details` |
| ASP.NET tự sinh | `title` + `errors` |
| Một số chỗ lỗi 500 | `message` + `detail` |

Frontend đã nhận hết các kiểu này, nhưng nếu backend thống nhất về một dạng thì đỡ rủi
ro bỏ sót về sau.

---

## 🟡 1.5. Tài liệu `FRONTEND-API-CHANGES-v2.md` ghi sai đường dẫn

Bốn đường dẫn trong tài liệu đều trả **404**:

| Đường dẫn trong tài liệu | Đường dẫn thật đang chạy |
|---|---|
| `/api/financials/wallet/withdraw` | `/api/spectator/wallet/withdraw`, `/api/owner/wallet/withdraw` |
| `/api/betting/place` | `/api/spectator/bets` |
| `/api/medical-checks` | `/api/MedicalCheck` |
| `/api/tournaments/register` | `/api/registrations` |

Đường dẫn cũ vẫn hoạt động bình thường nên **frontend không phải đổi gì**. Nhưng nên sửa
tài liệu để nhóm khác đọc không sửa nhầm.

---

# PHẦN 2 — Kiểm chứng các bản sửa backend đã công bố

Chạy trên cơ sở dữ liệu **đã làm sạch hoàn toàn** rồi dựng lại dữ liệu phủ hết tình huống.

## ✅ Đã làm đúng

| Nội dung | Kiểm chứng |
|---|---|
| Khoá tài khoản trả mảng `blockers` | `400` + `["User wallet has a positive balance of 42000.00."]` |
| Chặn cược nhiều ngựa cùng một cuộc đua | *"Arbitrage betting is not allowed"* |
| Mức cược tối thiểu | *"Bet amount must be at least 10,000"* |
| Chặn đăng ký ngựa `Injured` / `Recovering` | *"...because its health status is 'Recovering'"* |
| Rút tiền theo cơ chế tạm giữ | Số dư 90.000 → 85.000, giao dịch `Status=Pending` |
| Thông báo lỗi đã sang tiếng Anh | Thử nhiều API, không còn tiếng Việt |
| Mật khẩu mạnh khi tạo tài khoản | ≥8 ký tự + chữ hoa/thường/số/ký tự đặc biệt |

*(Ba mục chưa thử được: chống bấm chồng bằng `RowVersion` — cần gọi song song mới tái
hiện; danh tính trọng tài lấy từ mã đăng nhập — không có cuộc đua phù hợp; bọc `try-catch`
phần gửi email — máy local không cấu hình được SMTP.)*

## ✅ Validate tạo giải đấu — 5/5 đúng

| Tình huống | Kết quả |
|---|---|
| Ngày mở đăng ký ở quá khứ | ✅ Chặn |
| Giải bắt đầu chưa đủ 5 ngày sau khi đóng đăng ký | ✅ Chặn, nêu rõ ngày sớm nhất được phép |
| Giải thưởng hạng 1 nhỏ hơn hạng 2 | ✅ Chặn |
| Tỷ lệ chia chủ ngựa/nài ngựa không đủ 100% | ✅ Chặn |
| Ví hệ thống không đủ tiền trao giải | ✅ Chặn — điểm làm rất tốt |

## ✅ Validate đăng ký ngựa — 5/5 đúng

| Tình huống | Kết quả |
|---|---|
| Đăng ký lại ngựa đã đăng ký giải đó | ✅ Chặn |
| Ngựa đang hồi phục | ✅ Chặn, nêu rõ trạng thái |
| Ngựa của chủ khác | ✅ Chặn — *"Access denied"* |
| Ngựa không tồn tại | ✅ Chặn |
| Ngựa khoẻ, giải đang mở | ✅ Đăng ký được |

## ✅ Các ràng buộc khác

| Tình huống | Kết quả |
|---|---|
| Xoá ngựa đang đăng ký giải | ✅ Chặn *(nhưng mất thông báo — mục 1.3)* |
| Xoá ngựa không vướng gì | ✅ Xoá được |
| Quản trị viên tự khoá tài khoản mình | ✅ Chặn |
| Không sinh cuộc đua khi chưa đủ 12 ngựa đã khám | ✅ Chặn |
| Không nộp kết quả trước giờ đua | ✅ Chặn |
| Phân quyền chéo vai trò | ✅ 9/9 chặn (403) |
| Truy cập dữ liệu người khác cùng vai trò | ✅ Chặn |

---

# PHẦN 3 — Frontend đã xử lý

Ghi lại để backend biết phía giao diện đã bắt kịp những thay đổi nào.

| Nội dung | Trạng thái |
|---|---|
| Hiển thị mảng `blockers` khi hành động bị chặn | ✅ Đã làm |
| Nhãn `Pending` cho lệnh rút tiền chờ duyệt (ví Chủ ngựa) | ✅ Đã làm |
| Đồng bộ luật mật khẩu (8 ký tự + chữ hoa/thường/số/ký tự đặc biệt) | ✅ Đã làm |
| Nhận thêm trường `error` / `details` để không hiện JSON thô | ✅ Đã làm |
| Khoá nút nạp/rút/cược khi đang gọi API | ✅ Vốn đã có |
| Phím tắt `Ctrl + Space` gọi God API | ✅ Đã làm, chờ backend sửa lỗi 1.2 |

---

# Tổng hợp

| # | Nội dung | Mức độ |
|---|---|---|
| 1.1 | Khoá tài khoản — sai tên vai trò và sai tên trạng thái giải | 🔴 Cao |
| 1.2 | God API lỗi 500 — thiếu `UserId` khi tạo phiếu khám | 🔴 Cao |
| 1.3 | `Forbid()` nuốt mất lời báo lỗi khi xoá ngựa | 🔴 Cao |
| 1.4 | Tên trường trong phản hồi lỗi không thống nhất | 🟡 Vừa |
| 1.5 | Tài liệu ghi sai đường dẫn API | 🟡 Vừa |

**Nhận xét chung:** phần lớn luật kiểm tra chạy rất tốt — 10/10 tình huống thử ở tạo giải
và đăng ký ngựa đều đúng. Vấn đề lớn nhất là **khoá tài khoản**: logic đã viết đầy đủ
nhưng do gõ sai tên vai trò và tên trạng thái nên phần lớn code không bao giờ chạy tới.
Sửa hai chỗ đó là tính năng hoạt động đúng như thiết kế.
