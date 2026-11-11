/* components.js — Guía de estilo v1.3
   Comportamiento de los componentes de aplicación (STYLE_GUIDE.md §10), según WAI-ARIA APG:
     ui.tree(ul, opciones)       árbol (role="tree"): foco itinerante, flechas, Inicio/Fin, *, búsqueda por letra
     ui.tabs(lista, opciones)    pestañas (role="tablist"): flechas, Inicio/Fin, Supr para cerrar
     ui.menuButton(botón)        botón con menú (aria-haspopup="menu")
     ui.liveOutput(pre, opciones) salida en vivo (§10.4): sigue el final como un terminal, pausa y lo recién llegado
     data-tooltip="texto"        descripción emergente al pasar el puntero o recibir el foco [WCAG 1.4.13]
   Las opciones que resuelven decisiones de STYLE_GUIDE.md §14 tienen su valor por defecto: rowClick (D1-C),
   onRename/F2 (D3-B), el seguimiento del final (D15-C).
   Cargar después de theme.js, al final del <body> o con defer. Sin textos propios: los pone la aplicación.
*/
(function () {
  // chevron_right de Material Symbols (Apache 2.0), el juego de iconos por defecto (D13-A).
  var CHEVRON = '<svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M530-481 332-679l43-43 241 241-241 241-43-43 198-198Z"/></svg>';
  var ui = window.ui = window.ui || {};
  var nextId = 0;
  function uid(prefix) { nextId += 1; return prefix + '-' + nextId; }

  /* ---------- Árbol ---------- */
  /* Marcado: <ul role="tree" class="tree" aria-label="…"> con <li role="treeitem"> que contienen una
     <div class="tree-row"> (icono, .tree-label, .tree-meta) y, si tienen hijos, un <ul role="group">.
     Los elementos con aria-selected se seleccionan; los que no lo tienen son grupos y se pliegan al activarlos.
     Opciones:
       onSelect(item)                 al seleccionar un elemento
       rowClick                       clic en la fila de un elemento con hijos (D1):
                                      'select' (A), 'toggle' (B) o 'auto' (C: selecciona si tiene aria-selected)
       selectionFollowsFocus          seleccionar al mover el foco (solo si el panel se muestra sin espera)
       onRename(item, texto)          activa F2 en los elementos con data-renamable (D3-B);
                                      devuelve el mensaje de error o null
       renameLabel                    nombre accesible del campo de edición («Nombre»)
       errorPrefix                    prefijo oculto de los errores («Error:») */
  ui.tree = function (root, options) {
    options = options || {};
    function parentItem(item) { var g = item.parentElement; return g && g.getAttribute('role') === 'group' ? g.closest('[role="treeitem"]') : null; }
    function row(item) { return item.querySelector(':scope > .tree-row'); }
    function group(item) { return item.querySelector(':scope > [role="group"]'); }
    function expanded(item) { return item.getAttribute('aria-expanded') === 'true'; }
    // Visible: no está oculto (p. ej. por un filtro) y todos sus antecesores están desplegados.
    function shown(item) {
      var hidden = item.closest('[hidden]');
      if (hidden && root.contains(hidden)) return false;
      for (var p = parentItem(item); p; p = parentItem(p)) if (!expanded(p)) return false;
      return true;
    }
    function visibleItems() { return Array.prototype.filter.call(root.querySelectorAll('[role="treeitem"]'), shown); }

    // Nivel, chevron y aria-expanded según tenga hijos. Se repite tras cambiar el marcado (api.refresh).
    function refresh() {
      root.querySelectorAll('[role="treeitem"]').forEach(function (item) {
        var level = 1;
        for (var p = parentItem(item); p; p = parentItem(p)) level++;
        var r = row(item);
        r.style.setProperty('--level', level);
        var toggle = r.querySelector(':scope > .tree-toggle');
        if (!toggle) {
          toggle = document.createElement('span');
          toggle.className = 'tree-toggle';
          toggle.setAttribute('aria-hidden', 'true');
          r.insertBefore(toggle, r.firstChild);
        }
        var g = group(item);
        if (g && g.querySelector(':scope > [role="treeitem"]:not([hidden])')) {
          toggle.innerHTML = CHEVRON;
          if (!item.hasAttribute('aria-expanded')) item.setAttribute('aria-expanded', 'true');
        } else {
          toggle.innerHTML = '';
          item.removeAttribute('aria-expanded');
        }
        if (item.tabIndex !== 0) item.tabIndex = -1;
        // Los botones de la fila son atajos de ratón: la misma acción está en el panel de detalle.
        r.querySelectorAll('button, a, input').forEach(function (b) { b.tabIndex = -1; });
      });
      keepTabStop();
    }

    // Un único elemento en el orden de tabulación, siempre visible.
    function keepTabStop() {
      var stop = root.querySelector('[role="treeitem"][tabindex="0"]') ||
                 root.querySelector('[role="treeitem"][aria-selected="true"]') ||
                 root.querySelector('[role="treeitem"]');
      while (stop && !shown(stop)) stop = parentItem(stop);
      setTabStop(stop);
    }
    function setTabStop(item) {
      root.querySelectorAll('[role="treeitem"][tabindex="0"]').forEach(function (i) { if (i !== item) i.tabIndex = -1; });
      if (item) item.tabIndex = 0;
    }
    function moveTo(item, selectToo) {
      if (!item) return;
      setTabStop(item);
      item.focus();
      row(item).scrollIntoView({ block: 'nearest' });
      if (selectToo !== false && options.selectionFollowsFocus && item.hasAttribute('aria-selected')) select(item);
    }
    function select(item) {
      if (!item.hasAttribute('aria-selected')) { toggle(item); return; }
      root.querySelectorAll('[aria-selected="true"]').forEach(function (i) { i.setAttribute('aria-selected', 'false'); });
      item.setAttribute('aria-selected', 'true');
      if (options.onSelect) options.onSelect(item);
    }
    function setExpanded(item, open) {
      if (!item.hasAttribute('aria-expanded')) return;
      item.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Si el foco queda dentro de lo plegado, pasa al elemento plegado.
      if (!open && item !== document.activeElement && item.contains(document.activeElement)) moveTo(item, false);
    }
    function toggle(item) { setExpanded(item, !expanded(item)); }
    function setAll(open) {
      root.querySelectorAll('[aria-expanded]').forEach(function (i) { setExpanded(i, open); });
      keepTabStop();
    }
    // Abre los antecesores de un elemento (al seleccionarlo desde fuera del árbol).
    function reveal(item) {
      for (var p = parentItem(item); p; p = parentItem(p)) setExpanded(p, true);
      row(item).scrollIntoView({ block: 'nearest' });
    }

    function rename(item) {
      var r = row(item), label = r.querySelector('.tree-label');
      if (!label || r.querySelector('.tree-input')) return;
      var old = label.textContent;
      var input = document.createElement('input');
      input.className = 'tree-input';
      input.value = old;
      input.setAttribute('aria-label', options.renameLabel || 'Nombre');
      var error = null, closed = false;
      label.hidden = true;
      label.after(input);
      input.focus();
      input.select();
      function close() {
        if (closed) return;  // quitar el campo provoca un blur que volvería a cerrarlo
        closed = true;
        input.remove();
        if (error) error.remove();
        label.hidden = false;
        item.focus();
      }
      function commit() {
        var text = input.value.trim();
        if (text === old) { close(); return; }
        var problem = options.onRename(item, text);
        if (!problem) { label.textContent = text; close(); return; }
        // Se rechaza: se conserva lo escrito y se explica por qué [GOV.UK].
        if (!error) {
          error = document.createElement('p');
          error.className = 'tree-error';
          error.id = uid('tree-error');
          error.setAttribute('role', 'alert');
          error.style.setProperty('--level', r.style.getPropertyValue('--level'));
          r.after(error);
        }
        error.innerHTML = '<span class="visually-hidden"></span> ';
        error.firstChild.textContent = options.errorPrefix || 'Error:';
        error.appendChild(document.createTextNode(problem));
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', error.id);
      }
      input.addEventListener('keydown', function (ev) {
        ev.stopPropagation();
        if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
        else if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      });
      input.addEventListener('blur', function () { if (input.isConnected && !error) commit(); });
    }

    root.addEventListener('click', function (ev) {
      var r = ev.target.closest('.tree-row');
      if (!r || !root.contains(r) || ev.target.closest('.tree-action, .tree-input')) return;
      var item = r.parentElement;
      if (ev.target.closest('.tree-toggle') && item.hasAttribute('aria-expanded')) {
        toggle(item);   // el chevron solo pliega o despliega
        moveTo(item, false);
      } else {
        moveTo(item, false);
        var mode = options.rowClick || 'auto';
        if (mode === 'toggle' && item.hasAttribute('aria-expanded')) toggle(item);
        if (mode !== 'toggle' || item.hasAttribute('aria-selected')) select(item);
      }
    });
    root.addEventListener('dblclick', function (ev) {
      var r = ev.target.closest('.tree-row');
      if (options.rowClick !== 'toggle' && r && !ev.target.closest('.tree-toggle, .tree-action, .tree-input') && r.parentElement.hasAttribute('aria-selected')) toggle(r.parentElement);
    });
    root.addEventListener('keydown', function (ev) {
      var item = ev.target;
      if (item.getAttribute('role') !== 'treeitem' || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var list = visibleItems(), i = list.indexOf(item), handled = true;
      switch (ev.key) {
        case 'ArrowDown': moveTo(list[i + 1]); break;
        case 'ArrowUp': moveTo(list[i - 1]); break;
        case 'ArrowRight':
          if (item.hasAttribute('aria-expanded')) {
            if (!expanded(item)) setExpanded(item, true);
            else moveTo(list[i + 1]);  // el primer hijo visible
          }
          break;
        case 'ArrowLeft':
          if (expanded(item)) setExpanded(item, false);
          else moveTo(parentItem(item));
          break;
        case 'Home': moveTo(list[0]); break;
        case 'End': moveTo(list[list.length - 1]); break;
        case 'Enter': case ' ': select(item); break;
        case '*':
          Array.prototype.forEach.call(item.parentElement.children, function (s) { setExpanded(s, true); });
          break;
        case 'F2':
          if (options.onRename && item.hasAttribute('data-renamable')) rename(item); else handled = false;
          break;
        default:
          // Búsqueda por la primera letra, a partir del siguiente elemento.
          if (ev.key.length === 1 && ev.key.trim()) {
            var key = ev.key.toLocaleLowerCase();
            for (var n = 1; n <= list.length; n++) {
              var candidate = list[(i + n) % list.length];
              var text = candidate.querySelector('.tree-label').textContent.trim().toLocaleLowerCase();
              if (text.indexOf(key) === 0) { moveTo(candidate); break; }
            }
          } else handled = false;
      }
      if (handled) ev.preventDefault();
    });

    refresh();
    return {
      refresh: refresh,
      expandAll: function () { setAll(true); },
      collapseAll: function () { setAll(false); },
      select: function (item) { reveal(item); setTabStop(item); select(item); },
      rename: rename
    };
  };

  /* ---------- Pestañas ---------- */
  /* Marcado: <div role="tablist" class="tablist" aria-label="…"> con <button role="tab" class="tab"
     aria-selected aria-controls="panel"> y <div role="tabpanel" aria-labelledby="pestaña" tabindex="0">.
     Activación automática al moverse con las flechas, salvo data-manual en la lista (paneles que cargan datos).
     Pestañas de documento (.tab-doc) con <span class="tab-close" aria-hidden="true">: Supr las cierra.
     Opciones: onChange(pestaña), onClose(pestaña) → la aplicación confirma y llama a api.remove(pestaña). */
  ui.tabs = function (list, options) {
    options = options || {};
    var manual = list.hasAttribute('data-manual');
    function all() { return Array.prototype.slice.call(list.querySelectorAll('[role="tab"]')); }
    function panel(tab) { return document.getElementById(tab.getAttribute('aria-controls')); }
    function activate(tab) {
      all().forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = panel(t);
        if (p) p.hidden = !on;
      });
      if (options.onChange) options.onChange(tab);
    }
    function close(tab) { if (options.onClose) options.onClose(tab); }
    function remove(tab) {
      var tabs = all(), i = tabs.indexOf(tab), selected = tab.getAttribute('aria-selected') === 'true';
      var p = panel(tab);
      if (p) p.remove();
      tab.remove();
      var next = tabs[i + 1] || tabs[i - 1];
      if (selected && next) { activate(next); next.focus(); }
    }
    list.addEventListener('click', function (ev) {
      var tab = ev.target.closest('[role="tab"]');
      if (!tab) return;
      if (ev.target.closest('.tab-close')) { close(tab); return; }
      activate(tab);
    });
    list.addEventListener('keydown', function (ev) {
      var tab = ev.target.closest('[role="tab"]');
      if (!tab) return;
      var tabs = all(), i = tabs.indexOf(tab), next = null;
      if (ev.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (ev.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (ev.key === 'Home') next = tabs[0];
      else if (ev.key === 'End') next = tabs[tabs.length - 1];
      else if (manual && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); activate(tab); return; }
      else if (ev.key === 'Delete' && tab.querySelector('.tab-close')) { ev.preventDefault(); close(tab); return; }
      else return;
      ev.preventDefault();
      if (manual) tabs.forEach(function (t) { t.tabIndex = t === next ? 0 : -1; });
      else activate(next);
      next.focus();
    });
    var current = list.querySelector('[role="tab"][aria-selected="true"]') || all()[0];
    if (current) activate(current);
    return { activate: activate, remove: remove };
  };

  /* ---------- Botón con menú ---------- */
  /* <div class="menu-wrap"><button aria-haspopup="menu" aria-expanded="false" aria-controls="m">…</button>
     <ul class="menu" id="m" role="menu" popover="manual" hidden><li role="none"><button role="menuitem">…</button></li></ul></div>
     Con popover, el menú se abre en la capa superior y ningún contenedor con overflow lo recorta (STYLE_GUIDE.md §6.5);
     sin soporte de popover, se muestra en su sitio. */
  ui.menuButton = function (button, options) {
    options = options || {};
    var menu = document.getElementById(button.getAttribute('aria-controls'));
    var layer = typeof menu.showPopover === 'function' && menu.hasAttribute('popover');
    if (layer) menu.hidden = false;  // lo oculta el propio popover
    function isOpen() { return layer ? menu.matches(':popover-open') : !menu.hidden; }
    function items() { return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]')); }
    // Bajo el botón, alineado con su borde izquierdo y dentro de la ventana.
    function place() {
      var r = button.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
      menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
      menu.style.top = (r.bottom + h + 4 > window.innerHeight ? Math.max(8, r.top - h - 4) : r.bottom + 4) + 'px';
    }
    function open(focusLast) {
      if (layer) { menu.showPopover(); place(); } else menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      var list = items();
      list.forEach(function (i) { i.tabIndex = -1; });
      (focusLast ? list[list.length - 1] : list[0]).focus();
    }
    function close(returnFocus) {
      if (!isOpen()) return;
      if (layer) menu.hidePopover(); else menu.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (returnFocus) button.focus();
    }
    button.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
    button.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); open(ev.key === 'ArrowUp'); }
    });
    menu.addEventListener('keydown', function (ev) {
      var list = items(), i = list.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') list[(i + 1) % list.length].focus();
      else if (ev.key === 'ArrowUp') list[(i - 1 + list.length) % list.length].focus();
      else if (ev.key === 'Home') list[0].focus();
      else if (ev.key === 'End') list[list.length - 1].focus();
      else if (ev.key === 'Escape') close(true);
      else if (ev.key === 'Tab') close(false);
      else return;
      ev.preventDefault();
    });
    menu.addEventListener('click', function (ev) {
      var item = ev.target.closest('[role="menuitem"]');
      if (!item) return;
      close(true);
      if (options.onChoose) options.onChoose(item);
    });
    document.addEventListener('click', function (ev) {
      if (isOpen() && !menu.contains(ev.target) && !button.contains(ev.target)) close(false);
    });
    // Un menú en una capa fija se separaría de su botón al desplazar o redimensionar: se cierra.
    window.addEventListener('resize', function () { close(false); });
    document.addEventListener('scroll', function (ev) { if (!menu.contains(ev.target)) close(false); }, true);
    return { open: open, close: close };
  };

  /* ---------- Salida en vivo ---------- */
  /* Marcado: <div class="output-wrap"><pre class="output" tabindex="0" aria-label="Salida estándar de …"></pre></div>,
     sin role="log" ni aria-live: un lector de pantalla leería cada línea (STYLE_GUIDE.md §10.4).
     Sigue el final como un terminal (D15-C): deja de seguirlo cuando el usuario sube y vuelve al llegar abajo; nunca
     mueve la vista mientras se lee más arriba. En pausa guarda lo que llega (data-paused en .output-wrap, D14-D) y lo
     muestra al reanudar. Lo recién llegado lleva .output-new unos segundos.
     Opciones: maxLines (las últimas que se conservan; 10000), freshMs (cuánto se marca lo nuevo; 3000, como mucho
       5000), onChange(estado) con { paused, pending, following, lines }, para que la aplicación dibuje la etiqueta de
       la pausa, el interruptor «Seguir el final» y «Ir al final».
     Devuelve append(texto), pause(), resume(), clear(), follow(sí o no) y state(). */
  ui.liveOutput = function (pre, options) {
    options = options || {};
    var maxLines = options.maxLines || 10000, freshMs = Math.min(options.freshMs || 3000, 5000);
    var wrap = pre.parentElement;
    var paused = false, following = true, held = '', heldLines = 0, lines = 0;
    function count(text) { return (text.match(/\n/g) || []).length; }
    function state() { return { paused: paused, pending: heldLines, following: following, lines: lines }; }
    function changed() { if (options.onChange) options.onChange(state()); }
    function toEnd() { pre.scrollTop = pre.scrollHeight; }
    function show(text) {
      if (!text) return;
      var chunk = document.createElement('span');
      chunk.className = 'output-new';
      chunk.textContent = text;
      chunk.dataset.lines = count(text);
      pre.appendChild(chunk);
      lines += +chunk.dataset.lines;
      setTimeout(function () { chunk.classList.remove('output-new'); }, freshMs);
      // Se conservan las últimas líneas: se quitan las más antiguas, de trozo en trozo.
      while (lines > maxLines && pre.firstChild && pre.firstChild !== chunk) {
        lines -= +(pre.firstChild.dataset ? pre.firstChild.dataset.lines : count(pre.firstChild.textContent));
        pre.removeChild(pre.firstChild);
      }
      if (following) toEnd();
    }
    pre.addEventListener('scroll', function () {
      var atEnd = pre.scrollHeight - pre.scrollTop - pre.clientHeight < 4;
      if (atEnd !== following) { following = atEnd; changed(); }
    });
    var api = {
      append: function (text) {
        if (paused) { held += text; heldLines += count(text); changed(); }
        else show(text);
      },
      pause: function () { if (!paused) { paused = true; wrap.setAttribute('data-paused', ''); changed(); } },
      resume: function () {
        if (!paused) return;
        paused = false;
        wrap.removeAttribute('data-paused');
        show(held);
        held = ''; heldLines = 0;
        changed();
      },
      // «Vaciar la vista»: solo lo que se muestra, no lo que se lee.
      clear: function () { pre.textContent = ''; lines = 0; changed(); },
      follow: function (on) { following = !!on; if (following) toEnd(); changed(); },
      state: state
    };
    return api;
  };

  /* ---------- Descripción emergente ---------- */
  /* data-tooltip en cualquier control. Se muestra al pasar el puntero o recibir el foco, se puede recorrer con
     el puntero y se cierra con Escape [WCAG 1.4.13]. Si el texto no repite el nombre accesible, se enlaza con
     aria-describedby, para que también lo oiga quien usa lector de pantalla. Cambiar data-tooltip lo actualiza. */
  var tip = null, owner = null, hideTimer = null;
  function describe(el) {
    var text = el.getAttribute('data-tooltip') || '';
    var id = el.getAttribute('data-tooltip-id');
    var holder = id && document.getElementById(id);
    if (!text || text === el.getAttribute('aria-label')) { if (holder) holder.textContent = ''; return; }
    if (!holder) {
      holder = document.createElement('span');
      holder.className = 'visually-hidden';
      holder.id = uid('tooltip-text');
      el.setAttribute('data-tooltip-id', holder.id);
      document.body.appendChild(holder);  // fuera del control, para no alterar grupos ni :last-child
      var ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      ids.push(holder.id);
      el.setAttribute('aria-describedby', ids.join(' '));
    }
    holder.textContent = text;
    if (el === owner && tip) tip.textContent = text;
  }
  function showTip(el) {
    clearTimeout(hideTimer);
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tooltip';
      tip.setAttribute('aria-hidden', 'true');  // el texto ya llega por aria-describedby
      tip.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      tip.addEventListener('mouseleave', function () { hideSoon(); });
      document.body.appendChild(tip);
    }
    owner = el;
    tip.textContent = el.getAttribute('data-tooltip');
    tip.hidden = false;
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    tip.style.top = (r.bottom + h + 8 > window.innerHeight ? r.top - h - 6 : r.bottom + 6) + 'px';
  }
  function hideTip() { clearTimeout(hideTimer); if (tip) tip.hidden = true; owner = null; }
  function hideSoon() { clearTimeout(hideTimer); hideTimer = setTimeout(hideTip, 150); }
  document.addEventListener('mouseover', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-tooltip]');
    if (el && el.getAttribute('data-tooltip')) showTip(el);
  });
  document.addEventListener('mouseout', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-tooltip]');
    if (el && !el.contains(ev.relatedTarget)) hideSoon();
  });
  document.addEventListener('focusin', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-tooltip]');
    if (el && el.getAttribute('data-tooltip') && el.matches(':focus-visible')) showTip(el);
  });
  document.addEventListener('focusout', function () { hideTip(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && tip && !tip.hidden) hideTip(); });
  function describeAll(scope) { scope.querySelectorAll('[data-tooltip]').forEach(describe); }
  document.addEventListener('DOMContentLoaded', function () {
    describeAll(document);
    new MutationObserver(function (changes) {
      changes.forEach(function (c) {
        if (c.type === 'attributes') describe(c.target);
        else c.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.hasAttribute('data-tooltip')) describe(n); describeAll(n); } });
      });
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-tooltip'] });
  });
})();
