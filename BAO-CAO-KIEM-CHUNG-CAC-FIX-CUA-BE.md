# Kiểm chứng các bản sửa lỗi backend công bố

**Ngày:** 29/07/2026 · **Môi trường:** BE local `http://localhost:55446` + SQL Server local
**Cách làm:** gọi API thật để kiểm chứng, không dựa vào tài liệu.

---

## Bảng kết quả

| # | Backend công bố | Kiểm chứng | Ghi chú |
|---|---|---|---|
| 1 | Khoá tài khoản kiểm tra ràng buộc, trả mảng `blockers` | ✅ **Đúng** | Đã sửa FE để hiển thị |
| 2 | Chặn cược nhiều ngựa cùng một cuộc đua | ✅ **Đúng** | |
| 3 | Mức cược tối thiểu | ✅ **Đúng** | Mức thực tế: **10.000** |
| 4 | Chặn đăng ký ngựa `Injured` / `Recovering` | ✅ **Đúng** | |
| 5 | Xoá ngựa: chặn khi còn ràng buộc, xoá mềm khi có lịch sử | ⚠️ **Logic đúng, nhưng lời báo lỗi bị mất** | Xem mục A |
| 6 | Rút tiền theo cơ chế tạm giữ (trừ ngay, chờ duyệt) | ✅ **Đúng** | Đã sửa FE cho ví Chủ ngựa |
| 7 | Thông báo lỗi đã chuyển hết sang tiếng Anh | ✅ **Đúng** | Thử nhiều API, không còn tiếng Việt |
| 8 | Chống bấm chồng ví bằng `RowVersion` | ⏳ Chưa thử được | Cần gọi song song mới tái hiện |
| 9 | Danh tính trọng tài lấy từ mã đăng nhập | ⏳ Chưa thử được | Không có cuộc đua phù hợp |
| 10 | Bọc `try-catch` phần gửi email | ⏳ Chưa thử lại | Máy local không cấu hình được SMTP |

---

## Chi tiết các mục đã kiểm chứng

### 1. Khoá tài khoản — có `blockers` ✅

```
PUT /api/admin/users/426/status
→ 400 {"message":"Cannot lock user due to constraints.",
       "blockers":["User wallet has a positive balance of 42000.00."]}
```

So với lần kiểm thử trước (khoá được ngay, không cảnh báo gì) thì đây là cải thiện lớn.

### 2 + 3. Đặt cược ✅

```
Cược ngựa thứ nhất, cuộc đua #87, 10.000  → thành công
Cược ngựa thứ hai, CÙNG cuộc đua, 10.000  → 400
   "You already have a pending bet for this race. Arbitrage betting is not allowed."

Cược 0,01  → 400 "Bet amount must be at least 10,000."
```

Lần trước tôi cược được liền 3 ngựa trong một cuộc đua — nay đã chặn.

### 4. Đăng ký ngựa đang chấn thương ✅

```
POST /api/registrations  (ngựa ở trạng thái Injured)
→ 400 "Cannot register horse 'Thunder Strike' because its health status is 'Injured'."
```

### 6. Rút tiền theo cơ chế tạm giữ ✅

```
Số dư trước: 90.000
POST /api/spectator/wallet/withdraw  { amount: 5000 }
Số dư sau:   85.000        ← trừ ngay
Giao dịch:   -5000, Type=Withdraw, Status=Pending
```

### 7. Thông báo tiếng Anh ✅

Thử nhiều API lỗi, các câu trả về đều bằng tiếng Anh. Frontend đã gỡ bảng dịch tạm
thời từ trước nên không cần làm gì thêm.

---

# PHẦN A — Vấn đề còn lại ở backend

## 🔴 A1. Xoá ngựa: lời báo lỗi bị nuốt mất

`HorseService.DeleteHorseAsync` viết rất tốt:

```csharp
if (await _horseRepository.HasActiveDependenciesAsync(id))
    throw new InvalidOperationException(
        "Cannot delete this horse because it has active registrations, upcoming races, or active contracts.");
```

Nhưng ở tầng controller — `OwnerController.cs` dòng 151-154:

```csharp
catch (InvalidOperationException)
{
    return Forbid();     // ← 403 với thân phản hồi RỖNG
}
```

`Forbid()` **không mang theo nội dung**. Câu giải thích rất rõ ràng ở tầng service bị
vứt đi trên đường ra.

**Kiểm chứng:**

```
DELETE /api/horses/360   (ngựa đang có ràng buộc)
→ HTTP 403
→ thân phản hồi: (rỗng)
```

**Hậu quả:** chủ ngựa bấm xoá, thấy báo lỗi nhưng **không biết vì sao**. Giao diện
không có gì để hiển thị. Ngoài ra 403 mang nghĩa *"không có quyền"*, dễ khiến người
dùng tưởng mình bị chặn quyền chứ không phải do ngựa đang bận.

**Đề xuất:**

