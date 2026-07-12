import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Vietnamese to English
    "Vừa xong": "Just now",
    "phút trước": "minutes ago",
    "giờ trước": "hours ago",
    "Hôm qua": "Yesterday",
    "ngày trước": "days ago",
    "Đăng ký mới chờ duyệt": "New registration pending approval",
    "Đã duyệt đăng ký": "Registration approved",
    "Ngựa": "Horse",
    "Chủ": "Owner",
    "Chủ ngựa": "Horse Owner",
    "đăng ký tham gia": "registered to join",
    "Cập nhật giải đấu": "Tournament updated",
    "Lịch đua mới": "New race scheduled",
    "Cuộc đua": "Race",
    "quãng đường": "distance",
    "Mã": "ID",
    "Hành động": "Action",
    "Duyệt": "Approve",
    "Đang tải...": "Loading...",
    "Chi tiết": "Detail",
    "chờ duyệt": "Pending",
    "đăng ký tham gia mới": "New registration",
    "Tạo giải đấu vô địch quốc gia": "National Championship created",
    "Giải đấu Grand Prix Quốc Gia 2026 đã được khởi tạo": "National Grand Prix 2026 Tournament has been created",
    "Đăng ký tham gia mới": "New registration request",
    "Chủ ngựa HorseOwner đã đăng ký ngựa Thunder tham gia giải đấu Grand Prix": "HorseOwner registered Thunder for the Grand Prix Tournament",
    "Phân công trọng tài hoàn tất": "Referee assignment complete",
    "Trọng tài Referee đã được phân công cho cuộc đua Vòng 1": "Referee has been assigned to Round 1 race",
    "Xuất bản kết quả cuộc đua": "Race results published",
    "Admin đã công bố kết quả chính thức cho Giải đua Khang Lẹo": "Admin has published official results for Khang Leo Race",
    "Chào mừng": "Welcome",
    "Chào mừng,": "Welcome,",
    "Tổng quan hệ thống": "System Overview",
    "Mùa giải 2026": "Season 2026",
    "Hệ thống đang hoạt động": "System is active",
    "Xem đăng ký": "View registrations",
    "Quản lý cuộc đua": "Manage races",
    "Người dùng": "Users",
    "Giải đấu": "Tournaments",
    "Lợi nhuận (VNĐ)": "Profit (VND)",
    "Cuộc đua (số nhiều)": "Races",
    "Đăng ký chờ duyệt": "Pending registrations",
    "Cần xử lý trong 24h": "Needs processing within 24h",
    "Hoạt động gần đây": "Recent activity",
    "Chưa có dữ liệu": "No data available",
    "Tạo giải đấu mới": "Create new tournament",
    "Phân công trọng tài": "Assign referees",
    "Lập lịch đua": "Schedule races",
    "Công bố kết quả": "Publish results",
    "Thành tích": "Achievements",
    "Đăng xuất": "Logout",
    "Cài đặt": "Settings",
    "Giao diện": "Theme",
    "Giao diện (Theme)": "Theme",
    "Tối": "Dark",
    "Sáng": "Light",
    "Đóng": "Close",
    "Đăng ký": "Register",
    "Đăng nhập": "Login",
    "Menu": "Menu",
    "Xem tất cả": "View all",
    "Cài đặt hệ thống": "System Settings",
    "Thêm tournament mới vào hệ thống": "Add new tournament to system",
    "Gán referee cho các cuộc đua": "Assign referees to races",
    "Tạo và sắp xếp các cuộc đua": "Create and schedule races",
    "Publish kết quả đã xác nhận": "Publish confirmed results",
    "Tìm kiếm ngựa, cuộc đua, giải đấu...": "Search horses, races, tournaments...",
    "Season 2026": "Season 2026",
    
    // Tournament Management & Labels
    "Thời gian bắt đầu không thể ở quá khứ.": "Start date cannot be in the past.",
    "Thời gian kết thúc phải sau thời gian bắt đầu.": "End date must be after start date.",
    "Thời gian kết thúc đăng ký phải sau thời gian bắt đầu đăng ký.": "Registration end date must be after registration start date.",
    "Thời gian bắt đầu đăng ký không thể ở quá khứ.": "Registration start date cannot be in the past.",
    "Thời gian bắt đầu giải đấu phải sau hoặc bằng thời hạn kết thúc đăng ký.": "Tournament start date must be on or after registration end date.",
    "Thời gian kết thúc giải đấu phải sau thời gian bắt đầu giải đấu.": "Tournament end date must be after tournament start date.",
    "Vui lòng điền đầy đủ tất cả các trường thông tin bắt buộc.": "Please fill in all required fields.",
    "Thành công": "Success",
    "Giải đấu đang ở trạng thái Sắp diễn ra (Upcoming).": "Tournament is now in Upcoming status.",
    "Đã đóng thời hạn đăng ký giải đấu thành công!": "Registration deadline closed successfully!",
    "Đã tự động sắp xếp cuộc đua cho giải đấu.": "Races auto-assigned for tournament.",
    "Đã tự động sắp xếp bảng Chung kết (Top 12) thành công.": "Final bracket (Top 12) auto-assigned successfully.",
    "Đang đóng…": "Closing...",
    "Đóng đăng ký": "Close Registration",
    "Đang sắp xếp…": "Assigning...",
    "Auto xếp làn Pre": "Auto Assign Pre-lanes",
    "Auto xếp Final": "Auto Assign Final",
    "VD: Giải Đua Mùa Thu 2026": "E.g.: Autumn Race 2026",
    "Nhập mô tả chi tiết về giải đấu...": "Enter detailed tournament description...",
    "Mở đăng ký:": "Reg. opens:",
    "Đóng đăng ký:": "Reg. closes:",
    "Xem chi tiết": "View details",
    "Quản lý giải đấu": "Tournament Management",
    "Tạo và quản lý các giải đấu": "Create and manage tournaments",
    "Tạo giải đấu": "Create Tournament",
    "Tất cả": "All",
    "Đang diễn ra": "Active",
    "Sắp diễn ra": "Upcoming",
    "Đã kết thúc": "Completed",
    "Đã hủy": "Cancelled",
    "Tìm giải đấu...": "Search tournaments...",
    "Đang tải danh sách giải đấu...": "Loading tournaments list...",
    "Ngày bắt đầu:": "Start Date:",
    "Ngày kết thúc:": "End Date:",
    "Số vòng đấu:": "Number of Rounds:",
    "Tên giải đấu *": "Tournament Name *",
    "Ngày bắt đầu *": "Start Date *",
    "Ngày kết thúc *": "End Date *",
    "Số vòng đua *": "Number of Rounds *",
    "Hủy": "Cancel",
    "Đang tạo…": "Creating...",
    "Vui lòng điền đầy đủ tất cả các trường.": "Please fill in all fields.",
    "Tạo giải đấu thành công!": "Tournament created successfully!",
    "Các giải đấu đang và sắp diễn ra": "Active and upcoming tournaments",
    "Tất cả các giải đấu đang diễn ra": "All active tournaments",
    "Quay lại danh sách giải đấu": "Back to tournaments list",
    "Đang tải thông tin...": "Loading info...",
    "Không thể tải thông tin giải đấu.": "Failed to load tournament info.",
    "Không tìm thấy giải đấu.": "Tournament not found.",
    "Bắt đầu:": "Start:",
    "Kết thúc:": "End:",
    "Danh sách Cuộc Đua": "Races List",
    "Chưa có cuộc đua nào trong giải đấu này.": "No races in this tournament yet.",
    "Bắt đầu lúc:": "Starts at:",
    "Đường đua:": "Track distance:",
    "Làn tối đa:": "Max lanes:",
    "Xem Chi Tiết": "View Details",
    "Cược Ngay": "Bet Now",
    "Vòng": "Round",

    // Role Labels
    "Administrator": "Administrator",
    "Horse Owner": "Horse Owner",
    "Jockey": "Jockey",
    "Referee": "Referee",
    "Spectator": "Spectator",
  },
  vi: {
    // English to Vietnamese
    "Cuộc đua (số nhiều)": "Cuộc đua",
    "Dashboard": "Bảng điều khiển",
    "Accounts": "Tài khoản",
    "Tournaments": "Giải đấu",
    "Race Schedule": "Lịch đua",
    "Registrations": "Đăng ký",
    "Assign Referees": "Phân công trọng tài",
    "Referee Management": "Quản lý trọng tài",
    "Publish Results": "Công bố kết quả",
    "Violations": "Vi phạm",
    "Predictions": "Dự đoán",
    "My Horses": "Ngựa của tôi",
    "Race Entry": "Đăng ký đua",
    "Jockey": "Kỵ sĩ",
    "Results & Prizes": "Kết quả & Giải thưởng",
    "Invitations": "Lời mời",
    "My Races": "Cuộc đua của tôi",
    "Schedule": "Lịch trình",
    "Achievements": "Thành tích",
    "My Violations": "Vi phạm của tôi",
    "Horse Inspection": "Kiểm tra ngựa",
    "Record Violations": "Ghi nhận vi phạm",
    "Confirm Results": "Xác nhận kết quả",
    "Reports": "Báo cáo",
    "My Wallet": "Ví của tôi",
    "Tournaments & Schedule": "Giải đấu & Lịch trình",
    "Live Results": "Kết quả trực tiếp",
    "My Predictions": "Dự đoán của tôi",
    "Notifications": "Thông báo",
    "Settings": "Cài đặt",
    "Theme": "Giao diện",
    "Dark": "Tối",
    "Light": "Sáng",
    "Close": "Đóng",
    "Logout": "Đăng xuất",
    "Sign In": "Đăng nhập",
    "Register": "Đăng ký",
    "Search horses, races, tournaments...": "Tìm kiếm ngựa, cuộc đua, giải đấu...",
    "Season 2026": "Mùa giải 2026",
    "Menu": "Menu",
    "Welcome": "Chào mừng",
    
    // Role Labels
    "Administrator": "Quản trị viên",
    "Horse Owner": "Chủ ngựa",
    "Referee": "Trọng tài",
    "Spectator": "Khán giả",
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    if (!key) return '';
    
    // Check if translation exists in current language config
    const translations = TRANSLATIONS[language];
    if (translations && translations[key]) {
      return translations[key];
    }
    
    // Fallback: If current language is the same as key's implied language, return key itself.
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
