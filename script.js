const SHEET_URL = "https://script.google.com/macros/s/AKfycbwm_WqrOEPuB8NQK-isp70FbkGWMXRc2g1VC4NwZJUuULBC0IpxmdzJswWWdd3UYEGmKA/exec";
const CURRENT_USER = "trieu_tam_session";

// --- CƠ CHẾ BẮT BUỘC ĐĂNG NHẬP ---
(function() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const isLoginPage = window.location.pathname.includes("login.html");

    // Nếu KHÔNG có user và KHÔNG phải đang ở trang login -> Chuyển về login
    if (!user && !isLoginPage) {
        window.location.replace("login.html");
    }
    
    // Nếu ĐÃ có user mà vẫn cố vào trang login -> Đẩy vào trang chủ
    if (user && isLoginPage) {
        window.location.replace("index.html");
    }
})();

// 2. TÍNH NĂNG TÌM KIẾM & HIỂN THỊ SẢN PHẨM (TRANG CHỦ)
function searchProducts() {
    const kw = document.getElementById('product-search') ? document.getElementById('product-search').value.toLowerCase().trim() : "";
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));

    fetch(`${SHEET_URL}?mode=products`)
        .then(res => res.json())
        .then(products => {
            const filtered = kw === "" ? products : products.filter(p => 
                String(p.id).toLowerCase().includes(kw) || String(p.name).toLowerCase().includes(kw)
            );

            if (filtered.length === 0) {
                grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.5; font-family:'Playfair Display';">KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP</p>`;
                return;
            }

            grid.innerHTML = filtered.map(p => `
                <div class="product-card">
                    <img src="${p.img || 'https://via.placeholder.com/300'}" alt="${p.name}">
                    <p style="font-size:10px; color:#999; margin-top:10px; letter-spacing:2px;">CODE: ${p.id}</p>
                    <h3 style="font-family:'Playfair Display'; margin:10px 0;">${p.name}</h3>
                    <p class="price" style="color:#d4af37; font-weight:bold; font-size:18px;">${p.price}</p>
                    <p style="font-size:11px; opacity:0.6;">Tồn kho: <strong>${p.stock || 0}</strong></p>
                    ${user.role === 'admin' ? 
                        `<button onclick="updateStock('${p.id}')" class="btn-gold" style="font-size:12px; width:100%; margin-top:10px;">SỬA KHO</button>` : 
                        `<a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold" style="display:block; text-align:center; text-decoration:none; padding:12px; background:#111; color:#fff; margin-top:15px; font-weight:bold; letter-spacing:1px;">ĐẶT HÀNG NGAY</a>`
                    }
                </div>`).join('');
        })
        .catch(err => {
            grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:red; padding:20px;">LỖI TẢI DỮ LIỆU: Vui lòng kiểm tra lại Web App URL!</p>`;
        });
}

// 3. CHI TIẾT ĐẶT HÀNG (TRANG PRODUCT.HTML) - TỰ ĐỘNG HIỆN ẢNH & MÃ SP
function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const pId = urlParams.get('id');
    if (!pId) return;

    fetch(`${SHEET_URL}?mode=products`)
        .then(res => res.json())
        .then(products => {
            const p = products.find(item => item.id === pId);
            if (p) {
                document.getElementById('display-id').innerText = p.id;
                if (document.getElementById('display-name')) {
                    document.getElementById('display-name').innerText = p.name;
                }
                const imgElement = document.getElementById('display-img');
                if (imgElement && p.img) {
                    imgElement.src = p.img;
                    imgElement.style.display = "block";
                }
                const sizeSelect = document.getElementById('selected-size');
                if (sizeSelect) {
                    const sizes = ["S", "M", "L", "XL", "2XL"];
                    sizeSelect.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
                }
            }
        });
}

