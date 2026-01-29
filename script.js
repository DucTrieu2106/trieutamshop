// 1. CẤU HÌNH FIREBASE - TRIỆU TÂM SHOP
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

// Khởi tạo Firebase bản 8.10.0
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const CURRENT_USER = "artist_current_session";

// --- 2. HỆ THỐNG ĐĂNG NHẬP ---
function checkLogin() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const path = window.location.pathname;
    const fileName = path.split("/").pop();
    // Nếu chưa đăng nhập mà không phải ở trang login thì chuyển về login
    if (!user && fileName !== 'login.html' && fileName !== "") {
        window.location.href = 'login.html';
    }
}

function login(username, password) {
    // Admin mặc định
    if (username === 'trieutamshop' && password === 'trieutam123123@') {
        localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'admin', name: 'Admin' }));
        window.location.href = 'admin.html';
        return;
    }
    // Kiểm tra khách hàng từ Firebase
    db.ref('users/' + username).once('value', (snapshot) => {
        const u = snapshot.val();
        if (u && u.password === password) {
            localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'customer', name: username }));
            window.location.href = 'index.html';
        } else { 
            alert("Sai tài khoản hoặc mật khẩu!"); 
        }
    });
}

function logout() {
    localStorage.removeItem(CURRENT_USER);
    window.location.href = 'login.html';
}

// --- 3. QUẢN LÝ SẢN PHẨM (ĐỒNG BỘ REALTIME) ---
function renderHomeProducts() {
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;

    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const products = data ? Object.values(data) : [];
        
        if (products.length === 0) {
            grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Chưa có sản phẩm nào.</p>";
            return;
        }

        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.img}" alt="${p.name}">
                <p style="font-size:10px; color:#999; margin: 5px 0;">CODE: ${p.id}</p>
                <h3>${p.name}</h3>
                <p class="price">${p.price}</p>
                <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold">ĐẶT HÀNG</a>
            </div>`).join('');
    });
}

function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const file = document.getElementById('p-img-file').files[0];

    if(!id || !name || !file) {
        alert("Vui lòng nhập đầy đủ: Mã, Tên và Ảnh sản phẩm!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const productData = {
            id: id,
            name: name,
            price: price,
            img: e.target.result // Chuyển ảnh thành chuỗi base64 để lưu nhanh
        };

        db.ref('products/' + id).set(productData)
          .then(() => { 
              alert("Đã đồng bộ sản phẩm mới lên iPhone/Android!"); 
              // Xóa form sau khi thêm
              document.getElementById('p-id').value = "";
              document.getElementById('p-name').value = "";
              document.getElementById('p-price').value = "";
              document.getElementById('p-img-file').value = "";
          })
          .catch(error => alert("Lỗi khi thêm: " + error.message));
    };
    reader.readAsDataURL(file);
}

// --- 4. QUẢN LÝ ĐƠN HÀNG ---
function loadAdminOrders() {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;

    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        const orders = data ? Object.values(data).reverse() : [];
        
        if (orders.length === 0) {
            container.innerHTML = "<p style='text-align:center;'>Chưa có đơn hàng nào.</p>";
            return;
        }

        container.innerHTML = `
            <table border="1" style="width:100%; border-collapse: collapse; margin-top:20px;">
                <thead style="background:#f4f4f4;">
                    <tr>
                        <th>Khách</th><th>Hộ KD</th><th>Mã SP</th><th>Size</th><th>SL</th><th>Trạng thái</th><th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(o => `
                        <tr>
                            <td>${o.customerName}</td>
                            <td>${o.biz}</td>
                            <td>${o.pid}</td>
                            <td>${o.psize}</td>
                            <td>${o.pqty}</td>
                            <td style="color:${o.status === 'Đã giao' ? 'green' : 'orange'}; font-weight:bold;">${o.status}</td>
                            <td>
                                ${o.status !== 'Đã giao' ? `<button onclick="shipOrder('${o.orderUniqueId}')">Giao</button>` : '✅'}
                                <button onclick="deleteOrder('${o.orderUniqueId}')" style="background:red; color:white;">Xóa</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    });
}

function shipOrder(orderId) {
    db.ref('orders/' + orderId).update({ status: "Đã giao" });
}

function deleteOrder(orderId) {
    if(confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
        db.ref('orders/' + orderId).remove();
    }
}

function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(user && pass) {
        db.ref('users/' + user).set({ username: user, password: pass })
          .then(() => {
              alert("Đã tạo tài khoản cho khách: " + user);
              document.getElementById('new-user').value = "";
              document.getElementById('new-pass').value = "";
          });
    } else {
        alert("Vui lòng nhập đủ Tên TK và Mật khẩu!");
    }
}

// --- 5. KHỞI CHẠY ---
window.onload = function() {
    checkLogin();
    if (document.getElementById('home-product-grid')) renderHomeProducts();
    if (document.getElementById('admin-orders-container')) loadAdminOrders();
};
