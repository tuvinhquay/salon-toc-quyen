export const normalizeGuideText = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()

export type GuideTopic = {
  id: string
  title: string
  summary: string
  keywords: string[]
  steps: string[]
  tips?: string[]
}

export const guideTopics: GuideTopic[] = [
  { id: 'start', title: '1. Bắt đầu sử dụng ứng dụng', summary: 'Đăng nhập và làm quen với không gian quản lý salon.', keywords: ['dang nhap', 'bat dau', 'mo app', 'tong quan', 'owner', 'chu tiem'], steps: ['Đăng nhập bằng tài khoản Google được cấp quyền cho salon.', 'Sau khi vào ứng dụng, trang Tổng quan cho bạn biết lịch hôm nay, số khách, nhân viên, sản phẩm và tình hình tiền trong tháng.', 'Dùng thanh điều hướng bên trái hoặc thanh menu trên điện thoại để mở từng mục.', 'Nhấn Làm mới khi muốn đọc lại dữ liệu mới nhất đang lưu trên thiết bị.'], tips: ['Mỗi tài khoản chỉ xem dữ liệu salon mà tài khoản đó được phép truy cập.', 'Dữ liệu nghiệp vụ được thiết kế theo hướng lưu chính trên thiết bị (IndexedDB); Firebase dùng cho đăng nhập, quyền và điều phối đồng bộ, không phải kho dữ liệu salon chính.', 'Việc đồng bộ tự động giữa nhiều thiết bị chưa được nghiệm thu; không xóa dữ liệu ở thiết bị cũ trước khi xác nhận đã có bản sao lưu an toàn.'] },
  { id: 'appointments', title: '2. Lịch hẹn và tiền đặt cọc', summary: 'Tạo lịch hẹn cho khách, chọn dịch vụ và theo dõi tiến trình.', keywords: ['lich hen', 'dat lich', 'tien coc', 'hen khach', 'appointment'], steps: ['Mở Lịch hẹn.', 'Chọn khách hàng đã có trong danh sách. Nếu khách chưa có hồ sơ, hãy tạo khách ở mục Khách hàng trước.', 'Chọn giờ bắt đầu, giờ kết thúc, dịch vụ dự kiến và tiền đặt cọc nếu có.', 'Nhấn Tạo lịch hẹn. Lịch mới xuất hiện trong danh sách.', 'Cập nhật trạng thái theo thực tế: xác nhận, khách đã đến, đang làm và hoàn tất.'], tips: ['Kiểm tra ngày giờ và dịch vụ trước khi lưu.', 'Lịch đã hủy hoặc khách không đến sẽ được phân biệt với lịch hoàn tất.'] },
  { id: 'customers', title: '3. Hồ sơ khách hàng', summary: 'Lưu thông tin liên hệ, nhóm khách và ghi chú chăm sóc.', keywords: ['khach hang', 'ho so khach', 'so dien thoai', 'nhom khach', 'luu tru khach'], steps: ['Mở Khách hàng và nhập họ tên; số điện thoại, email và ghi chú là thông tin bổ sung.', 'Có thể gắn khách vào một hoặc nhiều nhóm khách hàng.', 'Dùng ô tìm kiếm để tìm theo tên hoặc số điện thoại.', 'Chọn Sửa để cập nhật hồ sơ.', 'Chọn Lưu trữ để ẩn hồ sơ không còn sử dụng.'], tips: ['Lưu trữ không xóa lịch sử hóa đơn và thanh toán.', 'Chỉ nhập thông tin khách hàng khi salon có quyền và sự đồng ý phù hợp.'] },
  { id: 'workflow', title: '4. Quy trình làm tóc và công thức', summary: 'Ghi lại tư vấn, công đoạn và công thức phục vụ lần sau.', keywords: ['quy trinh', 'cong thuc toc', 'nhuom', 'tay', 'phuc hoi', 'nhat ky'], steps: ['Mở Quy trình làm tóc và chọn lịch hẹn phù hợp.', 'Chọn loại ghi nhận: tư vấn, bắt đầu công đoạn, tạm dừng, hoàn tất, bàn giao, ghi chú hoặc lưu công thức.', 'Nếu lưu công thức, chọn loại, nhập sản phẩm cùng lượng và đơn vị, thông tin oxy/thời gian/kết quả mong muốn nếu có.', 'Nhấn Ghi nhật ký để lưu lại vào lịch hẹn.'], tips: ['Ghi công thức rõ ràng để thợ có thể đọc lại; đây là ghi chép tham khảo, không thay thế đánh giá chuyên môn của thợ.'] },
  { id: 'employees', title: '5. Nhân viên, ca làm và hoa hồng', summary: 'Quản lý hồ sơ nhân viên, lịch ca và quy định hoa hồng.', keywords: ['nhan vien', 'nhan su', 'ca lam', 'hoa hong', 'phan cong'], steps: ['Mở Nhân viên để thêm hồ sơ, thông tin liên hệ, vai trò và ngày vào làm.', 'Tạo ca làm bằng cách chọn nhân viên, thời gian bắt đầu và kết thúc.', 'Theo dõi ca đã hoàn thành và trạng thái nhân viên.', 'Thiết lập chính sách hoa hồng theo nhân viên hoặc dịch vụ khi cần.'], tips: ['Báo cáo doanh thu theo người chỉ chính xác khi hóa đơn/dòng dịch vụ được gán đúng nhân viên.', 'Không dùng số giờ làm thay cho doanh thu hoặc lợi nhuận cá nhân.'] },
  { id: 'services', title: '6. Danh mục dịch vụ', summary: 'Thiết lập dịch vụ, thời lượng và giá để dùng khi đặt lịch, lập hóa đơn.', keywords: ['dich vu', 'gia dich vu', 'thoi luong', 'bang gia'], steps: ['Mở Dịch vụ salon.', 'Nhập tên dịch vụ, thời lượng dự kiến, giá và mô tả.', 'Nhấn Lưu dịch vụ.', 'Sửa thông tin khi giá hoặc thời lượng thay đổi.'], tips: ['Giữ danh mục dịch vụ và giá cập nhật để việc đặt lịch, lập hóa đơn thuận tiện.'] },
  { id: 'inventory', title: '7. Kho sản phẩm và vật tư', summary: 'Theo dõi sản phẩm bán, vật tư sử dụng, lô hàng và mức tồn.', keywords: ['kho', 'ton kho', 'san pham', 'vat tu', 'nhap hang', 'han dung'], steps: ['Mở Kho sản phẩm & vật tư để thêm sản phẩm, mã hàng, đơn vị và giá.', 'Ghi nhận nhập hàng theo lô và thông tin cần thiết như giá nhập hoặc hạn dùng.', 'Theo dõi lượng còn trong kho và các mặt hàng thấp hơn mức cần có.', 'Khi bán sản phẩm hoặc xuất dùng vật tư, chọn đúng mặt hàng và số lượng theo nghiệp vụ có sẵn.'], tips: ['Kiểm tra đơn vị tính trước khi nhập số lượng.', 'Thông tin tồn kho phụ thuộc vào các lần nhập, bán và xuất dùng đã được ghi lại.'] },
  { id: 'pos', title: '8. Thu ngân, hóa đơn và chi phí', summary: 'Tạo hóa đơn, nhận thanh toán, hoàn tiền và ghi các khoản chi.', keywords: ['thu ngan', 'hoa don', 'thanh toan', 'hoan tien', 'chi phi', 'dong ca', 'tien mat'], steps: ['Mở Thu ngân & hóa đơn và bắt đầu ca thu ngân nếu ứng dụng yêu cầu.', 'Chọn khách hàng nếu có, thêm dịch vụ/sản phẩm hoặc khoản thu phù hợp, kiểm tra số lượng, giá và giảm giá.', 'Phát hành hóa đơn sau khi kiểm tra thông tin.', 'Ghi nhận khoản khách đã trả và phương thức thanh toán.', 'Nếu cần hoàn tiền, chọn khoản thanh toán liên quan, nhập số tiền và lý do.', 'Ghi các khoản chi của salon ở phần chi phí; cuối ca kiểm đếm và đóng ca.'], tips: ['Hóa đơn đã phát hành, tiền thực thu và tiền còn lại là các số khác nhau.', 'Chỉ ghi nhận hoàn tiền khi thực sự đã hoàn cho khách.'] },
  { id: 'reports', title: '9. Báo cáo và biểu đồ', summary: 'Xem tình hình thu tiền, hoàn tiền, chi phí và số tiền còn lại.', keywords: ['bao cao', 'bieu do', 'doanh thu', 'loi nhuan', 'tien con lai', 'thang', 'quy'], steps: ['Mở Báo cáo.', 'Chọn khoảng thời gian hoặc dùng các nút chọn nhanh như hôm nay, tháng, quý, năm hay 5 tháng gần nhất.', 'Xem tổng tiền hóa đơn, tiền đã thu, tiền hoàn, các khoản chi và tiền còn lại.', 'Đọc biểu đồ để so sánh tiền thu, tiền hoàn và các khoản chi theo ngày hoặc tháng.'], tips: ['Tiền còn lại được tính từ tiền đã thu trừ tiền hoàn và các khoản chi đã nhập.', 'Đây chưa chắc là lợi nhuận cuối cùng nếu giá vật tư, tiền công, hoa hồng hoặc khoản chi khác chưa được nhập đầy đủ.'] },
  { id: 'assistant', title: '10. Trợ lý Tóc Quyền', summary: 'Hỏi bằng tiếng Việt tự nhiên để tra cứu số liệu, tìm hồ sơ và học cách dùng app.', keywords: ['tro ly', 'bot', 'ai', 'hoi dap', 'ghi nho', 'huong dan bot'], steps: ['Mở Trợ lý AI hoặc nhấn nút trợ lý nổi ở góc màn hình.', 'Hỏi như đang nói chuyện: “Hôm nay có bao nhiêu lịch?”, “Tìm sản phẩm dầu gội”, “Tổng lợi nhuận tháng này bao nhiêu?” hoặc “Hướng dẫn tạo lịch hẹn”.', 'Trợ lý có thể tra cứu thông tin trong salon hiện tại, trả lời câu hỏi hướng dẫn và gợi ý cách sử dụng.', 'Bạn có thể yêu cầu trợ lý ghi nhớ thói quen hoặc câu hỏi nghiệp vụ do chủ tiệm tự dạy.'], tips: ['Bot chỉ trả lời theo thông tin có sẵn; dữ liệu thiếu sẽ được nêu rõ.', 'AI tư vấn bổ sung là tùy chọn. Các câu hỏi hướng dẫn cơ bản có thể trả lời ngay từ nội dung trong ứng dụng.'] },
  { id: 'devices', title: '11. Thiết bị và trạng thái đồng bộ', summary: 'Mỗi máy lưu dữ liệu riêng; Firebase xác thực thiết bị và điều phối các gói thay đổi được phép.', keywords: ['thiet bi', 'dong bo', 'may moi', 'duyet thiet bi', 'xung dot'], steps: ['Mỗi máy tính, laptop, iPhone hoặc Android có bộ dữ liệu cục bộ riêng trong bộ nhớ ứng dụng (IndexedDB).', 'Firebase đảm nhiệm đăng nhập, xác minh quyền salon/chủ tiệm, danh tính thiết bị và điều phối việc gửi/nhận các gói thay đổi đã mã hóa; không phải nơi lưu chính toàn bộ khách hàng, hóa đơn hay kho.', 'Chỉ ghép đôi và phê duyệt thiết bị mà bạn nhận biết và tin cậy.', 'Khi đồng bộ được bật, thiết bị gửi các thay đổi cần thiết; thiết bị nhận kiểm tra salon, thiết bị gửi, phiên bản và tính toàn vẹn trước khi áp dụng.', 'Nếu thiết bị offline, thay đổi được giữ trong hàng đợi cục bộ và chờ kết nối trở lại. Khi có xung đột, cần xử lý theo quy tắc nghiệp vụ, không tự ghi đè mù quáng.'], tips: ['Lưu ý: ở phiên bản hiện tại, protocol mã hóa và màn hình quản lý thiết bị đã có nhưng kênh truyền đồng bộ thực tế chưa hoàn thiện. Không được coi dữ liệu giữa hai máy là đã giống nhau cho tới khi trạng thái xác nhận đồng bộ thành công.', 'Không gỡ ứng dụng, xóa dữ liệu trình duyệt hoặc reset thiết bị cũ trước khi sao lưu và xác nhận thiết bị khác đã nhận đủ dữ liệu.', 'Firebase giữ vai trò xác thực/điều phối; các gói relay nếu dùng chỉ là dữ liệu mã hóa tạm thời có thời hạn, không phải bản dữ liệu salon chính.'] },
  { id: 'backup', title: '12. Sao lưu và khôi phục', summary: 'Tạo bản sao dữ liệu cục bộ được mã hóa để bảo vệ khi mất hoặc đổi thiết bị.', keywords: ['backup', 'sao luu', 'khoi phuc', 'mat du lieu', 'ma hoa'], steps: ['Mở Backup & khôi phục.', 'Tạo bản sao lưu và lưu file ở nơi an toàn mà bạn kiểm soát.', 'Giữ mật khẩu hoặc thông tin cần thiết để mở bản sao lưu; không gửi cho người khác.', 'Khi cần khôi phục, chọn đúng file, kiểm tra thông tin và chọn cách khôi phục được ứng dụng cung cấp.'], tips: ['Nên sao lưu định kỳ và trước khi đổi thiết bị hoặc trình duyệt.', 'Đồng bộ giữa các thiết bị không thay thế bản sao lưu độc lập.', 'Bản sao lưu không thay thế việc bảo vệ tài khoản Google và thiết bị.'] },
  { id: 'settings', title: '13. Cài đặt salon và dữ liệu mẫu', summary: 'Quản lý nhóm khách, thông tin salon và bộ dữ liệu mô phỏng.', keywords: ['cai dat', 'nhom khach', 'du lieu mau', 'demo', 'mo phong', 'salon'], steps: ['Mở Cài đặt để tạo/sửa nhóm khách hàng và xem thông tin không gian salon.', 'Dữ liệu mẫu dùng để thử giao diện và báo cáo, không phải giao dịch thật.', 'Chỉ tạo hoặc thay bộ dữ liệu mẫu khi bạn hiểu rằng số liệu mẫu sẽ xuất hiện trong báo cáo cùng dữ liệu đang có.', 'Chỉ xóa bộ dữ liệu mẫu khi thực sự muốn; ứng dụng bảo vệ các bản ghi thật khỏi thao tác xóa dữ liệu mẫu.'], tips: ['Không dùng số liệu mô phỏng để quyết định kinh doanh thực tế.', 'Nếu đang dùng salon thật, hãy tránh thêm dữ liệu mẫu vào báo cáo thật.'] },
]

