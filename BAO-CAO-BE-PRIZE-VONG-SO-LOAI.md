# Tiền thưởng vòng sơ loại hiện $1.000.000 — giá trị giả cắm cứng

**Bản kiểm tra:** `7234182` · **Ngày:** 01/08/2026

---

## Hiện tượng

Bảng *Race History* của chủ ngựa, giải "Phát Test" có tổng giải thưởng hạng nhất là **$1.000**:

| Cuộc đua | Hạng | Tiền thưởng hiện ra |
|---|---|---|
| Final Race | Rank 1 | $1,000.00 ✅ |
| Final Race | Rank 2 | $500.00 ✅ |
| **Race 1 (Pre)** | Rank 1 | **$1,000,000.00** ❌ |
| **Race 2 (Pre)** | Rank 1 | **$1,000,000.00** ❌ |

Thắng vòng sơ loại được thưởng gấp **1.000 lần** giải vô địch.

---

## Nguyên nhân

`OwnerDashboardRepository.cs:141-146`:

```csharp
else if (finishPosition == 1)
{
    // TODO: Revisit this legacy logic. We should rely on TournamentPrizePayouts instead.
    // Fallback legacy support for pre-round winners showing a default win indicator
    prizeAmount = 1000000;
}
```

Số `1000000` được cắm cứng làm "dấu hiệu đã thắng" cho vòng sơ loại. Nó **không phải tiền thật** — chủ ngựa không hề nhận số này, ví không cộng đồng nào. Nhưng frontend nhận về một con số ở trường `PrizeAmount` nên hiển thị nguyên xi thành `$1,000,000.00`.

Ghi chú `TODO` ngay trên dòng đó cho thấy đây là mã tạm, chưa kịp dọn.

---

## Vì sao nghiêm trọng

Đây là con số **sai về bản chất**, không phải lỗi hiển thị:

- Chủ ngựa nhìn vào tưởng mình được thưởng 1 triệu đô cho một vòng loại
- Cộng dồn cột *Prize Money* ra tổng vô nghĩa
- Trong buổi bảo vệ, người chấm nhìn thấy vòng loại thưởng cao gấp nghìn lần chung kết là câu hỏi khó trả lời

---

## Đề xuất

Vòng sơ loại **không có tiền thưởng** — chỉ có vòng chung kết mới chia giải. Nên trả về `0`:

```csharp
else if (finishPosition == 1)
{
    prizeAmount = 0;   // vong so loai khong co tien thuong
}
```

Nếu muốn giữ dấu hiệu "đã thắng vòng loại" thì thêm một trường riêng (ví dụ `IsPreRoundWinner`), **không mượn trường tiền** để mang ý nghĩa khác.

---

## Ghi chú cho frontend

Frontend đang hiển thị đúng thứ backend trả về (`res.prizeAmount`), nên không sửa được từ phía này mà không đoán mò. Khi backend trả `0`, cột sẽ tự hiện `—` vì đã có sẵn điều kiện `prizeAmount > 0`.
