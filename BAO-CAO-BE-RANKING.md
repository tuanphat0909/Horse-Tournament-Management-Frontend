# Điểm xếp hạng nài ngựa luôn bằng 0

**Bản kiểm tra:** `7234182` · **Ngày:** 01/08/2026

---

## Hiện tượng

Trang Leaderboard: ngựa **B1 có 2 thắng**, nhưng **mọi nài ngựa đều 0 điểm** — kể cả người đã cưỡi B1 thắng cả 2 cuộc đua đó.

---

## Nguyên nhân

Hai bảng lấy số liệu theo **hai cách khác hẳn nhau**:

| Bảng | Cách tính | Kết quả |
|---|---|---|
| **Ngựa** — `PublicQueryRepository.cs:59` | Đếm trực tiếp từ `RaceResults` mỗi lần gọi | Luôn đúng thực tế |
| **Nài ngựa** — `PublicQueryRepository.cs:35,43` | Đọc cột lưu sẵn `JockeyProfile.RankingPoint` | Luôn bằng 0 |

```csharp
// Ngựa: tính sống từ kết quả đua
var wins = results.Count(r =>
    r.Winner.Equals(h.Name, StringComparison.OrdinalIgnoreCase) ||
    r.Winner.Equals(h.HorseId.ToString()));

// Nài ngựa: chỉ đọc cột lưu sẵn
.OrderByDescending(jp => jp.RankingPoint)
```

**Cột `RankingPoint` không có chỗ nào tăng.** Rà toàn bộ mã nguồn, nó chỉ xuất hiện ở:

- `AdminService.cs:95` — gán `RankingPoint = 0` khi tạo tài khoản
- `DataSeeder.cs:631` — gán `RankingPoint = 0` khi tạo dữ liệu mẫu
- Vài chỗ **đọc** ra để tính tỷ lệ cược và xếp thứ tự

Không có bất kỳ dòng nào cộng điểm sau khi nài ngựa thắng. Nên giá trị nằm nguyên ở 0 vĩnh viễn, và thứ tự xếp hạng thực chất là ngẫu nhiên.

---

## Hệ quả ngoài bảng xếp hạng

`BettingService.cs:260-261` dùng `RankingPoint` để tính tỷ lệ cược:

```csharp
// 2. Jockey Ranking (RankingPoint in JockeyProfile)
var jockeyRank = entry.JockeyProfile != null ? entry.JockeyProfile.RankingPoint : 100;
```

Mọi nài ngựa đều 0 điểm nên **yếu tố nài ngựa không hề ảnh hưởng tới tỷ lệ cược** — nài giỏi và nài mới vào nghề cho ra cùng một tỷ lệ.

---

## Hai hướng sửa

| Hướng | Cách làm | Đánh giá |
|---|---|---|
| **A. Tính sống như ngựa** | Bỏ cột `RankingPoint`, đếm thắng từ `RaceResults` join qua `RaceEntry.JockeyProfileId` | Nhất quán với bảng ngựa, không bao giờ lệch dữ liệu |
| **B. Cộng điểm khi có kết quả** | Trong `RaceResultService`, sau khi duyệt kết quả thì cộng điểm cho nài ngựa thắng | Giữ được khái niệm "điểm" riêng, nhưng phải xử lý cả trường hợp sửa/huỷ kết quả |

Đề xuất **hướng A** — cùng một cách tính cho cả hai bảng thì không thể lệch nhau, và không cần lo đồng bộ lại khi kết quả bị sửa.

Nếu chọn hướng B thì `RaceResults` hiện đã đủ thông tin: bảng này lưu `RaceEntryId`, từ đó truy ra được nài ngựa.

---

## Frontend đang tạm chữa thế nào

Endpoint `/public/rankings/jockeys` chỉ trả `RankingPoint`, không có số trận thắng. Nên frontend
phải **tự đếm**: gọi `/public/races/schedule`, lọc các cuộc đã kết thúc, rồi gọi
`/public/races/{id}/entries` cho từng cuộc và đếm `finishPosition === 1` theo `jockeyId`.

Cách này ra số đúng nhưng **tốn N+1 lượt gọi mạng** mỗi lần mở trang — giải càng nhiều cuộc đua
thì càng chậm. Rất mong backend bổ sung `WinsCount` (và `RacesCount`) vào `JockeyRankingResponse`
giống `HorseRankingResponse` đã có, để frontend bỏ được vòng lặp này.