```csharp
catch (InvalidOperationException ex)
{
    // Ngựa đang có ràng buộc là lỗi nghiệp vụ, không phải lỗi phân quyền
    return BadRequest(new { message = ex.Message });
}
```

Nếu muốn tách bạch hơn thì dùng hai loại ngoại lệ riêng: một cho *"không sở hữu ngựa
này"* (403) và một cho *"ngựa đang bận"* (400 kèm lý do).

Nên rà thêm các controller khác xem còn chỗ nào dùng `Forbid()` nuốt mất thông báo tương tự.

## 🔴 A2. God API vẫn lỗi 500

Đã nêu chi tiết ở `BAO-CAO-BE-GOD-API-VA-DONG-BO-FE.md` — `DemoService.cs` tạo phiếu
khám nhưng thiếu `UserId`, vi phạm khoá ngoại. Frontend đã làm xong phần giao diện,
chỉ chờ sửa lỗi này.

## 🟡 A3. Tài liệu ghi sai đường dẫn

`FRONTEND-API-CHANGES-v2.md` ghi các đường dẫn `/api/financials/wallet/withdraw`,
`/api/betting/place`, `/api/medical-checks`, `/api/tournaments/register` — **cả bốn đều
trả 404**. Đường dẫn thật vẫn là `/api/spectator/wallet/withdraw`, `/api/spectator/bets`,
`/api/MedicalCheck`, `/api/registrations` và đang chạy bình thường.

Frontend không phải đổi gì, nhưng nên sửa tài liệu để nhóm khác đọc không sửa nhầm.

---

# PHẦN B — Phần frontend đã bổ sung

## B1. Hiển thị danh sách `blockers` ✅

`parseApiError()` trước đây chỉ lấy trường `message`, nên quản trị viên chỉ thấy
*"Cannot lock user due to constraints."* mà không biết vướng gì.

Đã bóc thêm mảng `blockers` ngay trong `parseApiError` (`src/api/authService.js`) nên
**mọi màn hình đều tự hiển thị được**, không phải sửa từng trang.

Kèm theo: thêm `whitespace-pre-line` cho khung thông báo
(`src/context/NotificationContext.jsx`) vì trước đó nhiều lý do bị dồn thành một dòng dài.

Kết quả:

```
Cannot lock user due to constraints.
• User wallet has a positive balance of 42000.00.
```

## B2. Ví Chủ ngựa thiếu nhãn "Pending" ✅

Sau khi backend đổi sang cơ chế tạm giữ, lệnh rút tiền bị trừ khỏi số dư ngay nhưng
vẫn đang chờ duyệt.

- Trang ví **Khán giả** đã có nhãn `Pending` từ trước ✅
- Trang ví **Chủ ngựa** thì **không có** ❌ → chủ ngựa thấy tiền bị trừ mà tưởng đã
  chuyển xong, dễ thắc mắc *"tiền đâu?"*

Đã bổ sung nhãn `Pending` màu vàng và tô màu số tiền cho khớp
(`src/pages/owner/OwnerWalletOverviewPage.jsx`).

## B3. Khoá nút khi đang gọi API — đã có sẵn ✅

Tài liệu backend yêu cầu khoá nút để tránh lỗi bấm chồng. Kiểm tra lại thì frontend
**đã làm sẵn từ trước** ở tất cả nút liên quan tới tiền:

| Màn hình | Điều kiện khoá |
|---|---|
| Rút tiền (Chủ ngựa / Khán giả) | `disabled={!isValid \|\| loading}` |
| Nạp tiền | `disabled={coinsPreview <= 0 \|\| depositLoading \|\| isLocked}` |
| Đặt cược | `disabled={betFormik.isSubmitting}` |
| Ví hệ thống | `disabled={actionLoading}` |

## B4. Các thông báo lỗi mới — hiển thị được ngay ✅

Lỗi cược trùng ngựa, mức cược tối thiểu, ngựa chấn thương, trùng lịch giải, chi tiết
khám sức khoẻ — tất cả đều trả ở trường `message` chuẩn nên `parseApiError()` đọc và
hiển thị được, không cần sửa thêm.

---

# Tổng kết

**Backend đã sửa đúng 6/6 mục kiểm chứng được.** Những lỗ hổng nghiêm trọng nhất ở
báo cáo trước (khoá tài khoản vô điều kiện, cược hết mọi ngựa để ăn chắc, xoá ngựa
đang thi đấu) đều đã được chặn.

**Việc backend cần làm tiếp:**

| # | Nội dung | Mức độ |
|---|---|---|
| A1 | `Forbid()` nuốt mất lời báo lỗi khi xoá ngựa | 🔴 Cao |
| A2 | God API lỗi 500 — thiếu `UserId` khi tạo phiếu khám | 🔴 Cao |
| A3 | Tài liệu ghi sai đường dẫn API | 🟡 Vừa |

**Frontend đã xử lý xong:** hiển thị `blockers`, nhãn `Pending` ở ví Chủ ngựa, thông
báo giữ xuống dòng. Phần khoá nút chống bấm chồng vốn đã có sẵn.
