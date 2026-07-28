import * as Yup from 'yup';

/**
 * Lấy câu lỗi đầu tiên từ kết quả validate của Yup.
 *
 * Dùng cho những form hiện chỉ có MỘT khung báo lỗi chung (không hiện lỗi dưới
 * từng ô) — giữ nguyên trải nghiệm cũ, chỉ đổi nguồn sinh ra câu lỗi.
 */
export function getFirstYupMessage(error, fallback) {
  if (error instanceof Yup.ValidationError) {
    return error.inner[0]?.message ?? error.message ?? fallback;
  }
  return fallback;
}
