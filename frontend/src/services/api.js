const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function getFriendlyApiError(error, fallback) {
  if (error instanceof TypeError) {
    return 'No pudimos conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.';
  }

  return error?.message || fallback;
}

function request(path, { token, ...options } = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(`${apiBaseUrl}${path}`, { ...options, headers });
}

function requestJson(path, method, payload, token) {
  return request(path, {
    method,
    body: JSON.stringify(payload),
    ...(token ? { token } : {}),
  });
}

export const cafeApi = {
  catalog() {
    return request('/api/v1/catalog?cafeteria=cafe-demo');
  },

  operations(token) {
    return request('/api/v1/operations/orders?cafeteria=cafe-demo', { token });
  },

  createOrder(payload) {
    return requestJson('/api/v1/orders', 'POST', payload);
  },

  updateOrderStatus(orderId, estado, token) {
    return requestJson(
      `/api/v1/operations/orders/${orderId}/status`,
      'PATCH',
      { cafeteria: 'cafe-demo', estado },
      token,
    );
  },

  updateProductAvailability(productId, disponible, token) {
    return requestJson(
      `/api/v1/operations/products/${productId}/availability`,
      'PATCH',
      { cafeteria: 'cafe-demo', disponible },
      token,
    );
  },

  login(credentials) {
    return requestJson('/api/v1/auth/login', 'POST', credentials);
  },

  trackOrder(codigo, telefono) {
    const params = new URLSearchParams({ cafeteria: 'cafe-demo', telefono });
    return request(`/api/v1/orders/${encodeURIComponent(codigo)}?${params}`);
  },

  assistantReply(message) {
    return requestJson('/api/v1/assistant/reply', 'POST', {
      cafeteria: 'cafe-demo',
      message,
    });
  },

  logout(token) {
    return request('/api/v1/auth/logout', { method: 'POST', token });
  },
};