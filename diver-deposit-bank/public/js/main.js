import { createClient } from '@supabase/supabase-js';
import i18next from 'i18next';
import { jsPDF } from 'jspdf';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dodijnhzghlpgmdddklr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGlqbmh6Z2hscGdtZGRka2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTE3MTksImV4cCI6MjA2OTAyNzcxOX0.soz1ofVIZ3NeWkcE1yUCIylFiVry5nwvc9PvHn7TZQQ';
const supabase = createClient(supabaseUrl, supabaseKey);

i18next.init({
    lng: 'en',
    resources: { /* [Existing translations] */ }
}).then(() => {
    document.getElementById('language-select')?.addEventListener('change', (e) => {
        i18next.changeLanguage(e.target.value);
        updateUI();
    });
    updateUI();
});

function updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(elem => elem.textContent = i18next.t(elem.dataset.i18n));
    document.querySelectorAll('input[data-i18n-placeholder], button[data-i18n-placeholder]').forEach(elem => elem.placeholder = i18next.t(elem.dataset.i18nPlaceholder));
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { username: document.getElementById('username').value, password: document.getElementById('password').value, security_code: document.getElementById('security-code').value, favorite_food: document.getElementById('favorite-food').value };
    document.getElementById('loading').classList.remove('hidden');
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    document.getElementById('loading').classList.add('hidden');
    const result = await response.json();
    if (result.error) {
        document.getElementById('error').classList.remove('hidden');
        setTimeout(() => document.getElementById('error').classList.add('hidden'), 3000);
    } else {
        document.getElementById('success').classList.remove('hidden');
        setTimeout(() => window.location.href = result.role === 'admin' ? `/admin.html?admin_id=${result.id}` : `/dashboard.html?id=${result.id}`, 1000);
    }
});

async function loadDashboard(userId) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    document.getElementById('username').textContent = data.username;
    document.getElementById('account-number').textContent = data.account_number;
    document.getElementById('balance').textContent = `$${data.balance.toFixed(2)}`;
    document.getElementById('card-last4').textContent = data.account_number.slice(-4);
    const { data: broker } = await supabase.from('brokers').select('*').eq('user_id', userId).maybeSingle();
    if (broker) {
        document.getElementById('broker-name').textContent = broker.name;
        document.getElementById('broker-balance').textContent = `$${broker.balance.toFixed(2)}`;
    }
    const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId);
    document.getElementById('transaction-list').innerHTML = transactions.map(tx => `<li>${tx.date}: ${tx.type} - $${tx.amount.toFixed(2)} - ${tx.description}</li>`).join('');
    const cryptoData = [{ name: 'Bitcoin', price: 65000.00 }, { name: 'Ethereum', price: 3200.00 }];
    document.getElementById('crypto-table').innerHTML = cryptoData.map(crypto => `
        <tr><td>${crypto.name}</td><td>$${crypto.price.toFixed(2)}</td><td><button onclick="simulateCryptoTrade('buy', '${crypto.name}')" data-i18n="buy">Buy</button><button onclick="simulateCryptoTrade('sell', '${crypto.name}')" data-i18n="sell">Sell</button></td></tr>`).join('');
}

