import { useEffect, useRef, useState } from 'react';
import { cafeApi } from '../../services/api.js';

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getRecommendedProduct(message, products, categories) {
  const normalizedMessage = normalizeText(message);
  const directMatch = products.find((product) => {
    const searchable = normalizeText(`${product.nombre} ${product.descripcion}`);
    return searchable.split(/\s+/).some((word) => word.length > 3 && normalizedMessage.includes(word));
  });

  if (directMatch) return directMatch;

  let candidates = products;
  const categoryMatch = categories.find((category) => {
    const categoryName = normalizeText(category.nombre);
    return normalizedMessage.includes(categoryName) && categoryName.length > 3;
  });

  if (categoryMatch) {
    candidates = products.filter((product) => product.categoria_id === categoryMatch.id);
  } else if (/frio|cold|helad|iced/.test(normalizedMessage)) {
    candidates = products.filter((product) => /cold|fria|frio|helad|iced/.test(normalizeText(`${product.nombre} ${product.descripcion}`)));
  } else if (/dulce|pan|postre|hornead/.test(normalizedMessage)) {
    candidates = products.filter((product) => /croissant|pan|muffin|rol|dulce|granola/.test(normalizeText(product.nombre)));
  } else if (/desayun/.test(normalizedMessage)) {
    const breakfastCategory = categories.find((category) => normalizeText(category.nombre).includes('desayun'));
    if (breakfastCategory) {
      candidates = products.filter((product) => product.categoria_id === breakfastCategory.id);
    }
  }

  return candidates.reduce((lowestPrice, product) => (
    !lowestPrice || Number(product.precio) < Number(lowestPrice.precio) ? product : lowestPrice
  ), null);
}

