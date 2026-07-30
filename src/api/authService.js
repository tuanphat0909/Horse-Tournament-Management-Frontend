import { api } from '../services/api';

// BE trả 2 kiểu lỗi khác nhau:
//   1) tự viết:      { message: "License number is required for Referee." }
//   2) ASP.NET tự sinh khi model binding hỏng:
//      { title: "One or more validation errors occurred.", errors: { ExperienceYears: ["..."] } }
// Kiểu 2 nếu chỉ lấy `title` thì người dùng chỉ thấy câu chung chung, không biết sai ô nào
// → luôn bóc `errors` ra trước.
function parseFieldErrors(err) {
  try {
    const parsed = JSON.parse(err.message);
    const errors = parsed.errors ?? parsed.result?.errors;
    if (!errors || typeof errors !== 'object') return {};
    const out = {};
    for (const [key, value] of Object.entries(errors)) {
      // BE có thể trả "request.ExperienceYears" hoặc "ExperienceYears" → về camelCase của form
      const name = String(key).split('.').pop();
      const field = name.charAt(0).toLowerCase() + name.slice(1);
      const message = Array.isArray(value) ? value.filter(Boolean).join(' ') : String(value);
      if (field && message) out[field] = message;
    }
    return out;
  } catch {
    return {};
  }
}

function parseApiError(err) {
  try {
    const parsed = JSON.parse(err.message);
    const fieldErrors = parseFieldErrors(err);
    const lines = Object.entries(fieldErrors).map(([field, message]) => {
      const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
      return `${label}: ${message}`;
    });
    if (lines.length) return lines.join('\n');

    // Mỗi controller của BE đặt tên trường hơi khác nhau: chỗ dùng `message`, chỗ
    // dùng `error` (ví dụ DemoController), ASP.NET tự sinh thì dùng `title`.
    // Bỏ sót một tên là người dùng nhìn thấy nguyên cục JSON thô trên màn hình.
    const base = parsed.message || parsed.error || parsed.title;

    // Khi một hành động bị chặn vì còn ràng buộc, BE trả kèm mảng `blockers` liệt kê
    // từng lý do (ví dụ khoá tài khoản đang có hợp đồng hiệu lực, ví còn tiền...).
    // Nếu chỉ lấy `message` thì người dùng chỉ thấy câu chung chung, không biết vướng gì.
    const blockers = parsed.blockers ?? parsed.result?.blockers;
    if (Array.isArray(blockers) && blockers.length) {
      const details = blockers.filter(Boolean).map(b => `• ${b}`).join('\n');
      return base ? `${base}\n${details}` : details;
    }

    // Lỗi 500 của BE trả { message: "An error occurred during ...", detail: "<lý do thật>" }
    // → nếu bỏ `detail` thì người dùng chỉ thấy câu chung chung.
    // Có chỗ đặt tên là `details` (số nhiều) nên nhận cả hai.
    const detail = parsed.detail ?? parsed.details;
    if (base && detail && detail !== base) return `${base}\n${detail}`;
    return base || err.message;
  } catch {
    return err.message;
  }
}

export async function login(email, password) {
  const data = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', data.result.accessToken);
  localStorage.setItem('user', JSON.stringify(data.result.user));
  return data.result.user;
}

export async function googleLogin(idToken) {
  const data = await api.post('/auth/google-login', { idToken });
  localStorage.setItem('token', data.result.accessToken);
  localStorage.setItem('user', JSON.stringify(data.result.user));
  return data.result.user;
}


export async function register(fullName, email, password, confirmPassword) {
  const data = await api.post('/auth/register', { fullName, email, password, confirmPassword });
  // Do NOT store token or user in localStorage since email activation is pending
  return data.result.user;
}

export async function verifyEmail(token) {
  const data = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  return data;
}


export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export { parseApiError, parseFieldErrors };
