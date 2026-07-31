# Báo cáo gửi Backend

**Cập nhật:** 31/07/2026
**Bản backend đã kiểm tra:** commit `4b87585` — *fix: QA feedback on God API, DataSeeder, and Tournament Status (#153)*
**Môi trường:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`

Tất cả nội dung bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

> **Đã sửa xong ở bản `4b87585`:** DataSeeder nay tự tạo hồ sơ nài ngựa còn thiếu (kể cả
> vá dữ liệu cũ khi khởi động), God API lấy thẳng từ bảng hồ sơ nên tạo đủ 12/12 suất đua
> và đặt giải về `Upcoming` đúng chuẩn. Đã chạy lại và xác nhận cả ba.
>
> File này chỉ liệt kê những gì **còn phải xử lý**. Mục nào có dấu 🆕 là mới phát hiện
trong lần kiểm tra gần nhất; mục không có dấu là đã báo từ trước mà chưa sửa.

**Cách dùng file này:** mỗi lần kiểm tra lại, tôi xoá các mục backend đã sửa và thêm mục
mới kèm ngày phát hiện — nên file luôn phản ánh đúng tình trạng hiện tại, không cộng dồn
lịch sử. Muốn xem lại các lỗi đã sửa thì tra trong lịch sử git của file này.

---

## 🔴 1. Ràng buộc khoá tài khoản của **Nài ngựa** vẫn dùng danh sách trạng thái cũ

> *Báo từ 31/07, backend chưa xử lý — đã kiểm chứng lại trên bản `4b87585` vẫn còn.*

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

## 🔴 2. 🆕 Giải đã có người đặt cược thì **không bao giờ huỷ được** — thiếu cơ chế hoàn cược

> *Phát hiện 31/07 khi chạy thử vòng đời huỷ giải trên máy.*

**Nơi sửa:** `TournamentService.CancelTournamentAsync`

### Kiểm chứng

```
PUT /api/admin/tournaments/100/cancel  (giải không có cược)
→ 200 "Tournament cancelled successfully."
   Thông báo gửi tới 3 chủ ngựa + 12 nài ngựa + trọng tài + khán giả ✅

PUT /api/admin/tournaments/101/cancel  (giải có cược)
→ 400 "Tournament with existing bets cannot be cancelled until bets are refunded."
```

Chặn như vậy là **đúng** — không thể huỷ giải khi tiền cược của khán giả còn treo. Nhưng
rà toàn bộ mã nguồn thì **không có API hoàn cược nào**, cũng không có hàm `RefundBet` /
`RefundAllBets` ở tầng nghiệp vụ.

### Hậu quả

Câu lỗi bảo *"cho tới khi cược được hoàn"* nhưng **không tồn tại cách nào để hoàn**. Nghĩa
là chỉ cần một người đặt cược là giải đó **kẹt vĩnh viễn**, không huỷ được nữa dù có lý do
chính đáng (thiếu ngựa, thời tiết, sự cố sân).

### Đề xuất

Gộp hoàn cược vào chính hàm huỷ giải, làm trước khi đổi trạng thái — quản trị viên chỉ cần
một thao tác:

```csharp
var pendingBets = await _context.Bets
    .Where(b => raceIds.Contains(b.RaceId) && b.Status == "Pending")
    .ToListAsync();

foreach (var bet in pendingBets)
{
    var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == bet.UserId);
    if (wallet == null) continue;

    wallet.Balance += bet.Amount;
    bet.Status = "Refunded";

    _context.WalletTransactions.Add(new WalletTransaction
    {
        WalletId = wallet.WalletId,
        Amount = bet.Amount,
        Type = "BetRefund",
        Description = $"Refund for cancelled tournament '{tournament.Name}'",
        CreatedAt = DateTime.UtcNow
    });

    await _notificationService.SendNotificationToUserAsync(
        bet.UserId, "Bet refunded",
        $"Your bet of {bet.Amount:N0} has been refunded because tournament "
        + $"'{tournament.Name}' was cancelled.",
        "Wallet", (int)tournament.TournamentId, actionUrl: "/spectator/wallet");
}
```

**Nếu backend làm phần này**, phía frontend sẽ bổ sung cảnh báo trong hộp thoại xác nhận
huỷ: *"Giải này đang có N vé cược trị giá X — huỷ giải sẽ hoàn lại toàn bộ cho người
chơi."* Cần backend trả về số vé và tổng tiền cược trong dữ liệu chi tiết giải để hiện
được con số này.

---

## 🟡 3. Tên trường trong phản hồi lỗi không thống nhất

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
| 1 | Ràng buộc khoá tài khoản của Nài ngựa vẫn dùng danh sách trạng thái cũ | 🔴 Cao | 31/07 | `UserRepository.cs` |
| 2 | 🆕 Giải có cược không huỷ được vì thiếu cơ chế hoàn cược | 🔴 Cao | 31/07 | `TournamentService.cs` |
| 3 | Tên trường phản hồi lỗi chưa thống nhất | 🟡 Vừa | 30/07 | Các controller |

**Ưu tiên mục 1** — chỉ cần sửa một hàm, dùng lại đúng cách đã áp dụng cho Chủ ngựa.
**Mục 2 nặng hơn** vì đang khoá cứng một luồng nghiệp vụ và dính tới tiền của người dùng.

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
| Bỏ chức năng nạp tiền của Chủ ngựa — ví chỉ còn nhận thưởng rồi rút (phí giải và tiền thuê nài ngựa thanh toán ngoài hệ thống) | ✅ |
