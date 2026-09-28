export function CartPanel({
  cart,
  cartCount,
  cartTotal,
  formatter,
  updateQuantity,
  onCheckout,
}) {
  return (
    <aside className="cart-panel" aria-label="Tu pedido">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Tu pedido</p>
          <h2>{cartCount === 1 ? '1 producto' : cartCount ? `${cartCount} productos` : 'Aun vacio'}</h2>
        </div>
        <span aria-hidden="true">{cartCount}</span>
      </div>
      {cart.length === 0 ? (
        <p className="cart-empty">Agrega algo del menu para comenzar.</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <h3>{item.nombre}</h3>
                  <p>{formatter.format(Number(item.precio) * item.quantity)}</p>
                </div>
                <div className="quantity-control">
                  <button type="button" aria-label={`Quitar una unidad de ${item.nombre}`} onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Agregar una unidad de ${item.nombre}`} onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatter.format(cartTotal)}</strong>
          </div>
          <button className="checkout-button" type="button" onClick={onCheckout}>Continuar pedido</button>
        </>
      )}
    </aside>
  );
}

export function CheckoutPanel({ onClose, onSubmit, status, error }) {
  return (
    <div className="checkout-backdrop" role="presentation">
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar checkout">x</button>
        <p className="eyebrow">Ultimo paso</p>
        <h2 id="checkout-title">¿Como te entregamos tu pedido?</h2>
        <p className="modal-intro">Te avisaremos cuando este listo. No necesitas crear una cuenta.</p>
        <form onSubmit={onSubmit}>
          <div className="form-grid">
            <label>Nombre completo<input name="cliente_nombre" required maxLength="160" autoComplete="name" /></label>
            <label>Telefono<input name="cliente_telefono" required maxLength="32" autoComplete="tel" /></label>
            <label>Correo (opcional)<input name="cliente_correo" type="email" maxLength="191" autoComplete="email" /></label>
            <label>Entrega
              <select name="tipo_entrega" defaultValue="recoger">
                <option value="recoger">Recoger en cafeteria</option>
                <option value="mesa">Servir en mesa</option>
                <option value="domicilio">Domicilio</option>
              </select>
            </label>
            <label className="form-wide">Notas para la cafeteria (opcional)
              <textarea name="notas" maxLength="1000" rows="3" placeholder="Ej. poca azucar, tocar el timbre..." />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="checkout-button" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Guardando pedido...' : 'Confirmar pedido'}
          </button>
        </form>
      </section>
    </div>
  );
}

export function AdminLoginPanel({ onSubmit, status, error }) {
  return (
    <section className="admin-login" aria-label="Acceso de administrador">
      <p className="eyebrow">Zona privada</p>
      <h2>Entra a la operación.</h2>
      <p>Usa tu cuenta de administrador para revisar pedidos y actividad.</p>
      <form onSubmit={onSubmit}>
        <label>Correo<input name="correo" type="email" required autoComplete="username" /></label>
        <label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="checkout-button" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Entrando...' : 'Entrar al panel'}
        </button>
      </form>
    </section>
  );
}

export function OrderTrackingPanel({ onSubmit, result, error, status }) {
  return (
    <section className="tracking-card" aria-label="Seguimiento de pedido">
      <div>
        <p className="eyebrow">¿Ya ordenaste?</p>
        <h3>Rastrea tu pedido</h3>
        <p>Usa el código de confirmación y el teléfono de tu pedido.</p>
      </div>
      <form onSubmit={onSubmit}>
        <input name="codigo" required placeholder="Código, ej. CW-2BFULLC1" aria-label="Código de pedido" />
        <input name="telefono" required placeholder="Teléfono" aria-label="Teléfono del pedido" />
        <button type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Buscando...' : 'Consultar'}</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      {result && <p className="tracking-result">{result.codigo}: <strong>{result.estado}</strong> · {result.tipo_entrega}</p>}
    </section>
  );
}