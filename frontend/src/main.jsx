import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { CafeAssistant } from './components/chat/CafeAssistant.jsx';
import { AdminLoginPanel, CartPanel, CheckoutPanel, OrderTrackingPanel } from './components/commerce/OrderPanels.jsx';
import { ScrollReveal } from './components/ui/ScrollReveal.jsx';
import { ToastNotice } from './components/ui/ToastNotice.jsx';
import cafeAuroraMark from './assets/cafe-aurora-mark.svg';
import { getProductImage, promotions } from './features/catalog/catalogData.js';
import { OperationsPanel } from './features/operations/OperationsPanel.jsx';
import { cafeApi, getFriendlyApiError } from './services/api.js';
import './styles.css';

function App() {
  const [catalog, setCatalog] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cafe-web-cart') || '[]');
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState('menu');
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [theme, setTheme] = useState(() => localStorage.getItem('cafe-web-theme') || 'light');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [operations, setOperations] = useState(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('cafe-web-admin-token') || '');
  const [loginStatus, setLoginStatus] = useState('idle');
  const [loginError, setLoginError] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const [trackingError, setTrackingError] = useState('');
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  async function loadCatalog() {
    setStatus('loading');
    setError('');

    try {
      const response = await cafeApi.catalog();

      if (!response.ok) {
        throw new Error('No fue posible cargar el catalogo.');
      }

      setCatalog(await response.json());
      setStatus('ready');
    } catch (requestError) {
      setError(getFriendlyApiError(requestError, 'No pudimos cargar el catálogo. Inténtalo de nuevo.'));
      setStatus('error');
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  useEffect(() => {
    localStorage.setItem('cafe-web-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('cafe-web-theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleKeyboardShortcuts(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setActiveTab('menu');
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
      }

      if (event.key === 'Escape' && checkoutOpen) {
        setCheckoutOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [checkoutOpen]);

  useEffect(() => {
    if (activeTab !== 'operations' || !adminToken) return;

    cafeApi.operations(adminToken)
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          throw new Error('SESSION_EXPIRED');
        }
        return response.json();
      })
      .then(setOperations)
      .catch((requestError) => {
        if (requestError.message === 'SESSION_EXPIRED') {
          localStorage.removeItem('cafe-web-admin-token');
          setAdminToken('');
        }
        setOperations(null);
      });
  }, [activeTab, adminToken, orderConfirmation]);

  if (status === 'loading') {
    return (
      <main className="state-screen loading-screen" aria-busy="true" aria-label="Cargando catálogo">
        <div className="skeleton-brand" />
        <div className="skeleton-hero" />
        <div className="skeleton-line" />
        <div className="skeleton-grid"><span /><span /><span /></div>
      </main>
    );
  }

  if (status === 'error') {
    return (
        <main className="state-screen" role="alert">
        <p className="eyebrow">Cafe Web</p>
        <h1>No pudimos cargar el catalogo</h1>
        <p>{error}</p>
        <button type="button" onClick={loadCatalog}>
          Reintentar
        </button>
      </main>
    );
  }

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: catalog.cafeteria.moneda,
  });
  const startingPrice = catalog.productos.length
    ? Math.min(...catalog.productos.map((product) => Number(product.precio)))
    : null;

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
    showToast(`${product.nombre} se agregó al pedido.`);
  }

  function updateQuantity(productId, change) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function submitOrder(event) {
    event.preventDefault();
    setCheckoutStatus('submitting');
    setCheckoutError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      cafeteria: 'cafe-demo',
      cliente_nombre: form.get('cliente_nombre'),
      cliente_telefono: form.get('cliente_telefono'),
      cliente_correo: form.get('cliente_correo') || null,
      tipo_entrega: form.get('tipo_entrega'),
      notas: form.get('notas') || null,
      items: cart.map((item) => ({ producto_id: item.id, cantidad: item.quantity })),
    };

    try {
      const response = await cafeApi.createOrder(payload);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'No fue posible guardar el pedido.');
      }

      setOrderConfirmation(result.pedido);
      setCart([]);
      setCheckoutOpen(false);
      setCheckoutStatus('idle');
      setActiveTab('order');
    } catch (requestError) {
      setCheckoutError(getFriendlyApiError(requestError, 'No fue posible guardar el pedido. Inténtalo de nuevo.'));
      setCheckoutStatus('error');
    }
  }

  function clearAdminSession() {
    localStorage.removeItem('cafe-web-admin-token');
    setAdminToken('');
    setOperations(null);
  }

  function ensureAdminResponse(response, fallback) {
    if (response.status === 401 || response.status === 403) {
      clearAdminSession();
      throw new Error('Tu sesión terminó. Inicia sesión para continuar.');
    }

    if (!response.ok) throw new Error(fallback);
  }

  async function refreshOperations() {
    const response = await cafeApi.operations(adminToken);
    ensureAdminResponse(response, 'No pudimos actualizar la operación.');
    setOperations(await response.json());
  }

  async function updateOrderStatus(orderId, estado) {
    try {
      const response = await cafeApi.updateOrderStatus(orderId, estado, adminToken);
      ensureAdminResponse(response, 'No pudimos actualizar el estado del pedido.');
      await refreshOperations();
      showToast('Estado del pedido actualizado.');
    } catch (requestError) {
      showToast(getFriendlyApiError(requestError, 'No pudimos actualizar el estado del pedido.'), 'error');
    }
  }

  async function updateProductAvailability(productId, disponible) {
    try {
      const response = await cafeApi.updateProductAvailability(productId, disponible, adminToken);
      ensureAdminResponse(response, 'No pudimos actualizar la disponibilidad.');
      await refreshOperations();
      showToast(disponible ? 'Producto disponible para pedidos.' : 'Producto marcado como agotado.');
    } catch (requestError) {
      showToast(getFriendlyApiError(requestError, 'No pudimos actualizar la disponibilidad.'), 'error');
    }

  }

  async function loginAdmin(event) {
    event.preventDefault();
    setLoginStatus('submitting');
    setLoginError('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await cafeApi.login({ correo: form.get('correo'), password: form.get('password') });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No fue posible iniciar sesión.');
      localStorage.setItem('cafe-web-admin-token', result.token);
      setAdminToken(result.token);
      setLoginStatus('idle');
    } catch (requestError) {
      setLoginError(getFriendlyApiError(requestError, 'No fue posible iniciar sesión. Inténtalo de nuevo.'));
      setLoginStatus('error');
    }
  }

  async function trackOrder(event) {
    event.preventDefault();
    setTrackingStatus('submitting');
    setTrackingError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await cafeApi.trackOrder(form.get('codigo'), form.get('telefono'));
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No encontramos ese pedido.');
      setTrackingResult(result.pedido);
      setTrackingStatus('idle');
    } catch (requestError) {
      setTrackingResult(null);
      setTrackingError(getFriendlyApiError(requestError, 'No encontramos ese pedido. Revisa los datos e inténtalo de nuevo.'));
      setTrackingStatus('error');
    }
  }

  function logoutAdmin() {
    if (adminToken) {
      cafeApi.logout(adminToken);
    }
    clearAdminSession();
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.precio) * item.quantity,
    0,
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleCategories = catalog.categorias
    .map((category) => ({
      ...category,
      products: catalog.productos.filter((product) => {
        const matchesCategory =
          (activeCategory === 'all' || product.categoria_id === activeCategory) &&
          product.categoria_id === category.id;
        const searchableText = `${product.nombre} ${product.descripcion}`.toLowerCase();

        return matchesCategory && searchableText.includes(normalizedSearch);
      }),
    }))
    .filter((category) => category.products.length > 0);
  const visibleProductCount = visibleCategories.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  return (
    <div className="app-shell">
      <main className="catalog-page">
      <header className="catalog-header">
        <a className="brand-lockup" href="#inicio" aria-label={`${catalog.cafeteria.nombre}, inicio`}>
          <img className="brand-logo" src={cafeAuroraMark} alt="" />
          <span className="brand-copy"><strong>{catalog.cafeteria.nombre}</strong><small>Café de especialidad</small></span>
        </a>
        <nav className="tabs" aria-label={`Secciones de ${catalog.cafeteria.nombre}`}>
          <button className={activeTab === 'menu' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('menu')} aria-current={activeTab === 'menu' ? 'page' : undefined}>Menu</button>
          <button className={activeTab === 'promos' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('promos')} aria-current={activeTab === 'promos' ? 'page' : undefined}>Promociones</button>
          <button className={activeTab === 'order' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('order')} aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`} aria-current={activeTab === 'order' ? 'page' : undefined}>
            Carrito <span>{cartCount}</span>
          </button>
          <button className={activeTab === 'operations' ? 'tab active' : 'tab'} type="button" onClick={() => setActiveTab('operations')} aria-current={activeTab === 'operations' ? 'page' : undefined}>Operacion</button>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="Tema oscuro"
          title="Activar o desactivar tema oscuro"
          onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
        >
          <span aria-hidden="true" />
        </button>
        <span className="status-pill"><span className="status-dot" />Abierto</span>
      </header>

      <section className="hero-banner" id="inicio" aria-label={`Experiencia ${catalog.cafeteria.nombre}`}>
        <div className="hero-image" />
        <div className="hero-copy">
          <p className="eyebrow">Cafe de especialidad · hecho para quedarse</p>
          <h1>{catalog.cafeteria.nombre}</h1>
          <p>Una pausa bien hecha, desde el primer sorbo. Elige algo rico y nosotros lo preparamos.</p>
          <button type="button" onClick={() => setActiveTab('menu')}>Explorar el menu <span aria-hidden="true">→</span></button>
        </div>
        <div className="hero-stamp" aria-hidden="true">
          <span>Desde</span>
          <strong>{startingPrice === null ? 'Consulta el menu' : formatter.format(startingPrice)}</strong>
          <small>en el menu</small>
        </div>
      </section>

      {activeTab === 'menu' && <div className="catalog-layout menu-layout">
        <section className="catalog-content" aria-label="Catalogo de productos">
          <div className="menu-tools">
            <label className="search-field">
              <span>Buscar en el menu <kbd>Ctrl K</kbd></span>
              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ej. latte, pan, matcha..."
              />
            </label>
            <div className="category-filters catalog-tabs" aria-label="Filtrar por categoria">
              <button
                className={activeCategory === 'all' ? 'filter active' : 'filter'}
                type="button"
                onClick={() => setActiveCategory('all')}
              >
                Todo
              </button>
              {catalog.categorias.map((category) => (
                <button
                  className={
                    activeCategory === category.id ? 'filter active' : 'filter'
                  }
                  type="button"
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.nombre}
                </button>
              ))}
            </div>
            <p className="result-count">
              {visibleProductCount} {visibleProductCount === 1 ? 'opcion' : 'opciones'}
            </p>
          </div>

          {visibleCategories.length === 0 ? (
            <div className="empty-results">
              <p className="eyebrow">Sin coincidencias</p>
              <h2>No encontramos ese antojo.</h2>
              <p>Prueba con otra palabra o limpia los filtros del menu.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
              >
                Ver todo el menu
              </button>
            </div>
          ) : visibleCategories.map((category, categoryIndex) => {

            return (
              <ScrollReveal as="section" className="category" key={category.id} delay={categoryIndex * 70}>
                <div className="category-heading">
                  <div>
                    <p className="category-index">0{category.orden}</p>
                    <h2>{category.nombre}</h2>
                  </div>
                  <p>{category.descripcion}</p>
                </div>
                <div className="product-grid">
                  {category.products.map((product) => (
                    <article className="product" key={product.id}>
                      <div className="product-image">
                        <img src={getProductImage(product)} alt="" loading="lazy" />
                      </div>
                      <div className="product-info">
                        <h3>{product.nombre}</h3>
                        <p>{product.descripcion}</p>
                      </div>
                      <div className="product-action">
                        <strong>{formatter.format(Number(product.precio))}</strong>
                        <button type="button" onClick={() => addToCart(product)}>
                          Agregar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </ScrollReveal>
            );
          })}
        </section>
        <CartPanel
          cart={cart}
          cartCount={cartCount}
          cartTotal={cartTotal}
          formatter={formatter}
          updateQuantity={updateQuantity}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </div>}

      {activeTab === 'promos' && (
        <section className="promotions-view" aria-label="Promociones">
          <div className="section-intro">
            <p className="eyebrow">Lo que se antoja hoy</p>
            <h2>Pequenos rituales, grandes pausas.</h2>
          </div>
          <div className="banner-grid">
            {promotions.map((promotion, index) => (
              <ScrollReveal
                as="article"
                className="promo-banner"
                key={promotion.title}
                delay={index * 90}
                style={{ backgroundImage: `url(${promotion.image})` }}
              >
                <div className="promo-copy">
                  <p className="eyebrow">{promotion.eyebrow}</p>
                  <h3>{promotion.title}</h3>
                  <p>{promotion.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal as="div" className="recommendations" delay={100}>
            <div className="section-intro compact">
              <p className="eyebrow">Para descubrir</p>
              <h2>Mas del menu</h2>
            </div>
            <div className="product-grid recommendation-grid">
              {catalog.productos.map((product) => (
                <article className="product" key={product.id}>
                  <div className="product-image">
                    <img src={getProductImage(product)} alt="" loading="lazy" />
                  </div>
                  <div className="product-info">
                    <h3>{product.nombre}</h3>
                    <p>{product.descripcion}</p>
                  </div>
                  <div className="product-action">
                    <strong>{formatter.format(Number(product.precio))}</strong>
                    <button type="button" onClick={() => addToCart(product)}>
                      Agregar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </section>
      )}

      {activeTab === 'order' && (
        <section className="order-view" aria-label="Pedido actual">
          {orderConfirmation && (
            <div className="order-confirmation">
              <p className="eyebrow">Pedido recibido</p>
              <h2>Ya estamos preparando todo.</h2>
              <p>
                Tu codigo es <strong>{orderConfirmation.codigo}</strong>. Total:{' '}
                <strong>
                  {formatter.format(Number(orderConfirmation.total))}
                </strong>
              </p>
              <button type="button" onClick={() => setOrderConfirmation(null)}>
                Hacer otro pedido
              </button>
            </div>
          )}
          <OrderTrackingPanel
            onSubmit={trackOrder}
            result={trackingResult}
            error={trackingError}
            status={trackingStatus}
          />
          <CartPanel
            cart={cart}
            cartCount={cartCount}
            cartTotal={cartTotal}
            formatter={formatter}
            updateQuantity={updateQuantity}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </section>
      )}
      {activeTab === 'operations' && (
        adminToken ? (
          <OperationsPanel
            operations={operations}
            onStatusChange={updateOrderStatus}
            onProductToggle={updateProductAvailability}
            onLogout={logoutAdmin}
          />
        ) : (
          <AdminLoginPanel onSubmit={loginAdmin} status={loginStatus} error={loginError} />
        )
      )}
      {checkoutOpen && (
        <CheckoutPanel
          onClose={() => setCheckoutOpen(false)}
          onSubmit={submitOrder}
          status={checkoutStatus}
          error={checkoutError}
        />
      )}
      <CafeAssistant
        catalog={catalog}
        onNavigate={setActiveTab}
        onSearch={setSearchTerm}
        onAddToCart={addToCart}
      />
      <ToastNotice toast={toast} onClose={() => setToast(null)} />
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="footer-lockup" href="#inicio" aria-label={`${catalog.cafeteria.nombre}, volver al inicio`}>
              <img src={cafeAuroraMark} alt="" />
              <span>{catalog.cafeteria.nombre}</span>
            </a>
            <p>Una pausa bien hecha, desde el primer sorbo.</p>
          </div>
          <nav className="footer-navigation" aria-label="Navegación del pie de página">
            <span>Explora</span>
            <button type="button" onClick={() => setActiveTab('menu')}>Menú</button>
            <button type="button" onClick={() => setActiveTab('promos')}>Promociones</button>
            <button type="button" onClick={() => setActiveTab('order')}>Seguimiento y pedido</button>
          </nav>
          <div className="footer-note">
            <span className="footer-note-label"><span className="status-dot" />Hecho al momento</span>
            <p>Tu siguiente café está a unos clics.</p>
            <button type="button" onClick={() => setActiveTab('menu')}>Ver el menú <span aria-hidden="true">→</span></button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {catalog.cafeteria.nombre}</span>
          <a href="#inicio">Volver arriba ↑</a>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);