# BÁO CÁO 07/07/2026 — Cài skill thiết kế + Redesign toàn bộ giao diện

> Kiểm chứng: `npm run build` thành công, 0 lỗi TS. Chỉ sửa FE.

---

## 1. Skill đã cài (cấp user — dùng được mọi project, có hiệu lực từ phiên Claude Code mới)

| Skill | Vai trò |
|---|---|
| `design-taste-frontend` | (đã cài trước) — landing/portfolio/redesign tổng quát |
| `redesign-existing-projects` ⭐ | Audit-first: quét pattern AI-generic rồi sửa, không phá chức năng |
| `high-end-visual-design` ⭐ | Chuẩn "agency $150k": font/shadow/motion/double-bezel |
| `full-output-enforcement` | Chống AI viết code cụt/placeholder khi rewrite file dài |

## 2. Cách redesign 27 trang dashboard — audit-first, đòn bẩy hệ thống

Theo đúng phương pháp `redesign-existing-projects` (Scan → Diagnose → Fix): cả 27 trang dashboard dùng chung 1 bộ CSS + layout components, nên sửa Ở GỐC thì mọi trang được nâng đồng loạt mà không phá chức năng nào.

**Kết quả audit & fix (khối "PREMIUM REFINEMENTS" trong `index.css` — áp cho toàn bộ 31 trang):**

| Vấn đề audit phát hiện | Fix |
|---|---|
| Không có focus ring → không dùng được bàn phím (fail a11y) | `:focus-visible` ring vàng toàn hệ thống |
| Nút bấm không có phản hồi vật lý | Mọi button "lún" `scale(0.98)` khi bấm, nhịp spring `cubic-bezier(0.32,0.72,0,1)` |
| Số trong bảng dùng font tỉ lệ → cột số lệch nhau | `tabular-nums` cho mọi `<table>` + class `.tabular` |
| Chữ mồ côi cuối dòng tiêu đề | `text-wrap: balance` cho h1–h3, `pretty` cho đoạn văn |
| Scrollbar mặc định trắng của trình duyệt phá tông tối | Scrollbar bo tròn tôn màu hệ thống, hover ánh vàng |
| Bôi đen chữ màu xanh mặc định | `::selection` màu gold thương hiệu |
| Shimmer nút vàng chạy vô hạn (nhiễu mắt + tốn GPU) | Chỉ chạy khi hover |
| Không có skeleton loading | Class `.skeleton` (sweep animation) — đã dùng ở hero landing |
| Card phẳng một lớp | Class `.bezel` (double-bezel lồng khung kiểu phần cứng) sẵn dùng |
| Không tôn trọng người dùng tắt animation | `@media (prefers-reduced-motion)` tắt toàn bộ motion |
| Anchor nhảy giật | `scroll-behavior: smooth` |

## 3. Landing page — DATA THẬT thay toàn bộ số bịa

| Chỗ | Trước (bịa) | Sau (thật — API public) |
|---|---|---|
| Hero: chỉ số dưới CTA | "500+ Elite Horses, 12 Championships" | Số ngựa trên BXH + số giải đấu thật (`/rankings/horses`, `/tournaments`) |
| Hero: card cuộc đua | "Dubai World Cup — Meydan" + 3 ngựa bịa kèm giờ bịa | Cuộc đua **đang live thật** (`/races/live`; không có → "Trường đua Equestria / Sắp diễn ra") + **top 3 BXH ngựa thật** (điểm + số trận); đang tải → skeleton |
| Hero: card leaderboard | "Thunderstrike 1,240 pts..." | Top 2 BXH thật |
| StatsSection | "142+ Horses / 18 Championships / 50K+ Spectators / 0.1s Latency" | 4 chỉ số thật: ngựa BXH, giải đấu (kèm badge "N đang diễn ra"), cuộc đua trong lịch, nài ngựa — **hiệu ứng đếm số** khi cuộn tới; API lỗi → "—" chứ không hiện số giả |
| FeaturedTournament | "The Royal Ascot Invitational 2025, £8.5M, 142/200 slots" | **Giải thật** (ưu tiên Active → Upcoming gần nhất): tên, ngày bắt đầu→kết thúc, số vòng, badge Đang diễn ra/Sắp diễn ra, **progress bar cửa sổ đăng ký tính theo thời gian thật**, số ngày còn để đăng ký; nút → `/register`. Không có giải nào → ẩn section (không dựng chuyện) |

## 4. Login/Register
- Gỡ font **Inter** (bị cả 2 skill cấm + sai brand) → `DM Sans` đúng hệ thống.
- Hưởng toàn bộ nâng cấp global: focus ring khi Tab, nút lún khi bấm, selection gold.

## 5. Chưa làm / ghi chú
- Skeleton mới áp ở landing hero; các trang dashboard vẫn dòng "Đang tải..." — class `.skeleton` đã sẵn, thay dần được từng trang (không gấp).
- Skill có hiệu lực auto từ **phiên Claude Code mới** (phiên này tôi đọc trực tiếp file skill để áp dụng).
- Icon vẫn là Lucide (skill khuyên Phosphor) — đổi bộ icon là việc lớn, cân nhắc sau vì Lucide đang nhất quán toàn app.

**File thay đổi:** `index.css` (+110 dòng system), `HeroSection.tsx`, `StatsSection.tsx` (viết lại), `FeaturedTournamentSection.tsx` (viết lại), `LoginPage.tsx`, `RegisterPage.tsx`.
