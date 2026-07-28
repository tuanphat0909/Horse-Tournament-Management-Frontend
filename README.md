# Horse Tournament Management — Frontend

Giao diện web quản lý giải đua ngựa, viết bằng **ReactJS (JavaScript) + Vite + Tailwind CSS**.

Hệ thống phục vụ 6 vai trò: Quản trị viên (Admin), Chủ ngựa (Horse Owner), Nài ngựa
(Jockey), Trọng tài (Referee), Bác sĩ thú y (Veterinarian) và Khán giả (Spectator).

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Thư viện giao diện | React 19 |
| Công cụ build | Vite 8 |
| Ngôn ngữ | JavaScript (JSX) |
| Giao diện | Tailwind CSS v4 (khai báo theme bằng `@theme` trong `src/index.css`) |
| Định tuyến | React Router v7 |
| Quản lý form | Formik + Yup |
| Hiệu ứng | Framer Motion |
| Biểu tượng | Lucide React |
| Thời gian thực | SignalR (thông báo đẩy) |
| Đăng nhập Google | @react-oauth/google |

## Chạy dự án

```bash
npm install
npm run dev      # chạy máy chủ phát triển
npm run build    # đóng gói bản production
npm run preview  # xem thử bản đã đóng gói
npm run lint     # kiểm tra chất lượng mã nguồn
```

## Cấu hình

Tạo file `.env.local` ở thư mục gốc (xem mẫu tại `.env.example`):

```
# Bỏ trống để dùng backend đã deploy trên Azure (mặc định trong mã nguồn)
# Trỏ về máy khi chạy backend local:
VITE_API_URL=http://localhost:55446/api

VITE_GOOGLE_CLIENT_ID=<client id của Google OAuth>
```

## Cấu trúc thư mục

```
src/
├─ api/           Lớp gọi API, tách theo vai trò (adminService, ownerService…)
├─ components/    Thành phần dùng lại: layout, landing, ui
├─ constants/     Hằng số dùng chung và các schema kiểm tra dữ liệu (Yup)
├─ context/       Context API: xác thực, thông báo, hộp thoại xác nhận
├─ pages/         Màn hình, chia theo vai trò: admin, owner, jockey,
│                 referee, spectator, vet
├─ routes/        Bảng định tuyến và lớp chặn truy cập theo vai trò
├─ services/      Lớp gửi HTTP dùng chung (tự gắn token)
└─ utils/         Hàm tiện ích: định dạng ngày giờ, xử lý lỗi, lọc thông báo
```

Dữ liệu chảy theo ba tầng: **màn hình** (`pages`) → **nghiệp vụ** (`api/*Service`) →
**hạ tầng HTTP** (`services/api.js`). Màn hình không cần biết địa chỉ backend hay
cách gắn token — đổi backend chỉ sửa một chỗ duy nhất.

## Phân quyền

Mọi đường dẫn nội bộ đều đi qua `PrivateRoute`: chưa đăng nhập thì chuyển về trang
đăng nhập, sai vai trò thì bị chặn. Vai trò lấy từ máy chủ sau khi xác thực lại
token, không đọc từ trình duyệt, nên không thể tự sửa để vượt quyền.
