# P22 – Salon Brain Core
Ngày: 2026-11-23
Branch: `phase-22-salon-brain-core`
Base: `phase-19-local-learning-assistant-rebased`

## Mục tiêu
Tạo nền tảng trí nhớ dài hạn độc lập cho Owner. Trí nhớ được lưu cục bộ trên thiết bị, không gửi Firebase/Gemini. Đây là bước nền trước khi triển khai hiểu hội thoại, governance và P2P.

## Đã triển khai trên branch
- Dexie schema v6 thêm `assistantMemories`, giữ nguyên migrations v1–v5.
- Kiểu dữ liệu có salonId, ownerId, category, title, content, keywords, revision, deviceId, trạng thái active/archived và syncState local_only.
- Zod validation cho nội dung trí nhớ.
- Parser chỉ ghi khi Owner đưa chỉ thị rõ ràng; phân loại profile, preference, routine, project, knowledge.
- Truy xuất trí nhớ theo yêu cầu “Bạn nhớ gì về tôi?” và tìm mục liên quan.
- Owner xem và lưu trữ từng mục; thao tác tạo/lưu trữ có audit event.
- Không truyền nội dung trí nhớ tới Firebase hoặc Gemini.

## Chưa làm trong P22
- Chưa có P2P transport, peer discovery, ghép đôi hoặc đồng bộ; dữ liệu chỉ ở thiết bị hiện tại.
- Chưa có trích xuất ý định phức tạp/đối thoại hỏi làm rõ.
- Chưa cho bot lập kế hoạch có cấu trúc hoặc thực hiện hành động.
- Chưa có kiểm thử IndexedDB migration trên trình duyệt thật.

## Kiểm thử bắt buộc
1. `npm run typecheck`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. Trên Termux: “Hãy ghi nhớ tên tôi là Quay”, refresh trang, hỏi “Bạn nhớ gì về tôi?”.
6. Thử lưu sở thích và kế hoạch hằng ngày; xác nhận chúng vẫn còn sau reload.
7. Lưu trữ một mục và xác nhận bot không còn nhắc lại mục đó.
8. Kiểm tra app nâng Dexie từ version 5 lên 6 mà không mất dữ liệu cũ.

## Definition of Done
Chỉ PASS khi toàn bộ kiểm tra trên thành công. Không merge trước khi CI và smoke test đạt.
