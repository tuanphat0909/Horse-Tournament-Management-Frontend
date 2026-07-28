# Báo cáo — Backend còn trả thông báo tiếng Việt

Giao diện web đã thống nhất **100% tiếng Anh**. Tuy nhiên một số API và thông báo
(notification, email) của backend vẫn trả câu tiếng Việt, nên khi hiển thị lên
màn hình sẽ lẫn hai ngôn ngữ.

Trước đây frontend có một bảng dịch Việt → Anh để chữa cháy, nhưng cách đó chỉ
là vá tạm: mỗi lần backend sửa câu chữ là bảng dịch lại lệch. Vì vậy frontend đã
gỡ bảng đó đi và nhờ backend sửa tận gốc — đổi thẳng các chuỗi này sang tiếng Anh.

**Tổng: 50 chuỗi tiếng Việt, nằm ở 8 file.**

---

## Mức độ ưu tiên

| Ưu tiên | Nhóm | Vì sao |
|---|---|---|
| 🔴 Cao | Message lỗi (`throw` / `BadRequest`) | Hiện thẳng lên màn hình người dùng khi thao tác lỗi |
| 🟡 Vừa | Notification (title + content) | Hiện trong chuông thông báo và trang Notifications |
| 🟢 Thấp | Nội dung email | Người dùng đọc trong hộp thư, không nằm trên web |

---

## 🔴 Ưu tiên cao — Message lỗi hiển thị trên UI

Đây là nhóm cần sửa trước, vì người dùng gặp ngay khi thao tác sai.

### `TournamentService.cs`

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 591 | `Giải đấu đã hoặc đang diễn ra hoặc đã kết thúc. Không được phép gán lại làn đua!` | `The tournament has already started or finished. Lane assignment is no longer allowed.` |
| 606 | `Lượt đua này đã hoặc đang bắt đầu diễn ra. Không được phép gán lại làn đua!` | `This race has already started. Lane assignment is no longer allowed.` |

### `AuthService.cs`

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 45 | `Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email của bạn để thực hiện xác thực.` | `Your account has not been activated. Please check your email to verify it.` |
| 134 | `Đăng ký thành công nhưng không thể gửi email xác thực. Chi tiết lỗi SMTP: {ex.Message}` | `Registration succeeded but the verification email could not be sent. SMTP error: {ex.Message}` |
| 180 | `Tài khoản thuộc nhóm quản trị hệ thống không được phép liên kết tự động bằng Google Login.` | `Administrator accounts cannot be linked automatically via Google Login.` |

### `AuthController.cs`

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 58 | `Mã xác thực Google không hợp lệ hoặc đã hết hạn.` | `The Google credential is invalid or has expired.` |
| 69 | `Đã xảy ra lỗi trong quá trình xác thực.` | `An error occurred during authentication.` |

### `PaymentsController.cs`

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 61 | `Số tiền nạp tối thiểu là 10,000 VND.` | `The minimum deposit amount is 10,000 VND.` |

---

## 🟡 Ưu tiên vừa — Nội dung thông báo (notification)

Những câu này hiện trong chuông thông báo và trang Notifications của mọi vai trò.

### `MedicalCheckService.cs` — nhiều nhất, 24 chuỗi

Các cặp tiêu đề + nội dung khi bác sĩ thú y khám ngựa:

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 178 | `Khám sức khỏe định kỳ không đạt` | `Periodic health check failed` |
| 179 | `Ngựa {horseName} của bạn không đạt yêu cầu khám lại sức khỏe định kỳ vì lý do: {FailReason}.` | `Your horse {horseName} failed the periodic health re-check. Reason: {FailReason}.` |
| 185 | `Khám sức khỏe đạt (Healthy)` | `Health check passed (Healthy)` |
| 186 | `Ngựa {horseName} của bạn đã đạt yêu cầu khám sức khỏe định kỳ và đã hồi phục (Healthy).` | `Your horse {horseName} passed the periodic health check and has recovered (Healthy).` |
| 249 | `Khám sức khỏe không đạt` | `Health check failed` |
| 250 | `Ngựa {horseName} của bạn không đạt yêu cầu khám sức khỏe cho giải đấu {tournamentName} vì lý do: {FailReason}.` | `Your horse {horseName} failed the health check for tournament {tournamentName}. Reason: {FailReason}.` |
| 264 | `Không có` | `None` |
| 277 | `Khám sức khỏe đạt (Pass)` | `Health check passed` |
| 278 | `Ngựa {horseName} của bạn đã đạt (pass) yêu cầu khám sức khỏe cho giải đấu {tournamentName}.` | `Your horse {horseName} passed the health check for tournament {tournamentName}.` |

