# Báo cáo gửi Backend

**Ngày:** 01/08/2026
**Bản backend đã kiểm tra:** `0f97e5e` — *Merge pull request #159*
**Môi trường:** BE local `http://localhost:55446` + SQL Server `.\SQLEXPRESS`, cơ sở dữ liệu
đã làm sạch chỉ giữ người dùng / ngựa / hồ sơ nài / trọng tài / giải đấu.

Cả hai mục dưới đây đều **kiểm chứng bằng cách gọi API thật**, không suy đoán từ tài liệu.

---

## 🔴 1. Giải dựng bằng God API không nộp được kết quả

**Nơi sửa:** `DemoService.cs:175`

### Chuyện gì xảy ra

Bản ghi phân công trọng tài được tạo với **hai giá trị trạng thái khác nhau** tuỳ nơi tạo:

| Nơi tạo | Trạng thái đặt vào |
|---|---|
| Admin phân công tay — `RefereeAssignmentService.cs:71` | `"Active"` |
| God API dựng giải — `DemoService.cs:175` | **`"Assigned"`** |

Nhưng hàm tra cứu lúc nộp kết quả chỉ chấp nhận đúng một giá trị:

```csharp
// ResultRepository.cs:45
.FirstOrDefaultAsync(rra => rra.RaceId == raceId
                         && rra.RefereeId == refereeId
                         && rra.Status == "Active");
```

### Hậu quả

Giải nào dựng bằng God API thì trọng tài **bị coi như chưa được phân công**, dù bản ghi
phân công đã tồn tại trong cơ sở dữ liệu. Câu lỗi trả về gây hiểu nhầm nặng — người dùng
sẽ đi phân công lại, nhưng bản ghi đã có sẵn nên không sửa được gì.

### Kiểm chứng

```
POST /api/demo/setup-race        → giai #121, race 136, 12 ngua + 12 nai
POST /api/demo/start-race/121    → giai chuyen sang Active
POST /api/referee/races/136/results
   → 400 "The referee is not assigned to this race."

Kiem tra CSDL: RaceRefereeAssignment(RaceId=136, RefereeId=169) TON TAI, Status='Assigned'

Doi Status thanh 'Active' roi nop lai
   → 200  RaceResult id=56, winner khop dung
```

### Đề xuất

Sửa `DemoService.cs:175` thành `"Active"` cho khớp với chỗ phân công tay. Nếu muốn giữ
`"Assigned"` như một trạng thái riêng thì phải sửa `GetAssignmentAsync` chấp nhận cả hai,
và rà lại mọi chỗ khác đang so sánh `Status == "Active"` trên bảng này.

---

## 🟡 2. Nhờ kiểm tra một bản ghi ngựa trên cơ sở dữ liệu deploy

**Không phải lỗi code** — đã loại trừ bằng thực nghiệm, nhưng cần backend xác nhận giúp
phần dữ liệu vì phía frontend không truy cập được cơ sở dữ liệu Azure.

### Hiện tượng

Trọng tài nộp kết quả trên bản deploy, ngựa thắng lấy tự động từ bảng xếp hạng:

```
Winner horse 'SU-SU_11_HORSE-Horse2' was not found.
```

### Những gì đã loại trừ

| Nghi vấn | Kết quả kiểm chứng |
|---|---|
| Ngựa không tồn tại | **Không** — `horseId 1014`, có trong 12 suất đua của race 244 |
| Tên có ký tự lạ / lỗi encoding | **Không** — thuần ASCII, đã dump từng mã ký tự |
| Bị xoá mềm nên bộ lọc `!IsDeleted` loại đi | **Không** — thử trên máy: xoá mềm làm suất đua biến mất hẳn (12 → 11), Azure vẫn hiện suất đua |
| Lỗi tra cứu theo tên trong code | **Không** — trên dữ liệu sạch ở máy, nộp kết quả bằng **tên ngựa** chạy bình thường (RaceResult id=56) |

### Nhờ chạy giúp

```sql
SELECT Id, '[' + Name + ']' AS Name, LEN(Name), DATALENGTH(Name)
FROM dbo.Horse WHERE Id = 1014;
```

`DATALENGTH` lớn hơn `LEN` là lộ ngay khoảng trắng thừa đầu/cuối — khả năng cuối cùng còn
lại. Dấu ngoặc vuông cũng giúp nhìn thấy khoảng trắng bằng mắt.

---

## Tổng hợp

| # | Nội dung | Mức độ | Nơi sửa |
|---|---|---|---|
| 1 | God API tạo phân công trọng tài là `Assigned`, nơi tra cứu đòi `Active` → không nộp được kết quả | 🔴 Cao | `DemoService.cs:175` |
| 2 | Nhờ kiểm tra khoảng trắng thừa trong `Horse.Name` của bản ghi `Id = 1014` trên deploy | 🟡 Vừa | Cơ sở dữ liệu Azure |

---

## Phía frontend đã tự xử lý trong đợt này

| Nội dung | Cách xử lý |
|---|---|
| Backend đổi tên endpoint demo (`auto-setup` → `setup-race`, bỏ `resolve-race`) khiến phím tắt Ctrl+Space trả 404 | Cập nhật lại đường dẫn, thêm `?count=` cho `populate-tournament` |
| Trọng tài nộp kết quả gửi tên ngựa | Đổi sang gửi **mã ngựa** — backend tra thẳng theo khoá chính, không phụ thuộc tên khớp từng ký tự |
| Trang Bet Management đọc sai tầng dữ liệu (`res.data.result`, trong khi tầng api dùng `fetch` và trả thẳng `{ message, result }`) | Bỏ lớp `.data` thừa |
| Tiền thắng của khán giả đọc sai tên trường (`prize`/`reward` thay vì `actualPayout`) | Đọc đúng `actualPayout` |
| Định dạng tiền lấy theo locale trình duyệt nên hiện `$5.000,00` | Chỉ định `en-US` |

---

> **Phạm vi file này:** chỉ gồm các mục phát hiện trong **phiên làm việc ngày 01/08**.
> Những mục đã báo các đợt trước mà backend chưa xử lý — hoàn cược khi huỷ giải, giải không
> tự chuyển sang `Active`, chuỗi kết nối kèm mật khẩu trong `appsettings.json`, tên trường
> phản hồi lỗi chưa thống nhất — **vẫn còn nguyên giá trị**, tra được trong lịch sử git của
> file này.
