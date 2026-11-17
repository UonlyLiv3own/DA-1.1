# KÈ THANH ĐA – ĐOẠN 1.1

Website quản lý dự toán bồi thường, hỗ trợ
Dự án Kè Thanh Đa – đoạn 1.1.
Sử dụng HTML/CSS/JavaScript và dữ liệu Excel.

## Chạy thử

1. Giải nén toàn bộ thư mục.
2. Mở thư mục bằng VS Code, chọn **Open with Live Server** trên `index.html`, hoặc chạy `python -m http.server 8000` trong thư mục rồi truy cập `http://localhost:8000`. Không mở bằng `file://` vì trình duyệt chặn fetch.
3. Truy cập Tổng quan, Danh sách, Chi tiết và Báo cáo.
4. Bấm **Tải Excel mới** để chọn bản cập nhật. Nếu dung lượng cho phép, bản tải lên được lưu trong localStorage của trình duyệt; không được đẩy lên Vercel hay chia sẻ sang máy khác. **Khôi phục file gốc** để trở về file kèm source.

## Triển khai Vercel

Đưa toàn bộ nội dung thư mục lên GitHub, import repository vào Vercel với Framework Preset **Other**, không cần build command. Trang chủ là `index.html`. Để cập nhật dữ liệu cho mọi người dùng, thay `data/du-toan.xlsx` trong repository rồi deploy lại. Nút Tải Excel mới chỉ cập nhật tại trình duyệt đang mở.

## Quy ước nguồn dữ liệu

- Chỉ đọc sheet `DT xử lý` trong file Excel. Bỏ qua `Dự toán gốc`, `Đồng ý`, `Không đồng ý`.
- Bảng nhiều tầng có tiêu đề hàng 5–7, hàng 8 là chú giải, dữ liệu từ hàng 9.
- Lấy những dòng có STT nguyên tại cột A và tên tại cột B. Bỏ qua dòng tổng cộng/chú thích.
- Cột AT = tổng dự toán bao gồm thưởng; AR = tổng trước thưởng; AS = thưởng.
- Cột AU: chỉ dấu X mới được tính là **Đã đánh dấu đồng ý**; trống được gọi **Chưa đánh dấu**, không kết luận là phản đối.
- BA–BF chỉ hiển thị nguyên trạng trên trang chi tiết; không cộng thành Đã chi/Chưa chi khi chưa xác nhận nghiệp vụ.
- STT là mã điều hướng tạm; nếu thay đổi thứ tự các dòng Excel, đường dẫn chi tiết cũng thay đổi. Khi vận hành chính thức nên có mã hồ sơ ổn định.
- Phần tiền dạng text có dấu phân cách được chuẩn hóa khi đọc, không sửa dữ liệu gốc.

## Giới hạn

- Website là bản đọc dữ liệu và báo cáo thử nghiệm, chưa có đăng nhập hoặc phân quyền. **Không triển khai công khai dữ liệu cá nhân** khi chưa được phép.
- Chưa có kết nối Google Sheets/Apps Script và chưa có audit log.
- Chưa xác minh tính pháp lý của số dự toán, tình trạng phê duyệt và các giao dịch chi tiền.
- Nếu đổi bố cục cột của `DT xử lý`, cập nhật bảng chỉ số cột `C` trong `js/data.js`.


## GIT

git init
git config --global user.email "xuannguyen040900@gmail.com"
git config --global user.name "UonlyLiv3own"
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/UonlyLiv3own/DA-1.1.git
git push -u origin main