import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { ArrowUpRight, Scissors, ShieldCheck, WifiOff } from 'lucide-react'
import { navigation } from './navigation'
import type { NavigationItem } from './navigation'

const setupCards = [
  { step: '01 · BẢO MẬT', title: 'Kết nối và xác thực Owner', description: 'Thiết lập Firebase Authentication, xác minh chủ salon và bảo vệ quyền quản trị.', Icon: ShieldCheck },
  { step: '02 · NGHIỆP VỤ', title: 'Thiết lập dịch vụ salon', description: 'Khai báo dịch vụ, thời lượng, giá, công đoạn và vật tư tiêu hao.', Icon: Scissors },
  { step: '03 · ĐỘI NGŨ', title: 'Thiết lập nhân viên', description: 'Quản lý hồ sơ, ca làm, vai trò, quyền hạn và chính sách hoa hồng.', Icon: ShieldCheck },
]

function DashboardPage() {
  return (
    <>
      <section className="hero">
        <small>SALON TÓC QUYỀN · OWNER APP</small>
        <h2>Nền tảng vận hành<br />salon của bạn.</h2>
        <p>Quản lý lịch hẹn, khách hàng, đội ngũ, kho và tài chính trong một không gian thống nhất.</p>
        <Scissors className="hero-icon" aria-hidden="true" />
      </section>
      <div className="heading">
        <div><small>BẮT ĐẦU THIẾT LẬP</small><h2>Hoàn thiện không gian salon</h2></div>
        <span>Chưa khởi tạo dữ liệu</span>
      </div>
      <div className="cards">
        {setupCards.map(({ step, title, description, Icon }) => (
          <article className="card" key={step}>
            <Icon aria-hidden="true" />
            <small>{step}</small>
            <h3>{title}</h3>
            <p>{description}</p>
            <footer><span>Chưa triển khai</span><ArrowUpRight size={14} aria-hidden="true" /></footer>
          </article>
        ))}
      </div>
      <div className="notice">
        <ShieldCheck aria-hidden="true" />
        <div><b>Chế độ khởi tạo an toàn</b><p>Đây là bộ khung Owner App. Chưa có dữ liệu demo, doanh thu giả hoặc nghiệp vụ giả lập. Các module chỉ được mở khi backend và kiểm thử tương ứng hoàn tất.</p></div>
      </div>
    </>
  )
}

function ModulePage({ item }: { item: NavigationItem }) {
  const Icon = item.Icon
  return (
    <section className="module-page">
      <div className="module-symbol"><Icon size={28} aria-hidden="true" /></div>
      <small>OWNER WORKSPACE · MODULE ROADMAP</small>
      <h2>{item.label}</h2>
      <p>{item.description}</p>
      <span className="module-status">Chưa triển khai</span>
      <div className="notice">
        <ShieldCheck aria-hidden="true" />
        <div>
          <b>Chưa có nghiệp vụ hoặc dữ liệu được bật</b>
          <p>Module này sẽ được xây dựng theo lộ trình. Khi triển khai, dữ liệu sẽ được kiểm tra, lưu cục bộ an toàn và có kiểm thử trước khi sử dụng. Không có dữ liệu mẫu hoặc thao tác giả.</p>
        </div>
      </div>
    </section>
  )
}

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const current = navigation.find((item) => item.to === pathname) ?? navigation[0]

  return (
    <main className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="TÓC QUYỀN - Tổng quan">
          <span className="mark"><Scissors aria-hidden="true" /></span>
          <span><b>TÓC QUYỀN</b><small>SALON MANAGEMENT</small></span>
        </Link>
        <p className="muted-label">KHÔNG GIAN LÀM VIỆC</p>
        <div className="workspace">Salon TÓC QUYỀN <small>OWNER</small></div>
        <nav aria-label="Điều hướng quản lý salon">
          {navigation.map(({ label, to, Icon }) => (
            <Link
              key={to}
              to={to as never}
              className={pathname === to ? 'selected' : ''}
              aria-current={pathname === to ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />{label}
              {pathname === to && <i aria-hidden="true" />}
            </Link>
          ))}
        </nav>
        <div className="profile"><span className="avatar">Q</span><div><b>Chủ salon</b><small>Không có phiên đăng nhập</small></div></div>
      </aside>
      <section className="main">
        <header>
          <div><small>KHÔNG GIAN CHỦ TIỆM</small><h1>{current.label}</h1></div>
          <span className="offline"><WifiOff size={15} aria-hidden="true" /> Chưa kết nối dữ liệu</span>
        </header>
        <div className="content"><Outlet /></div>
      </section>
    </main>
  )
}

export { DashboardPage, ModulePage, RootLayout }
