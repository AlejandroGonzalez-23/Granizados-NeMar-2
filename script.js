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

/* ---------- Enlaces de WhatsApp ---------- */
function initWhatsAppLinks() {
  document.querySelectorAll("[data-wa]").forEach((link) => {
    link.setAttribute("href", waLink(link.dataset.wa));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

/* ---------- Botones "Pedir" de cada producto ----------
   Solo estos botones abren WhatsApp. Si el usuario seleccionó un tamaño
   en la tarjeta, el mensaje lo incluye; si no, muestra las presentaciones. */
function initProductButtons() {
  document.querySelectorAll(".product-card .btn-block[data-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const product = button.dataset.product;
      const card = button.closest(".product-card");
      const selected = card ? card.querySelector(".size-option.is-selected") : null;

      let message;
      if (selected) {
        const { size, price } = selected.dataset;
        message =
          `Hola, quiero pedir un granizado de ${product} de ${size} (${money(price)}) 🍧\n` +
          "¿Me confirmas disponibilidad?";
      } else {
        message =
          `Hola, quiero pedir un granizado de ${product} 🍧\n` +
          "Presentaciones: 8 oz $9.000 · 12 oz $11.000 · 16 oz $13.000\n" +
          "¿Me confirmas disponibilidad?";
      }
      window.open(waLink(message), "_blank", "noopener,noreferrer");
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

  function getSelection() {
    const size = form.querySelector('input[name="size"]:checked');
    const sweet = form.querySelector('input[name="sweet"]:checked');
    const toppings = [...form.querySelectorAll('input[name="topping"]:checked')];

    const base = size ? Number(size.dataset.price) : 0;
    const extras = toppings.reduce(
      (sum, topping) => sum + Number(topping.dataset.price),
      0
    );

    return {
      size: size ? size.value : "",
      base,
      flavor1: form.querySelector("#flavor-1").value,
      flavor2: form.querySelector("#flavor-2").value,
      sweet: sweet ? sweet.value : "",
      toppings: toppings.map((topping) => topping.value),
      extras,
      total: base + extras,
    };
  }

  function render() {
    const selection = getSelection();
    totalEl.textContent = money(selection.total);
    return selection;
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  render();

  sendBtn.addEventListener("click", () => {
    const s = render();
    const lines = [
      "Hola, quiero pedir este granizado 🍧",
      "",
      `• Tamaño: ${s.size} (${money(s.base)})`,
      `• Sabor principal: ${s.flavor1}`,
      `• Segundo sabor: ${s.flavor2 || "sin segundo sabor"}`,
      `• Nivel de dulce: ${s.sweet}`,
      `• Toppings: ${s.toppings.length ? s.toppings.join(", ") : "ninguno"}`,
      "",
      `Total estimado: ${money(s.total)}`,
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
  initBuilder();
  initFlavorFilters();
  initNav();
  initYear();
});
