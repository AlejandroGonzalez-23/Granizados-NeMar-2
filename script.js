/* =========================================================
   Granizados NeMar — interacciones
   ---------------------------------------------------------
   ⚠️ CAMBIA ESTE NÚMERO por el WhatsApp real del negocio.
   Formato: código de país + número, sin +, sin espacios.
   Ejemplo Colombia: 573001234567
   ========================================================= */
const WHATSAPP = "573001234567";

const money = (value) =>
  "$" + Number(value).toLocaleString("es-CO", { maximumFractionDigits: 0 });

function waLink(message) {
  return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(message);
}

const MIN_QTY = 1;
const MAX_QTY = 20;

/* Texto natural para el pedido: "un granizado" / "3 granizados" */
function cantidadTexto(qty) {
  return qty === 1 ? "un granizado" : `${qty} granizados`;
}

/* Lee y aplica + / - en un control de cantidad, devolviendo el nuevo valor */
function cambiarCantidad(control, action) {
  const out = control.querySelector(".qty-value");
  const actual = Number(out.textContent) || MIN_QTY;
  const nuevo = Math.min(
    MAX_QTY,
    Math.max(MIN_QTY, actual + (action === "inc" ? 1 : -1))
  );
  out.textContent = String(nuevo);

  control.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.disabled =
      (btn.dataset.qtyAction === "dec" && nuevo <= MIN_QTY) ||
      (btn.dataset.qtyAction === "inc" && nuevo >= MAX_QTY);
  });

  return nuevo;
}

/* ---------- Enlaces de WhatsApp ---------- */
function initWhatsAppLinks() {
  document.querySelectorAll("[data-wa]").forEach((link) => {
    link.setAttribute("href", waLink(link.dataset.wa));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

/* ---------- Botones "Pedir" de cada producto ----------
   Solo estos botones abren WhatsApp. El mensaje incluye la cantidad
   elegida y, si hay un tamaño seleccionado, su precio y el total. */
function initProductButtons() {
  document.querySelectorAll(".product-card .btn-block[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = button.dataset.product;
      const card = button.closest(".product-card");
      const selected = card ? card.querySelector(".size-option.is-selected") : null;
      const out = card ? card.querySelector(".qty-control .qty-value") : null;
      const qty = Math.min(
        MAX_QTY,
        Math.max(MIN_QTY, Number(out && out.textContent) || MIN_QTY)
      );

      let message;
      if (selected) {
        const { size, price } = selected.dataset;
        const unit = Number(price);
        message =
          `Hola, quiero pedir ${cantidadTexto(qty)} de ${product} de ${size} (${money(unit)} c/u) 🍧\n` +
          (qty > 1 ? `Total estimado: ${money(unit * qty)}\n` : "") +
          "¿Me confirmas disponibilidad?";
      } else {
        message =
          `Hola, quiero pedir ${cantidadTexto(qty)} de ${product} 🍧\n` +
          "Presentaciones: 8 oz $9.000 · 12 oz $11.000 · 16 oz $13.000\n" +
          (qty > 1 ? `Cantidad: ${qty}\n` : "") +
          "¿Me confirmas disponibilidad?";
      }
      window.open(waLink(message), "_blank", "noopener,noreferrer");
    });
  });
}

/* ---------- Cantidad en cada tarjeta ---------- */
function initCardQuantities() {
  document.querySelectorAll(".product-card .qty-control").forEach((control) => {
    control.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.disabled = btn.dataset.qtyAction === "dec";
      btn.addEventListener("click", () => cambiarCantidad(control, btn.dataset.qtyAction));
    });
  });
}

/* ---------- Elegir tamaño desde la tarjeta ----------
   Marca visualmente la opción elegida, sin abrir WhatsApp. */
function initSizeOptions() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const sizes = [...card.querySelectorAll(".size-option")];

    sizes.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        sizes.forEach((option) => {
          const active = option === button;
          option.classList.toggle("is-selected", active);
          option.setAttribute("aria-pressed", String(active));
        });
      });
    });
  });
}

