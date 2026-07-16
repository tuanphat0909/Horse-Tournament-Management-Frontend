// Cấu hình gốc cho tất cả API calls
// Tự động gắn Bearer token từ localStorage vào mỗi request
//
// Mặc định trỏ tới BE ĐÃ DEPLOY trên Azure (giống cấu hình của nhóm) → clone về
// chạy `npm run dev` là kết nối được ngay, không cần chạy BE local.
// Muốn dev với BE local: tạo file .env.local với  VITE_API_URL=http://localhost:5000/api

const BASE_URL = import.meta.env.VITE_API_URL || 'https://hrms-backend-a4dwfmgmgfagf7ax.southeastasia-01.azurewebsites.net/api';

async function request(method, endpoint, data) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401) {
    // 401 tại endpoint /auth/* = sai email/mật khẩu → trả lỗi cho form hiển thị,
    // KHÔNG redirect (nếu redirect thì trang login reload và mất thông báo lỗi)
    if (endpoint.startsWith('/auth/')) {
      const message = await res.text();
      throw new Error(message || 'Incorrect email or password.');
    }
    // 401 tại các endpoint khác = token hết hạn/không hợp lệ → đăng xuất
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  delete: (url) => request('DELETE', url),
};
