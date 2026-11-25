# Hotfix – IndexedDB missing object store khi tạo bộ mô phỏng P30

## Nguyên nhân
Lỗi `Failed to execute 'objectStore' on 'IDBTransaction': The specified object store was not found` xảy ra khi IndexedDB của trình duyệt đã có database `salon-toc-quyen` ở schema version 7 nhưng bộ object stores thực tế không đồng nhất với schema v7 đang khai báo trong code. Dexie bắt đầu transaction với các bảng của bộ demo; nếu một store thiếu, transaction ném `NotFoundError` trước khi seed hoàn tất.

Điều này có thể xảy ra khi schema stores được bổ sung/điều chỉnh trong cùng một version đã phát hành cho một số thiết bị. Không nên yêu cầu người dùng xóa IndexedDB vì có thể mất dữ liệu salon thật.

## Sửa
- Nâng Dexie schema lên version 8.
- Khai báo lại đầy đủ schema v7 ở version 8 để IndexedDB tự tạo các object stores còn thiếu và áp dụng index schema.
- Không xóa database, không xóa records, không reset salon hoặc tài khoản.
- Bản ghi migration giữ toàn bộ v7 stores và indexes; dữ liệu hiện có được bảo toàn.

## Branch / PR
- Branch: `fix-indexeddb-store-upgrade-p30`
- Base: `phase-30-five-month-realistic-business-demo`
- PR: chờ mở sau CI.

## Nghiệm thu
- CI typecheck/lint/tests/build.
- Owner cập nhật code hotfix trên thiết bị, tải lại app để Dexie chạy migration v8, sau đó thử tạo demo.
- Không merge/deploy Firebase/Hosting nếu chưa có Owner approval.

## Điều tra tiếp theo – root cause transaction seed
- Owner xác nhận chạy local bằng Termux trên branch `fix-indexeddb-store-upgrade-p30` và lỗi vẫn xảy ra, nên migration v8 không đủ.
- Lần sửa trước đã sai: Dexie 4 hỗ trợ truyền danh sách bảng bằng array; spread toàn bộ 19 bảng thành arguments vượt overload TypeScript (chỉ nhận 3–7 arguments trong typings), khiến typecheck/build thất bại. Không sử dụng cách spread variadic.
- Kiểm tra lại scope transaction: `assertNoRealReferences()` đọc `salonDb.workflowEvents`, nhưng `workflowEvents` không nằm trong `demoTables`. Khi truy vấn này chạy bên trong transaction, Dexie báo object store không được bao gồm/không tồn tại trong transaction. Đây là nguyên nhân cụ thể phù hợp với lỗi runtime.
- Sửa cả `seedDemoData` và `clearDemoData` thành `salonDb.transaction('rw', [...demoTables, salonDb.workflowEvents], async () => ...)`: truyền array theo API Dexie và bổ sung workflowEvents vào scope đọc. Không xóa hoặc ghi workflowEvents, không đụng dữ liệu salon đã lưu.
