// --- CẤU HÌNH DATABASE ---
const PRODUCT_DB = "artist_store_data";
const ORDER_DB = "artist_order_data";
const USER_DB = "artist_user_data";
const CURRENT_USER = "artist_current_session";

// --- 1. BẢO MẬT & ĐIỀU HƯỚNG ---
function checkLogin() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const path = window.location.pathname;
    const fileName = path.split("/").pop();

    // Nếu chưa đăng nhập: Phải về login.html
    if (!user) {
        if (fileName !== 'login.html' && fileName !== "") {
            window.location.href = 'login.html';
            return;
        }
    } 
    // Nếu đã đăng nhập: Chặn vào lại login hoặc vào admin trái phép
    else {
        if (fileName === 'login.html') {
            window.location.href = (user.role === 'admin') ? 'admin.html' : 'index.html';
            return;
        }
        if (user.role !== 'admin' && fileName === 'admin.html') {
            window.location.href = 'index.html';
        }
    }
}

// Chạy kiểm tra đăng nhập ngay khi file script được nạp
checkLogin();

function login(username, password) {
    if (username === 'trieutamshop' && password === 'trieutam123123@') {
        localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'admin', name: 'Đức Triệu' }));
        window.location.href = 'admin.html';
        return;
    }

    let users = JSON.parse(localStorage.getItem(USER_DB)) || [];
    let customer = users.find(u => u.username === username && u.password === password);
    
    if (customer) {
        localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'customer', name: username }));
        window.location.href = 'index.html';
    } else {
        alert("Sai tài khoản hoặc mật khẩu!");
    }
}

function logout() {
    if(confirm("Bạn muốn đăng xuất khỏi hệ thống?")) {
        localStorage.removeItem(CURRENT_USER);
        window.location.href = 'login.html';
    }
}

function displayAdminButton() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const area = document.getElementById('admin-btn-area');
    if (user && user.role === 'admin' && area) {
        area.innerHTML = `
            <a href="admin.html" style="background: #d4af37; color: black; padding: 5px 12px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 15px; font-size: 11px;">QUẢN TRỊ</a>
        `;
    }
}

// --- 2. QUẢN LÝ SẢN PHẨM ---
function renderHomeProducts(filterData = null) {
    const grid = document.getElementById('home-product-grid');
    if(!grid) return;
    let products = filterData || JSON.parse(localStorage.getItem(PRODUCT_DB)) || [];
    
    if(products.length === 0) {
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;'>Chưa có sản phẩm nào.</p>";
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.img}" style="width:100%; border-radius:4px; aspect-ratio: 1 / 1; object-fit: cover;">
            <p style="font-size:10px; color:#999; letter-spacing:2px; margin-top:10px;">CODE: ${p.id}</p>
            <h3>${p.name}</h3>
            <p class="price" style="font-weight:bold; color:#d4af37;">${p.price}</p>
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold">ĐẶT HÀNG</a>
        </div>`).join('');
}

function searchProducts() {
    const kw = document.getElementById('product-search').value.toLowerCase().trim();
    const all = JSON.parse(localStorage.getItem(PRODUCT_DB)) || [];
    renderHomeProducts(kw === "" ? all : all.filter(p => p.id.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw)));
}

// --- 3. KHỞI CHẠY (WINDOW.ONLOAD) ---
window.onload = function() {
    displayAdminButton(); 
    
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    if (user && document.getElementById('user-display')) {
        document.getElementById('user-display').innerText = "Chào, " + user.name;
    }
    
    if (document.getElementById('home-product-grid')) renderHomeProducts();
    
    // Load lịch sử khách hàng
    const historyContainer = document.getElementById('customer-history');
    if (historyContainer && user) {
        let orders = JSON.parse(localStorage.getItem(ORDER_DB)) || [];
        let myOrders = orders.filter(o => o.customerName === user.name).reverse();
        historyContainer.innerHTML = myOrders.map(o => `
            <tr>
                <td style="padding:10px; border-bottom:1px solid #eee;">${o.time} - ${o.date}</td>
                <td>${o.pid}</td>
                <td>${o.psize}</td>
                <td>${o.pqty}</td>
                <td style="color:${o.status==='Đã giao'?'green':'orange'}">${o.status}</td>
            </tr>`).join('');
    }
};