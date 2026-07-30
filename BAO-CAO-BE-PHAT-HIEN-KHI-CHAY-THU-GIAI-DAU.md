# Báo cáo Backend — phát hiện khi chạy thử trọn vòng đời giải đấu

**Ngày:** 29/07/2026 · **Môi trường:** BE local + SQL Server local
**Giải dùng để thử:** `E2E Test Cup 041057` (TournamentId #94) — chạy đủ 12 bước từ
tạo giải tới trả thưởng.

> File này chỉ gồm **phần thuộc backend**, để gửi thẳng cho nhóm BE.
> Chi tiết đầy đủ xem `BAO-CAO-KIEM-THU-VONG-DOI-GIAI-DAU.md`.

---

## 🔴 1. Gửi email thất bại làm hỏng phản hồi API — dữ liệu vẫn được ghi

**Mức độ:** Cao · **Đã tái hiện 2 lần**

### Hiện tượng

```
Chủ ngựa mời nài ngựa  (POST /jockey-contracts)
  → API trả lỗi: "Không thể gửi email qua SMTP: 535 5.7.8 Username and Password not accepted"
  → Kiểm tra CSDL: 4 hợp đồng ĐÃ ĐƯỢC TẠO, trạng thái Pending

Nài ngựa chấp nhận  (PUT /jockeys/contracts/{id}/respond)
  → API trả lỗi SMTP y hệt
  → Kiểm tra CSDL: 4 hợp đồng ĐÃ chuyển sang Active
```

Nghiệp vụ chính chạy xong, dữ liệu ghi đúng, **nhưng người dùng chỉ thấy màn hình báo
lỗi đỏ**.

### Hậu quả

- Chủ ngựa tưởng thất bại → bấm mời lại → nhận lỗi *"Ngựa này đã có lời mời đang chờ"*
  → hai thông báo mâu thuẫn nhau
- Nài ngựa tưởng chưa chấp nhận được → bấm lại → có thể nhận lỗi *"đã phản hồi rồi"*
- Nhóm phát triển nhìn log tưởng chức năng hỏng, trong khi dữ liệu vẫn đúng

### Đây là lỗi lặp lại

Cùng kiểu với mục 2 trong `BAO-CAO-LOI-BE.md` (nạp tiền gặp lỗi SMTP nhưng tiền vẫn
vào ví). Nghĩa là cần rà **toàn bộ** các chỗ gửi email/thông báo, không chỉ sửa hai
chỗ này.

### Nơi cần sửa

- `JockeyContractService.cs` — tạo hợp đồng và phản hồi hợp đồng
- `WalletService.cs` — nạp/rút tiền (đã nêu ở báo cáo trước)
- Rà thêm các service khác có gọi `_emailService`

### Cách sửa

Email, thông báo đẩy, ghi log đều là **việc phụ** — hỏng thì không được làm hỏng việc
chính:

```csharp
// Nghiệp vụ chính
await _contractRepository.SaveChangesAsync();

// Việc phụ — bọc riêng, nuốt lỗi
try
{
    await _emailService.SendAsync(...);
}
catch (Exception ex)
{
    _logger.LogWarning(ex, "Khong gui duoc email cho hop dong {Id}", contract.ContractId);
    // Cân nhắc đẩy vào hàng đợi để gửi lại sau
}

return Ok(new { message = "Da gui loi moi thanh cong." });
```

Với hệ thống chạy thật, nên đưa email vào **hàng đợi nền** thay vì gửi ngay trong lúc
xử lý yêu cầu — phản hồi nhanh hơn và tự gửi lại được khi lỗi.

---

## 🟡 2. Thông báo lỗi khám sức khoẻ gộp nhiều điều kiện

**Mức độ:** Vừa · **Nơi sửa:** `MedicalCheckService.cs` — `ValidatePassEligibility` (dòng ~83-92)

Khi bác sĩ nhập nhiệt độ 38,5 °C (ngưỡng cho phép 37,2–38,3), hệ thống báo:

> *"Setting PASS status is not allowed when weight is out of the 300-700kg range or
> vital/doping signs do not meet the required health standards!"*

Câu này gộp **cân nặng + dấu hiệu sinh tồn + doping** vào một thông báo. Bác sĩ không
biết sai ở chỉ số nào, phải tự dò từng ô. Khi kiểm thử tôi cũng mất một lượt thử mới
đoán ra là do nhiệt độ.

### Đề xuất

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

## 🟡 3. Nài ngựa chưa có cơ chế nhận tiền công

**Mức độ:** Vừa (cần thống nhất nghiệp vụ trước khi sửa code)

Chạy hết vòng đời giải đấu, ví nài ngựa vẫn **bằng 0**, không phát sinh giao dịch nào —
dù hợp đồng ghi rõ phí thuê **1.000** và thưởng thắng **10%**.

Backend **có** hỗ trợ chia tỷ lệ thưởng owner/jockey (`TournamentService.cs` kiểm tra
`OwnerPercentage + JockeyPercentage = 100`), nhưng:

- Frontend đang ghi cứng `100/0` nên tính năng này chưa từng được dùng
  *(phần này thuộc FE, nhóm FE sẽ xử lý)*
- **Backend chưa có bước thanh toán hợp đồng** khi giải kết thúc — phí thuê và thưởng
  thắng ghi trong `JockeyContract` không được chi trả ở bất kỳ đâu

### Cần nhóm thống nhất

Nài ngựa được trả công theo cơ chế nào?

| Phương án | Việc backend cần làm |
|---|---|
| **Theo hợp đồng** (phí thuê + % thưởng) | Bổ sung bước thanh toán hợp đồng khi giải kết thúc — trừ ví chủ ngựa, cộng ví nài ngựa |
| **Theo tỷ lệ chia giải thưởng** | Giữ nguyên logic hiện có, chỉ cần FE gửi đúng tỷ lệ |
| **Cả hai** | Làm rõ thứ tự: trả thưởng trước hay thanh toán hợp đồng trước |

Hiện tại cả hai cơ chế đều không chạy, nên nài ngựa làm không công.

---

## ✅ Những điểm backend làm tốt

Ghi nhận để nhóm biết mà giữ:

1. **Kiểm tra ví hệ thống trước khi tạo giải** — bắt buộc ví admin đủ tiền cho toàn bộ
   giải thưởng (cần 17.000, ví 0 → chặn). Tránh được tình huống tới lúc trao thưởng mới
   phát hiện thiếu tiền.
2. **Ràng buộc ngày tháng chặt chẽ**: ngày mở đăng ký không được ở quá khứ; giải phải
   bắt đầu sau khi đóng đăng ký ít nhất 5 ngày; giải mới cách giải cũ ít nhất 1 ngày.
3. **Không sinh được cuộc đua khi chưa đủ 12 ngựa đã qua khám** — kiểm tra cả số lượng
   lẫn trạng thái khám.
4. **Không nộp được kết quả trước giờ đua.**
5. **Ngưỡng sức khoẻ đúng y học**: nhiệt độ 37,2–38,3 °C, nhịp tim 28–44, cân nặng
   300–700 kg.
6. **Phân quyền vững**: 9/9 phép thử vượt quyền đều bị chặn 403; không truy cập được
   dữ liệu của người dùng khác cùng vai trò.
7. **Dòng tiền trao thưởng khớp chính xác**: mỗi khoản `Prize_Payout` trừ ví hệ thống
   đều có `Prize_Reward` cộng vào ví chủ ngựa tương ứng, không lệch một đồng.

---

## Tổng hợp

| # | Nội dung | Mức độ |
|---|---|---|
| 1 | Gửi email lỗi làm hỏng phản hồi API dù dữ liệu đã ghi | 🔴 Cao |
| 2 | Thông báo lỗi khám sức khoẻ gộp nhiều điều kiện | 🟡 Vừa |
| 3 | Nài ngựa chưa có cơ chế nhận tiền công | 🟡 Vừa |

Các lỗi backend phát hiện ở những đợt trước vẫn còn hiệu lực, xem:
- `BAO-CAO-LOI-BE.md` — lỗi bảo mật và validate
- `BAO-CAO-LOI-BE-TRANG-THAI-GIAI-DAU.md` — giải kẹt ở `PendingAdminAttention`
- `BAO-CAO-BE-THONG-BAO-TIENG-VIET.md` — 50 chuỗi tiếng Việt cần đổi sang tiếng Anh
- `BAO-CAO-KIEM-THU-VA-LO-HONG-NGHIEP-VU.md` — 8 lỗ hổng nghiệp vụ (khoá tài khoản,
  đặt cược, xoá ngựa, đăng ký trùng lịch…)
