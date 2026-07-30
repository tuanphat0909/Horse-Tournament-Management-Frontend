# Báo cáo kiểm thử trọn vòng đời một giải đấu

**Ngày:** 29/07/2026
**Môi trường:** Backend local (`http://localhost:55446`) + SQL Server SQLEXPRESS local.
Không đụng cơ sở dữ liệu deploy.
**Giải dùng để thử:** `E2E Test Cup 041057` — TournamentId **#94**

> Đây là phần bổ sung cho `BAO-CAO-KIEM-THU-VA-LO-HONG-NGHIEP-VU.md`. Báo cáo trước ghi
> *"chưa kiểm thử vòng đời đầy đủ"* — nay đã chạy trọn vẹn từ tạo giải tới trả thưởng.

---

## 1. Kết quả 12 bước

| Bước | Thao tác | Kết quả |
|---|---|---|
| 1 | Admin tạo giải đấu | ✅ (sau khi vượt 4 ràng buộc, xem mục 2) |
| 2 | Chủ ngựa đăng ký 5 ngựa | ✅ → `PendingVet` |
| 3 | Bác sĩ thú y khám sức khoẻ | ✅ 4 đạt, 1 bị loại đúng ý muốn |
| 4 | Chủ ngựa mời nài ngựa | ⚠️ tạo được nhưng **API báo lỗi** (mục 3) |
| 5 | Nài ngựa chấp nhận lời mời | ⚠️ chuyển `Active` nhưng **API báo lỗi** (mục 3) |
| 6 | Admin duyệt đơn đăng ký | ✅ 4 đơn → `Approved` |
| 7 | Đóng đăng ký sớm | ✅ → `Registration Suspended` (chưa đủ 12 ngựa) |
| 8 | Sinh các cuộc đua | ✅ 1 cuộc chung kết, 12 ngựa |
| 9 | Gán trọng tài | ✅ |
| 10 | Khán giả đặt cược 500 | ✅ |
| 11 | Trọng tài nộp kết quả | ✅ → cuộc đua `Completed` |
| 12 | Công bố kết quả + trả thưởng | ✅ → giải `Completed` |

### Dòng tiền sau khi trả thưởng — khớp chính xác

| Tài khoản | Trước | Sau | Chênh lệch |
|---|---|---|---|
| Ví hệ thống (admin) | 50.000 | 33.000 | **−17.000** (chi 3 giải) |
| Chủ ngựa | 25.000 | 42.000 | **+17.000** (Top 1 + 2 + 3) |
| Khán giả | 10.000 | 11.000 | **+500** (cược 500, thắng 1.000) |
| **Nài ngựa** | **0** | **0** | **±0 ← bất thường, xem mục 4** |

Các giao dịch ví ghi đầy đủ và đúng cặp: mỗi khoản `Prize_Payout` trừ ví hệ thống đều
có `Prize_Reward` cộng vào ví chủ ngựa tương ứng. Không thất thoát, không lệch số.

---

## 2. Ràng buộc khi tạo giải — chặt chẽ, đáng ghi nhận

Phải thử **4 lần** mới tạo được giải, mỗi lần bị chặn bởi một luật khác nhau:

1. **Ví hệ thống phải đủ tiền cho toàn bộ giải thưởng** — cần 17.000 nhưng ví đang 0
2. Ngày mở đăng ký không được ở quá khứ
3. Giải phải bắt đầu **sau khi đóng đăng ký ít nhất 5 ngày**
4. Giải mới phải cách giải đang có **ít nhất 1 ngày**

Đây là điểm **làm rất tốt**. Đặc biệt luật số 1: kiểm tra ví ngay lúc tạo giải giúp
tránh tình huống tới lúc trao thưởng mới phát hiện không đủ tiền chi.

*Góp ý nhỏ:* luật số 4 khiến hệ thống chỉ chạy được một giải tại một thời điểm. Nếu
sau này có nhiều trường đua thì nên gắn ràng buộc theo từng trường thay vì áp cho
toàn hệ thống.

Hệ thống cũng chặn đúng ở các bước sau:
- Không sinh được cuộc đua khi **chưa đủ 12 ngựa đã qua khám**
- Không nộp được kết quả **trước giờ đua**
- Không đánh giá ĐẠT khi chỉ số sức khoẻ ngoài ngưỡng (nhiệt độ 37,2–38,3 °C; nhịp tim 28–44; cân nặng 300–700 kg)

---

## 🔴 3. Gửi email thất bại làm hỏng phản hồi API — dữ liệu vẫn được ghi

**Đã kiểm chứng thực tế, tái hiện 2 lần.**

