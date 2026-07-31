# Báo cáo gửi Backend

**Cập nhật:** 01/08/2026
**Bản backend đã kiểm tra:** commit `0f97e5e` — *Merge pull request #159*
**Môi trường:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`

Tất cả nội dung bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

> File này chỉ liệt kê những gì **còn phải xử lý**. Phần backend đã sửa xong được chuyển
> xuống mục *"Backend đã sửa xong"* ở cuối, và các thay đổi mới cần frontend lưu ý nằm ở
> mục *"Thay đổi mới"*.

**Cách dùng file này:** mỗi lần kiểm tra lại, tôi xoá các mục backend đã sửa và thêm mục
mới kèm ngày phát hiện — nên file luôn phản ánh đúng tình trạng hiện tại, không cộng dồn
lịch sử. Muốn xem lại các lỗi đã sửa thì tra trong lịch sử git của file này.

---

## 🔴 1. Giải đã có người đặt cược thì **không bao giờ huỷ được** — thiếu cơ chế hoàn cược

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

### Vì sao tình huống này xảy ra được — hai điều kiện đang chồng lấn

Điều kiện huỷ giải (`TournamentService.cs:1400`) chỉ loại trừ 4 trạng thái:

```csharp
new[] { "Active", "AwaitingResults", "Completed", "Cancelled" }
```

Điều kiện đặt cược (`BettingService.cs:104-116`) cho phép khi cuộc đua ở
`Upcoming`/`Scheduled` và giải chưa `finished`/`completed`/`cancelled`/`ended`.

Lịch đua được xếp **trước** khi giải chuyển sang `Active`. Nên có nguyên một khoảng —
giải `Upcoming` + cuộc đua `Scheduled` — mà **vừa nhận cược được, vừa huỷ được**:

```
… → PendingScheduling → Upcoming ──────► Active → AwaitingResults → Completed
                            │
              ┌─────────────┴─────────────┐
              │  đặt cược : ĐÃ MỞ         │  ← khoảng chồng lấn
              │  huỷ giải : VẪN CHO PHÉP  │
              └───────────────────────────┘
