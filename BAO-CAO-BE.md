# Báo cáo gửi Backend

**Cập nhật:** 31/07/2026
**Bản backend đã kiểm tra:** commit `90a1064` — *Merge PR #152 (vulnerability concurrency fixes)*
**Môi trường:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`

Tất cả nội dung bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

> **Đã sửa xong ở bản này:** trạng thái `RegistrationClosed` → `PendingScheduling`, God API
> đã gán ngày mở/đóng đăng ký, tài liệu đã sửa đường dẫn nạp ví. Ghi nhận thêm: God API
> nay còn tự tạo cuộc đua và gán trọng tài — tiện hơn nhiều.
>
> File này chỉ liệt kê những gì **còn phải xử lý**.

---

## 🔴 1. 55 tài khoản nài ngựa không dùng được vì thiếu hồ sơ

**Nơi sửa:** `backend/src/HorseRacing.Infrastructure/Persistence/DataSeeder.cs` dòng ~594-616

`DataSeeder` tạo 55 tài khoản `jockeysu1` … `jockeysu55` với `RoleId = 3` (Jockey) nhưng
**không tạo `JockeyProfile`** kèm theo:

```csharp
jockey = new AppUser
{
    Username = username,
    Email = $"{username}@gmail.com",
    FullName = $"SU Jockey #{i}",
    RoleId = 3,                    // đánh dấu là Jockey
    IsEmailConfirmed = true,
    CreatedAt = DateTime.UtcNow
};
_context.Users.Add(jockey);
await _context.SaveChangesAsync();
// ← thiếu bước tạo JockeyProfile
```

### Kiểm chứng

```
Đăng nhập jockeysu1@gmail.com   → OK
GET /api/jockeys/contracts       → 200 OK
GET /api/jockeys/stats           → 404 {"message":"Jockey profile not found"}
GET /api/jockeys/assigned-horses → 404 {"message":"Jockey profile not found"}

So sánh với jk1@test.com (tạo qua API, có hồ sơ):
GET /api/jockeys/stats           → 200 OK
```

### Hậu quả

- **55 tài khoản đăng nhập được nhưng dùng không được**: vào trang Thống kê hoặc
  Ngựa được giao là gặp lỗi 404
- Kéo theo lỗi ở mục 2 bên dưới

### Đề xuất

Tạo hồ sơ ngay cùng lúc, gán qua navigation property để cả hai được ghi trong **một**
lần lưu:

```csharp
var jockey = new AppUser { ... };
jockey.PasswordHash = hasher.HashPassword(jockey, "123456");

_context.JockeyProfiles.Add(new JockeyProfile
{
    User = jockey,          // EF tự điền khoá ngoại
    ExperienceYears = 3,
    RankingPoint = 0,
    Status = "Active"
});
await _context.SaveChangesAsync();
```

Nên rà thêm: `su_owner`, các tài khoản Referee do seeder tạo có thiếu hồ sơ tương tự không.

**Dữ liệu đang hỏng sẵn** — cần thêm bước vá cho 55 tài khoản đã tạo, không chỉ sửa code
cho lần chạy sau.

---

## 🟡 2. God API chỉ tạo được 7/12 suất đua

**Nơi sửa:** `backend/src/HorseRacing.API/Services/DemoService.cs` dòng ~159

### Kiểm chứng

```
POST /api/Demo/auto-setup → giải #112

Số đơn đăng ký : 12
Số suất đua    : 7      ← thiếu 5
Số làn của race: 12
```

### Nguyên nhân

```csharp
if (jockeyProfile != null)      // jockey nào thiếu hồ sơ thì bị bỏ qua âm thầm
{
    var raceEntry = new RaceEntry { ... };
    _context.RaceEntries.Add(raceEntry);
}
```

God API lấy 12 nài ngựa đầu tiên, trong đó có những tài khoản `jockeysu*` thiếu hồ sơ
(mục 1) nên bị bỏ qua. Kết quả là cuộc đua thiếu ngựa mà **không có cảnh báo gì**.

### Đề xuất

Sửa mục 1 là hết lỗi này. Ngoài ra nên **chỉ chọn nài ngựa đã có hồ sơ** ngay từ đầu, và
báo lỗi rõ nếu không đủ:

```csharp
var jockeys = await _context.JockeyProfiles
    .Include(p => p.User)
    .Where(p => p.User.Status == "Active")
    .Take(12)
    .ToListAsync();

