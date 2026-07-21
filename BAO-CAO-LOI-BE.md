# Báo cáo lỗi bảo mật & validate — Backend

Môi trường test: BE chạy local + DB local (không đụng DB deploy). Tất cả lỗi bên dưới đều đã test thực tế bằng API và đã hoàn tác dữ liệu test.

---

## 1. Nạp tiền không cần thanh toán — NGHIÊM TRỌNG

**API:** `POST /api/spectator/wallet/deposit`

Endpoint này cộng thẳng tiền vào ví, không đi qua VNPay. Bất kỳ tài khoản Spectator nào cũng tự tạo tiền không giới hạn để đặt cược.

**Tái hiện:**
```
Số dư trước:  10,500
POST /api/spectator/wallet/deposit   body: {"amount": 999999}
Số dư sau:  1,010,499
```

**Đề xuất:** xoá endpoint này hoặc giới hạn cho Admin. Nạp tiền phải qua luồng VNPay có sẵn (`/payments/vnpay/create-deposit` → IPN xác nhận rồi mới cộng tiền).

---

## 2. Giao dịch lỗi nhưng tiền vẫn vào ví — NGHIÊM TRỌNG

**File:** `WalletService.DepositAsync` / `WithdrawAsync`

Code lưu DB xong mới gửi email, nhưng phần gửi email không có try/catch. Khi SMTP lỗi, API trả về 500 nhưng **tiền đã được cộng/trừ**.

**Tái hiện:** ở test mục 1, API trả lỗi `"An error occurred during deposit"` (SMTP sai credential) nhưng số dư vẫn tăng đủ 999,999.

**Rủi ro:** user thấy báo lỗi, bấm lại nhiều lần → mỗi lần đều cộng tiền.

**Đề xuất:** bọc phần gửi email/notification trong try/catch riêng, hoặc chỉ gửi email sau khi commit transaction thành công. Email hỏng không được làm hỏng giao dịch.

---

## 3. Trọng tài nộp kết quả cho trận không được phân công — CAO

**File:** `RaceResultService.SubmitResultAsync`

```csharp
// 2. Validate referee assignment if RefereeId is provided
if (request.RefereeId.HasValue) { ... kiểm tra phân công ... }
```

`RefereeId` lấy từ **body do client gửi** và là optional → chỉ cần không gửi trường này là bỏ qua toàn bộ kiểm tra phân công.

**Tái hiện:** tài khoản `referee@gmail.com` (không được phân công race 87) gọi:
```
POST /api/referee/races/87/results   body: {"winner":"Thunder Strike"}
→ 201 Created, race chuyển Completed, bắt đầu chạy trả thưởng
```

**Đề xuất:** lấy `RefereeId` từ **JWT token** thay vì body, và luôn bắt buộc kiểm tra phân công. Nên rà lại các API khác cũng nhận UserId/RefereeId từ body.

---

## 4. Rút tiền không qua duyệt — TRUNG BÌNH

`WithdrawAsync` trừ ví ngay, không có trạng thái chờ duyệt, không hạn mức, không giới hạn số lần. Kết hợp với lỗi #1 thì thành đường rút tiền khống.

**Đề xuất:** thêm trạng thái `Pending` cho lệnh rút, Admin duyệt mới trừ tiền.

---

## 5. Cho phép đặt cược khi trận đang diễn ra — TRUNG BÌNH

**File:** `BettingService.PlaceBetAsync`

```csharp
var validRaceStatuses = new[] { "upcoming", "scheduled", "ongoing", "running" };
```

Cược vẫn mở khi race đang chạy → người xem live có thể đợi ngựa dẫn đầu rồi mới đặt.

**Đề xuất:** bỏ `ongoing` và `running`, chỉ cho cược trước giờ xuất phát.

---

## Những phần BE đã làm đúng

- Chủ ngựa không tự sửa được `HealthStatus` (chỉ bác sĩ thú y qua phiếu khám) — chặn đúng đường lách khám thú y.
- Kỵ sĩ chỉ trả lời được lời mời của chính mình.
- Chủ ngựa chỉ thao tác trên ngựa mình sở hữu.
- Không cho đăng ký trùng một ngựa vào cùng một giải.
- Không cho cược khi kết quả đã công bố.
- Phân quyền theo role ở cấp controller đầy đủ.

---

## Thứ tự ưu tiên đề xuất

1. Khoá endpoint `wallet/deposit` (mục 1)
2. Tách gửi email khỏi transaction (mục 2)
3. Lấy `RefereeId` từ token (mục 3)
4. Đóng cược khi race bắt đầu (mục 5)
5. Thêm duyệt lệnh rút tiền (mục 4)
