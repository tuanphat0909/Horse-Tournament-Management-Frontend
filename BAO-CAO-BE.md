# Báo cáo gửi Backend

**Cập nhật:** 31/07/2026
**Bản backend đã kiểm tra:** commit `90a1064` — *Merge PR #152 (vulnerability concurrency fixes)*
**Môi trường:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`

Tất cả nội dung bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

> **Đã sửa xong ở bản này:** trạng thái `RegistrationClosed` → `PendingScheduling`, God API
> đã gán ngày mở/đóng đăng ký, tài liệu đã sửa đường dẫn nạp ví. Ghi nhận thêm: God API
> nay còn tự tạo cuộc đua và gán trọng tài — tiện hơn nhiều.
>
> File này chỉ liệt kê những gì **còn phải xử lý**. Mục nào có dấu 🆕 là mới phát hiện
trong lần kiểm tra gần nhất; mục không có dấu là đã báo từ trước mà chưa sửa.

**Cách dùng file này:** mỗi lần kiểm tra lại, tôi xoá các mục backend đã sửa và thêm mục
mới kèm ngày phát hiện — nên file luôn phản ánh đúng tình trạng hiện tại, không cộng dồn
lịch sử. Muốn xem lại các lỗi đã sửa thì tra trong lịch sử git của file này.

---

## 🆕 🔴 1. 55 tài khoản nài ngựa không dùng được vì thiếu hồ sơ

> *Phát hiện 31/07 — mục mới*

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

## 🆕 🟡 2. God API chỉ tạo được 7/12 suất đua

> *Phát hiện 31/07 — mục mới*

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

## 🆕 🟡 3. God API đặt trạng thái giải là `Scheduled` — tên này không có trong hệ thống

> *Phát hiện 31/07 — mục mới*

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

## 🆕 🔴 5. Ràng buộc khoá tài khoản của **Nài ngựa** vẫn dùng danh sách trạng thái cũ

> *Phát hiện 31/07 — mục mới. Đây là phần còn sót của bản sửa hôm qua.*

**Nơi sửa:** `backend/src/HorseRacing.Infrastructure/Repositories/UserRepository.cs`
— hàm `HasUpcomingJockeyAssignmentsAsync`

Bản sửa hôm qua đã đổi ràng buộc của **Chủ ngựa** sang cách đảo ngược logic (giải nào
chưa `Completed`/`Cancelled` thì coi là đang diễn ra) — rất tốt. Nhưng **hàm dành cho
Nài ngựa thì bị bỏ sót**, vẫn giữ nguyên cách liệt kê cũ:

```csharp
public async Task<bool> HasUpcomingJockeyAssignmentsAsync(int jockeyId)
{
    return await _context.JockeyContracts.AnyAsync(c =>
        c.JockeyId == jockeyId &&
        c.Status == "Active" &&
        c.Tournament != null &&
        (c.Tournament.Status == "PendingRegistration" ||
         c.Tournament.Status == "PendingScheduling"  ||
         c.Tournament.Status == "Pending"      ||   // không tồn tại trong hệ thống
         c.Tournament.Status == "Scheduled"    ||   // chỉ God API sinh ra
         c.Tournament.Status == "InProgress"));     // không tồn tại trong hệ thống
}
```

Danh sách này **thiếu hẳn** các trạng thái quan trọng: `Active`, `Upcoming`,
`Registration Open`, `Registration Suspended`, `AwaitingResults`.

### Kiểm chứng

Đưa ví về 0 để chỉ còn ràng buộc nghiệp vụ, rồi thử khoá:

```
jockey@gmail.com — hợp đồng Active ở giải trạng thái "Scheduled"  → BỊ CHẶN ✅
jk2@test.com     — hợp đồng Active ở giải trạng thái "Upcoming"   → KHOÁ ĐƯỢC ❌
```

### Hậu quả

**Nài ngựa đang có hợp đồng ở giải sắp đua (`Upcoming`) hoặc đang đua (`Active`) vẫn bị
khoá bình thường** — đúng tình huống cần chặn nhất. Ràng buộc hiện chỉ chặn được giải ở
giai đoạn chuẩn bị, tức là lúc ít quan trọng hơn.

### Đề xuất

Dùng chung một kiểu với hàm của Chủ ngựa cho thống nhất:

```csharp
public async Task<bool> HasUpcomingJockeyAssignmentsAsync(int jockeyId)
{
    return await _context.JockeyContracts.AnyAsync(c =>
        c.JockeyId == jockeyId &&
        c.Status == "Active" &&
        c.Tournament != null &&
        !(c.Tournament.Status == "Completed" || c.Tournament.Status == "Cancelled"));
}
```

**Nên rà thêm `HasUpcomingRefereeAssignmentsAsync`** — hàm này lọc theo trạng thái
*cuộc đua* (`Upcoming`, `Scheduled`, `Live`, `InProgress`, `Running`), trong đó
`InProgress` và `Running` cũng không thấy dùng ở đâu. Cùng cách sửa: loại trừ
`Completed`/`Cancelled` thay vì liệt kê.

---

## 🟡 4. Tên trường trong phản hồi lỗi không thống nhất

> *Báo từ 30/07, backend chưa xử lý*

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

| # | Nội dung | Mức độ | Phát hiện | Nơi sửa |
|---|---|---|---|---|
| 1 | 55 tài khoản nài ngựa thiếu hồ sơ → không dùng được | 🔴 Cao | 🆕 31/07 | `DataSeeder.cs` |
| 2 | God API chỉ tạo 7/12 suất đua, không cảnh báo | 🟡 Vừa | 🆕 31/07 | `DemoService.cs` |
| 3 | God API đặt trạng thái `Scheduled` không có trong hệ thống | 🟡 Vừa | 🆕 31/07 | `DemoService.cs` |
| 4 | Tên trường phản hồi lỗi chưa thống nhất | 🟡 Vừa | 30/07 | Các controller |
| 5 | Ràng buộc khoá tài khoản của Nài ngựa vẫn dùng danh sách trạng thái cũ | 🔴 Cao | 🆕 31/07 | `UserRepository.cs` |

**Hai mục cần ưu tiên:** số 1 và số 5 — đều khiến tính năng đã làm nhưng không chạy đúng.

Mục 1 là gốc của mục 2, sửa mục 1 thì mục 2 tự hết. Mục 2 và 3 nằm cùng một file
`DemoService.cs`. Mục 5 chỉ cần sửa một hàm, dùng lại đúng cách đã áp dụng cho Chủ ngựa.

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