```

Giải #101 nằm đúng trong khoảng này: `Upcoming`, cuộc đua `Scheduled`, 1 vé cược 15.000
đang `Pending`. Trên cơ sở dữ liệu máy hiện có **5 giải** rơi vào khoảng này.

### Hậu quả

Câu lỗi bảo *"cho tới khi cược được hoàn"* nhưng **không tồn tại cách nào để hoàn**. Nghĩa
là chỉ cần một người đặt cược là giải đó **kẹt vĩnh viễn**, không huỷ được nữa dù có lý do
chính đáng (thời tiết, sự cố sân, doping).

### Hai hướng sửa — cần backend chọn một

| Hướng | Ý nghĩa nghiệp vụ | Công sức |
|---|---|---|
| **A. Hoàn cược rồi huỷ** | Giải đã mở cược vẫn huỷ được; huỷ thì trả tiền lại cho người đặt | Phải viết thêm phần hoàn cược |
| **B. Khoá huỷ từ lúc mở cược** | Một khi đã nhận tiền cược thì giải buộc phải chạy | Chỉ sửa điều kiện + câu lỗi |

**Nếu chọn hướng B**, thêm `Upcoming` vào danh sách trạng thái không cho huỷ, và **đổi câu
lỗi** thành đại ý *"Tournament that has opened betting cannot be cancelled."* — câu hiện
tại hứa hẹn một cơ chế hoàn tiền không tồn tại, gây hiểu nhầm cho cả người dùng lẫn người
đọc mã nguồn.

**Nếu chọn hướng A**, gộp hoàn cược vào chính hàm huỷ giải, làm trước khi đổi trạng thái —
quản trị viên chỉ cần một thao tác:

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

**Phía frontend sẽ làm gì tuỳ theo hướng backend chọn:**

- *Hướng A* — hiện cảnh báo trong hộp thoại xác nhận huỷ: *"Giải này đang có N vé cược trị
  giá X — huỷ giải sẽ hoàn lại toàn bộ cho người chơi."*
- *Hướng B* — ẩn luôn nút Huỷ với giải đã mở cược, kèm chú thích lý do, để quản trị viên
  không bấm vào rồi nhận lỗi.

Cả hai hướng đều cần backend trả về **số vé cược và tổng tiền cược** trong dữ liệu chi tiết
giải — hiện chưa có trường nào cho thông tin này.

---

## 🔴 2. Chạy BE bằng file `.exe` là vô tình nối thẳng vào database deploy

> *Phát hiện 31/07 khi God API báo "Chỉ có 1 nài ngựa có hồ sơ" dù DB local có 93.*

**Nơi sửa:** cấu hình khởi chạy, không phải mã nghiệp vụ.

### Chuyện gì xảy ra

`launchSettings.json` đặt `ASPNETCORE_ENVIRONMENT=Development`, nhưng file này **chỉ có
tác dụng khi chạy qua `dotnet run` hoặc Visual Studio**. Bấm thẳng vào
`bin/Debug/net10.0/HorseRacing.API.exe` thì biến môi trường không được đặt → .NET mặc định
**Production** → đọc `appsettings.json` → **Azure SQL deploy**.

### Kiểm chứng

Cùng một file `.exe`, chỉ khác biến môi trường:

```
(khong dat bien)                    → DB Azure  →  God API: "Chi co 1 nai ngua co ho so"
ASPNETCORE_ENVIRONMENT=Development  → DB local  →  God API: tao xong giai #115, 12 ngua + 12 nai
```

### Hậu quả

Người chạy BE trên máy **tưởng đang thử trên dữ liệu local nhưng thực ra đang đọc ghi vào
cơ sở dữ liệu thật của bản deploy**. Riêng God API thì có transaction bao ngoài nên lần
hỏng đã rollback, nhưng **các luồng khác không chắc đều được bảo vệ như vậy** — huỷ giải,
khoá tài khoản, duyệt rút tiền đều là thao tác ghi.

### Đề xuất

1. Đổi `appsettings.json` mặc định về chuỗi kết nối **local**, và đưa chuỗi Azure sang
   `appsettings.Production.json` hoặc biến môi trường trên máy chủ. Mặc định an toàn phải
   là local — chạy nhầm ra local thì vô hại, chạy nhầm ra deploy thì hỏng dữ liệu thật.
2. Ghi rõ trong README cách chạy đúng: `dotnet run` chứ không bấm file `.exe`.
3. **Chuỗi kết nối Azure hiện đang nằm trong `appsettings.json` và đã commit lên git, kèm
   nguyên văn mật khẩu tài khoản `dac-admin`.** Ai clone được repo là vào được cơ sở dữ
   liệu thật. Nên đưa ra biến môi trường / user-secrets, và **đổi mật khẩu** vì mật khẩu cũ
   đã nằm trong lịch sử git.

---

## 🔴 3. Giải không bao giờ tự chuyển sang `Active` — vòng đời giải bị kẹt

> *Phát hiện 31/07 khi chạy trọn vòng đời một giải trên máy.*

**Nơi sửa:** `TournamentService.cs` + `TournamentDeadlineWorker.cs`

### Chuyện gì xảy ra

Chỉ có **hai chỗ** trong toàn bộ mã nguồn đặt `tournament.Status = "Active"`:

| Dòng | Nằm trong hàm | Ai gọi |
|---|---|---|
| `TournamentService.cs:425` | `GetAllTournamentsAsync()` | **Không controller nào** |
| `TournamentService.cs:540` | `GetTournamentByIdAsync()` | `GET /public/tournaments/{id}/rounds` |

`TournamentDeadlineWorker` — tiến trình nền lo chuyển trạng thái theo mốc thời gian — xử lý
`PendingRegistration` → `Registration Open` → `PendingScheduling` → `Registration Suspended`,
nhưng **không hề đụng tới `Active`**.

### Hậu quả

Giải chỉ chuyển sang `Active` khi **có người tình cờ gọi `GET /public/tournaments/{id}/rounds`**.
Frontend không gọi endpoint này ở đâu, nên trên thực tế giải **nằm mãi ở `Upcoming`**, kéo theo:

- Không kết thúc giải được — `CompleteTournamentAsync` đòi `Status == "Active"`
- Không trao thưởng được
- Vòng đời một giải không bao giờ chạy hết

### Kiểm chứng

Giải #117, ngày bắt đầu đã lùi về quá khứ, trọng tài đã phân công đủ:

```
Truoc khi goi   → Status = Upcoming   (dung yen, ke ca sau khi worker chay)
GET /api/public/tournaments/117/rounds
Sau khi goi     → Status = Active     ✅
```

### Đề xuất

Chuyển logic kích hoạt vào `TournamentDeadlineWorker` — nơi đã có sẵn vòng lặp theo mốc
thời gian và đã xử lý mọi chuyển trạng thái khác. Điều kiện y như hiện tại: tới ngày bắt
đầu, mọi cuộc đua đã có trọng tài thì sang `Active`, thiếu trọng tài thì sang
`PendingAdminAttention`.

**Không nên để một endpoint `GET` thay đổi dữ liệu.** Ngoài chuyện khó đoán, nó còn khiến
trạng thái giải phụ thuộc vào việc có ai mở trang hay không.

---

## 🟡 4. Endpoint duy nhất trả về danh sách vòng đấu không được frontend dùng

> *Phát hiện 31/07.*

`GET /public/tournaments/{id}/rounds` trả về đầy đủ vòng đấu kèm cuộc đua bên trong — đúng
thứ trang quản lý cuộc đua cần. Nhưng frontend lại đọc `rounds` từ `/public/tournaments`,
mà DTO của endpoint đó **không có trường này** (chỉ 12 trường tóm tắt).

Frontend đã tự xử lý bằng cách dựng lại vòng từ lịch đua (`/public/races/schedule` có sẵn
`roundId`, `roundName`, `roundNumber`), nên **không cần backend sửa gấp**. Ghi lại để backend
biết là có một endpoint đang không ai dùng, và cân nhắc thêm `rounds` vào DTO danh sách giải
cho nhất quán.

---

## 🟡 5. Tên trường trong phản hồi lỗi không thống nhất

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
| 1 | Điều kiện huỷ giải và điều kiện đặt cược chồng lấn → giải có cược kẹt vĩnh viễn | 🔴 Cao | 31/07 | `TournamentService.cs:1406` |
| 2 | Chạy `.exe` là nối thẳng vào DB deploy + chuỗi kết nối kèm mật khẩu đã commit | 🔴 Cao | 31/07 | `appsettings.json` |
| 3 | Giải không tự chuyển sang `Active`, vòng đời giải bị kẹt ở `Upcoming` | 🔴 Cao | 31/07 | `TournamentDeadlineWorker.cs` |
| 4 | Endpoint trả về vòng đấu không được frontend dùng | 🟡 Vừa | 31/07 | `PublicController.cs` |
| 5 | Tên trường phản hồi lỗi chưa thống nhất | 🟡 Vừa | 30/07 | Các controller |

**Ưu tiên mục 3** — chặn cứng việc chạy trọn vòng đời một giải, cần xong trước buổi trình bày.
**Mục 2** là mục duy nhất có thể gây hỏng dữ liệu thật; phần đổi mật khẩu nên làm sớm vì
mật khẩu cũ đã nằm trong lịch sử git.

---

## ✅ Backend đã sửa xong ở bản `0f97e5e`

| Nội dung đã báo | Trạng thái |
|---|---|
| Ràng buộc khoá tài khoản của Nài ngựa dùng danh sách trạng thái cũ | ✅ Đã sửa đúng cách đề xuất — nay loại trừ `Completed`/`Cancelled` thay vì liệt kê (`UserRepository.cs:85`) |
| Đoạn tự vá hồ sơ nài ngựa không chạy | ⚠️ Không còn liên quan — `DataSeeder` đã bị **tắt hẳn** ở `Program.cs:117-118` |

---

## 🆕 Thay đổi mới cần phía frontend lưu ý

Rà 27 commit vừa được gộp vào `main`:

| Thay đổi | Ảnh hưởng tới frontend |
|---|---|
| `auto-setup` → **`setup-race`**, bỏ `resolve-race`, thêm `start-race/{id}` | Ctrl+Space bị 404 — **đã sửa** ở phía frontend |
| `populate-tournament/{id}` nhận `?count=` (tối đa 48), không có giá trị mặc định | Thiếu tham số thì tạo 0 suất — **đã truyền mặc định 12** |
| Giới hạn **tối đa 3 ngựa mỗi chủ ngựa cho một giải** (`RegistrationService.cs:101`) | Nên hiện trước giới hạn ở trang đăng ký thay vì để người dùng bấm rồi mới báo lỗi |
| Tắt seeder tự động khi khởi động | Database mới sẽ **trống hoàn toàn** — phải dùng God API hoặc nhập tay |
| Xoá toàn bộ EF migrations, dùng thẳng schema đã deploy | Thay đổi schema từ nay phải làm tay trên cơ sở dữ liệu |
| Bỏ tự động phân công trọng tài trong `PopulateTournamentAsync` | Sau khi populate phải tự phân công trọng tài, nếu không giải không chạy được |

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
