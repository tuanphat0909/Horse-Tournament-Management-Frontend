// Sửa lỗi mojibake: chuỗi UTF-8 bị đọc nhầm sang Latin-1/Windows-1252 nên
// "Chung Kết Quyết Định" hiện thành "Chung Káº¿t Quyáº¿t Äá»‹nh".
// Dữ liệu do người dùng nhập (tên giải, tên ngựa, tên cuộc đua) hay dính lỗi này.

// Chỉ những chuỗi có dấu hiệu mojibake mới cần decode lại.
const MOJIBAKE_HINT = /[ÃÂÄÅÆÐÑÕØÞß][-¿‘-„†-›]/;

const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }) : null;

// Windows-1252 map cho các byte 0x80–0x9F (nơi Latin-1 để trống) — trình duyệt
// hiển thị các byte này thành ký tự đặc biệt như ‹ › ‚ „ … khi decode sai.
const CP1252_TO_BYTE = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85,
  '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a,
  '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92,
  '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c,
  'ž': 0x9e, 'Ÿ': 0x9f,
};

function fixMojibake(value) {
  if (typeof value !== 'string' || !decoder || !MOJIBAKE_HINT.test(value)) return value;

  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const byte = code > 0xff ? CP1252_TO_BYTE[value[i]] : code;
    if (byte === undefined) return value; // ký tự không thể là byte gốc → bỏ qua
    bytes[i] = byte;
  }

  try {
    return decoder.decode(bytes); // fatal: chuỗi không phải UTF-8 hợp lệ sẽ ném lỗi
  } catch {
    return value;
  }
}

/** Duyệt sâu object/array trả về từ API và sửa mọi chuỗi bị lỗi encoding. */
export function fixMojibakeDeep(input) {
  if (typeof input === 'string') return fixMojibake(input);
  if (Array.isArray(input)) return input.map(fixMojibakeDeep);
  if (input && typeof input === 'object') {
    for (const key of Object.keys(input)) {
      const fixed = fixMojibakeDeep(input[key]);
      if (fixed !== input[key]) input[key] = fixed;
    }
  }
  return input;
}
