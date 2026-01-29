// 1. CẤU HÌNH FIREBASE
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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const SESSION_KEY = "trieu_tam_user_session";

// --- QUẢN LÝ TRUY CẬP ---
function checkLogin() {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    const isLoginPage = window.location.pathname.includes("login.html");
    
    if (!user && !isLoginPage) {
        window.location.href = "login.html";
    }
}

function login(username, password) {
    // Admin mặc định của bạn
    if (username === 'trieutamshop' && password === 'trieutam123123@') {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'admin', name: 'Đức Triệu' }));
        window.location.href = 'admin.html';
        return;
    }
    // Kiểm tra khách từ Firebase
    db.ref('users/' + username).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.password === password) {
            localStorage.setItem(SESSION_KEY, JSON.stringify({ role: 'customer', name: username }));
            window.location.href = 'index.html';
        } else {
            alert("Sai tài khoản hoặc mật khẩu!");
        }
    });
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

// --- QUẢN LÝ SẢN PHẨM ---
function addNewProduct() {
    const id = document.getElementById('p-id').value.trim();
    const name = document.getElementById('p-name').value.trim();
    const price = document.getElementById('p-price').value.trim();
    const file = document.getElementById('p-img-file').files[0];

    if(!id || !name || !file) return alert("Vui lòng nhập đủ thông tin!");

    const reader = new FileReader();
    reader.onload = function(e) {
        db.ref('products/' + id).set({ id, name, price, img: e.target.result })
          .then(() => { alert("Đã cập nhật xong!"); location.reload(); });
    };
    reader.readAsDataURL(file);
}

function renderHomeProducts() {
    const grid = document.getElementById('home-product-grid');
    if (!grid) return;
    db.ref('products').on('value', (snapshot) => {
        const products = snapshot.val() ? Object.values(snapshot.val()) : [];
        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.img}" style="width:100%">
                <p>CODE: ${p.id}</p>
                <h3>${p.name}</h3>
                <p class="price">${p.price}</p>
                <a href="product.html?id=${p.id}" class="btn-gold">ĐẶT HÀNG</a>
            </div>`).join('');
    });
}

function createCustomerAccount() {
    const user = document.getElementById('new-user').value.trim();
    const pass = document.getElementById('new-pass').value.trim();
    if(user && pass) {
        db.ref('users/' + user).set({ username: user, password: pass })
          .then(() => alert("Đã tạo tài khoản cho khách: " + user));
    }
}

// Khởi chạy
checkLogin();
window.onload = function() {
    if (document.getElementById('home-product-grid')) renderHomeProducts();
};