async function simulateAction(type) {
    const userId = new URLSearchParams(window.location.search).get('id');
    const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, type, amount: 100, description: `${type} test` })
    });
    const result = await response.json();
    alert(result.message || `${type.charAt(0).toUpperCase() + type.slice(1)} successful!`);
    showNotification(`${type} completed`);
    loadDashboard(userId);
}
async function simulateCryptoTrade(action, crypto) {
    const userId = new URLSearchParams(window.location.search).get('id');
    const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, type: `${action}_${crypto.toLowerCase()}`, amount: 0.1, description: `${action} ${crypto}` })
    });
    const result = await response.json();
    alert(result.message || `${action.charAt(0).toUpperCase() + action.slice(1)} ${crypto} successful!`);
    showNotification(`${action} ${crypto} completed`);
    loadDashboard(userId);
}
async function simulateLoan() {
    const userId = new URLSearchParams(window.location.search).get('id');
    const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, type: 'loan', amount: 5000, description: 'Loan application' })
    });
    const result = await response.json();
    alert(result.message || 'Loan application submitted!');
    showNotification('Loan application submitted');
    loadDashboard(userId);
}
function downloadStatement() {
    const doc = new jsPDF();
    doc.text('Diver Deposit Bank Statement', 10, 10);
    doc.text(`Account Number: ${document.getElementById('account-number').textContent}`, 10, 20);
    doc.text(`Balance: ${document.getElementById('balance').textContent}`, 10, 30);
    doc.text('Transactions:', 10, 40);
    const transactions = document.getElementById('transaction-list').innerHTML.split('<li>').slice(1);
    transactions.forEach((tx, i) => doc.text(tx.replace('</li>', ''), 10, 50 + i * 10));
    doc.save('statement.pdf');
}
function sendChatMessage() {
    const messageInput = document.getElementById('support-message');
    if (!messageInput.value) return;
    const chatMessages = document.getElementById('chat-messages');
    const timestamp = new Date().toLocaleTimeString();
    chatMessages.innerHTML += `<div class="chat-message user">${messageInput.value} <small>${timestamp}</small></div>`;
    messageInput.value = '';
    setTimeout(() => {
        chatMessages.innerHTML += `<div class="chat-message bot">Thank you! Our 24/7 team will respond shortly. <small>${timestamp}</small></div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        showNotification('New support message');
    }, 1000);
}
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
document.getElementById('dark-mode-toggle')?.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
document.getElementById('create-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUser = { admin_id: new URLSearchParams(window.location.search).get('admin_id'), username: document.getElementById('new-username').value, password: document.getElementById('new-password').value, security_code: document.getElementById('new-security-code').value, favorite_food: document.getElementById('new-favorite-food').value, balance: parseFloat(document.getElementById('new-balance').value) };
    const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    const result = await response.json();
    alert(result.message);
    loadUsers();
});
async function loadUsers() {
    const adminId = new URLSearchParams(window.location.search).get('admin_id');
    const response = await fetch(`/api/admin/users?admin_id=${adminId}`);
    const users = await response.json();
    document.getElementById('user-list').innerHTML = users.map(user => `<li>${user.username} - ${user.account_number} - $${user.balance.toFixed(2)} <button onclick="editUser('${user.id}')">Edit</button><button onclick="deleteUser('${user.id}')">Delete</button><button onclick="freezeUser('${user.id}', '${user.status}')">${user.status === 'active' ? 'Freeze' : 'Unfreeze'}</button></li>`).join('');
}
async function editUser(userId) { /* [Existing editUser code] */ }
async function deleteUser(userId) { /* [Existing deleteUser code] */ }
async function freezeUser(userId, currentStatus) { /* [Existing freezeUser code] */ }
document.getElementById('assign-broker-form')?.addEventListener('submit', async (e) => { /* [Existing assign-broker code] */ });
document.getElementById('edit-broker-form')?.addEventListener('submit', async (e) => { /* [Existing edit-broker code] */ });
document.getElementById('delete-broker-form')?.addEventListener('submit', async (e) => { /* [Existing delete-broker code] */ });
if (window.location.pathname.includes('dashboard.html')) loadDashboard(new URLSearchParams(window.location.search).get('id'));
else if (window.location.pathname.includes('admin.html')) loadUsers();                invalid: 'Credenciales inválidas',
                balance: 'Saldo',
                account_number: 'Número de cuenta',
                deposit: 'Depósito',
                withdraw: 'Retiro',
                transfer: 'Transferencia',
                statement: 'Descargar estado de cuenta',
                support: 'Soporte al cliente',
                support_placeholder: 'Deja tu queja, nuestro equipo de soporte responderá inmediatamente',
                loan: 'Solicitar un préstamo',
                apply: 'Solicitar',
                broker: 'Corredor de inversiones',
                crypto: 'Comercio de criptomonedas',
                buy: 'Comprar',
                sell: 'Vender',
                create: 'Crear usuario',
                add: 'Agregar transacción',
                assign: 'Asignar corredor',
                update: 'Actualizar corredor',
                delete: 'Eliminar corredor',
                language: 'Seleccionar idioma'
            }
        },
        ko: {
            translation: {
                welcome: 'Diver Deposit Bank에 오신 것을 환영합니다',
                since: '1998년부터 고객을 섬기고 있습니다',
                login: '로그인',
                username: '사용자 이름',
                password: '비밀번호',
                security_code: '보안 코드는 무엇입니까?',
                favorite_food: '좋아하는 음식은 무엇입니까?',
                support_contact: '24/7 고객 지원팀에 문의하세요',
                invalid: '잘못된 자격 증명',
                balance: '잔액',
                account_number: '계좌 번호',
                deposit: '입금',
                withdraw: '출금',
                transfer: '이체',
                statement: '명세서 다운로드',
                support: '고객 지원',
                support_placeholder: '불만 사항을 남겨주세요, 지원팀이 즉시 응답합니다',
                loan: '대출 신청',
                apply: '신청',
                broker: '투자 브로커',
                crypto: '암호화폐 거래',
                buy: '구매',
                sell: '판매',
                create: '사용자 생성',
                add: '거래 추가',
                assign: '브로커 지정',
                update: '브로커 업데이트',
                delete: '브로커 삭제',
                language: '언어 선택'
            }
        },
        zh: {
            translation: {
                welcome: '欢迎体验Diver Deposit Bank',
                since: '自1998年以来为客户服务',
                login: '登录',
                username: '用户名',
                password: '密码',
                security_code: '您的安全代码是什么？',
                favorite_food: '您最喜欢的食物是什么？',
                support_contact: '联系我们的24/7客户支持团队',
                invalid: '无效凭据',
                balance: '余额',
                account_number: '账户号码',
                deposit: '存款',
                withdraw: '取款',
                transfer: '转账',
                statement: '下载对账单',
                support: '客户支持',
                support_placeholder: '留下您的投诉，我们的支持团队将立即回应',
                loan: '申请贷款',
                apply: '申请',
                broker: '投资经纪人',
                crypto: '加密货币交易',
                buy: '购买',
                sell: '出售',
                create: '创建用户',
                add: '添加交易',
                assign: '分配经纪人',
                update: '更新经纪人',
                delete: '删除经纪人',
                language: '选择语言'
            }
        }
    }
}).then(() => {
    document.getElementById('language-select')?.addEventListener('change', (e) => {
        i18next.changeLanguage(e.target.value);
        updateUI();
    });
    updateUI();
});

// Update UI with translations
function updateUI() {
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        elem.textContent = i18next.t(elem.dataset.i18n);
    });
    document.querySelectorAll('input[data-i18n-placeholder], button[data-i18n-placeholder]').forEach(elem => {
        elem.placeholder = i18next.t(elem.dataset.i18nPlaceholder);
    });
}

// Login handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const securityCode = document.getElementById('security-code').value;
    const favoriteFood = document.getElementById('favorite-food').value;
    
    document.getElementById('loading').classList.remove('hidden');
    
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, security_code: securityCode, favorite_food: favoriteFood })
    });
    
    document.getElementById('loading').classList.add('hidden');
    const result = await response.json();
    
    if (result.error) {
        document.getElementById('error').classList.remove('hidden');
        setTimeout(() => document.getElementById('error').classList.add('hidden'), 3000);
    } else {
        document.getElementById('success').classList.remove('hidden');
        setTimeout(() => {
            if (result.role === 'admin') {
                window.location.href = `/admin.html?admin_id=${result.id}`;
            } else {
                window.location.href = `/dashboard.html?id=${result.id}`;
            }
        }, 1000);
    }
});

// Load dashboard data
async function loadDashboard(userId) {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    
    document.getElementById('username').textContent = data.user.username;
    document.getElementById('account-number').textContent = data.user.account_number;
    document.getElementById('balance').textContent = data.user.balance.toFixed(2);
    document.getElementById('card-last4').textContent = data.user.account_number.slice(-4);
    
    if (data.broker) {
        document.getElementById('broker-name').textContent = data.broker.name;
        document.getElementById('broker-balance').textContent = data.broker.balance.toFixed(2);
    }
    
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = data.transactions.map(tx => `
        <li>${tx.date}: ${tx.type} - ${tx.amount.toFixed(2)} - ${tx.description}</li>
    `).join('');

    // Mock crypto data
    const cryptoData = [
        { name: 'Bitcoin', price: 65000.00 },
        { name: 'Ethereum', price: 3200.00 }
    ];
    const cryptoTable = document.getElementById('crypto-table');
    cryptoTable.innerHTML = cryptoData.map(crypto => `
        <tr>
            <td>${crypto.name}</td>
            <td>${crypto.price.toFixed(2)}</td>
            <td>
                <button onclick="simulateCryptoTrade('buy', '${crypto.name}')" data-i18n="buy">Buy</button>
                <button onclick="simulateCryptoTrade('sell', '${crypto.name}')" data-i18n="sell">Sell</button>
            </td>
        </tr>
    `).join('');
}

// Simulate banking actions
function simulateAction(type) {
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} successful!`);
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} completed`);
}

// Simulate crypto trading
function simulateCryptoTrade(action, crypto) {
    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} ${crypto} successful!`);
    showNotification(`${action.charAt(0).toUpperCase() + action.slice(1)} ${crypto} completed`);
}

