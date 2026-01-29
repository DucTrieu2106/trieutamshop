// 1. Cấu hình Firebase lấy từ image_4f86b7.png
const firebaseConfig = {
  apiKey: "AIzaSyCFB6byIpcDVqE7z7H6wN7dr256s68VCho",
  authDomain: "trieu-tam-shop.firebaseapp.com",
  projectId: "trieu-tam-shop",
  storageBucket: "trieu-tam-shop.firebasestorage.app",
  messagingSenderId: "20432947800",
  appId: "1:20432947800:web:762c9e55bf96403ec5d82d",
  measurementId: "G-C1TB8XPYHX",
  databaseURL: "https://trieu-tam-shop-default-rtdb.firebaseio.com"
};

// Khởi tạo Firebase (Sử dụng cú pháp bản 8.x cho ổn định với HTML thuần)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const CURRENT_USER = "artist_current_session";

// --- HÀM THÊM SẢN PHẨM (Sửa lỗi nút bấm không hoạt động) ---
function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const file = document.getElementById('p-img-file').files[0];

    // Kiểm tra dữ liệu đầu vào
    if(!id || !name || !file) {
        alert("Vui lòng nhập đủ: Mã SP, Tên và chọn Ảnh!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const productData = {
            id: id,
            name: name,
            price: price,
            img: e.target.result
        };

        // Ghi dữ liệu vào Firebase
        db.ref('products/' + id).set(productData)
            .then(() => {
                alert("Đã cập nhật sản phẩm " + id + " thành công!");
                // Xóa dữ liệu cũ trong form để nhập món mới
                document.getElementById('p-id').value = "";
                document.getElementById('p-name').value = "";
                document.getElementById('p-price').value = "";
                document.getElementById('p-img-file').value = "";
            })
            .catch((error) => {
                console.error("Lỗi: ", error);
                alert("Lỗi hệ thống: " + error.message);
            });
    };
    reader.readAsDataURL(file);
}

// --- HIỂN THỊ DANH SÁCH (Tự động cập nhật khi có món mới) ---
function renderHomeProducts() {
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;

    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const products = data ? Object.values(data) : [];
        
        if (products.length === 0) {
            grid.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Đang đợi bạn thêm sản phẩm mới...</p>";
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.img}">
                <p style="font-size:10px; color:#999;">CODE: ${p.id}</p>
                <h3>${p.name}</h3>
                <p class="price">${p.price}</p>
                <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold">ĐẶT HÀNG</a>
            </div>`).join('');
    });
}

// Hàm bổ trợ khác (Duyệt đơn, Đăng nhập...)
function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(user && pass) {
        db.ref('users/' + user).set({ username: user, password: pass }).then(() => alert("Đã tạo TK: " + user));
    }
}

window.onload = function() {
    if (document.getElementById('home-product-grid')) renderHomeProducts();
};
