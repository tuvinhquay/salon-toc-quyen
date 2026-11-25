# Design system – Luxury Emerald Glass

## Brand direction
- Chủ đề: Luxury Emerald Glass – kính xanh ngọc lục bảo phối vàng champagne.
- Nền: video salon MP4 toàn màn hình, tắt tiếng, autoplay, loop, playsInline.
- Overlay xanh đậm nhiều lớp để nội dung luôn đủ tương phản.
- Logo app: kéo cắt tóc vàng và chữ SalonQuyen; icon rút gọn chỉ dùng kéo.
- Không sử dụng hình người hoặc hình nai trong icon nhận diện app.

## Asset map
- `public/videos/videosalo.mp4`: video nền 15 giây do Owner cung cấp.
- `public/brand/`: quy chuẩn và artwork thương hiệu dùng chung.
- `public/icons/icon.svg`: icon chính.
- `public/icons/pwa-192.svg`, `pwa-512.svg`, `pwa-maskable.svg`: icon manifest.
- `public/icons/apple-touch-icon.svg`: biểu tượng Apple touch tạm thời dạng SVG.
- `src/styles.css`: token màu, glass surfaces, sidebar motion, responsive breakpoints.
- `src/main.tsx`: lớp video nền cấp root, xuất hiện trước AuthGate trên cả đăng nhập và Owner workspace.
- `src/styles.css`: video visibility, emerald overlay, high-contrast text và readable glass surfaces.
- `src/lib/invoice-print.ts`: họa tiết đầu nai có sừng và watermark riêng cho hóa đơn; icon thương hiệu app vẫn là kéo.

## Sidebar interaction
- Desktop/tablet: sidebar cố định theo chiều cao viewport, cuộn độc lập khi danh mục dài.
- Hover: trượt ngang nhẹ 4px, nền ánh vàng-xanh xuất hiện mềm.
- Active route: nền emerald glass, vạch champagne bên trái, chấm sáng nhịp chậm.
- Mobile: điều hướng ngang có scroll-snap, không chiếm chiều cao như sidebar desktop.
- Keyboard focus và forced-colors vẫn có chỉ báo rõ.
- prefers-reduced-motion tắt chuyển động không cần thiết.

## Cross-platform and performance
- CSS responsive cho desktop/tablet/mobile; safe viewport dùng 100dvh trên mobile.
- Video decorative, muted, playsInline; không chặn thao tác, không chiếm pointer events.
- Gradient emerald vẫn là fallback khi file video chưa được đặt vào public/videos.
- Giữ nguyên React routes, Dexie, Firebase auth, quyền Owner, nghiệp vụ và assistant.
- Cần smoke test thực tế Android/Termux, Chrome desktop, Safari iOS/PWA trước khi nghiệm thu.
- SVG icons hiện dùng để giữ chất lượng vector. Bộ PNG raster 192/512 và Apple 180×180 có thể được xuất bổ sung nếu cần thiết cho thiết bị iOS/manifest strict compatibility.
\n\n## Contrast and invoice ornament (Phase 34)\n- Không áp dụng opacity/filter lên text; chỉ bề mặt glass được translucent.\n- Nội dung chính dùng chữ màu đặc, contrast cao; form control/placeholder/focus rõ trên cả nền video.\n- Video nền dùng chung cho sign-in và Owner shell, overlay giảm độ đậm để thấy video rõ hơn nhưng vẫn bảo đảm khả năng đọc.\n- Họa tiết đầu nai có sừng chỉ dùng trong invoice print; không thay biểu tượng kéo của app.\n