// 4. HIỂN THỊ LỊCH SỬ ĐƠN HÀNG (SỬA LỖI LỆCH CỘT & NHÓM NGÀY DD-MM-YYYY)
function renderOrders() {
    const container = document.getElementById('customer-history');
    if (!container) return;
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const url = user.role === 'admin' ? `${SHEET_URL}?mode=orders` : `${SHEET_URL}?mode=orders&user=${user.name}`;

    fetch(url).then(res => res.json()).then(orders => {
        if (!orders || orders.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="padding:40px; opacity:0.5; text-align:center; letter-spacing:2px;">CHƯA CÓ DỮ LIỆU ĐƠN HÀNG</td></tr>';
            return;
        }

        const sortedOrders = orders.reverse();
        let html = "";
        let currentDay = "";

        sortedOrders.forEach(o => {
            const dateObj = new Date(o.date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const dateStr = `${day}-${month}-${year}`;
            
            // Lấy giờ chính xác từ cột date trong Sheets
            const timeStr = String(dateObj.getHours()).padStart(2, '0') + ":" + String(dateObj.getMinutes()).padStart(2, '0');

            if (dateStr !== currentDay) {
                currentDay = dateStr;
                html += `
                    <tr class="date-group" style="background: #f8f8f8; font-weight: bold; text-align: left;">
                        <td colspan="6" style="padding: 15px; border-left: 4px solid #d4af37; letter-spacing:2px;">📅 NGÀY: ${dateStr}</td>
                    </tr>`;
            }

            html += `
                <tr>
                    <td style="color: #999; padding: 15px;">${timeStr}</td>
                    <td style="font-weight:bold; color:#d4af37;">${o.biz || '---'}</td>
                    <td style="font-weight:600; letter-spacing:1px;">${o.pid}</td>
                    <td><span style="border:1px solid #ddd; padding:3px 10px; font-size:11px;">${o.psize}</span></td>
                    <td>${o.pqty}</td>
                    <td>
                        <span style="color:${o.status === 'Đã duyệt' ? '#27ae60' : '#f39c12'}; font-weight:bold; font-size:11px; letter-spacing:1px;">${o.status.toUpperCase()}</span>
                        ${(user.role === 'admin' && o.status === 'Chờ duyệt') ? 
                            `<button onclick="approveOrder('${o.orderId}')" style="margin-left:10px; background:#27ae60; color:white; border:none; padding:6px 12px; cursor:pointer; border-radius:2px; font-size:10px; font-weight:bold; letter-spacing:1px;">DUYỆT</button>` : ''}
                    </td>
                </tr>`;
        });
        container.innerHTML = html;
    });
}

// 5. XỬ LÝ ĐẶT HÀNG
function handleOrder() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const biz = document.getElementById('biz-name').value.trim();
    const pid = document.getElementById('display-id').innerText;
    if (!biz || pid === "---") return alert("Vui lòng nhập tên Hộ kinh doanh!");

    const orderData = {
        orderId: "DH" + Date.now(),
        customer: user.name,
        biz: biz,
        pid: pid,
        psize: document.getElementById('selected-size').value,
        pqty: document.getElementById('selected-qty').value
    };

    fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(orderData) })
    .then(() => { 
        alert("Đặt hàng thành công! Cảm ơn bạn."); 
        window.location.href = 'index.html'; 
    });
}

// 6. ADMIN: DUYỆT ĐƠN & SỬA KHO
function approveOrder(orderId) {
    if (confirm("Xác nhận duyệt đơn và tự động trừ tồn kho?")) {
        fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "approveOrder", orderId: orderId }) })
        .then(() => {
            alert("Đã duyệt đơn hàng!");
            location.reload();
        });
    }
}

function updateStock(id) {
    const newStock = prompt("Nhập số lượng tồn kho mới cho mã " + id + ":");
    if (newStock !== null && !isNaN(newStock)) {
        fetch(SHEET_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "updateStock", id, newStock }) })
        .then(() => {
            alert("Cập nhật kho thành công!");
            location.reload();
        });
    }
}

// 7. ĐĂNG NHẬP & ĐĂNG XUẤT
function login(u, p) {
    if (u === 'trieutam' && p === 'trieutam123@') {
        localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'admin', name: 'Đức Triệu' }));
        window.location.href = 'index.html';
        return;
    }
    fetch(`${SHEET_URL}?mode=users`).then(res => res.json()).then(users => {
        const found = users.find(item => (item.username == u || item.u == u) && (item.password == p || item.p == p));
        if (found) {
            localStorage.setItem(CURRENT_USER, JSON.stringify({ role: 'customer', name: u }));
            window.location.href = 'index.html';
        } else alert("Tài khoản hoặc mật khẩu không chính xác!");
    });
}

function logout() { 
    if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.clear(); 
        window.location.replace('login.html'); 
    }
}

// 8. KHỞI CHẠY HỆ THỐNG
window.onload = function() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    if (user && document.getElementById('user-display')) {
        document.getElementById('user-display').innerText = "CHÀO " + (user.role === 'admin' ? "SẾP" : user.name.toUpperCase());
    }
    if (document.getElementById('home-product-grid')) searchProducts(); 
    if (document.getElementById('customer-history')) renderOrders();
    if (document.getElementById('display-id')) loadProductDetail();
};