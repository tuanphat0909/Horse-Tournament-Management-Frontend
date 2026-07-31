# Nghiệp vụ hợp đồng, phí giải và xử lý khi huỷ giải

**Ngày:** 31/07/2026
**Phạm vi:** Thiết kế nghiệp vụ — không phải báo cáo lỗi kỹ thuật

---

## Quyết định của nhóm

> **Phần tiền bạc của hợp đồng giữa chủ ngựa và nài ngựa được xử lý ngoài hệ thống.**
> Hệ thống chỉ chịu trách nhiệm **thông báo cho những người liên quan khi giải bị huỷ**.

Đây là quyết định thu hẹp phạm vi hợp lý với một đồ án môn học: dòng tiền hợp đồng là bài
toán tài chính phức tạp (giữ tạm, hoàn theo mức lỗi, tranh chấp), làm nửa vời sẽ rối hơn
là không làm. Tài liệu này ghi lại **những gì hệ thống chịu trách nhiệm**, và **những gì
cố ý để ngoài** cùng lý do — để trả lời được khi bị hỏi.

---

## 1. Phần hệ thống chịu trách nhiệm — đã có và chạy đúng

Đã kiểm chứng bằng cách huỷ thật giải **#100** trên máy:

```
PUT /api/admin/tournaments/100/cancel   { reason: "Khong du so luong ngua dang ky" }
→ 200 "Tournament cancelled successfully."

Trạng thái giải : Cancelled
Thông báo gửi đi:
   • 3  chủ ngựa   → kèm liên kết /owner/tournaments
   • 12 nài ngựa   → kèm liên kết /jockey/schedule
   • Khán giả      → phát cho toàn bộ vai trò Spectator
   • Trọng tài     → kèm câu "Your officiating assignment is no longer active."

Nội dung: "Tournament 'DEMO 3 - Cho xep lich' has been cancelled. Reason: ..."
```

Nghĩa là yêu cầu *"thông báo cho người tham gia biết giải đã bị huỷ"* **đã đạt** — không
cần làm thêm gì.

### Ai nhận được thông báo

| Vai trò | Cách lấy danh sách | Liên kết đính kèm |
|---|---|---|
| Chủ ngựa | Chủ của những ngựa đã đăng ký giải | `/owner/tournaments` |
| Nài ngựa | Người có hợp đồng trong giải | `/jockey/schedule` |
| Trọng tài | Người được phân công cho các cuộc đua của giải | `/referee/schedule` |
| Khán giả | Phát cho toàn bộ vai trò Spectator | `/spectator/tournaments/{id}` |

Lý do huỷ do quản trị viên nhập được gắn kèm vào nội dung, nên người nhận biết vì sao.

---

## 2. Phần cố ý để ngoài hệ thống

| Nội dung | Xử lý |
|---|---|
| Phí cưỡi ngựa (`RentalFee`) | Hai bên tự thoả thuận và thanh toán bên ngoài |
| Phần trăm tiền thưởng cho nài ngựa (`WinningBonusPercentage`) | Chủ ngựa tự chia sau khi nhận thưởng |
| Đền bù khi giải bị huỷ | Hai bên tự giải quyết |
| Phí tham gia giải của chủ ngựa | Không thu qua hệ thống |

Hai cột `RentalFee` và `WinningBonusPercentage` **vẫn giữ trong hợp đồng** với vai trò
**ghi nhận thoả thuận** — để hai bên có căn cứ đối chiếu khi thanh toán bên ngoài, và để
sau này muốn nối vào luồng thanh toán thì đã có sẵn chỗ.

### Hệ quả: đã bỏ chức năng nạp tiền của chủ ngựa

Khi phí giải và tiền thuê nài ngựa đều thanh toán bên ngoài thì **chủ ngựa không còn lý
do gì để nạp tiền vào hệ thống** — ví của họ chỉ còn một chiều: nhận tiền thưởng rồi rút
ra. Để nút *Nạp tiền* nằm đó mà không dùng vào việc gì sẽ khiến người chấm hỏi ngay
"nạp vào để làm gì".

Đã xoá ở phía giao diện:

| Chỗ | Thay đổi |
|---|---|
| `src/pages/owner/OwnerDepositPage.jsx` | Xoá cả trang |
| `src/routes/index.jsx` | Xoá tuyến `/owner/wallet/deposit` |
| `src/components/layout/Sidebar.jsx` | Bỏ mục *Deposit* khỏi nhóm Ví của chủ ngựa |
| `src/pages/owner/OwnerWalletOverviewPage.jsx` | Bỏ tab lọc *Deposit* |

Vẫn **giữ** kiểu giao dịch `deposit` trong bảng màu của trang tổng quan ví, để những
giao dịch nạp cũ còn trong lịch sử vẫn hiện đúng nhãn thay vì rơi vào nhóm *Other*.

Khán giả **vẫn nạp tiền bình thường** — họ cần tiền trong ví để đặt cược, đó là dòng
tiền duy nhất hệ thống thực sự quản lý.

### Nói thế nào khi bị hỏi