// Simulate loan application
function simulateLoan() {
    alert('Loan application submitted!');
    showNotification('Loan application submitted');
}

// Download statement
function downloadStatement() {
    const doc = new jsPDF();
    doc.text('Diver Deposit Bank Statement', 10, 10);
    doc.text('Account Number: ' + document.getElementById('account-number').textContent, 10, 20);
    doc.text('Balance: ' + document.getElementById('balance').textContent, 10, 30);
    doc.text('Transactions:', 10, 40);
    const transactions = document.getElementById('transaction-list').innerHTML.split('<li>').slice(1);
    transactions.forEach((tx, i) => {
        doc.text(tx.replace('</li>', ''), 10, 50 + i * 10);
    });
    doc.save('statement.pdf');
}

// Mock live chat
function sendChatMessage() {
    const messageInput = document.getElementById('support-message');
    const message = messageInput.value;
    if (!message) return;
    
    const chatMessages = document.getElementById('chat-messages');
    const timestamp = new Date().toLocaleTimeString();
    chatMessages.innerHTML += `
        <div class="chat-message user">${message} <small>${timestamp}</small></div>
    `;
    messageInput.value = '';
    
    // Simulate bot response
    setTimeout(() => {
        chatMessages.innerHTML += `
            <div class="chat-message bot">Thank you for your message! Our 24/7 customer support team will respond shortly. <small>${timestamp}</small></div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        showNotification('New support message received');
    }, 1000);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Dark mode toggle
document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

// Admin panel: Create user
document.getElementById('create-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUser = {
        admin_id: new URLSearchParams(window.location.search).get('admin_id'),
        username: document.getElementById('new-username').value,
        password: document.getElementById('new-password').value,
        security_code: document.getElementById('new-security-code').value,
        favorite_food: document.getElementById('new-favorite-food').value,
        balance: parseFloat(document.getElementById('new-balance').value)
    };
    
    const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });
    
    const result = await response.json();
    alert(result.message);
    loadUsers();
});

// Admin panel: Load users
async function loadUsers() {
    const adminId = new URLSearchParams(window.location.search).get('admin_id');
    const response = await fetch(`/api/admin/users?admin_id=${adminId}`);
    const users = await response.json();
    const userList = document.getElementById('user-list');
    userList.innerHTML = users.map(user => `
        <li>
            ${user.username} - ${user.account_number} - ${user.balance.toFixed(2)}
            <button onclick="editUser('${user.id}')">Edit</button>
            <button onclick="deleteUser('${user.id}')">Delete</button>
            <button onclick="freezeUser('${user.id}', '${user.status}')">${user.status === 'active' ? 'Freeze' : 'Unfreeze'}</button>
        </li>
    `).join('');
}

// Admin panel: Edit user
async function editUser(userId) {
    const balance = prompt('Enter new balance:');
    const status = prompt('Enter status (active/frozen):');
    const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: new URLSearchParams(window.location.search).get('admin_id'), balance: parseFloat(balance), status })
    });
    const result = await response.json();
    alert(result.message);
    loadUsers();
}

// Admin panel: Delete user
async function deleteUser(userId) {
    if (confirm('Delete user?')) {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: new URLSearchParams(window.location.search).get('admin_id') })
        });
        const result = await response.json();
        alert(result.message);
        loadUsers();
    }
}

// Admin panel: Freeze/unfreeze user
async function freezeUser(userId, currentStatus) {
    const status = currentStatus === 'active' ? 'frozen' : 'active';
    const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: new URLSearchParams(window.location.search).get('admin_id'), status })
    });
    const result = await response.json();
    alert(result.message);
    loadUsers();
}

// Admin panel: Assign broker
document.getElementById('assign-broker-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const broker = {
        admin_id: new URLSearchParams(window.location.search).get('admin_id'),
        user_id: document.getElementById('broker-user-id').value,
        name: document.getElementById('broker-name').value,
        balance: parseFloat(document.getElementById('broker-balance').value)
    };
    
    const response = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broker)
    });
    
    const result = await response.json();
    alert(result.message);
});

// Admin panel: Edit broker
document.getElementById('edit-broker-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const broker = {
        admin_id: new URLSearchParams(window.location.search).get('admin_id'),
        broker_id: document.getElementById('edit-broker-id').value,
        name: document.getElementById('edit-broker-name').value,
        balance: parseFloat(document.getElementById('edit-broker-balance').value)
    };
    
    const response = await fetch('/api/admin/brokers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broker)
    });
    
    const result = await response.json();
    alert(result.message);
});

// Admin panel: Delete broker
document.getElementById('delete-broker-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const broker = {
        admin_id: new URLSearchParams(window.location.search).get('admin_id'),
        broker_id: document.getElementById('delete-broker-id').value
    };
    
    const response = await fetch('/api/admin/brokers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broker)
    });
    
    const result = await response.json();
    alert(result.message);
});

// Load dashboard or admin panel
if (window.location.pathname.includes('dashboard.html')) {
    const userId = new URLSearchParams(window.location.search).get('id');
    loadDashboard(userId);
} else if (window.location.pathname.includes('admin.html')) {
    loadUsers();
}
