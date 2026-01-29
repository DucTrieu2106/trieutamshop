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
firebase.initializeApp(firebaseConfig);
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
        grid.innerHTML = products.length === 0 ? "<p>Chưa có sản phẩm.</p>" : products.map(p => `
            <div class="product-card">
                <img src="${p.img}">
                <p style="font-size:10px; color:#999;">CODE: ${p.id}</p>
                <h3>${p.name}</h3>
                <p class="price">${p.price}</p>
                <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold">ĐẶT HÀNG</a>
            </div>`).join('');
    });
}

function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const file = document.getElementById('p-img-file').files[0];
    if(!id || !name || !file) return alert("Nhập đủ thông tin!");

    const reader = new FileReader();
    reader.onload = function(e) {
        db.ref('products/' + id).set({ id, name, price, img: e.target.result })
          .then(() => { alert("Đã đồng bộ lên iPhone/Android!"); location.reload(); });
    };
    reader.readAsDataURL(file);
}

// --- 4. ĐẶT HÀNG & QUẢN LÝ ĐƠN ---
function handleOrder() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const biz = document.getElementById('biz-name').value.trim();
    const pId = document.getElementById('display-id').innerText;
    if (!biz) return alert("Vui lòng nhập tên hộ kinh doanh!");

    const orderId = Date.now();
    const d = new Date();
    const orderData = {
        orderUniqueId: orderId,
        customerName: user.name,
        date: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
        time: `${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`,
        biz: biz, pid: pId,
        psize: document.getElementById('selected-size').value,
        pqty: document.getElementById('selected-qty').value,
        status: "Chờ duyệt"
    };

    db.ref('orders/' + orderId).set(orderData).then(() => {
        alert("Đặt hàng thành công!");
        window.location.href = 'index.html';
    });
}

function loadAdminOrders() {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        const orders = data ? Object.values(data).reverse() : [];
        container.innerHTML = `<table>
            <thead><tr><th>KHÁCH</th><th>HỘ KD</th><th>MÃ</th><th>SIZE</th><th>SL</th><th>TRẠNG THÁI</th><th>HĐ</th></tr></thead>
            <tbody>${orders.map(o => `<tr>
                <td>${o.customerName}</td><td>${o.biz}</td><td>${o.pid}</td>
                <td>${o.psize}</td><td>${o.pqty}</td>
                <td style="color:${o.status==='Đã giao'?'green':'orange'}">${o.status}</td>
                <td>
                    ${o.status !== 'Đã giao' ? `<button onclick="shipOrder(${o.orderUniqueId})">Giao</button>` : '✅'}
                    <button onclick="deleteOrder(${o.orderUniqueId})" style="background:red;color:white">Xóa</button>
                </td>
            </tr>`).join('')}</tbody></table>`;
    });
}

function shipOrder(id) { db.ref('orders/' + id).update({ status: "Đã giao" }); }
function deleteOrder(id) { if(confirm("Xóa đơn?")) db.ref('orders/' + id).remove(); }
function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(user && pass) db.ref('users/' + user).set({ username: user, password: pass }).then(() => alert("Đã tạo xong!"));
}

window.onload = function() {
    checkLogin();
    if (document.getElementById('home-product-grid')) renderHomeProducts();
    if (document.getElementById('admin-orders-container')) loadAdminOrders();
    if (document.getElementById('display-id')) {
        const pId = decodeURIComponent(new URLSearchParams(window.location.search).get('id'));
        db.ref('products/' + pId).once('value', (s) => {
            const p = s.val();
            if(p) {
                document.getElementById('display-id').innerText = p.id;
                let sizeH = "";
                if (p.id.toUpperCase().startsWith("#A")) sizeH = `<option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>`;
                else if (p.id.toUpperCase().startsWith("#Q")) sizeH = `<option value="Size 1">Size 1</option><option value="Size 2">Size 2</option>`;
                document.getElementById('selected-size').innerHTML = sizeH;
            }
        });
    }
};