/* ---------- Configurador de pedido ---------- */
function initBuilder() {
  const form = document.getElementById("builder");
  if (!form) return;

  const totalEl = document.getElementById("builder-total");
  const sendBtn = document.getElementById("builder-send");
  const qtyControl = form.querySelector(".qty-control");

  function getSelection() {
    const size = form.querySelector('input[name="size"]:checked');
    const sweet = form.querySelector('input[name="sweet"]:checked');
    const toppings = [...form.querySelectorAll('input[name="topping"]:checked')];
    const qtyOut = qtyControl ? qtyControl.querySelector(".qty-value") : null;

    const base = size ? Number(size.dataset.price) : 0;
    const extras = toppings.reduce(
      (sum, topping) => sum + Number(topping.dataset.price),
      0
    );
    const qty = Math.min(
      MAX_QTY,
      Math.max(MIN_QTY, Number(qtyOut && qtyOut.textContent) || MIN_QTY)
    );

    return {
      qty,
      size: size ? size.value : "",
      base,
      flavor1: form.querySelector("#flavor-1").value,
      flavor2: form.querySelector("#flavor-2").value,
      sweet: sweet ? sweet.value : "",
      toppings: toppings.map((topping) => topping.value),
      extras,
      unit: base + extras,
    };
  }

  function render() {
    const selection = getSelection();
    totalEl.textContent = money(selection.unit * selection.qty);
    if (qtyControl) {
      qtyControl.querySelectorAll(".qty-btn").forEach((btn) => {
        btn.disabled =
          (btn.dataset.qtyAction === "dec" && selection.qty <= MIN_QTY) ||
          (btn.dataset.qtyAction === "inc" && selection.qty >= MAX_QTY);
      });
    }
    return selection;
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("click", (event) => {
    const btn = event.target.closest(".qty-btn");
    if (!btn || !qtyControl) return;
    cambiarCantidad(qtyControl, btn.dataset.qtyAction);
    render();
  });
  render();

  sendBtn.addEventListener("click", () => {
    const s = render();
    const total = s.unit * s.qty;
    const lines = [
      `Hola, quiero pedir ${cantidadTexto(s.qty)} con estos detalles 🍧`,
      "",
      `• Cantidad: ${s.qty}`,
      `• Tamaño: ${s.size} (${money(s.base)})`,
      `• Sabor principal: ${s.flavor1}`,
      `• Segundo sabor: ${s.flavor2 || "sin segundo sabor"}`,
      `• Nivel de dulce: ${s.sweet}`,
      `• Toppings: ${s.toppings.length ? s.toppings.join(", ") : "ninguno"}`,
      "",
      `• Precio por unidad: ${money(s.unit)}`,
      `Total estimado: ${money(total)}` +
        (s.qty > 1 ? ` (${s.qty} × ${money(s.unit)})` : ""),
    ];

    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  });
}

/* ---------- Filtro por categoría de sabor ---------- */
function initFlavorFilters() {
  const chips = [...document.querySelectorAll(".filter-chip")];
  const cards = [...document.querySelectorAll(".product-card")];
  const groups = [...document.querySelectorAll(".menu-group")];
  const empty = document.getElementById("filter-empty");
  if (!chips.length || !cards.length) return;

  function apply(filter) {
    let visibleCount = 0;

    cards.forEach((card) => {
      const cats = (card.dataset.cats || "").split(/\s+/);
      const show = filter === "todos" || cats.includes(filter);
      card.hidden = !show;
      if (show) visibleCount += 1;
    });

    groups.forEach((group) => {
      const hasVisible = [...group.querySelectorAll(".product-card")].some(
        (card) => !card.hidden
      );
      group.hidden = !hasVisible;
    });

    chips.forEach((chip) => {
      const active = chip.dataset.filter === filter;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });

    if (empty) empty.hidden = visibleCount > 0;
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => apply(chip.dataset.filter));
  });

  apply("todos");
}

/* ---------- Navegación móvil ---------- */
function initNav() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  if (!header || !toggle || !nav) return;

  const closeNav = () => {
    header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeNav();
  });
}

/* ---------- Año del footer ---------- */
function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  initWhatsAppLinks();
  initProductButtons();
  initSizeOptions();
  initCardQuantities();
  initBuilder();
  initFlavorFilters();
  initNav();
  initYear();
});