if (jockeys.Count < 12)
    throw new InvalidOperationException(
        $"Chi co {jockeys.Count} nai ngua co ho so, can 12 de dung giai demo.");
```

Im lặng bỏ qua khiến người dùng tưởng đã tạo đủ, tới lúc vào xem mới thấy thiếu.

---

## 🟡 3. God API đặt trạng thái giải là `Scheduled` — tên này không có trong hệ thống

**Nơi sửa:** `backend/src/HorseRacing.API/Services/DemoService.cs`

Bản trước dùng `"RegistrationClosed"`, đã sửa thành `"PendingScheduling"` — nhưng sau khi
tạo cuộc đua thì giải lại được chuyển sang `"Scheduled"`.

### Kiểm chứng

```sql
SELECT Status, COUNT(*) FROM Tournament GROUP BY Status;

Registration Open        6
Upcoming                 2
Registration Suspended   1
RegistrationClosed       1   ← còn sót từ bản trước
Scheduled                1   ← mới
Active                   1
Cancelled                1
Completed                1
PendingAdminAttention    1
PendingRegistration      1
```

Bộ trạng thái mà hệ thống dùng thống nhất là:

```
PendingRegistration · Registration Open · Registration Suspended
PendingScheduling · Upcoming · Active · AwaitingResults · Completed · Cancelled
PendingAdminAttention
```

Không có `Scheduled`. Giao diện tra bảng cấu hình không khớp → giải demo hiển thị sai nhãn.

### Đề xuất

Sau khi tạo cuộc đua, dùng **`"Upcoming"`** — đúng nghĩa *"đã xếp lịch, chờ tới ngày đua"*
và khớp với luồng sinh cuộc đua thủ công (`generate-races` cũng chuyển giải sang `Upcoming`).

*(Frontend đã chuẩn hoá cách tra bảng nên tạm chịu được, nhưng nên thống nhất ở gốc.)*

---

## 🟡 4. Tên trường trong phản hồi lỗi không thống nhất

Mỗi controller đặt tên một kiểu:

| Nơi | Trường chứa câu lỗi |
|---|---|
| Phần lớn controller | `message` |
| `DemoController` | `error` + `details` |
| ASP.NET tự sinh | `title` + `errors` |
| Một số chỗ lỗi 500 | `message` + `detail` |

Frontend đã nhận hết các kiểu này nên không gấp, nhưng thống nhất về một dạng sẽ đỡ rủi
ro bỏ sót về sau. Đề xuất dùng chung `{ message, blockers?, detail? }`.

---

## Tổng hợp

| # | Nội dung | Mức độ | Nơi sửa |
|---|---|---|---|
| 1 | 55 tài khoản nài ngựa thiếu hồ sơ → không dùng được | 🔴 Cao | `DataSeeder.cs` |
| 2 | God API chỉ tạo 7/12 suất đua, không cảnh báo | 🟡 Vừa | `DemoService.cs` |
| 3 | God API đặt trạng thái `Scheduled` không có trong hệ thống | 🟡 Vừa | `DemoService.cs` |
| 4 | Tên trường phản hồi lỗi chưa thống nhất | 🟡 Vừa | Các controller |

Mục 1 là gốc của mục 2 — sửa mục 1 thì mục 2 tự hết. Mục 2 và 3 nằm cùng một file.

---

## Phía frontend đã xử lý

| Nội dung | Trạng thái |
|---|---|
| Chuẩn hoá tra bảng trạng thái (chịu được cả `RegistrationClosed` lẫn `Registration Closed`) | ✅ |
| Báo lỗi rõ khi tài khoản thiếu hồ sơ nài ngựa, thay vì *"Failed to load"* chung chung | ✅ |
| Hiển thị mảng `blockers` khi hành động bị chặn | ✅ |
| Nhận thêm trường `error` / `details` để không hiện JSON thô | ✅ |
| Đồng bộ luật mật khẩu (8 ký tự + chữ hoa/thường/số/ký tự đặc biệt) | ✅ |
| Nhãn `Pending` cho lệnh rút tiền chờ duyệt ở ví Chủ ngựa | ✅ |
