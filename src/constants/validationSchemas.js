import * as Yup from 'yup';

/**
 * Schema Yup dùng chung cho các form trong app.
 *
 * Mỗi schema giữ đúng luật và đúng câu thông báo mà form đó đang dùng, chỉ đổi
 * cách viết từ if/else thủ công sang khai báo — để luật nằm một chỗ, dễ đọc và
 * dễ sửa hơn là rải rác trong hàm submit.
 */

/* ─────────── Ngựa (Owner) ─────────── */

export const createHorseSchema = Yup.object({
  name: Yup.string().trim().required('Please fill in all information.'),
  breed: Yup.string().trim().required('Please fill in all information.'),
  age: Yup.string().required('Please fill in all information.'),
  gender: Yup.string().required('Please fill in all information.'),
});

export const editHorseSchema = Yup.object({
  name: Yup.string().trim().required('Please fill in all information.'),
  breed: Yup.string().trim().required('Please fill in all information.'),
  age: Yup.string().required('Please fill in all information.'),
});

/* ─────────── Mời kỵ sĩ (Owner) ─────────── */

export const inviteJockeySchema = Yup.object({
  horseId: Yup.string().required('Please fill in all information.'),
  jockeyId: Yup.string().required('Please fill in all information.'),
  tournamentId: Yup.string().required('Please fill in all information.'),
  expiryHours: Yup.number().typeError('Response deadline must be a number greater than 0.').moreThan(0, 'Response deadline must be a number greater than 0.'),
});

/* ─────────── Đăng ký thi đấu (Owner) ─────────── */

export const registerHorseSchema = Yup.object({
  horseId: Yup.string().required('Please select a horse and a tournament.'),
  tournamentId: Yup.string().required('Please select a horse and a tournament.'),
});

/* ─────────── Đặt cược (Spectator) ─────────── */

export const placeBetSchema = Yup.object({
  raceId: Yup.string().required('Please fill in all information.'),
  horseId: Yup.string().required('Please fill in all information.'),
  amount: Yup.number().typeError('Please fill in all information.').moreThan(0, 'Please fill in all information.').required('Please fill in all information.'),
});
