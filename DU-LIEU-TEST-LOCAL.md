# Dữ liệu thử nghiệm trên máy (local)

**Cập nhật:** 30/07/2026
**Cơ sở dữ liệu:** `HorseRacingManagementSystem` trên `.\SQLEXPRESS` — **chỉ ở máy bạn,
không liên quan tới máy chủ deploy.**

Tài liệu này ghi lại toàn bộ dữ liệu đang có để bạn biết mở lên là thấy gì và dùng vào
việc gì. Dữ liệu được dựng lại từ đầu sau khi dọn sạch, cố ý phủ hết mọi trạng thái để
thử được mọi màn hình.

---

## 1. Tài khoản đăng nhập

### Tài khoản chính — mật khẩu `123456`

| Email | Vai trò | Ví | Dùng để thử |
|---|---|---|---|
| `admin@gmail.com` | Quản trị viên | **500.000** | Tạo giải, duyệt đơn, xếp lịch, trao thưởng |
| `owner@gmail.com` | Chủ ngựa | 0 | Đăng ký ngựa, mời nài ngựa, xem kết quả |
| `owner2@gmail.com` | Chủ ngựa | 0 | Thử xem dữ liệu của chủ khác có bị lộ không |
| `owner3@gmail.com` | Chủ ngựa | 0 | |
| `jockey@gmail.com` | Nài ngựa | 0 | Nhận/từ chối lời mời, xem lịch đua |
| `referee@gmail.com` | Trọng tài | 0 | Kiểm tra ngựa, ghi vi phạm, nộp kết quả |
| `spectator@gmail.com` | Khán giả | **50.000** | Đặt cược, nạp/rút tiền |
| `vet@gmail.com` | Bác sĩ thú y | 0 | Khám sức khoẻ ngựa |

### Tài khoản phụ — mật khẩu `Test@1234`

| Email | Vai trò | Số lượng |
|---|---|---|
| `jk1@test.com` … `jk12@test.com` | Nài ngựa | 12 |
| `rf1@test.com`, `rf2@test.com` | Trọng tài | 2 |

> **Lưu ý về mật khẩu:** backend yêu cầu mật khẩu mới phải **từ 8 ký tự** và có đủ
> **chữ hoa, chữ thường, chữ số, ký tự đặc biệt**. Các tài khoản cũ vẫn dùng được
> `123456` vì đã tạo từ trước khi có luật này. Khi tạo tài khoản mới phải theo luật mới.

---

## 2. Giải đấu — 10 giải, phủ đủ 9 trạng thái

| ID | Tên | Trạng thái | Dùng để thử |
|---|---|---|---|
| 98 | DEMO 1 - Đang mở đăng ký | `Registration Open` | **Đăng ký ngựa, mời nài ngựa** |
| 99 | DEMO 2 - Chưa mở đăng ký | `PendingRegistration` | Hiển thị giải sắp mở, chưa cho đăng ký |
| 100 | DEMO 3 - Chờ xếp lịch | `PendingScheduling` | **Sinh cuộc đua** (đã đủ 12 ngựa duyệt) |
| 101 | DEMO 4 - Sắp diễn ra | `Upcoming` | **Đặt cược, gán trọng tài** (đã có cuộc đua) |
| 102 | DEMO 5 - Đang diễn ra | `Active` | **Nộp kết quả** (cuộc đua đang `Live`) |
| 103 | DEMO 6 - Đã kết thúc | `Completed` | Màn hình chỉ xem, không sửa được |
| 104 | DEMO 7 - Đã huỷ | `Cancelled` | Hiển thị giải bị huỷ |
| 105 | DEMO 8 - Tạm đóng chờ gia hạn | `Registration Suspended` | **Nút gia hạn đăng ký** |
| 106 | DEMO 9 - Chờ admin xử lý | `PendingAdminAttention` | Cảnh báo thiếu trọng tài |
| 97 | E2E Clean Cup | `Registration Open` | Giải tạo lúc kiểm thử |

---

## 3. Đơn đăng ký — 47 đơn, đủ 4 trạng thái

| Trạng thái | Số lượng | Ý nghĩa |
|---|---|---|
| `PendingVet` | 4 | Vừa đăng ký, **chờ bác sĩ khám** |
| `Pending` | 3 | Đã khám đạt, **chờ admin duyệt** |
| `Approved` | 39 | Đã duyệt, được vào giải |
| `Rejected` | 1 | Bị loại vì khám **không đạt** |

Riêng giải **98** có đủ cả 4 trạng thái để xem giao diện lọc theo tab.

---

## 4. Phiếu khám sức khoẻ — 43 phiếu

