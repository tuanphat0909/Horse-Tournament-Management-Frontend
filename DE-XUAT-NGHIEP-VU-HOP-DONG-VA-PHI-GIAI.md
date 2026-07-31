# Đề xuất nghiệp vụ: Hợp đồng nài ngựa, phí tham gia và xử lý khi huỷ giải

**Ngày:** 31/07/2026
**Phạm vi:** Thiết kế nghiệp vụ — không phải báo cáo lỗi kỹ thuật
**Mục đích:** Nhóm thống nhất trước khi viết code, và dùng làm căn cứ trả lời khi bảo vệ

---

## 1. Hiện trạng — đã kiểm tra trong mã nguồn và cơ sở dữ liệu

| Hạng mục | Tình trạng |
|---|---|
| Cột `RentalFee`, `WinningBonusPercentage` trong bảng `JockeyContract` | **Có trong cơ sở dữ liệu, nhưng không dòng mã nào sử dụng** |
| Thanh toán cho nài ngựa | **Không có** — chạy hết vòng đời giải, ví nài ngựa vẫn bằng 0 |
| Phí tham gia giải của chủ ngựa | **Không có** |
| Nguồn tiền trao giải | Ví hệ thống (quản trị viên tự nạp), không thu lại được |
| Khi huỷ giải | Chỉ chặn nếu còn cược chưa chốt, rồi đổi trạng thái — **không xử lý hợp đồng, không hoàn tiền** |

Nói cách khác: **"hợp đồng" hiện chỉ là lời mời và lời đồng ý**, không có ràng buộc nào
bằng tiền.

---

## 2. Ba vấn đề cần giải quyết

### 2.1. Hợp đồng không ràng buộc nên không ai chịu trách nhiệm

| Tình huống | Hậu quả hiện nay |
|---|---|
| Nài ngựa nhận lời rồi bỏ ngang | Chủ ngựa mất suất đua; nài ngựa không mất gì |
| Chủ ngựa huỷ đăng ký sau khi đã mời | Nài ngựa đã từ chối lời mời khác để giữ chỗ, giờ trắng tay |
| Giải bị huỷ | Cả hai bên đều thiệt, không có cơ chế đền bù |
| Ngựa thắng giải | Tiền thưởng về hết chủ ngựa, nài ngựa — người trực tiếp đua — không được gì |

### 2.2. Không có phí tham gia thì quỹ giải thưởng không bền

Hiện quản trị viên phải tự nạp tiền vào ví hệ thống để có quỹ trao giải, và **không thu
lại được đồng nào**. Hệ thống chỉ có một nguồn thu duy nhất là chênh lệch cá cược — mà
khoản này không ổn định và không liên quan tới việc tổ chức giải.

Đây là điểm phi thực tế nhất: **càng tổ chức nhiều giải thì càng lỗ**.

### 2.3. Huỷ giải không có quy tắc xử lý hậu quả

Khi giải bị huỷ, hệ thống chỉ đổi trạng thái. Không trả lời được các câu hỏi: tiền phí
tham gia xử lý sao, hợp đồng nài ngựa còn hiệu lực không, ai đền bù cho ai.

---

## 3. Đề xuất

### 3.1. Nài ngựa nhận hai khoản tách biệt

Đây là cách các giải đua thật vận hành:

| Khoản | Bản chất | Thời điểm trả |
|---|---|---|
| **Phí cưỡi** (`RentalFee`) | Trả cho công sức, thắng thua gì cũng có | Ký hợp đồng thì **giữ tạm**, giải kết thúc mới chuyển |
| **Phần trăm tiền thưởng** (`WinningBonusPercentage`) | Thưởng thêm nếu ngựa vào top | Khi trả thưởng |

**Cơ chế giữ tạm (escrow)** là mấu chốt: lúc ký hợp đồng, tiền bị **trừ khỏi ví chủ ngựa
ngay** nhưng **chưa vào ví nài ngựa**. Nhờ vậy:

- Chủ ngựa không thể hứa suông rồi tiêu mất tiền
- Nài ngựa yên tâm tiền đã được giữ, không sợ quỵt
- Khi có sự cố, hệ thống biết chính xác phải hoàn cho ai bao nhiêu