Máy local không cấu hình được SMTP nên gửi email thất bại. Hậu quả:

```
Chủ ngựa mời nài ngựa
  → API trả lỗi: "Không thể gửi email qua SMTP: 535 5.7.8 Username and Password not accepted"
  → Kiểm tra CSDL: 4 hợp đồng ĐÃ ĐƯỢC TẠO, trạng thái Pending

Nài ngựa bấm chấp nhận
  → API trả lỗi SMTP y hệt
  → Kiểm tra CSDL: 4 hợp đồng ĐÃ chuyển sang Active
```

**Nghiệp vụ chính đã chạy xong, nhưng người dùng chỉ nhìn thấy màn hình báo lỗi đỏ.**

### Hậu quả thực tế

- Chủ ngựa tưởng thất bại → bấm mời lại → lần này nhận lỗi *"Ngựa này đã có lời mời
  đang chờ"* → hoang mang vì hai thông báo mâu thuẫn nhau
- Nài ngựa tưởng chưa chấp nhận được → bấm lại → có thể nhận lỗi *"đã phản hồi rồi"*
- Nhóm phát triển nhìn log tưởng chức năng hỏng, trong khi dữ liệu vẫn đúng

Đây **cùng một kiểu lỗi** với mục 2 trong `BAO-CAO-LOI-BE.md` (nạp tiền gặp lỗi SMTP
nhưng tiền vẫn vào ví). Nghĩa là lỗi này lặp ở nhiều nơi, không phải trường hợp cá biệt.

### Cách xử lý

Email, thông báo đẩy, ghi log — đều là **việc phụ**. Việc phụ hỏng thì không được làm
hỏng việc chính:

```csharp
// Nghiệp vụ chính: lưu hợp đồng
await _contractRepository.SaveChangesAsync();

// Việc phụ: gửi email — hỏng cũng không được ảnh hưởng kết quả trả về
try
{
    await _emailService.SendAsync(...);
}
catch (Exception ex)
{
    _logger.LogWarning(ex, "Khong gui duoc email moi nai ngua cho hop dong {Id}",
                       contract.ContractId);
    // Cân nhắc: đẩy vào hàng đợi để gửi lại sau
}

return Ok(new { message = "Da gui loi moi thanh cong." });
```

Với hệ thống chạy thật, email nên đưa vào **hàng đợi nền** thay vì gửi ngay trong lúc
xử lý yêu cầu — vừa phản hồi nhanh hơn cho người dùng, vừa tự gửi lại được khi lỗi.

---

## 🔴 4. Nài ngựa không nhận được đồng nào từ giải thưởng

**Đã kiểm chứng thực tế.**

Sau khi trả thưởng xong, ví nài ngựa vẫn **bằng 0**, không phát sinh một giao dịch nào
— mặc dù:

- Hợp đồng ghi rõ phí thuê **1.000** và thưởng thắng **10%**
- Lúc tạo giải đã gửi lên tỷ lệ chia `ownerPercentage: 70, jockeyPercentage: 30`

### Cấu hình thực tế lưu trong CSDL

| Hạng | Tiền thưởng | OwnerPercentage | JockeyPercentage |
|---|---|---|---|
| 1 | 10.000 | **100** | **0** |
| 2 | 5.000 | **100** | **0** |
| 3 | 2.000 | **100** | **0** |

Tỷ lệ 70/30 gửi lên đã bị thay thành 100/0.

### Nguyên nhân nằm ở frontend

`src/pages/admin/AdminTournamentsPage.jsx`, dòng 362-364:

```jsx
{ rankPosition: 1, amount: firstPrize,  ownerPercentage: 100, jockeyPercentage: 0 },
{ rankPosition: 2, amount: secondPrize, ownerPercentage: 100, jockeyPercentage: 0 },
{ rankPosition: 3, amount: thirdPrize,  ownerPercentage: 100, jockeyPercentage: 0 },
```

Giá trị bị **ghi cứng**, và giao diện cũng không có ô cho quản trị viên nhập tỷ lệ.

Backend thực ra **có hỗ trợ** chia tỷ lệ — trong `TournamentService.cs` có kiểm tra
`OwnerPercentage + JockeyPercentage` phải bằng đúng 100%. Nhưng frontend không bao giờ
gửi giá trị khác 100/0 nên tính năng này chưa từng được dùng.

### Hệ quả

Toàn bộ tiền thưởng về chủ ngựa. Nài ngựa — người trực tiếp cưỡi ngựa đua — không nhận
được gì từ giải thưởng. Phí thuê 1.000 ghi trong hợp đồng cũng không thấy được thanh toán.

