document.addEventListener('DOMContentLoaded', function() {
    console.log("--- SYSTEM START: REAL AUTHENTICATION VERSION ---");

    /* ========================================================================
       0. ГЛОБАЛЬНЫЕ ХЕЛПЕРЫ (MODAL, COOKIE)
       ======================================================================== */
    
    const getModal = (id) => {
        const el = document.getElementById(id);
        return el ? bootstrap.Modal.getOrCreateInstance(el) : null;
    };

    function setCookie(n, v, d) {
        const dt = new Date();
        dt.setTime(dt.getTime() + (d * 24 * 3600 * 1000));
        document.cookie = n + "=" + encodeURIComponent(v) + ";expires=" + dt.toUTCString() + ";path=/";
    }

    function getCookie(n) {
        const eq = n + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(eq) === 0) return decodeURIComponent(c.substring(eq.length));
        }
        return null;
    }

    function eraseCookie(n) {
        document.cookie = n + '=; Max-Age=-99999999;';
    }

    /* ========================================================================
       1. ЛР 19: КАТАЛОГ (СОРТИРОВКА + ФИЛЬТРЫ)
       ======================================================================== */
    
    let allProducts = [];
    let displayedProducts = [];
    let cart = [];
    let currentFilter = 'all';
    let currentSort = 'default';

    const fallbackData = [
      { id: 1, name: "Кухня Severin", price: 11654, image: "image/NR1.png", category: "Loft" },
      { id: 2, name: "Кухня Milano", price: 9845, image: "image/NR2.png", category: "Modern" },
      { id: 3, name: "Кухня Florence", price: 13275, image: "image/NR3.png", category: "Classic" },
      { id: 4, name: "Кухня Venice", price: 10990, image: "image/NR1.png", category: "Loft" },
      { id: 5, name: "Кухня Rome", price: 12450, image: "image/NR2.png", category: "Modern" },
      { id: 6, name: "Кухня Naples", price: 8750, image: "image/NR3.png", category: "Provence" },
      { id: 7, name: "Кухня Turin", price: 14320, image: "image/NR1.png", category: "Modern" },
      { id: 8, name: "Кухня Verona", price: 11110, image: "image/NR2.png", category: "Classic" },
      { id: 9, name: "Кухня Bologna", price: 9999, image: "image/NR3.png", category: "Modern" }
    ];

    const grid = document.getElementById('portfolioGrid');
    const loadBtn = document.getElementById('loadMoreBtn');
    let shownCount = 0;
    const step = 6;

    function initProducts() {
        fetch('products.json')
            .then(res => { if(!res.ok) throw new Error(); return res.json(); })
            .then(data => { allProducts = data; applyFilters(); })
            .catch(() => { allProducts = fallbackData; applyFilters(); });
    }

    function applyFilters() {
        if (currentFilter === 'all') {
            displayedProducts = [...allProducts];
        } else {
            displayedProducts = allProducts.filter(p => p.category === currentFilter);
        }

        if (currentSort === 'price_asc') displayedProducts.sort((a, b) => a.price - b.price);
        else if (currentSort === 'price_desc') displayedProducts.sort((a, b) => b.price - a.price);
        else if (currentSort === 'name') displayedProducts.sort((a, b) => a.name.localeCompare(b.name));

        if (grid) grid.innerHTML = '';
        shownCount = 0;
        renderProducts();
    }

    function renderProducts() {
        if (!grid) return;
        const nextItems = displayedProducts.slice(shownCount, shownCount + step);

        if(nextItems.length === 0 && shownCount === 0) {
            grid.innerHTML = '<div class="col-12 text-center text-muted py-5">Нет товаров</div>';
        }

        nextItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'col-md-4 col-sm-6 reveal active';
            div.innerHTML = `
                <div class="portfolio-item">
                    <img class="portfolio-img" src="${item.image}" alt="${item.name}" loading="lazy">
                    <div class="portfolio-content">
                        <div class="portfolio-model-name">
                            ${item.name} <br><span class="badge bg-warning text-dark" style="font-size:10px">${item.category}</span>
                        </div>
                        <div class="info-container">
                            <div class="portfolio-info">
                                <div class="portfolio-price"><span class="amount">${item.price}</span> LEI</div>
                                <button class="btn btn-warning w-100 mt-2 add-to-cart-action" data-id="${item.id}">В КОРЗИНУ</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            grid.appendChild(div);
        });

        document.querySelectorAll('.portfolio-img').forEach(img => {
            if(!img.style.backgroundImage) {
                img.style.backgroundImage = `url('${img.src}')`;
                img.style.backgroundSize = 'cover';
                img.style.backgroundPosition = 'center';
                img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjwvc3ZnPg==';
            }
        });

        shownCount += nextItems.length;
        if (loadBtn) loadBtn.style.display = (shownCount >= displayedProducts.length) ? 'none' : 'block';
    }

    if(loadBtn) loadBtn.addEventListener('click', renderProducts);

    const filtersContainer = document.getElementById('catalogFilters');
    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                filtersContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                applyFilters();
            }
        });
    }

    const sortSelect = document.getElementById('catalogSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }

    if (grid) {
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.add-to-cart-action');
            if (btn) {
                e.stopPropagation(); e.preventDefault();
                addToCart(parseInt(btn.dataset.id));
            }
        });
    }
    initProducts();


    /* ========================================================================
       2. ЛОГИКА КОРЗИНЫ
       ======================================================================== */
    function addToCart(id) {
        const product = allProducts.find(p => p.id === id);
        if(product) {
            cart.push(product);
            updateCartUI();
            const btn = document.getElementById('cartBtn');
            if(btn) {
                btn.classList.add('btn-warning');
                setTimeout(() => btn.classList.remove('btn-warning'), 400);
            }
        }
    }

    function removeFromCart(idx) {
        cart.splice(idx, 1);
        updateCartUI();
    }

    function updateCartUI() {
        document.getElementById('cartCount').textContent = cart.length;
        const tbody = document.getElementById('cartItemsContainer');
        const totalEl = document.getElementById('cartTotal');
        if (tbody && totalEl) {
            tbody.innerHTML = ''; let total = 0;
            if (cart.length === 0) tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Пусто</td></tr>';
            else {
                cart.forEach((item, i) => {
                    total += item.price;
                    tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.price}</td><td><button class="btn btn-sm btn-danger" onclick="window.delCartItem(${i})">&times;</button></td></tr>`;
                });
            }
            totalEl.textContent = total;
        }
    }
    window.delCartItem = (i) => removeFromCart(i);
    document.getElementById('cartBtn')?.addEventListener('click', () => getModal('cartModal').show());


    /* ========================================================================
       3. АВТОРИЗАЦИЯ: РЕГИСТРАЦИЯ + ВХОД (С ПРОВЕРКОЙ БАЗЫ ДАННЫХ)
       ======================================================================== */
    
    // Паттерны
    const patterns = {
        name: /^[a-zA-Zа-яА-ЯёЁ\s]+$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/ 
    };

    // --- 3.1 РЕГИСТРАЦИЯ (СОХРАНЯЕМ В "БАЗУ" LS) ---
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const name = e.target.name.replace('reg', '').toLowerCase();
                const valid = patterns[name] ? patterns[name].test(e.target.value) : true;
                e.target.classList.toggle('is-valid', valid);
                e.target.classList.toggle('is-invalid', !valid);
            });
        });

        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameVal = document.getElementById('regName').value;
            const emailVal = document.getElementById('regEmail').value;
            const passVal = document.getElementById('regPassword').value;

            // Валидация
            if (!patterns.name.test(nameVal) || !patterns.email.test(emailVal) || !patterns.password.test(passVal)) {
                alert("Ошибка валидации! Проверьте: Имя(буквы), Email, Пароль(6+ симв, цифры+буквы)");
                return;
            }

            // ПРОВЕРКА: Существует ли пользователь?
            let usersDB = JSON.parse(localStorage.getItem('ALL_USERS')) || [];
            const existingUser = usersDB.find(u => u.email === emailVal);
            
            if(existingUser) {
                alert("Пользователь с таким Email уже существует! Войдите в аккаунт.");
                return;
            }

            // СОХРАНЕНИЕ НОВОГО ПОЛЬЗОВАТЕЛЯ
            const newUser = { name: nameVal, email: emailVal, password: passVal };
            usersDB.push(newUser);
            localStorage.setItem('ALL_USERS', JSON.stringify(usersDB));

            // Авторизация после регистрации
            setCookie('username', nameVal, 7);
            setCookie('is_logged_in', 'true', 7);
            
            alert("Регистрация успешна!");
            getModal('guestModal').hide();
            checkAuthHeader();
            
            setTimeout(() => {
                 document.getElementById('profileUsernameDisplay').textContent = nameVal;
                 getModal('profileModal').show();
            }, 500);
        });
    }

    // --- 3.2 ВХОД (ПРОВЕРКА ПО "БАЗЕ") ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            
            // Валидация на пустоту
            if(!email || !pass) { alert("Заполните все поля!"); return; }

            // Валидация формата Email
            if (!patterns.email.test(email)) {
                alert("Некорректный формат Email!");
                return;
            }

            // ПОИСК ПОЛЬЗОВАТЕЛЯ В БАЗЕ (Local Storage)
            let usersDB = JSON.parse(localStorage.getItem('ALL_USERS')) || [];
            const foundUser = usersDB.find(u => u.email === email && u.password === pass);

            if (foundUser) {
                // УСПЕХ
                setCookie('username', foundUser.name, 7);
                setCookie('is_logged_in', 'true', 7);
                
                getModal('guestModal').hide();
                checkAuthHeader();
                alert("Вход выполнен! Рады видеть вас, " + foundUser.name);
            } else {
                // ОШИБКА
                alert("Ошибка входа! Неверный Email или Пароль, либо аккаунт не создан.");
            }
        });
    }

    // --- 3.3 Управление профилем ---
    const profileBtn = document.getElementById('profileBtn');
    
    function checkAuthHeader() {
        const user = getCookie('username');
        if (user && profileBtn) {
            profileBtn.innerHTML = `<i class="fa fa-user-check text-success"></i> ${user}`;
            profileBtn.classList.add('text-success');
        } else if (profileBtn) {
            profileBtn.innerHTML = `<i class="fa fa-user"></i> Вход`;
            profileBtn.classList.remove('text-success');
        }
    }
    
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const user = getCookie('username');
            if (user) {
                document.getElementById('profileUsernameDisplay').textContent = user;
                getModal('profileModal').show();
            } else {
                getModal('guestModal').show();
            }
        });
    }
    checkAuthHeader();

    document.getElementById('btnLogout')?.addEventListener('click', () => {
        eraseCookie('username'); 
        eraseCookie('is_logged_in');
        getModal('profileModal').hide();
        checkAuthHeader();
        alert("Вы вышли из системы");
    });


    /* ========================================================================
       4. ЛР 20: ДАННЫЕ И ОФОРМЛЕНИЕ
       ======================================================================== */
    
    function getPersonalData() {
        return {
            fio: document.getElementById('pdFIO').value,
            email: document.getElementById('pdEmail').value,
            phone: document.getElementById('pdPhone') ? document.getElementById('pdPhone').value : '',
            dob: document.getElementById('pdDob').value,
            place: document.getElementById('pdPlace').value
        };
    }

    function setPersonalData(d) {
        if(!d) return;
        document.getElementById('pdFIO').value = d.fio || '';
        document.getElementById('pdEmail').value = d.email || '';
        if(document.getElementById('pdPhone')) document.getElementById('pdPhone').value = d.phone || '';
        document.getElementById('pdDob').value = d.dob || '';
        document.getElementById('pdPlace').value = d.place || '';
    }

    document.getElementById('btnSaveLS')?.addEventListener('click', () => {
        localStorage.setItem('userData', JSON.stringify(getPersonalData()));
        alert("Сохранено в Local Storage!");
    });
    document.getElementById('btnLoadLS')?.addEventListener('click', () => {
        const d = localStorage.getItem('userData');
        if(d) setPersonalData(JSON.parse(d)); else alert("Local Storage пуст");
    });
    document.getElementById('btnSaveCookie')?.addEventListener('click', () => {
        setCookie('userDataFull', JSON.stringify(getPersonalData()), 7);
        alert("Сохранено в Cookie!");
    });
    document.getElementById('btnLoadCookie')?.addEventListener('click', () => {
        const d = getCookie('userDataFull');
        if(d) setPersonalData(JSON.parse(d)); else alert("Cookie пуст");
    });
    document.getElementById('btnClearData')?.addEventListener('click', () => {
        document.getElementById('personalDataForm').reset();
        localStorage.removeItem('userData');
        eraseCookie('userDataFull');
        alert("Очищено");
    });

    // Оформление заказа
    const checkoutBtn = document.getElementById('btnInitCheckout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) { alert("Корзина пуста!"); return; }

            const isLogged = getCookie('is_logged_in');
            const cartM = getModal('cartModal');
            cartM.hide();

            if (isLogged !== 'true') {
                alert("Для оформления заказа необходимо войти!");
                setTimeout(() => getModal('guestModal').show(), 500);
            } else {
                prepareCheckoutData();
                setTimeout(() => getModal('checkoutModal').show(), 500);
            }
        });
    }

    function prepareCheckoutData() {
        const total = document.getElementById('cartTotal').textContent;
        document.getElementById('checkoutTotal').textContent = total + " лей";
        
        let saved = localStorage.getItem('userData') || getCookie('userDataFull');
        if(saved) {
            try {
                const d = JSON.parse(decodeURIComponent(saved));
                if(d.fio) document.getElementById('orderName').value = d.fio;
                if(d.email) document.getElementById('orderEmail').value = d.email;
            } catch(e) {}
        }
    }

    document.getElementById('finalOrderForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Заказ успешно оформлен!");
        getModal('checkoutModal').hide();
        cart = [];
        updateCartUI();
    });


    /* ========================================================================
       5. ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (ПОЛНЫЙ ПАКЕТ)
       ======================================================================== */
    
    // Слайдер
    const slides = document.querySelectorAll('.slide');
    if(slides.length) {
        let cur = 0;
        setInterval(() => {
            slides[cur].classList.remove('active');
            cur = (cur + 1) % slides.length;
            slides[cur].classList.add('active');
        }, 5000);
    }

    // Параллакс
    const heroSec = document.querySelector('.hero-carousel-wrapper');
    const heroCap = document.querySelector('.carousel-caption');
    if(heroSec && heroCap) {
        heroSec.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth - e.pageX * 2) / 100;
            const y = (window.innerHeight - e.pageY * 2) / 100;
            heroCap.style.transform = `translate(calc(-50% + ${x}px), calc(-40% + ${y}px))`;
        });
    }

    // Таймер
    let fakeTime = { d: 4, h: 9, m: 34, s: 32 };
    setInterval(() => {
        fakeTime.s--;
        if (fakeTime.s < 0) { fakeTime.s = 59; fakeTime.m--; }
        if (fakeTime.m < 0) { fakeTime.m = 59; fakeTime.h--; }
        if (fakeTime.h < 0) { fakeTime.h = 23; fakeTime.d--; }
        const el = document.querySelector('.fake-secs');
        if(el) {
            el.textContent = String(fakeTime.s).padStart(2, '0');
            document.querySelector('.fake-mins').textContent = String(fakeTime.m).padStart(2, '0');
            document.querySelector('.fake-hours').textContent = String(fakeTime.h).padStart(2, '0');
            document.querySelector('.fake-days').textContent = String(fakeTime.d).padStart(2, '0');
        }
    }, 1000);

    // Калькулятор
    if (typeof $ !== 'undefined' && $('#budget').length) {
        function calc() {
            const b = parseFloat($('#budget').val())||0;
            const m = parseInt($('#months').val())||1;
            const d = parseFloat($('#downPayment').val().replace('%',''))||0;
            const r = (b - (b*d/100))/m;
            $('#paymentResult').text(r.toFixed(2)+' €');
            if(typeof anime !== 'undefined') anime({targets:'#paymentResult', scale:[1.1, 1], duration:300});
        }
        $('#budget,#months,#downPayment').on('input', calc);
        $('.calculator-form').on('submit', (e)=>{e.preventDefault(); alert("Отправлено!");});
        calc();
    }

    // Scroll Reveal
    function reveal() {
        document.querySelectorAll(".reveal").forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 100) el.classList.add("active");
        });
    }
    window.addEventListener('scroll', reveal);
    reveal();

    // Чат
    const ct = document.getElementById('chat-trigger');
    const cw = document.getElementById('chat-widget');
    if(ct && cw) {
        setTimeout(() => ct.style.opacity = '1', 1000);
        ct.onclick = () => { cw.classList.add('open'); ct.style.display='none'; }
        cw.querySelector('.close-btn').onclick = () => { cw.classList.remove('open'); setTimeout(()=>ct.style.display='flex', 300); }
        const sb = cw.querySelector('.send-btn');
        const mi = cw.querySelector('.message-input');
        if(sb) sb.onclick = () => { if(mi.value) { cw.querySelector('.messages').innerHTML += `<div class="message user-message" style="background:#FFD700;padding:5px;">${mi.value}</div>`; mi.value=''; } };
    }

    // Flip, Mask, UpBtn
    window.flip = (el) => el.classList.toggle("flipped");
    const pi = document.getElementById('phoneInput');
    if(pi && typeof IMask !== 'undefined') IMask(pi, {mask:'+375 (00) 000-00-00'});
    const sBtn = document.getElementById("scroll-toggle");
    if(sBtn) sBtn.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

    // Подменю
    const cm = document.getElementById('catalogMenu');
    if(cm) {
        const sm = document.createElement('ul');
        sm.style.cssText = "position:absolute;top:100%;left:0;background:#fff;padding:10px;display:none;list-style:none;box-shadow:0 5px 15px rgba(0,0,0,0.1);z-index:9999;";
        ['Loft', 'Modern', 'Classic'].forEach(t => sm.innerHTML += `<li><a href="#" style="display:block;padding:5px;color:#333;">${t}</a></li>`);
        cm.appendChild(sm);
        cm.onmouseenter = () => sm.style.display = 'block';
        cm.onmouseleave = () => sm.style.display = 'none';
    }
});0