export function CafeAssistant({ catalog, onNavigate, onSearch, onAddToCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [hasGenerativeAssistant, setHasGenerativeAssistant] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([{
    id: 0,
    role: 'assistant',
    text: `Hola, soy la guía de ${catalog.cafeteria.nombre}. Puedo recomendarte algo del menú, abrir secciones, ayudarte con el seguimiento y conectarte con el equipo.`,
  }]);
  const conversationRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const nextMessageId = useRef(1);
  const phone = (catalog.cafeteria.telefono || import.meta.env.VITE_WHATSAPP_PHONE || '').replace(/\D/g, '');
  const email = catalog.cafeteria.correo?.endsWith('.local') ? '' : catalog.cafeteria.correo;
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, ${catalog.cafeteria.nombre}. Vengo desde su página.`)}`
    : '';
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: catalog.cafeteria.moneda,
  });

  useEffect(() => {
    if (!isOpen) return;

    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;

      setIsOpen(false);
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function addMessage(role, text, product = null, action = null) {
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: nextMessageId.current++, role, text, product, action },
    ]);
  }

  async function tryGenerativeAnswer(message) {
    try {
      const response = await cafeApi.assistantReply(message);
      const result = await response.json();

      if (!response.ok || !result.enabled || !result.reply) return false;

      const recommendedProduct = catalog.productos.find((product) => product.id === result.recommended_product_id) || null;
      setHasGenerativeAssistant(true);
      addMessage('assistant', result.reply, recommendedProduct);
      return true;
    } catch {
      return false;
    }
  }

  async function answerMessage(message) {
    const normalized = normalizeText(message);

    if (/whatsapp|contact|hablar|persona|equipo/.test(normalized)) {
      if (whatsappUrl) {
        addMessage('assistant', 'Claro. Te conecto con el equipo por WhatsApp.', null, { label: 'Abrir WhatsApp', href: whatsappUrl });
      } else if (email) {
        addMessage('assistant', 'Todavía no hay un número de WhatsApp configurado. Puedes escribir al equipo por correo.', null, { label: 'Enviar correo', href: `mailto:${email}` });
      } else {
        addMessage('assistant', 'El contacto directo aún no está configurado. Cuando agreguen el teléfono de la cafetería podré abrir WhatsApp desde aquí.');
      }
      return;
    }

    if (/menu|catalog/.test(normalized)) {
      onNavigate('menu');
      onSearch('');
      addMessage('assistant', 'Te abrí el menú completo para que explores las opciones.');
      return;
    }

    if (/promoc|oferta/.test(normalized)) {
      onNavigate('promos');
      addMessage('assistant', 'Te abrí las promociones disponibles.');
      return;
    }

    if (/pedido|seguimiento|rastre|orden/.test(normalized)) {
      onNavigate('order');
      addMessage('assistant', 'Te llevé a seguimiento. Ahí puedes consultar tu pedido con el código y el teléfono que usaste al ordenar.');
      return;
    }

    if (/domicilio|entrega|recoger|mesa/.test(normalized)) {
      addMessage('assistant', 'Al confirmar tu pedido puedes elegir recoger en cafetería, servicio en mesa o domicilio. La disponibilidad puede variar.');
      return;
    }

    if (/horario|abren|cierran|ubicacion|direccion/.test(normalized)) {
      addMessage('assistant', 'No tengo un horario o dirección confirmados para compartir. Si el contacto está configurado, puedo conectarte con el equipo.', null, whatsappUrl
        ? { label: 'Preguntar por WhatsApp', href: whatsappUrl }
        : null);
      return;
    }

    if (/menu|catalog|producto|recom|antojo|frio|cold|helad|dulce|pan|desayun|latte|espresso|matcha|precio/.test(normalized)) {
      if (await tryGenerativeAnswer(message)) return;

      const product = getRecommendedProduct(message, catalog.productos, catalog.categorias);

      if (product) {
        addMessage('assistant', `Te recomiendo ${product.nombre}: ${product.descripcion}. Cuesta ${formatter.format(Number(product.precio))}.`, product);
      } else {
        onNavigate('menu');
        addMessage('assistant', 'Abrí el menú para que explores todas las opciones.');
      }
      return;
    }

    if (await tryGenerativeAnswer(message)) return;

    addMessage('assistant', 'Puedo recomendarte bebidas y alimentos del menú, mostrar promociones, abrir el seguimiento de tu pedido o ayudarte a contactar a la cafetería.');
  }

  async function sendMessage(message = draft) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isThinking) return;

    addMessage('user', trimmedMessage);
    setDraft('');
    setIsThinking(true);

    try {
      await answerMessage(trimmedMessage);
    } finally {
      setIsThinking(false);
    }
  }

  function exploreMenu() {
    onNavigate('menu');
    onSearch('');
    setIsOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }

  function closeAssistant() {
    setIsOpen(false);
    window.requestAnimationFrame(() => launcherRef.current?.focus());
  }

  return (
    <div className="assistant-widget">
      {isOpen && (
        <section className="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title">
          <header className="assistant-header">
            <div className="assistant-avatar" aria-hidden="true">C</div>
            <div className="assistant-heading">
              <h2 id="assistant-title">Guía de {catalog.cafeteria.nombre}</h2>
              <span><i /> {isThinking ? 'Preparando respuesta...' : hasGenerativeAssistant ? 'IA activa · Catálogo' : 'Menú y pedidos'}</span>
            </div>
            <button className="assistant-close" type="button" aria-label="Cerrar asistente" onClick={closeAssistant}>×</button>
          </header>

          <div className="assistant-messages" ref={conversationRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <article className={`assistant-message assistant-message-${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.product && (
                  <button className="assistant-product-action" type="button" onClick={() => onAddToCart(message.product)}>
                    Agregar {message.product.nombre} · {formatter.format(Number(message.product.precio))}
                  </button>
                )}
                {message.action && (
                  <a className="assistant-message-action" href={message.action.href} target="_blank" rel="noreferrer">
                    {message.action.label}
                  </a>
                )}
              </article>
            ))}
          </div>

          <div className="assistant-shortcuts" aria-label="Preguntas sugeridas">
            <button type="button" disabled={isThinking} onClick={() => sendMessage('¿Qué me recomiendas?')}>Recomiéndame algo</button>
            <button type="button" onClick={exploreMenu}>Ver menú</button>
            <button type="button" disabled={isThinking} onClick={() => sendMessage('Quiero seguir mi pedido')}>Seguir pedido</button>
            <button type="button" disabled={isThinking} onClick={() => sendMessage('Quiero hablar por WhatsApp')}>Contactar</button>
          </div>

          <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              aria-label="Escribe tu pregunta"
              placeholder="Escribe tu pregunta..."
              maxLength={280}
              disabled={isThinking}
            />
            <button type="submit" disabled={!draft.trim() || isThinking} aria-label="Enviar mensaje">Enviar</button>
          </form>

          <div className="assistant-contact-links">
            {whatsappUrl ? (
              <>
                <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
                <a href={`tel:+${phone}`}>Llamar</a>
              </>
            ) : (
              <span title="Configura el teléfono de la cafetería para activar WhatsApp">WhatsApp por configurar</span>
            )}
            {email && <a href={`mailto:${email}`}>Correo</a>}
            <button type="button" onClick={() => sendMessage('¿Cuál es su horario y ubicación?')}>Horario y ubicación</button>
          </div>
        </section>
      )}

      <button
        className="assistant-launcher"
        ref={launcherRef}
        type="button"
        aria-label={isOpen ? 'Cerrar guía de la cafetería' : `Abrir guía de ${catalog.cafeteria.nombre}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="assistant-chat-icon" aria-hidden="true"><i /><i /><i /></span>
        <span className="assistant-launcher-label">Ayuda</span>
      </button>
    </div>
  );
}