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
- `src/app/App.tsx`: lớp video nền toàn app; không can thiệp nghiệp vụ hoặc quyền.

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
