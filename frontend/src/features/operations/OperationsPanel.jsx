export function OperationsPanel({ operations, onStatusChange, onProductToggle, onLogout }) {
  if (!operations) {
    return <div className="operations-state">Cargando operacion...</div>;
  }

  return (
    <section className="operations-view" aria-label="Panel de operacion">
      <div className="operations-heading">
        <div>
          <p className="eyebrow">Modo operador / Demo</p>
          <h2>El pulso de la cafeteria.</h2>
        </div>
        <div className="operations-actions">
          <span className="status-pill">En vivo</span>
          <button type="button" onClick={onLogout}>Salir</button>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric"><span>Pedidos hoy</span><strong>{operations.estadisticas.pedidos_hoy}</strong></div>
        <div className="metric"><span>En proceso</span><strong>{operations.estadisticas.pendientes}</strong></div>
        <div className="metric"><span>Ingresos</span><strong>${operations.estadisticas.ingresos}</strong></div>
      </div>
      {operations.suscripcion && (
        <div className="subscription-card">
          <div>
            <p className="eyebrow">Licencia SaaS</p>
            <h3>Plan {operations.suscripcion.plan}</h3>
            <span>Estado: {operations.suscripcion.estado} · Renueva {operations.suscripcion.periodo_fin.slice(0, 10)}</span>
          </div>
          <div className="subscription-limits">
            <span>{operations.suscripcion.max_productos ?? 'Ilimitados'} productos</span>
            <span>{operations.suscripcion.max_usuarios ?? 'Ilimitados'} usuarios</span>
            <span>{operations.suscripcion.max_pedidos_mes ?? 'Ilimitados'} pedidos/mes</span>
          </div>
        </div>
      )}
      {operations.suscripcion && operations.uso && (
        <div className="usage-card">
          <div className="operations-list-heading"><h3>Consumo del plan</h3><span>Este mes</span></div>
          {[
            ['Pedidos', operations.uso.pedidos_mes, operations.suscripcion.max_pedidos_mes],
            ['Productos', operations.uso.productos, operations.suscripcion.max_productos],
            ['Usuarios', operations.uso.usuarios, operations.suscripcion.max_usuarios],
          ].map(([label, current, limit]) => {
            const percentage = limit ? Math.min((current / limit) * 100, 100) : 8;

            return (
              <div className="usage-row" key={label}>
                <div><span>{label}</span><strong>{current} / {limit ?? 'Ilimitado'}</strong></div>
                <div className="usage-track"><span style={{ width: `${percentage}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}
      <div className="operations-list">
        <div className="operations-list-heading"><h3>Pedidos recientes</h3><span>{operations.pedidos.length} mostrados</span></div>
        {operations.pedidos.length === 0 ? (
          <p className="operations-empty">Aun no hay pedidos para mostrar.</p>
        ) : operations.pedidos.map((order) => (
          <article className="order-row" key={order.id}>
            <div className="order-code"><strong>{order.codigo}</strong><span>{order.cliente_nombre}</span></div>
            <div className="order-meta"><span>{order.tipo_entrega}</span><strong>{order.moneda} {order.total}</strong></div>
            <select value={order.estado} onChange={(event) => onStatusChange(order.id, event.target.value)} aria-label={`Estado de ${order.codigo}`}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="preparando">Preparando</option>
              <option value="listo">Listo</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </article>
        ))}
      </div>
      <div className="products-operations">
        <div className="operations-list-heading"><h3>Catálogo rápido</h3><span>{operations.productos.length} productos</span></div>
        <div className="product-operations-grid">
          {operations.productos.map((product) => (
            <article className="product-operation" key={product.id}>
              <div><strong>{product.nombre}</strong><span>Stock: {product.existencias}</span></div>
              <button
                className={product.disponible ? 'availability available' : 'availability'}
                type="button"
                onClick={() => onProductToggle(product.id, !product.disponible)}
              >
                {product.disponible ? 'Disponible' : 'Agotado'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}