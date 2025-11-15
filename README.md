# Tra cứu đơn vị hành chính Việt Nam

Ứng dụng web tĩnh tra cứu đơn vị hành chính Việt Nam (tỉnh/thành, xã/phường) dựa trên dữ liệu mẫu trong thư mục `dataThamKhao`.

## Cấu trúc thư mục chính

- `index.html` – giao diện chính, ô tìm kiếm và hiển thị kết quả.
- `app.js` – logic tải dữ liệu và tìm kiếm.
- `style.css` – giao diện cơ bản.
- `dataThamKhao/json/data.json` – dữ liệu đầy đủ 2 cấp: tỉnh/thành và xã/phường.

Khi deploy, cần giữ nguyên cấu trúc thư mục này để ứng dụng hoạt động đúng.

## Hướng dẫn deploy lên GitHub Pages

### 1. Tạo repository trên GitHub

1. Đăng nhập GitHub và tạo repository mới, ví dụ: `Code_DonViHanhChinh`.
2. Không bắt buộc tạo README từ GitHub (vì trong dự án đã có `README.md` này).

### 2. Đẩy code từ máy local lên GitHub

Trong thư mục dự án (ví dụ `F:\Code\Code_DonViHanhChinh`), chạy các lệnh sau:

```bash
git init
git add .
git commit -m "Init don vi hanh chinh"
git branch -M main
git remote add origin https://github.com/<your-username>/Code_DonViHanhChinh.git
git push -u origin main
```

Thay `<your-username>` bằng tên tài khoản GitHub của bạn.

### 3. Bật GitHub Pages

1. Vào repository trên GitHub.
2. Chọn tab **Settings**.
3. Trong menu bên trái, chọn **Pages**.
4. Ở phần **Source**, chọn:
   - **Deploy from a branch**.
   - Branch: `main`.
   - Folder: `/ (root)`.
5. Bấm **Save** và chờ vài phút để GitHub build.

### 4. Truy cập ứng dụng

Sau khi GitHub Pages build xong, bạn sẽ có URL dạng:

```text
https://<your-username>.github.io/Code_DonViHanhChinh/
```

Truy cập đường dẫn này để sử dụng trang tra cứu đơn vị hành chính.