> "Hợp đồng trong hệ thống đóng vai trò **ghi nhận thoả thuận** giữa chủ ngựa và nài ngựa
> — ai cưỡi ngựa nào, ở giải nào, phí bao nhiêu, thưởng bao nhiêu phần trăm. Phần thanh
> toán thực tế nhóm em để hai bên tự xử lý bên ngoài, vì làm dòng tiền hợp đồng đầy đủ
> cần cơ chế giữ tạm và quy tắc hoàn tiền theo mức độ lỗi của từng bên — vượt phạm vi đồ
> án. Hệ thống chịu trách nhiệm phần thông tin: khi giải bị huỷ thì báo ngay cho tất cả
> chủ ngựa, nài ngựa, trọng tài và khán giả kèm lý do, để họ chủ động xử lý phần của mình."

Cách trả lời này **trung thực và có ranh giới rõ** — tốt hơn nhiều so với việc để lộ ra là
chưa nghĩ tới.

---

## 3. Một chỗ còn kẹt cần xử lý

### 🔴 Giải đã có người đặt cược thì không huỷ được

**Kiểm chứng:**

```
PUT /api/admin/tournaments/101/cancel
→ 400 "Tournament with existing bets cannot be cancelled until bets are refunded."
```

Backend chặn đúng — không thể huỷ giải khi tiền cược của khán giả còn treo. **Nhưng rà
toàn bộ mã nguồn thì không có API hoàn cược nào**, cũng không có hàm hoàn cược nào trong
tầng nghiệp vụ.

**Hậu quả:** giải nào đã có người đặt cược thì **không bao giờ huỷ được**. Câu thông báo
lỗi bảo *"cho tới khi cược được hoàn"* nhưng không có cách nào hoàn.

### Vì sao lại rơi vào tình huống này

Dễ tưởng huỷ giải chỉ dành cho giải *chưa đủ ngựa*, nhưng backend không làm vậy — huỷ được
ở **mọi trạng thái trừ** `Active`, `AwaitingResults`, `Completed`, `Cancelled`. Trong khi
đó đặt cược mở ngay khi lịch đua được xếp, tức là **trước** lúc giải sang `Active`.

```
… → PendingScheduling → Upcoming ──────► Active → AwaitingResults → Completed
                            │
              ┌─────────────┴─────────────┐
              │  đặt cược : ĐÃ MỞ         │  ← khoảng chồng lấn
              │  huỷ giải : VẪN CHO PHÉP  │
              └───────────────────────────┘
```

Trên cơ sở dữ liệu máy hiện có **5 giải** nằm trong khoảng này. Đây là chỗ **buộc phải xử
lý**, vì nó liên quan tới tiền thật của khán giả trong hệ thống — khác với phí hợp đồng
vốn đã thống nhất để ngoài.

### Hai hướng, chọn một

| Hướng | Cách làm | Đánh giá |
|---|---|---|
| **A. Hoàn cược rồi huỷ** | Khi huỷ giải, duyệt các vé cược `Pending`, cộng tiền lại vào ví người đặt, đổi vé thành `Refunded`, gửi thông báo | Thực tế hơn — giải vẫn huỷ được khi có sự cố (thời tiết, doping), người chơi không mất tiền |
| **B. Khoá huỷ từ lúc mở cược** | Thêm `Upcoming` vào danh sách không cho huỷ; đã nhận cược thì giải buộc phải chạy | **Gọn hơn, hợp phạm vi đồ án** — chỉ sửa điều kiện và câu lỗi, không phải viết luồng hoàn tiền |

**Nếu chọn hướng B**, bắt buộc đổi luôn câu thông báo lỗi — câu hiện tại hứa hẹn một cơ chế
hoàn tiền không tồn tại. Khi vấn đáp thì nói thẳng: *"giải đã mở bán cược thì không huỷ
được nữa, vì tiền cược đã vào hệ thống."*

**Nếu chọn hướng A**, gộp vào chính hàm huỷ giải để người dùng chỉ cần một thao tác:

```csharp
// Trong CancelTournamentAsync, làm trước khi đổi trạng thái giải
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
        bet.UserId,
        "Bet refunded",
        $"Your bet of {bet.Amount:N0} has been refunded because tournament "
        + $"'{tournament.Name}' was cancelled.",
        "Wallet", (int)tournament.TournamentId, actionUrl: "/spectator/wallet");
}
```

**Phía giao diện cần thêm:** trong hộp thoại xác nhận huỷ giải, nếu giải có cược thì báo
trước *"Giải này đang có N vé cược trị giá X. Huỷ giải sẽ hoàn lại toàn bộ cho người
chơi."* — để quản trị viên biết hậu quả trước khi bấm.

---

## 4. Tóm tắt

| # | Nội dung | Trạng thái |
|---|---|---|
| 1 | Thông báo cho chủ ngựa, nài ngựa, trọng tài, khán giả khi huỷ giải | ✅ **Đã có, chạy đúng** |
| 2 | Lý do huỷ hiển thị trong thông báo | ✅ Đã có |
| 3 | Thanh toán hợp đồng nài ngựa | ⬜ **Cố ý để ngoài hệ thống** |
| 4 | Phí tham gia giải | ⬜ **Cố ý để ngoài hệ thống** |
| 5 | Bỏ nạp tiền của chủ ngựa (ví chỉ còn nhận thưởng → rút) | ✅ **Đã xoá ở giao diện** |
| 6 | Xử lý giải đã mở cược khi huỷ | 🔴 **Đang kẹt — chờ chọn hướng A hay B** |

Chỉ còn **mục 6** cần làm, và nó nằm ở phía backend. Mục 3 và 4 là quyết định có chủ đích
của nhóm chứ không phải thiếu sót.