> **Thuận lợi:** backend vừa làm xong cơ chế giữ tạm cho chức năng rút tiền (trừ ngay,
> trạng thái `Pending`, admin duyệt mới chuyển). **Dùng lại đúng cơ chế đó**, không phải
> nghĩ mới.

**Ràng buộc kèm theo:**

- Chủ ngựa phải **đủ tiền trong ví** mới mời được nài ngựa — chặn ngay ở bước gửi lời mời
- Lời mời hết hạn mà nài ngựa không trả lời → **tự hoàn tiền** cho chủ ngựa
- Nài ngựa từ chối → hoàn 100% ngay

### 3.2. Chủ ngựa đóng phí tham gia, quỹ giải tự cân đối

```
Quỹ giải thưởng = Phí tham gia × Số ngựa được duyệt  +  Tiền tài trợ (nếu có)
Hệ thống giữ lại 10–20% làm chi phí vận hành
Phần còn lại chia cho Top 3
```

**Ví dụ với 12 ngựa, phí 5.000/ngựa:**

| Khoản | Số tiền |
|---|---|
| Tổng thu | 60.000 |
| Hệ thống giữ (15%) | 9.000 |
| Quỹ trao giải | 51.000 |
| → Hạng nhất (60%) | 30.600 |
| → Hạng nhì (25%) | 12.750 |
| → Hạng ba (15%) | 7.650 |

**Lợi ích:**

- Quản trị viên **không phải bỏ tiền túi** — hiện tại đang phải nạp 500.000 vào ví hệ thống
- Giải càng đông thì thưởng càng lớn → tạo động lực tham gia
- Hệ thống có nguồn thu **ổn định và hợp lý**, không phụ thuộc cá cược

**Thời điểm thu:** khi quản trị viên **duyệt đơn đăng ký** (không phải lúc nộp đơn) — vì
đơn có thể bị từ chối do khám sức khoẻ không đạt, thu trước rồi hoàn lại sẽ rườm rà.

### 3.3. Quy tắc xử lý khi huỷ

**Huỷ toàn bộ giải:**

| Ai huỷ | Phí tham gia | Hợp đồng nài ngựa |
|---|---|---|
| **Ban tổ chức huỷ** | Hoàn **100%** cho chủ ngựa | Nài ngựa nhận **10–20% phí cưỡi** làm đền bù, lấy từ quỹ vận hành. Phần còn lại hoàn chủ ngựa |
| **Huỷ do bất khả kháng** (thời tiết, dịch bệnh) | Hoàn **100%** | Hoàn **100%** cho chủ ngựa, nài ngựa không đền bù |

Lý do ban tổ chức huỷ thì phải đền: nài ngựa đã giữ lịch, từ chối các lời mời khác.

**Chủ ngựa tự rút khỏi giải:**

| Thời điểm rút | Phí tham gia | Hợp đồng nài ngựa |
|---|---|---|
| Trước khi đóng đăng ký | Hoàn **100%** | Hoàn **100%** |
| Sau khi đóng đăng ký, trước khi xếp làn | Hoàn **50%** | Nài ngựa **giữ toàn bộ** phí cưỡi |
| Sau khi đã xếp làn | **Không hoàn** | Nài ngựa **giữ toàn bộ** phí cưỡi |
| Ngựa bị loại do **khám sức khoẻ không đạt** | Hoàn **100%** | Hoàn **100%** — không phải lỗi cố ý |

**Nài ngựa bỏ ngang sau khi đã nhận lời:**

- Hoàn **100%** phí cưỡi cho chủ ngựa
- **Trừ điểm uy tín** nài ngựa (`RankingPoint`) — cột này đã có sẵn trong `JockeyProfile`
- Chủ ngựa được mời nài ngựa khác thay thế, nếu còn trong thời hạn đăng ký

Nguyên tắc chung: **bên nào chủ động phá vỡ thì bên đó chịu thiệt.**

---

## 4. Ảnh hưởng tới hệ thống hiện có

### Cần thêm

| Hạng mục | Nội dung |
|---|---|
| Bảng `Tournament` | Thêm cột `EntryFee` (phí tham gia mỗi ngựa) |
| Bảng `JockeyContract` | Thêm `PaymentStatus` (`Held` / `Released` / `Refunded`) |
| Loại giao dịch ví | `EntryFee`, `EntryFeeRefund`, `ContractHold`, `ContractRelease`, `ContractRefund`, `CancellationCompensation` |
| Cấu hình hệ thống | Tỷ lệ hệ thống giữ lại, tỷ lệ hoàn theo từng mốc thời gian, mức đền bù khi huỷ |