*(Còn khoảng 15 chuỗi tương tự trong file này — cùng dạng tiêu đề/nội dung thông báo khám sức khoẻ.)*

### `JockeyContractService.cs` — 13 chuỗi

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 226 | `Đề nghị hợp đồng đã được gửi` | `Contract proposal sent` |
| 239 | `Lời mời hợp đồng nài ngựa mới` | `New jockey contract invitation` |
| 355 | `Lời mời nài ngựa bị hủy` | `Jockey invitation cancelled` |
| 356 | `Lời mời nài ngựa cho ngựa '{...}' gửi tới Jockey '{...}' đã bị tự động hủy do Jockey đã nhận lời mời từ chủ ngựa khác trong giải đấu '{...}'.` | `The invitation for horse '{...}' sent to jockey '{...}' was cancelled automatically because the jockey accepted another owner's invitation in tournament '{...}'.` |
| 385 | `Phản hồi hợp đồng nài ngựa` | `Jockey contract response` |
| 398 | `Cập nhật trạng thái hợp đồng nài ngựa` | `Jockey contract status updated` |
| 443 | `Hủy lời mời nài ngựa` | `Jockey invitation cancelled` |
| 456 | `Hợp đồng bị hủy từ chủ ngựa` | `Contract cancelled by horse owner` |

### `RegistrationService.cs` — 4 chuỗi

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 134 | giá trị mặc định `"Ngựa"` | `"Horse"` |
| 135 | giá trị mặc định `"Giải đấu"` | `"Tournament"` |
| 138 | `Yêu cầu khám sức khỏe mới` | `New health check request` |
| 139 | `Ngựa '{horseName}' đã đăng ký tham gia giải đấu '{tournamentName}' và đang chờ khám sức khỏe.` | `Horse '{horseName}' has registered for tournament '{tournamentName}' and is awaiting a health check.` |

### `TournamentDeadlineWorker.cs`

| Dòng | Câu hiện tại | Đề xuất |
|---|---|---|
| 133 | `Đăng ký bị hủy tự động` | `Registration cancelled automatically` |

*(Các dòng 38, 68, 81 trong file này chỉ là **comment code**, không hiển thị ra ngoài — có thể giữ nguyên.)*

---

## 🟢 Ưu tiên thấp — Nội dung email

`AuthService.cs` dòng 118–128: template email xác thực tài khoản (tiêu đề
`Xác Thực Tài Khoản Đăng Ký`, nút bấm, dòng chân trang). Người dùng đọc trong
hộp thư nên không ảnh hưởng giao diện web, nhưng nếu thống nhất được thì tốt.

---

## Ghi chú

- Các dòng chỉ là **comment trong code** (`// ...`) thì không cần sửa, vì không
  bao giờ hiển thị ra ngoài. Đã loại khỏi danh sách ưu tiên ở trên.
- Sau khi backend sửa xong, frontend **không cần thay đổi gì** — mọi thông báo
  đã đi qua `parseApiError()` và hiển thị nguyên văn những gì backend trả về.
- Nếu backend muốn hỗ trợ đa ngôn ngữ về sau, nên trả thêm **mã lỗi** (ví dụ
  `TOURNAMENT_ALREADY_STARTED`) bên cạnh câu chữ, để frontend tự chọn ngôn ngữ
  hiển thị mà không phụ thuộc vào câu văn.
