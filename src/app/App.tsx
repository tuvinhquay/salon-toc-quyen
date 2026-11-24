import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Database, LogOut, Scissors, ShieldCheck, WifiOff } from 'lucide-react'
import { navigation } from './navigation'
import type { NavigationItem } from './navigation'
import { useAuth } from '../auth/AuthProvider'
import { useOwnerContext } from '../auth/OwnerContext'
import { CustomersPage, ServicesPage } from './OwnerModules'
import { EmployeesPage, InventoryPage } from './EmployeeInventoryPages'
import { PosPage, ReportsPage } from './PosReportsPages'
import { BackupPage, DevicesPage } from './DeviceBackupPages'
import { AssistantPage } from './AssistantPage'
import { FloatingAssistant } from './FloatingAssistant'
import { SettingsPage } from './SettingsPage'
import { DashboardPage as MetricsDashboardPage } from './DashboardPage'
import { AppointmentsPage, WorkflowPage } from './AppointmentWorkflow'

function DashboardPage(){return <MetricsDashboardPage/>}
function ModulePage({item}:{item:NavigationItem}){if(item.to==='/settings')return <SettingsPage/>;if(item.to==='/customers')return <CustomersPage/>;if(item.to==='/services')return <ServicesPage/>;if(item.to==='/appointments')return <AppointmentsPage/>;if(item.to==='/workflow')return <WorkflowPage/>;if(item.to==='/employees')return <EmployeesPage/>;if(item.to==='/inventory')return <InventoryPage/>;if(item.to==='/pos')return <PosPage/>;if(item.to==='/reports')return <ReportsPage/>;if(item.to==='/devices')return <DevicesPage/>;if(item.to==='/backup')return <BackupPage/>;if(item.to==='/assistant')return <AssistantPage/>;const Icon=item.Icon;return <section className="module-page"><div className="module-symbol"><Icon size={28}/></div><small>OWNER WORKSPACE · MODULE ROADMAP</small><h2>{item.label}</h2><p>{item.description}</p><span className="module-status">Chưa triển khai</span><div className="notice"><ShieldCheck/><div><b>Module chưa được kích hoạt</b><p>Chức năng này chỉ mở sau khi nghiệp vụ, phân quyền và kiểm thử tương ứng hoàn tất. Không có dữ liệu demo hoặc thao tác giả.</p></div></div></section>}
function RootLayout(){
 const pathname=useRouterState({select:s=>s.location.pathname})
 const current=navigation.find(x=>x.to===pathname)??navigation[0]
 const {user,logOut,error:authError}=useAuth()
 const owner=useOwnerContext()
 const accountEmail=user?.email??'Tài khoản Owner'
 return <main className="shell">
  <aside className="sidebar">
   <Link to="/" className="brand" aria-label="TÓC QUYỀN - Tổng quan"><span className="mark"><Scissors/></span><span><b>TÓC QUYỀN</b><small>SALON MANAGEMENT</small></span></Link>
   <p className="muted-label">KHÔNG GIAN LÀM VIỆC</p>
   <div className="workspace">Salon {owner.salonId}<small>OWNER</small></div>
   <nav aria-label="Điều hướng quản lý salon">{navigation.map(({label,to,Icon})=><Link key={to} to={to as never} className={pathname===to?'selected':''} aria-current={pathname===to?'page':undefined}><Icon size={18}/>{label}{pathname===to&&<i/>}</Link>)}</nav>
   <div className="profile"><span className="avatar">{(user?.displayName??accountEmail).slice(0,1).toUpperCase()}</span><div><b>{user?.displayName??'Chủ salon'}</b><small>{accountEmail}</small></div><button className="logout-button" onClick={()=>void logOut()} aria-label="Đăng xuất tài khoản" title="Đăng xuất"><LogOut size={17}/></button></div>
  </aside>
  <section className="main">
   <header>
    <div><small>KHÔNG GIAN CHỦ TIỆM</small><h1>{current.label}</h1></div>
    <div className="header-actions">
     <Link to={"/settings" as never} className="quick-demo-link"><Database size={15}/> Dữ liệu mẫu</Link>
     <span className="offline"><WifiOff size={15}/> Lưu cục bộ · Chưa đồng bộ</span>
     <span className="account-email" title={accountEmail}>{accountEmail}</span>
     <button type="button" className="account-logout-button" onClick={()=>void logOut()}><LogOut size={15}/> Đăng xuất</button>
    </div>
   </header>
   <div className="content">{authError&&<p className="form-error" role="alert">{authError}</p>}<Outlet/></div>
  </section>
  <FloatingAssistant/>
 </main>
}
export {DashboardPage,ModulePage,RootLayout}
