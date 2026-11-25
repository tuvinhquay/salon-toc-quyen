# Video nền toàn ứng dụng

Đặt video nền đã dựng tại đúng đường dẫn:

`public/videos/videosalo.mp4`

Khi chạy Vite, app tải video tại `/videos/videosalo.mp4`.

Yêu cầu khuyến nghị:
- MP4 H.264 + AAC hoặc không có audio; app luôn phát muted.
- 1920×1080 (16:9), 15 giây, seamless loop, 24/30 FPS.
- Không âm thanh, không chữ/logo nhúng trong video.
- Dung lượng mục tiêu 5–15 MB; tối ưu bằng H.264 CRF khoảng 25–28, faststart.
- Giữ chuyển động chậm và độ tương phản thấp để các panel kính dễ đọc.

Không commit video dung lượng lớn bằng Git nếu vượt giới hạn repo; dùng Git LFS hoặc asset hosting đã được Owner duyệt nếu cần. Không thay đổi sang cloud storage chứa dữ liệu nghiệp vụ.