### Cần sửa

| Chỗ | Sửa gì |
|---|---|
| Mời nài ngựa | Kiểm tra ví đủ tiền → trừ và giữ tạm |
| Duyệt đơn đăng ký | Thu phí tham gia, cộng vào quỹ giải |
| Tạo giải | Quỹ thưởng tính từ phí tham gia thay vì bắt quản trị viên tự nạp |
| Trả thưởng | Chia tiền cho **cả** chủ ngựa và nài ngựa theo tỷ lệ trong hợp đồng |
| Huỷ giải | Chạy đủ quy trình hoàn tiền theo bảng ở mục 3.3 |
| Giao diện | Hiện phí cưỡi khi mời, hiện phí tham gia khi đăng ký, cảnh báo rõ mức hoàn khi rút |

### Không đụng tới

Đặt cược, khám sức khoẻ, xếp làn, nộp và công bố kết quả — các luồng này không liên quan
tới dòng tiền hợp đồng.

---

## 5. Thứ tự nên làm

| Giai đoạn | Nội dung | Vì sao trước |
|---|---|---|
| **1** | Chia tiền thưởng cho nài ngựa theo `WinningBonusPercentage` | Cột đã có sẵn, chỉ cần nối vào bước trả thưởng. Ít việc nhất mà giải quyết được điểm bất hợp lý rõ nhất |
| **2** | Giữ tạm phí cưỡi khi ký hợp đồng | Tái sử dụng cơ chế giữ tạm của chức năng rút tiền |
| **3** | Phí tham gia và quỹ giải tự cân đối | Thay đổi lớn, ảnh hưởng cách tạo giải |
| **4** | Bộ quy tắc hoàn tiền khi huỷ | Làm sau cùng vì phụ thuộc cả hai mục trên |

Giai đoạn 1 và 2 đủ để hệ thống **hợp lý về mặt nghiệp vụ**. Giai đoạn 3 và 4 làm cho nó
**bền vững về mặt tài chính**.

---

## 6. Cách trình bày khi bảo vệ

Nếu được hỏi *"vì sao nài ngựa không được trả tiền?"* — nên trả lời thẳng thay vì né:

> "Nhóm em nhận ra đây là thiếu sót về nghiệp vụ. Hệ thống đã có sẵn cột `RentalFee` và
> `WinningBonusPercentage` trong bảng hợp đồng nhưng chưa nối vào luồng thanh toán, nên
> hợp đồng hiện chỉ mang tính ghi nhận. Hướng xử lý là dùng cơ chế giữ tạm: ký hợp đồng
> thì trừ tiền chủ ngựa ngay và giữ lại, giải kết thúc mới chuyển cho nài ngựa; nếu huỷ
> thì hoàn theo mức độ lỗi của từng bên."

Nếu được hỏi *"tiền thưởng lấy từ đâu?"*:

> "Hiện tại quản trị viên tự nạp vào ví hệ thống — em biết đây là điểm chưa thực tế. Mô
> hình đúng là thu phí tham gia của chủ ngựa, hệ thống giữ lại 10–20% chi phí vận hành,
> phần còn lại làm quỹ trao giải. Như vậy quỹ tự cân đối theo số lượng ngựa dự giải."

Trả lời như trên cho thấy **hiểu nghiệp vụ**, mạnh hơn nhiều so với việc coi như không có
vấn đề.

---

## 7. Tóm tắt

| Vấn đề | Cách giải quyết |
|---|---|
| Hợp đồng không ràng buộc | Phí cưỡi giữ tạm khi ký, chuyển khi giải xong |
| Nài ngựa không nhận tiền thưởng | Chia theo `WinningBonusPercentage` đã có trong hợp đồng |
| Quỹ giải phụ thuộc ví quản trị viên | Thu phí tham gia, hệ thống giữ 10–20% |
| Huỷ giải không có quy tắc | Bảng hoàn tiền theo bên gây ra và thời điểm huỷ |

**Nguyên tắc xuyên suốt:** tiền phải được **giữ trước** để ràng buộc, và **bên nào chủ
động phá vỡ thì bên đó chịu thiệt**.