### Cần làm rõ với nhóm

Nài ngựa được trả công theo cơ chế nào?

- **Nếu theo hợp đồng** (phí thuê + % thưởng): phải bổ sung bước thanh toán hợp đồng
  khi giải kết thúc — hiện chưa có
- **Nếu theo tỷ lệ chia giải thưởng**: phải mở ô nhập tỷ lệ trên giao diện quản trị và
  bỏ giá trị ghi cứng ở frontend

Hiện tại **cả hai cơ chế đều không chạy**, nên nài ngựa làm không công.

---

## 🟡 5. Thông báo lỗi khám sức khoẻ gộp nhiều điều kiện

Khi bác sĩ nhập nhiệt độ 38,5 °C (ngưỡng cho phép 37,2–38,3), hệ thống báo:

> *"Setting PASS status is not allowed when weight is out of the 300-700kg range or
> vital/doping signs do not meet the required health standards!"*

Câu này gộp **cân nặng + dấu hiệu sinh tồn + doping** vào một thông báo duy nhất. Bác sĩ
không biết mình sai ở chỉ số nào, phải tự dò từng ô. Trong lần kiểm thử này tôi cũng
mất một lượt thử mới đoán ra là do nhiệt độ.

**Đề xuất** — tách riêng từng điều kiện:

```csharp
var loi = new List<string>();
if (!tempOk)   loi.Add($"Nhiet do {temperature}°C ngoai khoang cho phep 37,2-38,3°C");
if (!hrOk)     loi.Add($"Nhip tim {heartRate} ngoai khoang cho phep 28-44");
if (!weightOk) loi.Add($"Can nang {weight}kg ngoai khoang cho phep 300-700kg");
if (!dopingOk) loi.Add("Ket qua doping duong tinh");

if (loi.Any())
    throw new ArgumentException("Khong the danh gia DAT: " + string.Join("; ", loi));
```

---

## 6. Tổng hợp phát hiện mới

| # | Nội dung | Mức độ | Thuộc về |
|---|---|---|---|
| 3 | Gửi email lỗi làm hỏng phản hồi API dù dữ liệu đã ghi | 🔴 Cao | Backend |
| 4 | Nài ngựa không nhận tiền thưởng (tỷ lệ bị ghi cứng 100/0) | 🔴 Cao | **Frontend** + nghiệp vụ |
| 5 | Thông báo lỗi khám sức khoẻ gộp nhiều điều kiện | 🟡 Vừa | Backend |

**Riêng mục 4 thuộc frontend** — tức là nhóm có thể tự sửa được ngay, không cần chờ
backend.

---

## 7. Ghi chú về dữ liệu kiểm thử

- Giải **#94** cùng các đơn đăng ký, hợp đồng, cuộc đua, kết quả và giao dịch ví liên
  quan là **dữ liệu do kiểm thử sinh ra**, đang nằm trong CSDL local. Có thể xoá nếu
  muốn dọn sạch.

- Đã can thiệp CSDL ở **ba chỗ** để rút ngắn thời gian chờ. Những can thiệp này không
  ảnh hưởng tới tính đúng đắn của phần được kiểm thử:
  1. Lùi ngày mở đăng ký về quá khứ (thay vì chờ 3 phút)
  2. Thêm 8 ngựa kèm phiếu khám cho đủ mức tối thiểu 12 con — phần đăng ký và khám đã
     được kiểm thử đầy đủ qua API với 5 ngựa đầu
  3. Lùi giờ đua về 1 giờ trước để nộp được kết quả (thay vì chờ 36 ngày)

- Ví hệ thống đã được nạp 50.000 qua API `POST /admin/wallet/deposit` để có quỹ trao
  giải. Chính API này là lỗ hổng đã nêu ở mục 1 của `BAO-CAO-LOI-BE.md` — nạp tiền
  không cần qua thanh toán thật.

---

## 8. Kết luận

**Vòng đời giải đấu chạy được trọn vẹn từ đầu đến cuối.** Không có bước nào tắc, không
có màn hình nào chết. Dòng tiền trao thưởng khớp chính xác tới từng đồng.

Các ràng buộc nghiệp vụ ở phần tạo giải, sinh cuộc đua và nộp kết quả **được làm khá
chặt chẽ** — nhiều chỗ chặt hơn tôi dự đoán.

Hai vấn đề cần xử lý trước khi đưa vào chạy thật:
1. **Email lỗi không được làm hỏng nghiệp vụ chính** (backend)
2. **Nài ngựa phải được trả công** — hiện đang làm không công (frontend + nghiệp vụ)
