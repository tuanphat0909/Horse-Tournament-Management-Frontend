# Báo cáo kiểm thử hệ thống & lỗ hổng nghiệp vụ

**Ngày kiểm thử:** 29/07/2026
**Môi trường:** Backend chạy local (`http://localhost:55446`) + SQL Server SQLEXPRESS local.
Không đụng tới cơ sở dữ liệu deploy.
**Phiên bản backend:** commit `c039f4e` (Feat/vet notifications fix #147)

---

# PHẦN A — Kết quả kiểm thử chức năng

## A1. Đăng nhập — 6/6 vai trò hoạt động

| Tài khoản | Vai trò | Kết quả |
|---|---|---|
| admin@gmail.com | Admin | ✅ |
| owner@gmail.com | HorseOwner | ✅ |
| jockey@gmail.com | Jockey | ✅ |
| referee@gmail.com | Referee | ✅ |
| spectator@gmail.com | Spectator | ✅ |
| vet@gmail.com | Veterinarian | ✅ |

## A2. Các màn hình đọc dữ liệu — 34/34 hoạt động

Đã gọi thử toàn bộ API mà giao diện sử dụng để hiển thị dữ liệu. **Không có màn hình
nào hiện ra nhưng không lấy được dữ liệu.**

- **Admin (15):** dashboard, danh sách tài khoản, đơn đăng ký, trọng tài, vi phạm,
  báo cáo trọng tài, cược, thống kê cược, ví hệ thống, lịch sử ví, nhật ký hoạt động,
  vai trò, phân công trọng tài, dự đoán, thống kê dự đoán
- **Horse Owner (6):** ngựa của tôi, đơn đăng ký, lời mời nài ngựa, kết quả, ví, lịch sử ví
- **Jockey (4):** hợp đồng, ngựa được giao, thống kê, vi phạm
- **Referee (2):** dashboard, vi phạm
- **Spectator (3):** cược của tôi, số dư, lịch sử ví
- **Veterinarian (4):** phiếu khám, chờ khám, được giao, ngựa không khoẻ

## A3. Phân quyền — 9/9 chặn đúng

Thử dùng token vai trò thấp gọi API vai trò cao, **tất cả đều trả HTTP 403**:
Spectator/Owner/Jockey/Vet/Referee đều không vào được API của Admin; Jockey không
xem được ví của Owner.

## A4. Truy cập dữ liệu người khác cùng vai trò (IDOR) — chặn đúng

Dùng token `owner@gmail.com` thao tác trên ngựa của `owner3@gmail.com`:

| Hành động | Kết quả |
|---|---|
| Xem chi tiết | ✅ chặn (404) |
| Sửa thông tin | ✅ chặn (403) |
| Xoá | ✅ chặn (403) |

## A5. Mã nguồn frontend

| Kiểm tra | Kết quả |
|---|---|
| Tất cả lệnh `import` khớp với `export` thật | ✅ 638/638 |
| Biên dịch từng file qua dev server | ✅ 96/96 |
| `npm run build` | ✅ |
| ESLint | ✅ sạch |
| knip (mã chết) | ✅ sạch |

---

# PHẦN B — Lỗ hổng nghiệp vụ phát hiện

Xếp theo mức độ. Mỗi lỗi ghi rõ **đã kiểm chứng thực tế** hay **phát hiện qua đọc mã nguồn**.

---

## 🔴 B1. Khoá tài khoản không kiểm tra ràng buộc đang tồn tại

> Đây chính là vấn đề giảng viên đã góp ý: *"cứ thế mà lock à? Người đó đang có hợp
> đồng hay đang có việc được giao thì sao?"*

**Đã kiểm chứng thực tế.**

**Nơi xử lý:** `AdminController.cs` — `UpdateUserStatus` (dòng ~1091)

**Hiện tại chỉ kiểm tra 2 điều:**
1. Quản trị viên không tự khoá chính mình
2. Không khoá quản trị viên cuối cùng còn hoạt động

**Kịch bản đã chạy thử:**

```
Tài khoản owner@gmail.com đang có:
  • 10 đơn đăng ký đã được duyệt
  • 5 ngựa đang thi đấu ở giải "Summer Grand Prix 2026" (trạng thái Active)
  • 25.000 trong ví

Gọi PUT /admin/users/426/status
→ Kết quả: "User status updated successfully"  — KHOÁ THÀNH CÔNG
→ Không có cảnh báo, không có xác nhận, không chặn
```

**Hậu quả:**
- 5 con ngựa vẫn nằm trong giải đang diễn ra nhưng chủ không đăng nhập được để theo dõi
- 25.000 trong ví bị treo, không rút được
- Nếu ngựa thắng giải, tiền thưởng trả vào ví của tài khoản đã bị khoá

**Cách các hệ thống thực tế xử lý:**

Không dùng một nút bật/tắt duy nhất, mà tách thành nhiều mức:

| Mức | Ý nghĩa | Khi nào dùng |
|---|---|---|
| **Đình chỉ một phần** | Chặn tạo mới (không đăng ký giải, không đặt cược) nhưng vẫn đăng nhập xem được, vẫn rút tiền | Khi còn nghĩa vụ chưa xong |
| **Khoá hoàn toàn** | Chặn đăng nhập | Chỉ khi đã sạch ràng buộc |
| **Đóng tài khoản** | Xoá mềm, giữ lịch sử | Người dùng chủ động rời đi |

Quy trình nên là: bấm khoá → hệ thống **kiểm tra ràng buộc** → nếu còn vướng thì hiện
bảng liệt kê cụ thể và bắt chọn hướng xử lý.

**Đề xuất triển khai:**

Thêm bước kiểm tra trước khi khoá, trả về danh sách vướng mắc thay vì khoá ngay:

```csharp
var blockers = new List<string>();

// Nài ngựa đang có hợp đồng hiệu lực
if (await context.JockeyContracts.AnyAsync(c => c.JockeyId == id && c.Status == "Active"))
    blockers.Add("Nài ngựa đang có hợp đồng còn hiệu lực");

// Chủ ngựa có ngựa đang thi đấu
if (await context.Registrations.AnyAsync(r =>
        r.Horse.OwnerId == id && r.Status == "Approved" &&
        r.Tournament.Status != "Completed" && r.Tournament.Status != "Cancelled"))
    blockers.Add("Có ngựa đang tham gia giải chưa kết thúc");

// Trọng tài đang được phân công cho cuộc đua sắp diễn ra
if (await context.RaceRefereeAssignments.AnyAsync(a =>
        a.RefereeId == id && a.Status == "Active" &&
        (a.Race.Status == "Scheduled" || a.Race.Status == "Live")))
    blockers.Add("Đang được phân công trọng tài cho cuộc đua sắp diễn ra");

// Còn tiền trong ví
var balance = await context.Wallets.Where(w => w.UserId == id)
                                   .Select(w => w.Balance).FirstOrDefaultAsync();
if (balance > 0)
    blockers.Add($"Ví còn {balance:N0}, cần tất toán trước");

// Còn cược chưa có kết quả
if (await context.Bets.AnyAsync(b => b.UserId == id && b.Status == "Pending"))
    blockers.Add("Còn cược chưa có kết quả");

if (blockers.Any() && !request.ForceLock)
    return BadRequest(new {
        message = "Tài khoản còn ràng buộc chưa xử lý xong.",
        blockers,
        hint = "Chọn 'Đình chỉ một phần' hoặc xử lý xong các mục trên rồi khoá."
    });
```

**Phía giao diện:** khi backend trả về danh sách `blockers`, hiện hộp thoại liệt kê rõ
từng mục kèm 2 lựa chọn: *"Đình chỉ một phần"* hoặc *"Vẫn khoá (ghi rõ lý do)"* —
không nên để một nút khoá trơ trọi như hiện tại.

---

## 🔴 B2. Đặt cược được TẤT CẢ ngựa trong cùng một cuộc đua

**Đã kiểm chứng thực tế.**

**Nơi xử lý:** `BettingService.cs` — `PlaceBetAsync`

**Kịch bản đã chạy thử:**

```
Cuộc đua #87 "Summer Grand Final" có 6 ngựa.
Cùng một tài khoản spectator@gmail.com đặt cược lần lượt:
  • Ngựa A (entry 721) — 100  → thành công
  • Ngựa B (entry 722) — 100  → thành công
  • Ngựa C (entry 723) — 100  → thành công
Không có bất kỳ cảnh báo nào.
```

**Vì sao nguy hiểm:** cược hết mọi ngựa thì **chắc chắn có một con thắng**. Nếu tỷ lệ
trả thưởng lớn hơn số ngựa trong cuộc đua, người chơi **luôn có lãi mà không cần dự
đoán đúng** — nhà cái lỗ có hệ thống. Trong ngành cá cược gọi là *arbitrage betting*.

Ví dụ: cuộc đua 6 ngựa, cược mỗi con 100 (tổng chi 600). Ngựa thắng trả tỷ lệ 1:10
→ nhận 1.000 → **lãi chắc chắn 400** dù đoán sai 5 con.

**Đề xuất:** mỗi người chỉ được cược **một ngựa cho mỗi cuộc đua**. Muốn đổi thì phải
huỷ cược cũ (nếu chưa tới giờ đua).

```csharp
var daCuoc = await _context.Bets
    .Include(b => b.RaceEntry)
    .AnyAsync(b => b.UserId == userId
                && b.RaceEntry.RaceId == raceId
                && b.Status == "Pending");

if (daCuoc)
    throw new InvalidOperationException(
        "Bạn đã đặt cược cho cuộc đua này. Mỗi cuộc đua chỉ được cược một ngựa.");
```

Nếu về sau muốn cho cược nhiều con (một số sàn có), thì phải tính lại tỷ lệ trả
thưởng theo tổng số tiền đã cược, chứ không dùng tỷ lệ cố định như hiện nay.

---

## 🔴 B3. Xoá ngựa không kiểm tra ngựa có đang thi đấu hay không

**Phát hiện qua đọc mã nguồn.**

**Nơi xử lý:** `HorseService.cs` — `DeleteHorseAsync` (dòng 127)

Toàn bộ nội dung hàm chỉ có:

```csharp
var horse = await _horseRepository.GetByIdAsync(id);
if (horse == null) throw new ArgumentException(...);
if (horse.OwnerId != ownerUserId) throw new InvalidOperationException("Access denied...");

_horseRepository.Delete(horse);   // xoá ngay, không kiểm tra gì thêm
```

**Không kiểm tra:**
- Ngựa đang có đơn đăng ký ở giải chưa kết thúc
- Ngựa đang nằm trong danh sách xuất phát của cuộc đua sắp diễn ra
- Ngựa đang có hợp đồng nài ngựa còn hiệu lực
- **Ngựa đang có người đặt cược** — đây là mục nguy hiểm nhất về mặt tiền bạc
- Ngựa đã có thành tích trong lịch sử (xoá đi là mất bảng xếp hạng)

**Hậu quả:** nếu ràng buộc khoá ngoại trong cơ sở dữ liệu chặn lại thì người dùng
nhận lỗi 500 khó hiểu; nếu không chặn thì mất dữ liệu và cuộc đua có chỗ trống.

**Đề xuất:** kiểm tra ràng buộc trước, và **xoá mềm** thay vì xoá hẳn với ngựa đã có
lịch sử thi đấu (giữ lại để bảng xếp hạng và lịch sử cược không bị hỏng).

```csharp
if (await _context.Registrations.AnyAsync(r => r.HorseId == id
        && r.Tournament.Status != "Completed" && r.Tournament.Status != "Cancelled"))
    throw new InvalidOperationException("Ngựa đang tham gia giải chưa kết thúc, không thể xoá.");

if (await _context.RaceEntries.AnyAsync(e => e.HorseId == id
        && (e.Race.Status == "Scheduled" || e.Race.Status == "Live")))
    throw new InvalidOperationException("Ngựa đang có tên trong cuộc đua sắp diễn ra.");

if (await _context.JockeyContracts.AnyAsync(c => c.HorseId == id && c.Status == "Active"))
    throw new InvalidOperationException("Ngựa đang có hợp đồng nài ngựa còn hiệu lực.");

// Đã từng thi đấu → xoá mềm để giữ lịch sử
if (await _context.RaceEntries.AnyAsync(e => e.HorseId == id))
{
    horse.IsDeleted = true;
    horse.DeletedAt = DateTime.UtcNow;
}
else
{
    _horseRepository.Delete(horse);
}
```

---

## 🔴 B4. Một con ngựa đăng ký được nhiều giải diễn ra cùng thời gian

**Phát hiện qua đọc mã nguồn.**

**Nơi xử lý:** `RegistrationService.cs` — `CreateRegistrationAsync`

Hiện chỉ kiểm tra *"ngựa này đã đăng ký **giải này** chưa"*:

```csharp
var existing = await _registrationRepository
    .GetByHorseIdAndTournamentIdAsync(request.HorseId, request.TournamentId);
```

**Không kiểm tra** ngựa đó có đang đăng ký **giải khác trùng khoảng thời gian** không.
Một con ngựa không thể chạy hai giải cùng lúc — đây là ràng buộc vật lý.

**Đề xuất:**

```csharp
var trungLich = await _context.Registrations
    .Include(r => r.Tournament)
    .Where(r => r.HorseId == request.HorseId
             && r.Status != "Rejected" && r.Status != "Cancelled"
             && r.Tournament.Status != "Completed" && r.Tournament.Status != "Cancelled"
             && r.Tournament.StartDate <= tournament.EndDate
             && r.Tournament.EndDate   >= tournament.StartDate)   // hai khoảng thời gian giao nhau
    .Select(r => r.Tournament.Name)
    .FirstOrDefaultAsync();

if (trungLich != null)
    throw new InvalidOperationException(
        $"Ngựa '{horse.Name}' đã đăng ký giải '{trungLich}' diễn ra cùng thời gian.");
```

---

## 🟡 B5. Không giới hạn số tiền cược tối thiểu

**Đã kiểm chứng thực tế.**

```
Đặt cược 0.01 → thành công, không có cảnh báo
```

Cược 0,01 đồng không có ý nghĩa kinh doanh, nhưng lại tạo bản ghi trong cơ sở dữ liệu,
sinh thông báo, và chiếm chỗ trong lịch sử. Nếu ai đó viết kịch bản tự động đặt hàng
chục nghìn lệnh cược nhỏ, hệ thống sẽ phình dữ liệu vô ích.

**Đề xuất:** đặt mức tối thiểu (ví dụ 10.000) và mức tối đa mỗi lần cược, đưa vào
cấu hình `appsettings.json` để chỉnh được mà không phải sửa mã nguồn.

*(Mức tối đa hiện đã có giới hạn gián tiếp qua số dư ví — thử cược 999.999 bị chặn
vì không đủ tiền.)*

---

## 🟡 B6. Danh tính trọng tài lấy từ dữ liệu người dùng gửi lên

**Phát hiện qua đọc mã nguồn.**

**Nơi xử lý:** `RaceResultService.cs` — `SubmitResultAsync` (dòng 63-75)

So với báo cáo trước, phần này **đã được vá một phần**: `RefereeId` giờ là bắt buộc và
có kiểm tra trọng tài đó có được phân công cho cuộc đua hay không.

**Nhưng `RefereeId` vẫn lấy từ phần thân yêu cầu (request body), không lấy từ mã
đăng nhập (JWT).** Nghĩa là trọng tài A vẫn có thể gửi `RefereeId` của trọng tài B —
nếu B được phân công cho cuộc đua đó — để nộp kết quả **thay mặt B**. Bản ghi sẽ ghi
tên B trong khi người thao tác thật là A.

**Đề xuất:** lấy danh tính từ mã đăng nhập, bỏ hẳn trường này khỏi dữ liệu gửi lên:

```csharp
var refereeUserId = GetCurrentUserId();      // lấy từ JWT, không tin dữ liệu client gửi
var referee = await _context.RefereeProfiles
    .FirstOrDefaultAsync(p => p.UserId == refereeUserId);
if (referee == null)
    throw new UnauthorizedAccessException("Tài khoản không phải trọng tài.");

var assignment = await _repository.GetAssignmentAsync(request.RaceId, referee.RefereeId);
```

Đây là nguyên tắc chung: **những gì liên quan tới danh tính và quyền hạn thì luôn lấy
từ mã đăng nhập, không bao giờ tin dữ liệu do trình duyệt gửi lên.**

---

## 🟡 B7. Đăng ký giải không kiểm tra tình trạng sức khoẻ trước

**Phát hiện qua đọc mã nguồn.**

Ngựa đang ở trạng thái `Injured` (chấn thương) hoặc `Recovering` (đang hồi phục) vẫn
đăng ký được, phải chờ tới bước bác sĩ thú y khám mới bị loại.

Việc này không gây lỗi, nhưng tạo ra đơn rác: chủ ngựa mất công đăng ký, bác sĩ mất
công khám rồi loại. Nên chặn ngay từ đầu và báo rõ lý do.

```csharp
if (horse.HealthStatus == "Injured" || horse.HealthStatus == "Recovering")
    throw new InvalidOperationException(
        $"Ngựa '{horse.Name}' đang ở trạng thái '{horse.HealthStatus}', " +
        "cần được bác sĩ thú y xác nhận hồi phục trước khi đăng ký giải.");
```

---

## 🟡 B8. Rút tiền không qua bước duyệt

**Đã nêu ở báo cáo trước, kiểm tra lại vẫn còn.**

**Nơi xử lý:** `WalletService.cs` — `WithdrawAsync` (dòng 135)

Chỉ kiểm tra số tiền lớn hơn 0 và đủ số dư, rồi **trừ tiền ngay lập tức**. Không có
trạng thái *"chờ duyệt"*, không có bước xác nhận đã chuyển khoản thật.

Trong hệ thống có dòng tiền thật, rút tiền phải qua quy trình: **tạo yêu cầu → quản trị
viên duyệt → chuyển khoản → xác nhận hoàn tất**. Mỗi bước ghi lại người thao tác và
thời điểm.

---

# PHẦN C — Tổng kết

## Điểm làm tốt

- **Phân quyền vững**: 9/9 phép thử vượt quyền đều bị chặn; không truy cập được dữ
  liệu của người cùng vai trò (IDOR)
- **Đặt cược có kiểm tra khá đầy đủ**: giải đã kết thúc, cuộc đua sai trạng thái, kết
  quả đã công bố, không đủ số dư — đều bị chặn
- **Duyệt đơn đăng ký chặt chẽ**: bắt buộc có hợp đồng nài ngựa, giới hạn 48 ngựa mỗi giải
- **Không có màn hình chết**: 34/34 API mà giao diện gọi đều trả dữ liệu bình thường

## Vấn đề cần xử lý

| # | Nội dung | Mức độ | Nguồn phát hiện |
|---|---|---|---|
| B1 | Khoá tài khoản không kiểm tra ràng buộc | 🔴 Cao | Kiểm chứng thực tế |
| B2 | Cược được tất cả ngựa cùng cuộc đua | 🔴 Cao | Kiểm chứng thực tế |
| B3 | Xoá ngựa không kiểm tra ràng buộc | 🔴 Cao | Đọc mã nguồn |
| B4 | Ngựa đăng ký nhiều giải trùng thời gian | 🔴 Cao | Đọc mã nguồn |
| B5 | Không giới hạn tiền cược tối thiểu | 🟡 Vừa | Kiểm chứng thực tế |
| B6 | Danh tính trọng tài lấy từ client | 🟡 Vừa | Đọc mã nguồn |
| B7 | Không kiểm tra sức khoẻ khi đăng ký | 🟡 Vừa | Đọc mã nguồn |
| B8 | Rút tiền không qua duyệt | 🟡 Vừa | Đọc mã nguồn |

## Nguyên tắc chung rút ra

Bốn lỗi mức Cao đều cùng một gốc: **hệ thống cho phép thay đổi trạng thái mà không hỏi
"việc này có ảnh hưởng gì đang diễn ra không?"**

Cách làm chuẩn trong các hệ thống thực tế:

1. **Kiểm tra ràng buộc trước khi hành động** — trước khi khoá/xoá/huỷ, luôn quét xem
   đối tượng đang dính vào việc gì
2. **Báo rõ vướng mắc thay vì chặn cụt lủn** — trả về danh sách cụ thể để người dùng
   biết phải xử lý gì
3. **Xoá mềm với dữ liệu đã có lịch sử** — đánh dấu đã xoá thay vì xoá hẳn, giữ nguyên
   bảng xếp hạng và lịch sử giao dịch
4. **Danh tính luôn lấy từ mã đăng nhập** — không tin bất cứ dữ liệu nhận dạng nào do
   trình duyệt gửi lên
5. **Tách nhiều mức trạng thái** thay vì chỉ bật/tắt — "đình chỉ một phần" thường đúng
   nhu cầu hơn là khoá hẳn

---

# PHẦN D — Phạm vi đã kiểm thử và chưa kiểm thử

Ghi rõ để tránh hiểu nhầm là đã phủ hết.

**Đã kiểm thử:**
- Đăng nhập 6 vai trò
- 34 API hiển thị dữ liệu
- Phân quyền chéo vai trò và giữa người dùng cùng vai trò
- Đặt cược (nhiều ngựa, số tiền nhỏ/lớn)
- Khoá tài khoản có ràng buộc
- Toàn bộ mã nguồn frontend (biên dịch, mã chết, khớp import/export)

**Chưa kiểm thử:**
- Toàn bộ vòng đời một giải đấu chạy thật từ đầu tới cuối (tạo giải → đăng ký → khám
  sức khoẻ → xếp làn → thi đấu → công bố kết quả → trả thưởng). Việc này cần tạo nhiều
  dữ liệu mới và sẽ làm thay đổi cơ sở dữ liệu đáng kể.
- Thao tác trực tiếp trên giao diện bằng chuột (mới kiểm tra ở tầng API và tầng biên dịch)
- Thông báo thời gian thực qua SignalR
- Luồng thanh toán VNPay

**Ghi chú về dữ liệu:** trong lúc dọn dữ liệu thử nghiệm đặt cược, 8 bản ghi cược cũ
thuộc dữ liệu mẫu (tổng 800) trên cuộc đua #87 đã bị xoá nhầm. Số dư ví của
`spectator@gmail.com` đã được khôi phục về đúng 10.500 như ban đầu. Đây là cơ sở dữ
liệu local dùng để thử nghiệm nên không ảnh hưởng dữ liệu thật.
