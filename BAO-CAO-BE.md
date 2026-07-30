# Báo cáo gửi Backend — buổi làm việc tối 30/07 và 31/07/2026

**Môi trường kiểm thử:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`
**Phiên bản backend:** commit `65c86f1` (God API) — đã pull mới nhất

Đây là **những phát hiện mới trong buổi tối 30/07**, sau khi pull backend bản mới nhất
(có God API và các bản sửa lỗ hổng). Các vấn đề của những đợt trước không nhắc lại ở đây.

Tất cả lỗi bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

> ## ✅ Cập nhật 31/07 — backend đã sửa xong 4 lỗi
>
> Sau khi pull bản mới nhất (commit `b562356` — *Feature/vulnerability concurrency fixes #149*),
> tôi đã chạy lại và kiểm chứng: **các mục 1.1, 1.2, 1.3, 1.5 đều đã sửa và chạy đúng.**
> Chi tiết ở [Phần 4](#phần-4--kiểm-chứng-lại-sau-khi-backend-sửa-3107).
> Phần mô tả lỗi bên dưới giữ nguyên để tiện đối chiếu.

## Việc đã làm trong buổi này

1. Pull backend bản mới nhất, chạy `update_db.sql` để đồng bộ lược đồ cơ sở dữ liệu local
2. Làm tính năng phím tắt `Ctrl + Space` gọi God API ở phía giao diện
3. Đối chiếu tài liệu `FRONTEND-API-CHANGES-v2.md` với hệ thống thật
4. Kiểm chứng lại các bản sửa lỗ hổng backend vừa công bố
5. **Làm sạch toàn bộ cơ sở dữ liệu local**, dựng lại dữ liệu phủ hết tình huống rồi
   chạy kiểm thử validate từ đầu

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

---

# PHẦN 4 — Kiểm chứng lại sau khi backend sửa (31/07)

**Bản backend:** commit `b562356` — *Feature/vulnerability concurrency fixes (#149)*

Đã pull, chạy lại và gọi API thật để kiểm chứng.

## 4.1. Kết quả — 4/5 lỗi đã sửa xong

| # | Lỗi | Trạng thái | Kiểm chứng |
|---|---|---|---|
| 1.1 | Khoá tài khoản không kiểm tra ràng buộc nghiệp vụ | ✅ **Đã sửa** | Xem 4.2 |
| 1.2 | God API lỗi 500 thiếu `UserId` | ✅ **Đã sửa** | Xem 4.3 |
| 1.3 | `Forbid()` nuốt mất lời báo lỗi | ✅ **Đã sửa** | Xem 4.4 |
| 1.4 | Tên trường phản hồi lỗi không thống nhất | ⏳ Chưa đổi | Frontend đã nhận hết các kiểu nên không gấp |
| 1.5 | Tài liệu ghi sai đường dẫn | ✅ **Đã sửa** | Còn sót `/api/financials/wallet/deposit` |

## 4.2. Khoá tài khoản — đã chặn đúng

Backend sửa đúng cả hai nguyên nhân, và chọn cách đảo ngược logic như đề xuất:

```csharp
else if (role == "HorseOwner" || role == "Owner")        // nhận cả hai cách gọi
...
!(r.Tournament.Status == "Completed" || r.Tournament.Status == "Cancelled")
```

Kiểm chứng — đưa ví về 0 để chỉ còn ràng buộc nghiệp vụ:

```
PUT /api/admin/users/426/status   (chủ ngựa đang có ngựa thi đấu)
→ 400 {"message":"Cannot lock user due to constraints.",
       "blockers":["User has horses actively registered in ongoing tournaments."]}
```

Trước khi sửa thì khoá được luôn. Nay đã chặn và **nêu đúng lý do nghiệp vụ**, không
còn chỉ báo mỗi chuyện ví còn tiền.

## 4.3. God API — đã chạy được

```
POST /api/Demo/auto-setup
→ 200 "Demo tournament setup successfully with 12 horses and jockeys."
→ Giải #108 - Auto Demo Cup f1df9763
```

Dữ liệu sinh ra đầy đủ: 12 đơn `Approved` · 12 hợp đồng `Active` · 12 phiếu khám `Pass`.

**Phím tắt `Ctrl + Space` trên giao diện giờ chạy trọn vẹn** — hiện màn hình chờ, bắn
pháo hoa, tải lại danh sách.

## 4.4. Xoá ngựa — đã hiện đúng lý do

```
DELETE /api/horses/{id}   (ngựa đang đăng ký giải)
→ 400 {"message":"Cannot delete this horse because it has active registrations,
        upcoming races, or active contracts."}
```

Trước đây trả 403 với thân phản hồi rỗng. Backend đã sửa **cả ba chỗ** trong
`OwnerController` chứ không riêng chỗ xoá ngựa.

---

## 4.5. Hai điểm mới phát hiện ở God API

### 🟡 a) Dùng tên trạng thái không có trong hệ thống

`DemoService.cs` đặt giải ở trạng thái `"RegistrationClosed"` (viết liền). Nhưng toàn hệ
thống dùng các tên sau:

```
PendingRegistration · Registration Open · Registration Suspended
PendingScheduling · Upcoming · Active · AwaitingResults · Completed · Cancelled
```

Không có `RegistrationClosed`. Giao diện tra bảng cấu hình theo `"registration closed"`
(có dấu cách) nên không khớp, giải bị hiển thị **sai nhãn trạng thái**.

**Đề xuất:** dùng `"PendingScheduling"` — đúng nghĩa *"đã đóng đăng ký, chờ xếp lịch"*
và khớp với luồng sinh cuộc đua sẵn có.

*(Phía frontend tôi đã chuẩn hoá lại cách tra bảng — bỏ dấu cách trước khi so sánh — nên
giờ chịu được cả hai cách viết. Nhưng nên sửa ở gốc cho thống nhất.)*

### 🟡 b) Thiếu ngày mở/đóng đăng ký

```sql
TournamentId | Status             | RegistrationStartDate | RegistrationEndDate
108          | RegistrationClosed | NULL                  | NULL
```

`DemoService` chỉ gán `StartDate` và `EndDate`, bỏ trống hai cột ngày đăng ký. Nhiều màn
hình dựa vào hai cột này để tính trạng thái hiển thị và đếm ngược, nên giải demo sẽ hiện
thiếu thông tin so với giải tạo bằng tay.

**Đề xuất:**

```csharp
RegistrationStartDate = DateTime.UtcNow.AddDays(-10),
RegistrationEndDate   = DateTime.UtcNow.AddDays(-1),
StartDate             = DateTime.UtcNow.AddDays(1),
EndDate               = DateTime.UtcNow.AddDays(7),
Status                = "PendingScheduling",
```

---

## 4.6. Tổng hợp còn lại

| # | Nội dung | Mức độ |
|---|---|---|
| 4.5a | God API dùng trạng thái `RegistrationClosed` không có trong hệ thống | 🟡 Vừa |
| 4.5b | God API không gán ngày mở/đóng đăng ký | 🟡 Vừa |
| 1.4 | Tên trường phản hồi lỗi chưa thống nhất | 🟡 Vừa |
| — | Tài liệu còn sót `/api/financials/wallet/deposit` (đường dẫn thật là `/api/admin/wallet/deposit`) | 🟢 Thấp |

**Không còn lỗi mức Cao.** Ba lỗi nghiêm trọng nhất đã được xử lý gọn.
