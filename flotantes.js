/* ════════════════════════════════════════════════════════════════
   FLOTANTES — que no tapen el contenido en el teléfono
   Módulo universal · 15-09-2026

   ── EL PROBLEMA, medido y no supuesto ──────────────────────────
   Se auditaron los 75 sitios a 390×844 abriendo la pestaña Visítanos:

   · NINGUNO tiene desbordamiento horizontal. El responsive está bien.
   · Pero los botones flotantes, anclados abajo a la derecha, se comen
     justo lo que la gente va a leer en esa pestaña:

       Mol Plaza          → tapa viernes, sábado y domingo del horario
       Carbel Coffee      → tapa sábado y domingo
       My Favorite Place  → tapa "Consumo en el local" y EL WHATSAPP
       Cafea              → tapa Instagram, WhatsApp y Google Maps
       Coffee Syria       → tapa cuatro días del horario y la nota del sábado
       Petiit Coffee      → tapa "Servicios"

     En escritorio no se nota porque sobran márgenes laterales. En un
     teléfono la columna ocupa todo el ancho y los botones caen encima
     del texto: se ve roto.

   ── LA SOLUCIÓN ────────────────────────────────────────────────
   En pantallas de teléfono los flotantes dejan de flotar sueltos y se
   apoyan en una franja opaca pegada al borde inferior, y el <body>
   recibe abajo exactamente el alto de esa franja. Así el contenido
   nunca queda debajo de un botón: la franja ocupa su propio espacio,
   igual que la cabecera pegajosa ocupa el suyo arriba.

   Por qué así y no escondiéndolos al hacer scroll: esto es CSS puro y
   determinista. No depende de eventos, no hay estado que se
   desincronice, y el botón está siempre donde el pulgar lo alcanza.

   El color de la franja se toma del propio <body> del sitio, así que
   cada cafetería la ve con su paleta sin tener que tocar sus estilos.

   Es defensivo a propósito: si algo falla, los botones se quedan
   exactamente como están hoy.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MOVIL = 760;
  var ALTO = 74;          // alto de la franja, en px

  /* ⚠️ window.innerWidth devuelve 0 en algunos contenedores embebidos.
     clientWidth es el que siempre responde bien. */
  function ancho() {
    return document.documentElement.clientWidth || window.innerWidth || 0;
  }

  /* El carrito y la pestaña de redes se inyectan después, así que la
     lista se recalcula en vez de guardarse una sola vez. */
  function flotantes() {
    var out = [];
    var todos = document.querySelectorAll('body *');
    for (var i = 0; i < todos.length; i++) {
      var e = todos[i], cs;
      try { cs = getComputedStyle(e); } catch (err) { continue; }
      if (cs.position !== 'fixed') continue;
      if (e.classList.contains('flot-franja')) continue;

      var r = e.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;

      /* Ancho completo = cabecera, menú desplegado o cajón del carrito. */
      if (r.width > 300) continue;

      var alto = document.documentElement.clientHeight || 800;
      if (alto - r.bottom > 180) continue;   // sólo lo pegado abajo

      var cls = (e.className || '').toString();
      if (/loader|burger|nav|head|drawer|panel|backdrop|overlay/i.test(cls)) continue;

      /* Si el padre ya entró, se mueve el padre: el grupo viaja junto. */
      if (out.indexOf(e.parentElement) !== -1) continue;

      out.push(e);
    }
    return out;
  }

  function fondo() {
    try {
      var c = getComputedStyle(document.body).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(0, 0, 0, 0\)/.test(c)) return c;
    } catch (e) { /* da igual */ }
    return '#ffffff';
  }

  function marcar() {
    var f = flotantes(), i;
    for (i = 0; i < f.length; i++) {
      var e = f[i];
      if (e.classList.contains('flot-auto')) continue;
      e.classList.add('flot-auto');
      /* ¿va pegado a la izquierda o a la derecha? Se mira dónde está
         puesto de verdad, no cómo se llama la clase. */
      var r = e.getBoundingClientRect();
      e.classList.add(r.left < ancho() / 2 ? 'flot-izq' : 'flot-der');
    }
    return f.length;
  }

  function pintar() {
    if (document.querySelector('.flot-franja')) return;
    var f = document.createElement('div');
    f.className = 'flot-franja';
    f.setAttribute('aria-hidden', 'true');
    document.body.appendChild(f);
  }

  var estilo = document.createElement('style');
  estilo.setAttribute('data-flotantes', '');
  estilo.textContent =
    ':root{--flot-alto:' + ALTO + 'px;--flot-fondo:' + fondo() + '}' +
    '.flot-franja{display:none}' +
    '@media (max-width:' + MOVIL + 'px){' +
      '.flot-franja{' +
        'display:block;position:fixed;left:0;right:0;bottom:0;z-index:799;' +
        'height:calc(var(--flot-alto) + env(safe-area-inset-bottom,0px));' +
        'background:var(--flot-fondo);' +
        'border-top:1px solid rgba(128,128,128,.22);' +
        'box-shadow:0 -6px 20px -12px rgba(0,0,0,.35);' +
      '}' +
      /* Los botones se apoyan en la franja, centrados en su alto, y en
         fila en vez de en columna. */
      '.flot-auto{' +
        'bottom:calc(env(safe-area-inset-bottom,0px) + (var(--flot-alto) - 48px)/2) !important;' +
        'top:auto !important;z-index:801 !important;' +
        'flex-direction:row !important;align-items:center !important;' +
      '}' +
      '.flot-auto.flot-der{right:14px !important;left:auto !important}' +
      '.flot-auto.flot-izq{left:14px !important;right:auto !important}' +
      /* El hueco de abajo: la franja deja de taparle nada al contenido. */
      'body{padding-bottom:calc(var(--flot-alto) + env(safe-area-inset-bottom,0px)) !important}' +
      /* Los pies que ya reservaban sitio a mano dejan de necesitarlo. */
      '.foot{padding-bottom:clamp(30px,4.5vw,50px) !important}' +
      /* En 375px no caben cuatro círculos y dos píldoras anchas en la
         misma franja: las de delivery pasan a ser sólo el icono. El
         nombre de la plataforma ya lo dice el color y el propio icono,
         y el aria-label sigue completo para quien use lector. */
      '.fab-delivery{width:48px !important;padding:0 !important;border-radius:50% !important;' +
        'justify-content:center !important}' +
      '.fab-delivery span{display:none !important}' +
      /* "Volver arriba" sobra en el teléfono: para eso está el gesto. */
      '.fab-top{display:none !important}' +
      /* Separación pareja entre los botones ya que van en fila. */
      '.flot-auto{gap:10px !important}' +
    '}';

  function arrancar() {
    if (!document.head.contains(estilo)) document.head.appendChild(estilo);
    pintar();
    marcar();
    /* El carrito y la pestaña de redes llegan tarde: dos pasadas más. */
    setTimeout(marcar, 900);
    setTimeout(marcar, 2200);
    window.addEventListener('resize', marcar, { passive: true });
  }

  function seguro() {
    try { arrancar(); } catch (e) { /* nunca romper la página */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', seguro);
  } else {
    seguro();
  }
})();
