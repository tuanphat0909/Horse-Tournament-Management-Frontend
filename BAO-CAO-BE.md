# Báo cáo gửi Backend

**Cập nhật:** 31/07/2026
**Bản backend đã kiểm tra:** commit `b562356` — *Feature/vulnerability concurrency fixes (#149)*
**Môi trường:** Backend local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`

Tất cả nội dung bên dưới đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

> **Các lỗi mức Cao của đợt trước đã được xử lý xong** — khoá tài khoản không kiểm tra
> ràng buộc nghiệp vụ, God API lỗi 500, `Forbid()` nuốt mất lời báo lỗi. Đã chạy lại và
> xác nhận cả ba đều hoạt động đúng. File này chỉ còn những mục **chưa xử lý**.

---

## 🟡 1. God API dùng tên trạng thái không có trong hệ thống

**Nơi sửa:** `backend/src/HorseRacing.API/Services/DemoService.cs`

`DemoService` đặt giải ở trạng thái `"RegistrationClosed"` (viết liền). Nhưng toàn hệ
thống đang dùng các tên sau:

```
PendingRegistration · Registration Open · Registration Suspended
PendingScheduling · Upcoming · Active · AwaitingResults · Completed · Cancelled
```

Không có `RegistrationClosed`. Giao diện tra bảng cấu hình theo khoá `"registration closed"`
(có dấu cách) nên không khớp → giải demo bị **hiển thị sai nhãn trạng thái**.

### Đề xuất

Dùng `"PendingScheduling"` — đúng nghĩa *"đã đóng đăng ký, chờ xếp lịch"* và khớp với
luồng sinh cuộc đua sẵn có.

*(Phía frontend đã chuẩn hoá cách tra bảng — bỏ dấu cách trước khi so sánh — nên tạm thời
chịu được cả hai cách viết. Nhưng nên sửa ở gốc cho thống nhất.)*

---

## 🟡 2. God API không gán ngày mở/đóng đăng ký

**Nơi sửa:** `backend/src/HorseRacing.API/Services/DemoService.cs`

### Kiểm chứng

```sql
TournamentId | Status             | RegistrationStartDate | RegistrationEndDate
108          | RegistrationClosed | NULL                  | NULL
```

`DemoService` chỉ gán `StartDate` và `EndDate`, bỏ trống hai cột ngày đăng ký. Nhiều màn
hình dựa vào hai cột này để tính trạng thái hiển thị và đồng hồ đếm ngược, nên giải demo
hiện thiếu thông tin so với giải tạo bằng tay.

### Đề xuất

```csharp
RegistrationStartDate = DateTime.UtcNow.AddDays(-10),
RegistrationEndDate   = DateTime.UtcNow.AddDays(-1),
StartDate             = DateTime.UtcNow.AddDays(1),
EndDate               = DateTime.UtcNow.AddDays(7),
Status                = "PendingScheduling",
```

---

## 🟡 3. Tên trường trong phản hồi lỗi không thống nhất

Mỗi controller đặt tên một kiểu:

| Nơi | Trường chứa câu lỗi |
|---|---|
| Phần lớn controller | `message` |
| `DemoController` | `error` + `details` |
| ASP.NET tự sinh | `title` + `errors` |
| Một số chỗ lỗi 500 | `message` + `detail` |

Frontend đã nhận hết các kiểu này nên không gấp, nhưng nếu backend thống nhất về một dạng
thì đỡ rủi ro bỏ sót về sau. Đề xuất dùng chung `{ message, blockers?, detail? }`.

---

## 🟢 4. Tài liệu còn sót một đường dẫn

`backend/FRONTEND-API-CHANGES-v2.md` mục 2 vẫn ghi:

```
POST /api/financials/wallet/deposit
```

Đường dẫn này trả **404**. Đường dẫn thật là `/api/admin/wallet/deposit` (nạp ví hệ thống);
còn luồng nạp tiền của người dùng đi qua VNPay `/api/payments/vnpay/create-deposit`.

Các đường dẫn khác trong tài liệu đã được sửa đúng ở đợt vừa rồi.

---

## Tổng hợp

| # | Nội dung | Mức độ | Nơi sửa |
|---|---|---|---|
| 1 | God API dùng trạng thái `RegistrationClosed` không có trong hệ thống | 🟡 Vừa | `DemoService.cs` |
| 2 | God API không gán ngày mở/đóng đăng ký | 🟡 Vừa | `DemoService.cs` |
| 3 | Tên trường phản hồi lỗi chưa thống nhất | 🟡 Vừa | Các controller |
| 4 | Tài liệu còn sót `/api/financials/wallet/deposit` | 🟢 Thấp | `FRONTEND-API-CHANGES-v2.md` |

**Không còn lỗi mức Cao.** Mục 1 và 2 nằm cùng một file nên sửa một lượt được.
