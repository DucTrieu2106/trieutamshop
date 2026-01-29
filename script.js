const PRODUCT_DB = "artist_store_data";
const ORDER_DB = "artist_order_data";
const USER_DB = "artist_user_data";
const CURRENT_USER = "artist_current_session";

// --- 1. BẢO MẬT & ĐĂNG NHẬP ---
function checkLogin() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const path = window.location.pathname;
    const fileName = path.split("/").pop();

    if (!user && fileName !== 'login.html' && fileName !== "") {
        window.location.href = 'login.html';
        return;
    }
    if (user && user.role !== 'admin' && fileName === 'admin.html') {
        window.location.href = 'index.html';
    }
}

function login(username, password) {
    if (username === 'trieutamshop' && password === 'trieutam123123@') {
        localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'admin', name: 'Admin' }));
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
    if(confirm("Bạn muốn đăng xuất?")) {
        localStorage.removeItem(CURRENT_USER);
        window.location.href = 'login.html';
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
            <img src="${p.img}">
            <p style="font-size:10px; color:#999; letter-spacing:2px; margin-top:10px;">CODE: ${p.id}</p>
            <h3>${p.name}</h3>
            <p class="price">${p.price}</p>
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold">ĐẶT HÀNG</a>
        </div>`).join('');
}

function searchProducts() {
    const kw = document.getElementById('product-search').value.toLowerCase().trim();
    const all = JSON.parse(localStorage.getItem(PRODUCT_DB)) || [];
    renderHomeProducts(kw === "" ? all : all.filter(p => p.id.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw)));
}

// --- 3. ĐẶT HÀNG ---
function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    let pId = decodeURIComponent(urlParams.get('id'));
    const p = (JSON.parse(localStorage.getItem(PRODUCT_DB)) || []).find(item => item.id === pId);
    if (p) {
        document.getElementById('display-id').innerText = p.id;
        let sizeH = "";
        const code = p.id.toUpperCase();
        if (code.startsWith("#A")) sizeH = `<option value="L">Size L</option><option value="XL">Size XL</option><option value="XXL">Size XXL</option>`;
        else if (code.startsWith("#Q")) sizeH = `<option value="Size 1">Size 1</option><option value="Size 2">Size 2</option>`;
        else sizeH = `<option value="Free Size">Free Size</option>`;
        document.getElementById('selected-size').innerHTML = sizeH;
    }
}

function handleOrder() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const biz = document.getElementById('biz-name').value.trim();
    if (!biz) return alert("Vui lòng nhập tên hộ kinh doanh!");

    const d = new Date();
    const order = {
        orderUniqueId: Date.now(),
        customerName: user.name,
        date: `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`,
        time: `${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`,
        biz: biz,
        pid: document.getElementById('display-id').innerText,
        psize: document.getElementById('selected-size').value,
        pqty: document.getElementById('selected-qty').value,
        status: "Chờ duyệt"
    };

    let orders = JSON.parse(localStorage.getItem(ORDER_DB)) || [];
    orders.push(order);
    localStorage.setItem(ORDER_DB, JSON.stringify(orders));
    alert("Đặt hàng thành công!");
    window.location.href = 'index.html';
}

// --- 4. ADMIN & LỊCH SỬ ---
function loadAdminOrders() {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;
    let orders = JSON.parse(localStorage.getItem(ORDER_DB)) || [];
    const groups = [...orders].reverse().reduce((acc, o) => { (acc[o.date] = acc[o.date] || []).push(o); return acc; }, {});
    
    let html = "";
    for (const date in groups) {
        const delivered = groups[date].filter(o => o.status === "Đã giao");
        const sum = delivered.reduce((acc, o) => { acc[o.pid] = (acc[o.pid] || 0) + parseInt(o.pqty); return acc; }, {});
        let sumTxt = Object.entries(sum).map(([id, q]) => `${id}: ${q}`).join(' | ') || "0";

        html += `<div class="date-group-header"><span>NGÀY: ${date}</span><span class="summary-tag">GIAO: ${sumTxt}</span></div>
            <table><thead><tr><th>KHÁCH</th><th>HỘ KD</th><th>MÃ</th><th>SIZE</th><th>SL</th><th>TRẠNG THÁI</th><th>HĐ</th></tr></thead>
            <tbody>${groups[date].map(o => `<tr>
                <td>${o.customerName}</td><td>${o.biz}</td><td>${o.pid}</td><td>${o.psize}</td><td>${o.pqty}</td>
                <td style="color:${o.status==='Đã giao'?'#27ae60':'#d4af37'}"><strong>${o.status}</strong></td>
                <td>
                    ${o.status !== 'Đã giao' ? `<button onclick="shipOrder(${o.orderUniqueId})">Giao</button>` : '✅'}
                    <button onclick="deleteOrder(${o.orderUniqueId})" style="background:red;color:white">Xóa</button>
                </td>
            </tr>`).join('')}</tbody></table>`;
    }
    container.innerHTML = html;
}

function loadCustomerHistory() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const container = document.getElementById('customer-history');
    if (!container || !user) return;
    let orders = JSON.parse(localStorage.getItem(ORDER_DB)) || [];
    let myOrders = orders.filter(o => o.customerName === user.name).reverse();
    container.innerHTML = myOrders.map(o => `<tr><td>${o.time} - ${o.date}</td><td>${o.pid}</td><td>${o.psize}</td><td>${o.pqty}</td><td style="color:${o.status==='Đã giao'?'green':'orange'}">${o.status}</td></tr>`).join('');
}

function shipOrder(id) {
    let orders = JSON.parse(localStorage.getItem(ORDER_DB));
    orders[orders.findIndex(o => o.orderUniqueId === id)].status = "Đã giao";
    localStorage.setItem(ORDER_DB, JSON.stringify(orders));
    loadAdminOrders();
}

function deleteOrder(id) {
    if(confirm("Xóa đơn?")) {
        let orders = JSON.parse(localStorage.getItem(ORDER_DB));
        localStorage.setItem(ORDER_DB, JSON.stringify(orders.filter(o => o.orderUniqueId !== id)));
        loadAdminOrders();
    }
}

function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value;
    const file = document.getElementById('p-img-file').files[0];
    if(!id || !name || !file) return alert("Nhập đủ thông tin!");
    const reader = new FileReader();
    reader.onload = function(e) {
        let products = JSON.parse(localStorage.getItem(PRODUCT_DB)) || [];
        products.push({ id, name, price: document.getElementById('p-price').value, img: e.target.result });
        localStorage.setItem(PRODUCT_DB, JSON.stringify(products));
        alert("Cập nhật sản phẩm thành công!");
        location.reload();
    };
    reader.readAsDataURL(file);
}

function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(!user || !pass) return alert("Nhập đủ!");
    let users = JSON.parse(localStorage.getItem(USER_DB)) || [];
    users.push({ username: user, password: pass });
    localStorage.setItem(USER_DB, JSON.stringify(users));
    alert("Đã tạo TK: " + user);
}

function deleteProduct(id) {
    if(confirm("Xóa SP?")) {
        let products = JSON.parse(localStorage.getItem(PRODUCT_DB));
        localStorage.setItem(PRODUCT_DB, JSON.stringify(products.filter(p => p.id !== id)));
        location.reload();
    }
}

window.onload = function() {
    checkLogin();
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    if (user && document.getElementById('user-display')) document.getElementById('user-display').innerText = "Chào, " + user.name;
    if (document.getElementById('home-product-grid')) renderHomeProducts();
    if (document.getElementById('admin-orders-container')) loadAdminOrders();
    if (document.getElementById('customer-history')) loadCustomerHistory();
    if (document.getElementById('display-id')) loadProductDetail();
    if (document.getElementById('inventory-list')) {
        let products = JSON.parse(localStorage.getItem(PRODUCT_DB)) || [];
        document.getElementById('inventory-list').innerHTML = products.map(p => `<div style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #eee;"><span>${p.id}</span><button onclick="deleteProduct('${p.id}')">Xóa</button></div>`).join('');
    }
};