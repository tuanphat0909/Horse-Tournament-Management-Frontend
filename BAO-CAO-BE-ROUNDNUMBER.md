# RoundNumber trong DemoService đang phá vỡ quy ước của chính backend

**Bản kiểm tra:** `7234182` · **Ngày:** 01/08/2026

---

## Vấn đề

`DemoService` đặt **cả hai vòng đều bằng 1**:

```csharp
Name = "Final Round",     RoundNumber = 1,   // DemoService.cs:348-349
Name = "Prefinal Round",  RoundNumber = 1,   // DemoService.cs:393-394
```

Trong khi luồng giải thường đặt đúng quy ước:

```csharp
Name = "Pre",    RoundNumber = 1,   // TournamentService.cs:713-716
Name = "Final",  RoundNumber = 2,   // TournamentService.cs:657-660
```

---

## Ba chỗ trong backend chạy sai với giải tạo bằng God API

| Nơi | Mã | Hậu quả |
|---|---|---|
| `AdminController.cs:577` | `var isFinalRace = race.Round?.RoundNumber == 2;` | Cuộc đua chung kết **không bao giờ được nhận là chung kết** |
| `RaceResultService.cs:529-531` | `if (race.Round.RoundNumber != 1) return;` — chú thích ghi *"Only apply to Pre-round"* | Final Round bị coi là **vòng sơ loại**, hệ thống cố sinh thêm một vòng chung kết nữa từ chính vòng chung kết |
| `TournamentService.cs:1032` | `.OrderBy(r => r.RoundNumber)` | Hai vòng cùng số → thứ tự sắp xếp không xác định |

---

## Đề xuất

Trong `DemoService`, đặt `RoundNumber = 1` cho *Prefinal Round* và `= 2` cho *Final Round*, đúng như luồng giải thường.

---

## Cái bẫy kèm theo

Chuỗi `"Prefinal"` **có chứa** `"final"`. Mọi chỗ kiểm tra kiểu `name.Contains("final")` sẽ nhận nhầm vòng sơ loại thành chung kết. Frontend đã vấp đúng lỗi này và phải kiểm tra `"prefinal"` trước.

---

## Kiểm chứng

```
setup-race (12 ngựa)          → Round [Final Round]    RoundNumber=1, Race [FinalRace]
populate-tournament?count=24  → Round [Prefinal Round] RoundNumber=1, Race [Prefinal Race 1..2]
```

---

Phía frontend đã tự xử lý bằng cách nhận dạng vòng theo tên nên không bị chặn. Ba mục ở trên là của backend, frontend không chữa hộ được.
