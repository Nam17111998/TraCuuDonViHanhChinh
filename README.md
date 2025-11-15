# Tra cứu đơn vị hành chính Việt Nam

Ứng dụng web tĩnh tra cứu đơn vị hành chính Việt Nam (tỉnh/thành, xã/phường) dựa trên dữ liệu mẫu trong thư mục `dataThamKhao`.

## Cấu trúc thư mục chính

- `index.html` – giao diện chính, ô tìm kiếm và hiển thị kết quả.
- `app.js` – logic tải dữ liệu và tìm kiếm.
- `style.css` – giao diện cơ bản.
- `dataThamKhao/json/data.json` – dữ liệu đầy đủ 2 cấp: tỉnh/thành và xã/phường.

Khi deploy, cần giữ nguyên cấu trúc thư mục này để ứng dụng hoạt động đúng.

## Chạy thử (test) trên máy trước khi deploy

Để kiểm tra ứng dụng trước khi đẩy lên GitHub Pages, nên chạy qua một web server tĩnh (không mở trực tiếp bằng `file://` vì `fetch` sẽ lỗi).

### Bước 1: Chuẩn bị

- Đảm bảo các file chính tồn tại:
  - `index.html`
  - `app.js`
  - `style.css`
  - `dataThamKhao/json/data.json`
- Mở terminal tại thư mục dự án (ví dụ: `F:\Code\Code_DonViHanhChinh`).

### Cách 1: Dùng Python

Nếu máy có Python, chạy:

```bash
python -m http.server 8000
```

Sau đó mở trình duyệt vào:

```text
http://localhost:8000/
```

### Cách 2: Dùng Node.js (http-server / serve)

Nếu có Node.js:

```bash
npm install -g http-server
http-server . -p 8000
```

hoặc:

```bash
npx serve -l 8000
```

Rồi truy cập `http://localhost:8000/`.

### Cách 3: VS Code Live Server

- Mở thư mục dự án bằng VS Code.
- Cài extension **Live Server**.
- Mở `index.html` → chuột phải chọn **Open with Live Server**.
- Trình duyệt sẽ tự mở (thường là `http://127.0.0.1:5500/`).

### Kiểm tra nhanh

- Khi mở trang, dòng trạng thái ban đầu là “Đang tải dữ liệu, vui lòng chờ…”, sau đó chuyển sang hướng dẫn nhập từ khóa.
- Thử gõ: `Ha Noi`, `Phuong Ben Nghe`, `Quan 1`… xem kết quả tỉnh/thành và xã/phường có hiển thị.
- Mở Developer Tools (F12) → tab **Network** → kiểm tra `dataThamKhao/json/data.json` tải thành công (status 200).

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
