# Phase 37 – Hướng dẫn & giới thiệu, tích hợp kiến thức vào Trợ lý

Ngày: 2026-11-26  
Branch: `phase-37-owner-guide-and-assistant-knowledge`  
Base: `phase-36-owner-friendly-language`

## Mục tiêu
Tạo một nơi hướng dẫn dễ đọc cho chủ salon/người sử dụng, từ thao tác cơ bản đến các chức năng chính; cho phép hỏi Trợ lý bằng câu tự nhiên để nhận đúng hướng dẫn.

## Nội dung đã triển khai
- Thêm mục điều hướng **Hướng dẫn & giới thiệu** ngay sau Tổng quan.
- Trang hướng dẫn có phần giới thiệu app, bắt đầu nhanh, ô tìm kiếm và 13 chủ đề có thể mở/thu gọn.
- Chủ đề bao gồm: bắt đầu, lịch hẹn/tiền cọc, khách hàng, quy trình/công thức tóc, nhân viên/ca/hoa hồng, dịch vụ, kho/vật tư, thu ngân/hóa đơn/chi phí, báo cáo/biểu đồ, trợ lý, thiết bị, sao lưu/khôi phục, cài đặt/dữ liệu mẫu.
- Ghi rõ giới hạn hiện tại: đồng bộ tự động nhiều thiết bị chưa hoàn thiện; dữ liệu mẫu không phải giao dịch thật; số tiền còn lại chưa mặc nhiên là lợi nhuận cuối cùng.
- Tích hợp nội dung hướng dẫn tĩnh vào Trợ lý cục bộ. Các câu hỏi “hướng dẫn/cách sử dụng/làm sao…” được định tuyến đến nội dung tương ứng trước khi đọc dữ liệu kinh doanh; không cần Gemini và không gửi thông tin salon ra ngoài.
- Thêm câu hỏi gợi ý và unit tests cho định tuyến hướng dẫn.

## An toàn/phạm vi
- Không thay đổi dữ liệu nghiệp vụ, schema, công thức, Auth, tenant scope hoặc quyền.
- Hướng dẫn mô tả chức năng hiện có, không tuyên bố đồng bộ P2P đã hoạt động.
- PR Draft; không merge/deploy.

## Kiểm tra
- CI: PASS (Typecheck, Lint, 64/64 unit tests, production build/PWA).
- Owner cần xem nội dung hướng dẫn trên Android/Termux và hỏi bot vài câu mẫu.
