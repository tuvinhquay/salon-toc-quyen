import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Package,
  ReceiptText,
  Scissors,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type NavigationItem = {
  label: string
  to: string
  Icon: LucideIcon
  description: string
}

export const navigation: NavigationItem[] = [
  { label: 'Tổng quan', to: '/', Icon: ChartNoAxesCombined, description: 'Không gian điều hành và tình trạng thiết lập salon.' },
  { label: 'Hướng dẫn & giới thiệu', to: '/guide', Icon: BookOpen, description: 'Cách sử dụng các mục trong ứng dụng và hỏi đáp hướng dẫn.' },
  { label: 'Lịch hẹn', to: '/appointments', Icon: CalendarDays, description: 'Lịch hẹn, khách vãng lai, thời lượng và tiền đặt cọc.' },
  { label: 'Khách hàng', to: '/customers', Icon: Users, description: 'Hồ sơ khách hàng, lịch sử dịch vụ và sự đồng ý lưu trữ dữ liệu.' },
  { label: 'Quy trình làm tóc', to: '/workflow', Icon: Scissors, description: 'Các công đoạn dịch vụ, phân công và nhật ký thực hiện.' },
  { label: 'Nhân viên', to: '/employees', Icon: Users, description: 'Hồ sơ nhân sự, ca làm, vai trò và chính sách hoa hồng.' },
  { label: 'Dịch vụ', to: '/services', Icon: Scissors, description: 'Danh mục dịch vụ, thời lượng, giá và định mức vật tư.' },
  { label: 'Kho sản phẩm & vật tư', to: '/inventory', Icon: Package, description: 'Sản phẩm, lô hàng, hạn dùng và biến động tồn kho.' },
  { label: 'Thu ngân & hóa đơn', to: '/pos', Icon: ReceiptText, description: 'Hóa đơn, thanh toán, tiền cọc, hoàn tiền và đóng ca.' },
  { label: 'Báo cáo', to: '/reports', Icon: ChartNoAxesCombined, description: 'Báo cáo vận hành và tài chính có thể truy xuất nguồn.' },
  { label: 'Thiết bị & đồng bộ', to: '/devices', Icon: ShieldCheck, description: 'Thiết bị được duyệt, trạng thái đồng bộ và thu hồi quyền.' },
  { label: 'Backup & khôi phục', to: '/backup', Icon: ShieldCheck, description: 'Sao lưu mã hóa, kiểm tra toàn vẹn và khôi phục dữ liệu.' },
  { label: 'Trợ lý AI', to: '/assistant', Icon: Sparkles, description: 'Trợ lý nội bộ học thói quen; Gemini cố vấn khi cần.' },
  { label: 'Cài đặt', to: '/settings', Icon: Settings, description: 'Thông tin salon, tiền tệ, múi giờ và chính sách vận hành.' },
]
