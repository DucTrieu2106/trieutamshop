// 1. Cấu hình Firebase đồng bộ với dự án Trieu Tam Shop của bạn
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

// Khởi tạo Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const CURRENT_USER = "artist_current_session";

// --- QUẢN LÝ SẢN PHẨM ---
function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const file = document.getElementById('p-img-file').files[0];

    if(!id || !name || !file) return alert("Vui lòng nhập đủ Mã SP, Tên và chọn Ảnh!");

    const reader = new FileReader();
    reader.onload = function(e) {
        db.ref('products/' + id).set({
            id: id,
            name: name,
            price: price,
            img: e.target.result
        }).then(() => {
            alert("Đã cập nhật sản phẩm " + id + " thành công!");
            location.reload();
        }).catch(err => alert("Lỗi: " + err.message));
    };
    reader.readAsDataURL(file);
}

function renderHomeProducts() {
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;
    db.ref('products').on('value', (snapshot) => {
        const products = snapshot.val() ? Object.values(snapshot.val()) : [];
        grid.innerHTML = products.length === 0 ? 
            "<p style='grid-column:1/-1; text-align:center;'>Chưa có sản phẩm nào.</p>" : 
            products.map(p => `
            <div class="product-card">
                <img src="${p.img}" style="width:100%">
                <p style="font-size:10px; color:#999; margin-top:10px;">CODE: ${p.id}</p>
                <h3>${p.name}</h3>
                <p class="price" style="font-weight:bold; color:#d4af37;">${p.price}</p>
                <a href="product.html?id=${encodeURIComponent(p.id)}" class="btn-gold" style="display:block; text-align:center; background:#111; color:#fff; padding:10px; text-decoration:none;">ĐẶT HÀNG</a>
            </div>`).join('');
    });
}

// --- QUẢN LÝ ĐƠN HÀNG & TÀI KHOẢN ---
function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(user && pass) {
        db.ref('users/' + user).set({ username: user, password: pass })
          .then(() => alert("Đã tạo tài khoản khách: " + user));
    }
}

function loadInventory() {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        const products = data ? Object.values(data) : [];
        list.innerHTML = products.map(p => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                <span>${p.id}</span>
                <button onclick="if(confirm('Xóa?')) db.ref('products/${p.id}').remove()" style="color:red; border:none; background:none; cursor:pointer;">Xóa</button>
            </div>`).join('');
    });
}

function checkLogin() {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER));
    const path = window.location.pathname;
    const fileName = path.split("/").pop();
    if (!user && fileName !== 'login.html' && fileName !== "") {
        window.location.href = 'login.html';
    }
}

window.onload = function() {
    checkLogin();
    if (document.getElementById('home-product-grid')) renderHomeProducts();
    if (document.getElementById('inventory-list')) loadInventory();
};