const overview = [
  'Ứng dụng TÓC QUYỀN giúp chủ salon quản lý công việc hằng ngày: lịch hẹn, khách hàng, quy trình làm tóc, nhân viên, dịch vụ, kho, thu ngân, báo cáo và sao lưu.',
  'Hướng dẫn này mô tả những chức năng đang có trong phiên bản hiện tại. Một số tính năng nhiều thiết bị hoặc đồng bộ vẫn đang được hoàn thiện; phần hướng dẫn sẽ nói rõ giới hạn thay vì hứa rằng chức năng đã hoạt động.',
]

const guideTriggers = /(huong dan|chi toi|cach su dung|su dung app|su dung ung dung|gioi thieu app|app lam duoc gi|ung dung lam gi|tinh nang nao|giup toi su dung|lam sao de)/

export function isGuideQuestion(question: string): boolean {
  const q = normalizeGuideText(question)
  return guideTriggers.test(q) || guideTopics.some(topic => topic.keywords.some(keyword => q.includes(normalizeGuideText(keyword))) && /(cach|lam sao|huong dan|su dung|la gi|o dau|the nao|giup)/.test(q))
}

export function answerFromGuide(question: string): string | null {
  const q = normalizeGuideText(question)
  const asksOverview = /(app lam duoc gi|ung dung lam gi|tinh nang|gioi thieu|huong dan|cach su dung app|su dung ung dung)/.test(q)
  const topic = guideTopics.find(item => item.keywords.some(keyword => q.includes(normalizeGuideText(keyword))))
  if (!topic && !asksOverview) return null
  if (!topic) {
    return [
      '**Ứng dụng TÓC QUYỀN làm được gì?**',
      ...overview,
      '',
      '**Các mục chính**',
      ...guideTopics.map(item => '• ' + item.title.replace(/^\d+\. /, '') + ': ' + item.summary),
      '',
      'Bạn có thể hỏi em: “Hướng dẫn tạo lịch hẹn”, “Cách lập hóa đơn”, “Làm sao sao lưu dữ liệu?” hoặc “Giải thích báo cáo”.',
    ].join('\n')
  }
  return [
    '**' + topic.title + '**',
    topic.summary,
    '',
    '**Cách sử dụng**',
    ...topic.steps.map((step, index) => (index + 1) + '. ' + step),
    ...(topic.tips?.length ? ['', '**Lưu ý**', ...topic.tips.map(tip => '• ' + tip)] : []),
  ].join('\n')
}
