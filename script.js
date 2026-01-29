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
    if (!user && fileName !== 'login.html' && fileName !== "") {
        window.location.href = 'login.html';
    }
}

function login(username, password) {
    if (username === 'trieutamshop' && password === 'trieutam123123@') {
        localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'admin', name: 'Admin' }));
        window.location.href = 'admin.html';
        return;
    }
    db.ref('users/' + username).once('value', (snapshot) => {
        const u = snapshot.val();
        if (u && u.password === password) {
            localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'customer', name: username }));
            window.location.href = 'index.html';
        } else { alert("Sai tài khoản hoặc mật khẩu!"); }
    });
}

function logout() {
    localStorage.removeItem(CURRENT_USER);
    window.location.href = 'login.html';
}

// --- 3. QUẢN LÝ SẢN PHẨM (REALTIME) ---
function renderHomeProducts() {
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;
    
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const products = data ? Object.values(data) : [];
        grid.innerHTML = products.length === 0 ? 
            "<p style='grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;'>Chưa có sản phẩm.</p>" : 
            products.map(p => `
            <div class="product-card">
                <img src="${p.img}" style="width:100%; border-radius:4px;">
                <p style="font-size:10px; color:#999; margin-top:10px;">CODE: ${p.id}</p>
                <h3 style="font-size:14px; margin:5px 0;">${p.name}</h3>
                <p class="price" style="font-weight:bold; color:#d4af37;">${p.price}</p>
                <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold" style="display:block; text-align:center; background:#111; color:#fff; padding:8px; text-decoration:none; font-size:12px; margin-top:10px;">ĐẶT HÀNG</a>
            </div>`).join('');
    });
}

function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const file = document.getElementById('p-img-file').files[0];

    if(!id || !name || !file) return alert("Vui lòng nhập đủ Mã SP, Tên và Ảnh!");

    const reader = new FileReader();
    reader.onload = function(e) {
        db.ref('products/' + id).set({ id, name, price, img: e.target.result })
          .then(() => { 
              alert("Đã cập nhật sản phẩm " + id + " thành công!"); 
              location.reload(); 
          })
          .catch(err => alert("Lỗi hệ thống: " + err.message));
    };
    reader.readAsDataURL(file);
}

// --- 4. QUẢN LÝ ĐƠN HÀNG & KHO ---
function loadAdminOrders() {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        const orders = data ? Object.values(data).reverse() : [];
        if (orders.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>Chưa có đơn hàng nào.</p>";
            return;
        }
        container.innerHTML = `<table>
            <thead><tr><th>KHÁCH</th><th>HỘ KD</th><th>MÃ</th><th>SIZE</th><th>SL</th><th>TRẠNG THÁI</th><th>HĐ</th></tr></thead>
            <tbody>${orders.map(o => `<tr>
                <td>${o.customerName}</td><td>${o.biz}</td><td>${o.pid}</td>
                <td>${o.psize}</td><td>${o.pqty}</td>
                <td style="color:${o.status==='Đã giao'?'#27ae60':'#d4af37'}"><strong>${o.status}</strong></td>
                <td>
                    ${o.status !== 'Đã giao' ? `<button onclick="shipOrder('${o.orderUniqueId}')" style="background:#111; color:#fff;">Giao</button>` : '✅'}
                    <button onclick="deleteOrder('${o.orderUniqueId}')" style="background:#e74c3c; color:white;">Xóa</button>
                </td>
            </tr>`).join('')}</tbody></table>`;
    });
}

function shipOrder(id) { db.ref('orders/' + id).update({ status: "Đã giao" }); }
function deleteOrder(id) { if(confirm("Xóa đơn hàng này?")) db.ref('orders/' + id).remove(); }

function loadInventory() {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const products = data ? Object.values(data) : [];
        list.innerHTML = products.map(p => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; align-items:center;">
                <span style="font-size:13px; font-weight:bold;">${p.id}</span>
                <button onclick="if(confirm('Xóa sản phẩm này?')) db.ref('products/${p.id}').remove()" style="color:#e74c3c; border:none; background:none; cursor:pointer; font-size:12px;">Xóa</button>
            </div>`).join('');
    });
}

function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(user && pass) {
        db.ref('users/' + user).set({ username: user, password: pass }).then(() => {
            alert("Đã tạo tài khoản khách: " + user);
            document.getElementById('new-user').value = "";
            document.getElementById('new-pass').value = "";
        });
    } else {
        alert("Vui lòng nhập đủ Tên đăng nhập và Mật khẩu!");
    }
}

// --- 5. KHỞI CHẠY ---
window.onload = function() {
    checkLogin();
    if (document.getElementById('home-product-grid')) renderHomeProducts();
    if (document.getElementById('admin-orders-container')) loadAdminOrders();
    if (document.getElementById('inventory-list')) loadInventory();
};