| Kết quả | Số lượng |
|---|---|
| `Pass` | 42 |
| `Fail` | 1 — ghi rõ lý do *"Nhiệt độ và nhịp tim vượt ngưỡng cho phép"* |

Ngưỡng hợp lệ của hệ thống: nhiệt độ **37,2–38,3 °C** · nhịp tim **28–44** ·
cân nặng **300–700 kg** · doping phải **âm tính**.

---

## 5. Hợp đồng nài ngựa — 42 hợp đồng

| Trạng thái | Số lượng | Ý nghĩa |
|---|---|---|
| `Pending` | 3 | Đã mời, **chờ nài ngựa trả lời** |
| `Active` | 39 | Nài ngựa **đã nhận lời** |

Phí thuê 1.000–1.500 · thưởng thắng 10–15%.

---

## 6. Cuộc đua — 2 cuộc

| Cuộc đua | Giải | Trạng thái | Số ngựa | Trọng tài | Dùng để thử |
|---|---|---|---|---|---|
| Final Race | 101 (Upcoming) | `Scheduled` | 12 | Đã gán | **Đặt cược, xếp làn** |
| Final Race | 102 (Active) | `Live` | 12 | Đã gán | **Nộp kết quả** |

24 suất đua (`RaceEntry`), đã xếp làn từ 1 đến 12.

---

## 7. Cược — 1 vé

| Trạng thái | Số tiền | Ghi chú |
|---|---|---|
| `Pending` | 15.000 | Đang chờ kết quả cuộc đua |

> Mức cược tối thiểu backend yêu cầu là **10.000**. Mỗi người **chỉ được cược một ngựa**
> cho mỗi cuộc đua (chặn gian lận cược hết mọi ngựa).

---

## 8. Ngựa — 40 con

| Sức khoẻ | Số lượng | Dùng để thử |
|---|---|---|
| `Healthy` | 28 | Đăng ký giải bình thường |
| `Injured` | 6 | **Bị chặn khi đăng ký** |
| `Recovering` | 6 | **Bị chặn khi đăng ký** |

Ngựa chia cho 3 chủ: `owner@`, `owner2@`, `owner3@`.

---

## 9. Gợi ý kịch bản thử

| Muốn thử | Vào đâu |
|---|---|
| Đăng ký ngựa | `owner@` → giải **98** |
| Ngựa chấn thương bị chặn | `owner@` → chọn ngựa `Injured`/`Recovering` |
| Khám sức khoẻ | `vet@` → 4 đơn `PendingVet` |
| Duyệt đơn | `admin@` → 3 đơn `Pending` |
| Nhận lời mời nài ngựa | `jockey@` hoặc `jk1@` → 3 hợp đồng `Pending` |
| Sinh cuộc đua | `admin@` → giải **100** |
| Gán trọng tài, xếp làn | `admin@` → giải **101** |
| Đặt cược | `spectator@` → cuộc đua của giải **101** |
| Nộp kết quả | `referee@` → cuộc đua `Live` của giải **102** |
| Gia hạn đăng ký | `admin@` → giải **105** |
| Màn hình chỉ xem | `admin@` → giải **103** (đã kết thúc) |

---

## 10. Cách kết nối và khôi phục

### Trỏ giao diện về máy mình

Trong `.env.local`:

```
VITE_API_URL=http://localhost:55446/api
```

Muốn quay lại dùng máy chủ deploy thì thêm dấu `#` vào đầu dòng đó.

### Chạy backend

```bash
cd .../backend/src/HorseRacing.API
dotnet run --urls "http://localhost:55446"
```

### Bản sao lưu trước khi dọn dữ liệu

```
c:\Program Files\Microsoft SQL Server\MSSQL10_50.SQLEXPRESS\MSSQL\DATA\
HorseRacing_backup_20260730_232549.bak
```

Khôi phục lại dữ liệu cũ:

```sql
RESTORE DATABASE [HorseRacingManagementSystem]
FROM DISK = N'...\HorseRacing_backup_20260730_232549.bak' WITH REPLACE;
```

---

## 11. Những gì chưa có trong dữ liệu

Ghi rõ để không hiểu nhầm là đã phủ hết:

- **Cược đã có kết quả** (`Won` / `Lost`) — mới có cược đang chờ
- **Kết quả cuộc đua** (`RaceResult`) — chưa cuộc nào công bố kết quả
- **Vi phạm và báo cáo trọng tài** — chưa có
- **Giao dịch rút tiền chờ duyệt** — đã xoá khi dọn dữ liệu
- **Thông báo** — bảng trống, sẽ tự sinh khi thao tác

Muốn có những thứ này thì chạy hết một vòng giải đấu: nộp kết quả cuộc đua `Live` ở
giải **102** → công bố kết quả → hệ thống sẽ tự chốt cược và trả thưởng.
