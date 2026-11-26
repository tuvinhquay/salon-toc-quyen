import { useMemo, useState } from 'react'
import { BookOpen, Search, MessageCircleQuestion, ChevronDown, Lightbulb } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { guideTopics, normalizeGuideText } from './guide-content'

export function GuidePage() {
  const [search, setSearch] = useState('')
  const query = normalizeGuideText(search)
  const topics = useMemo(() => guideTopics.filter(topic => !query || normalizeGuideText([topic.title, topic.summary, ...topic.keywords, ...topic.steps, ...(topic.tips ?? [])].join(' ')).includes(query)), [query])
  return <section className="work-page owner-guide">
    <div className="work-intro"><div><small>TRỢ GIÚP · TÓC QUYỀN</small><h2>Hướng dẫn & giới thiệu</h2><p>Hướng dẫn từng bước để bạn và nhân viên làm quen, sử dụng các mục trong ứng dụng dễ dàng hơn.</p></div></div>
    <div className="guide-hero">
      <div className="guide-hero-icon"><BookOpen size={26}/></div>
      <div><h3>Ứng dụng giúp salon quản lý công việc hằng ngày</h3><p>Từ đặt lịch, chăm sóc khách, quản lý dịch vụ và kho đến thu ngân, báo cáo và sao lưu. Bạn có thể đọc hướng dẫn tại đây hoặc hỏi Trợ lý Tóc Quyền bằng lời nói tự nhiên.</p></div>
    </div>
    <div className="guide-quick-start">
      <h3>Bắt đầu nhanh</h3>
      <ol>
        <li>Đăng nhập bằng tài khoản Google được cấp quyền cho salon.</li>
        <li>Kiểm tra trang Tổng quan để xem lịch hẹn, khách hàng, nhân viên và tình hình hoạt động.</li>
        <li>Thêm dịch vụ và hồ sơ khách hàng trước khi tạo lịch hoặc hóa đơn.</li>
        <li>Ghi nhận các giao dịch thực tế trong Thu ngân & hóa đơn để báo cáo phản ánh đúng.</li>
        <li>Sao lưu dữ liệu định kỳ, đặc biệt trước khi đổi thiết bị hoặc trình duyệt.</li>
      </ol>
    </div>
    <label className="guide-search"><Search size={18}/><input aria-label="Tìm trong hướng dẫn" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm hướng dẫn: tạo lịch, lập hóa đơn, sao lưu…"/></label>
    <div className="guide-topic-heading"><div><h3>Hướng dẫn sử dụng các mục</h3><p>{topics.length} nội dung · Mở từng mục để xem cách làm</p></div></div>
    <div className="guide-topic-list">
      {topics.map(topic => <details className="guide-topic" key={topic.id}>
        <summary><span><strong>{topic.title}</strong><small>{topic.summary}</small></span><ChevronDown size={18}/></summary>
        <div className="guide-topic-content"><h4>Cách sử dụng</h4><ol>{topic.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>{topic.tips?.length? <div className="guide-tips"><Lightbulb size={16}/><div><strong>Lưu ý</strong><ul>{topic.tips.map((tip,index)=><li key={index}>{tip}</li>)}</ul></div></div>:null}</div>
      </details>)}
      {topics.length===0&&<p className="empty-state">Chưa tìm thấy hướng dẫn phù hợp. Thử tìm bằng từ ngắn hơn, ví dụ “lịch hẹn” hoặc “kho”.</p>}
    </div>
    <div className="guide-bot-card"><div className="guide-hero-icon"><MessageCircleQuestion size={23}/></div><div><h3>Hỏi Trợ lý Tóc Quyền</h3><p>Bot đã được tích hợp nội dung hướng dẫn này. Bạn có thể hỏi: “Hướng dẫn tạo lịch hẹn”, “Cách lập hóa đơn”, “Sao lưu dữ liệu ở đâu?” hoặc “Ứng dụng có những tính năng gì?”.</p><Link to={"/assistant" as never} className="guide-assistant-link">Mở Trợ lý AI để hỏi <span>→</span></Link></div></div>
    <p className="guide-limit-note">Lưu ý: hướng dẫn phản ánh các chức năng đang có trong phiên bản hiện tại. Tính năng đồng bộ tự động nhiều thiết bị chưa hoàn thiện; hãy kiểm tra trạng thái và sao lưu trước khi chuyển thiết bị.</p>
  </section>
}
