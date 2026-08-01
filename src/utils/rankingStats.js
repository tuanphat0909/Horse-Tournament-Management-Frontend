import { getRaceSchedule, getRaceEntries } from '../api/publicService';

/**
 * Đếm số trận và số thắng của từng ngựa / nài ngựa từ các cuộc đua đã kết thúc.
 *
 * Cần thiết vì `/public/rankings/jockeys` chỉ trả về `rankingPoint` — cột này ở backend
 * không có chỗ nào tăng nên luôn bằng 0, khiến bảng xếp hạng nài ngựa vô nghĩa
 * (xem BAO-CAO-BE-RANKING.md). Bảng ngựa có `winsCount` tính sống nên vẫn đúng.
 *
 * Trả về hai Map tra theo id: { races, wins }.
 */
export async function demThongKeTuKetQua() {
  const theoNgua = new Map();
  const theoNaiNgua = new Map();

  try {
    const lich = await getRaceSchedule();
    const ds = lich?.result ?? (Array.isArray(lich) ? lich : []);
    const daXong = ds.filter((r) => ['finished', 'completed', 'published'].includes(String(r.status ?? '').toLowerCase()));

    const cacSuat = await Promise.allSettled(daXong.map((r) => getRaceEntries(r.raceId ?? r.id)));
    for (const res of cacSuat) {
      if (res.status !== 'fulfilled') continue;
      const entries = res.value?.result ?? [];
      for (const e of Array.isArray(entries) ? entries : []) {
        const thang = Number(e.finishPosition) === 1;
        for (const [map, id] of [
          [theoNgua, e.horseId],
          [theoNaiNgua, e.jockeyId],
        ]) {
          if (id == null) continue;
          const cu = map.get(id) ?? { races: 0, wins: 0 };
          map.set(id, { races: cu.races + 1, wins: cu.wins + (thang ? 1 : 0) });
        }
      }
    }
  } catch {
    // Không lấy được lịch đua thì trả về map rỗng — nơi gọi tự lùi về số liệu của API.
  }

  return { theoNgua, theoNaiNgua };
}
