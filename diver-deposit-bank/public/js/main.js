import { createClient } from '@supabase/supabase-js';
import i18next from 'i18next';
import { jsPDF } from 'jspdf';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://dodijnhzghlpgmdddklr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGlqbmh6Z2hscGdtZGRka2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTE3MTksImV4cCI6MjA2OTAyNzcxOX0.soz1ofVIZ3NeWkcE1yUCIylFiVry5nwvc9PvHn7TZQQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize i18next for translations
i18next.init({
    lng: 'en',
    resources: {
        en: {
            translation: {
                welcome: 'Welcome to Diver Deposit Bank',
                since: 'Serving customers since 1998',
                login: 'Login',
                username: 'Username',
                password: 'Password',
                security_code: "What's your security code?",
                favorite_food: "What's your favorite food?",
                support_contact: 'Contact our 24/7 customer support team',
                invalid: 'Invalid credentials',
                balance: 'Balance',
                account_number: 'Account Number',
                deposit: 'Deposit',
                withdraw: 'Withdraw',
                transfer: 'Transfer',
                statement: 'Download Statement',
                support: 'Customer Support',
                support_placeholder: 'Leave your complaint, our support team will respond immediately',
                loan: 'Apply for a Loan',
                apply: 'Apply',
                broker: 'Investment Broker',
                crypto: 'Crypto Trading',
                buy: 'Buy',
                sell: 'Sell',
                create: 'Create User',
                add: 'Add Transaction',
                assign: 'Assign Broker',
                update: 'Update Broker',
                delete: 'Delete Broker',
                language: 'Select Language'
            }
        },
        es: {
            translation: {
                welcome: 'Bienvenido a Diver Deposit Bank',
                since: 'Sirviendo a clientes desde 1998',
                login: 'Iniciar sesión',
                username: 'Nombre de usuario',
                password: 'Contraseña',
                security_code: '¿Cuál es tu código de seguridad?',
                favorite_food: '¿Cuál es tu comida favorita?',
                support_contact: 'Contáctenos con nuestro equipo de soporte 24/7',
                invalid: 'Credenciales inválidas',
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
    const data = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        security_code: document.getElementById('security-code').value,
        favorite_food: document.getElementById('favorite-food').value
    };
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('biometric-option').classList.add('hidden');
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    document.getElementById('loading').classList.add('hidden');
    const result = await response.json();
    if (result.error) {
        document.getElementById('error').classList.remove('hidden');
        setTimeout(() => document.getElementById('error').classList.add('hidden'), 3000);
    } else {
        document.getElementById('success').classList.remove('hidden');
        setTimeout(async () => {
            document.getElementById('success').classList.add('hidden');
            const redirectUrl = result.role === 'admin' ? `/admin.html?admin_id=${result.id}` : `/dashboard.html?id=${result.id}`;
            window.location.href = redirectUrl;
            // Load dashboard if redirected to dashboard.html
            if (redirectUrl.includes('dashboard.html')) {
                const urlParams = new URLSearchParams(window.location.search);
                const userId = urlParams.get('id');
                if (userId) await loadDashboard(userId);
            }
        }, 1000);
    }
});

// Biometric Login (Placeholder)
document.getElementById('biometric-login')?.addEventListener('click', () => {
    alert('Biometric login simulated! Redirecting...');
    window.location.href = '/dashboard.html?id=1';
    // Load dashboard after redirect
    setTimeout(() => loadDashboard('1'), 100); // Simulate async load
}

// Load Dashboard Function with Animations
async function loadDashboard(userId) {
    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error) throw error;
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = `$${data.balance.toFixed(2)}`;
        balanceElement.style.animation = 'none'; // Reset animation
        void balanceElement.offsetWidth; // Trigger reflow
        balanceElement.style.animation = 'fadeIn 1s ease-in';
        document.getElementById('account-number').textContent = data.account_number;
        document.getElementById('card-last4').textContent = data.account_number.slice(-4);
        const { data: broker } = await supabase.from('brokers').select('*').eq('user_id', userId).maybeSingle();
        if (
