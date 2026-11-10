import { Scissors, CalendarDays, Users, Package, ReceiptText, ChartNoAxesCombined, Settings, ShieldCheck, Sparkles, WifiOff, ArrowUpRight } from 'lucide-react'

const navigation = [
  { label: 'Tổng quan', Icon: ChartNoAxesCombined },
  { label: 'Lịch hẹn', Icon: CalendarDays },
  { label: 'Khách hàng', Icon: Users },
  { label: 'Quy trình làm tóc', Icon: Scissors },
  { label: 'Nhân viên', Icon: Users },
  { label: 'Dịch vụ', Icon: Scissors },
  { label: 'Kho sản phẩm & vật tư', Icon: Package },
  { label: 'Thu ngân & hóa đơn', Icon: ReceiptText },
  { label: 'Báo cáo', Icon: ChartNoAxesCombined },
  { label: 'Thiết bị & đồng bộ', Icon: ShieldCheck },
  { label: 'Backup & khôi phục', Icon: ShieldCheck },
  { label: 'Trợ lý AI', Icon: Sparkles },
  { label: 'Cài đặt', Icon: Settings },
]
const setupCards = [
  { step: '01 · BẢO MẬT', title: 'Kết nối và xác thực Owner', description: 'Thiết lập Firebase Authentication, xác minh chủ salon và bảo vệ quyền quản trị.', Icon: ShieldCheck },
  { step: '02 · NGHIỆP VỤ', title: 'Thiết lập dịch vụ salon', description: 'Khai báo dịch vụ, thời lượng, giá, công đoạn và vật tư tiêu hao.', Icon: Scissors },
  { step: '03 · ĐỘI NGŨ', title: 'Thiết lập nhân viên', description: 'Quản lý hồ sơ, ca làm, vai trò, quyền hạn và chính sách hoa hồng.', Icon: Users },
]

export function App() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="mark"><Scissors /></span><div><b>TÓC QUYỀN</b><small>SALON MANAGEMENT</small></div></div>
        <p className="muted-label">KHÔNG GIAN LÀM VIỆC</p>
        <div className="workspace">Salon TÓC QUYỀN <small>OWNER</small></div>
        <nav aria-label="Điều hướng quản lý salon">
          {navigation.map(({ label, Icon }, index) => <a href="#" key={label} className={index === 0 ? 'selected' : ''} aria-current={index === 0 ? 'page' : undefined}><Icon size={18} />{label}{index === 0 && <i />}</a>)}
        </nav>
        <div className="profile"><span className="avatar">Q</span><div><b>Chủ salon</b><small>Quản trị viên</small></div></div>
      </aside>
      <section className="main">
        <header><div><small>KHÔNG GIAN CHỦ TIỆM</small><h1>Tổng quan điều hành</h1></div><span className="offline"><WifiOff size={15} /> Chưa kết nối dữ liệu</span></header>
        <div className="content">
          <section className="hero"><small>SALON TÓC QUYỀN · OWNER APP</small><h2>Nền tảng vận hành<br />salon của bạn.</h2><p>Quản lý lịch hẹn, khách hàng, đội ngũ, kho và tài chính trong một không gian thống nhất.</p><Scissors className="hero-icon" /></section>
          <div className="heading"><div><small>BẮT ĐẦU THIẾT LẬP</small><h2>Hoàn thiện không gian salon</h2></div><span>Chưa khởi tạo dữ liệu</span></div>
          <div className="cards">{setupCards.map(({ step, title, description, Icon }) => <article className="card" key={step}><Icon /><small>{step}</small><h3>{title}</h3><p>{description}</p><footer>Chưa triển khai <ArrowUpRight size={14} /></footer></article>)}</div>
          <div className="notice"><ShieldCheck /><div><b>Chế độ khởi tạo an toàn</b><p>Đây là bộ khung Owner App. Chưa có dữ liệu demo, doanh thu giả hoặc nghiệp vụ giả lập. Các module chỉ được mở khi backend và kiểm thử tương ứng hoàn tất.</p></div></div>
          <div className="copyright">© 2026 SALON TÓC QUYỀN <span>LOCAL-FIRST · PRIVATE BY DESIGN</span></div>
        </div>
      </section>
    </main>
  )
}
