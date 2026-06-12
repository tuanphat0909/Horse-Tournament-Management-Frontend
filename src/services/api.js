// Cấu hình gốc cho tất cả API calls
// Tự động gắn Bearer token từ localStorage vào mỗi request

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
