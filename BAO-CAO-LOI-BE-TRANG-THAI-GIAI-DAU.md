# Báo cáo lỗi — Trạng thái giải đấu bị kẹt ở `PendingAdminAttention`

Phát hiện trên môi trường deploy: giải đấu **đã đua xong toàn bộ race** nhưng badge vẫn hiển thị `PendingAdminAttention`, không thể kết thúc giải, không thể trả thưởng.

Sau khi trace code BE thì đây không phải lỗi hiển thị của FE — DB đang lưu đúng chuỗi `PendingAdminAttention`, FE chỉ render lại.

---

## Vòng đời trạng thái hiện tại

```
PendingRegistration → Registration Open → PendingScheduling → Upcoming → Active → AwaitingResults → Completed
                                                                  ↓
                                                        PendingAdminAttention  ← ngõ cụt
```

---

## 1. Sweep tự động không bao giờ xét lại giải đang `PendingAdminAttention` — CAO

**File:** `TournamentService.GetAllTournamentsAsync` (dòng ~300-346) và `GetTournamentByIdAsync` (dòng ~428-500)

Đoạn tự cập nhật trạng thái chỉ có nhánh cho `t.Status == "Upcoming"`:

```csharp
if (t.Status == "Upcoming" && t.StartDate.HasValue && vietnamNow >= t.StartDate.Value)
{
    if (!hasCompleteLanes)              t.Status = "PendingScheduling";
    else if (readiness.HasMissingReferees) t.Status = "PendingAdminAttention";
    else                                 t.Status = "Active";
}
```

Một khi đã rơi vào `PendingAdminAttention` (hoặc `PendingScheduling`), **không có nhánh nào xét lại**. Admin gán đủ trọng tài / đủ làn xong thì trạng thái vẫn đứng yên — hệ thống không tự nhận ra điều kiện đã được khắc phục.

**Đề xuất:** thêm nhánh đối xứng — nếu giải đang ở `PendingAdminAttention` / `PendingScheduling`, đã qua `StartDate`, mà `hasCompleteLanes == true` và `HasMissingReferees == false` thì tự đẩy về `Active`.

---

## 2. Bảng transition không có đường ra khỏi `PendingAdminAttention` — CAO

**File:** `TournamentService.UpdateTournamentAsync` (dòng ~195-203)

```csharp
["PendingScheduling"]        = ["Upcoming", "Cancelled"],
["PendingAdminAttention"]    = ["Upcoming", "Cancelled"],
["Upcoming"]                 = ["Active", "Cancelled"],
["Active"]                   = ["AwaitingResults"],
```

Giải đã qua `StartDate` mà chỉ được quay ngược về `Upcoming` là sai ngữ nghĩa: `Upcoming` nghĩa là "sắp diễn ra", trong khi giải này đã đua xong rồi. Admin buộc phải đi đường vòng `PendingAdminAttention → Upcoming → (chờ sweep) → Active` mới thao tác tiếp được.

**Đề xuất:** cho phép `PendingAdminAttention → Active` trực tiếp (kèm kiểm tra đã đủ lane + referee).

---

## 3. Không thể kết thúc giải nếu đã lỡ kẹt — CAO (hậu quả trực tiếp)

**File:** `AdminController.cs` (dòng ~1420) — API kết thúc phase đua

```csharp
if (tournament.Status != "Active")
    return BadRequest($"Tournament is not in Active status. Current status: {tournament.Status}.");
```

Điều kiện chặn cứng theo trạng thái **giải**, trong khi cái thực sự cần kiểm tra là trạng thái **các race** (ngay dòng dưới đã có sẵn kiểm tra `allRaces.Any(r => r.Status không phải Finished/Completed)`).

Kết quả dây chuyền: `AwaitingResults` không đạt được → mà `Completed` chỉ được set duy nhất tại `PrizePayoutService.cs:323` sau khi trả thưởng → **giải không bao giờ hoàn thành và tiền thưởng không bao giờ được chi**, dù toàn bộ race đã `Completed`.

**Đề xuất:** nới điều kiện thành `Active` **hoặc** `PendingAdminAttention` (giữ nguyên kiểm tra tất cả race phải Finished/Completed — đó mới là điều kiện đúng về nghiệp vụ).

---

## 4. Ghi chú thêm: giải bị kẹt vẫn chặn tạo giải mới — THẤP

**File:** `TournamentService` (dòng ~1309)

```csharp
if (t.Status == "Completed" || t.Status == "Cancelled" || ...) continue;
```

Rule "2 giải phải cách nhau ít nhất 1 ngày" bỏ qua giải `Completed`/`Cancelled`. Giải kẹt ở `PendingAdminAttention` không nằm trong danh sách bỏ qua nên vẫn tiếp tục chặn việc tạo giải mới trùng khoảng thời gian, dù thực tế nó đã đua xong.

Lỗi này sẽ tự hết khi sửa xong mục 1-3.

---

## Tóm tắt

| # | Vấn đề | Mức độ | File |
|---|--------|--------|------|
| 1 | Sweep không xét lại giải `PendingAdminAttention`/`PendingScheduling` | Cao | `TournamentService.GetAllTournamentsAsync` |
| 2 | Transition chỉ cho quay về `Upcoming` | Cao | `TournamentService.UpdateTournamentAsync` |
| 3 | API kết thúc phase đua chặn theo status giải thay vì status race | Cao | `AdminController` ~1420 |
| 4 | Giải kẹt vẫn chặn tạo giải mới | Thấp | `TournamentService` ~1309 |

**Cách gỡ tạm cho dữ liệu đang kẹt:** admin sửa giải về `Upcoming` → gọi lại API danh sách giải để sweep đẩy sang `Active` → bấm kết thúc phase đua → publish results → trả thưởng.
