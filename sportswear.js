const PRODUCT_LIST = [
  { id: "jersey", name: "Team Jersey", price: 250, description: "Lightweight match-day jersey. Made to move.", tag: "BESTSELLER", kind: "jersey" },
  { id: "sleeveless", name: "Sleeveless Jersey", price: 250, description: "Freedom of movement for training and match play.", tag: "SLEEVELESS", kind: "sleeveless" },
  { id: "shorts", name: "Match Shorts", price: 200, description: "Easy-fit performance shorts for every play.", tag: "PERFORMANCE", kind: "shorts" },
  { id: "tee", name: "Training Tee", price: 150, description: "Your everyday training layer, in soft tech-knit.", tag: "EVERYDAY", kind: "tee" },
  { id: "warmer", name: "Warmer", price: 250, description: "Warmup-ready coverage for training and travel.", tag: "TEAMWEAR", kind: "warmer" }
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const CART_KEY = "lineup-sportswear-cart-v1";
const ORDER_KEY = "lineup-sportswear-last-order-v1";
const defaultCustomization = () => ({
  teamName: "YOUR TEAM", playerName: "", surname: "PLAYER", number: "10",
  frontNumber: false, cut: "short", size: "M", quantity: 1, jerseyColor: "#f05a24", secondaryColor: "#111111", fontStyle: "bold", template: "classic", designs: []
});
const JERSEY_TEMPLATES = [
  { id: "classic", name: "Classic", primary: "#f05a24", secondary: "#111111", fontStyle: "bold" },
  { id: "split", name: "Half Split", primary: "#1f4b99", secondary: "#f4f4f1", fontStyle: "athletic" },
  { id: "voltage", name: "Voltage", primary: "#111111", secondary: "#ffb800", fontStyle: "athletic" },
  { id: "court", name: "Courtline", primary: "#f4f4f1", secondary: "#2e8b57", fontStyle: "bold" }
];
const app = document.getElementById("app-main");
let cart = loadCart();
let custom = defaultCustomization();
let previewSide = "front";
let toastTimer;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    const cleaned = saved.filter((item) => item?.productId !== "polo");
    if (cleaned.length !== saved.length) localStorage.setItem(CART_KEY, JSON.stringify(cleaned));
    return cleaned;
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    return [];
  }
}

function money(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function notify(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function storeCart(nextCart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    cart = nextCart;
    updateCartBadge();
    return true;
  } catch (error) {
    console.error("Could not save the cart to this browser.", error);
    notify("Your browser could not save the cart. Try removing a large design image.");
    return false;
  }
}

function updateCartBadge() {
  const count = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = String(count);
}

function garmentArtwork(kind, side) {
  const templates = {
    jersey: { front: "tee.png", back: "tee-back.png", label: "jersey" },
    sleeveless: { front: "tank.png", back: "tank-back.png", label: "sleeveless jersey" },
    shorts: { front: "shorts.png", back: "shorts-back.png", label: "sports shorts" },
    tee: { front: "tee.png", back: "tee-back.png", label: "training t-shirt" },
    warmer: { front: "tee.png", back: "tee-back.png", label: "team warmer" }
  };
  const template = templates[kind] || templates.jersey;
  return `<img class="garment-image" src="sportswear-assets/${template[side]}" alt="Blank ${template.label}, ${side} view">`;
}

function productArt(product) {
  return `<div class="product-art"><span class="product-art-label">${product.tag}</span><div class="product-template-frame">${garmentArtwork(product.kind, "front")}</div></div>`;
}

function renderJersey(data, side, draggable = false) {
  const designs = (data.designs || []).filter((design) => design.side === side);
  const copy = side === "front"
    ? `<div class="jersey-text jersey-team">${escapeHTML(data.teamName || "")}</div>${data.playerName ? `<div class="jersey-text jersey-player">${escapeHTML(data.playerName)}</div>` : ""}${data.frontNumber && data.number ? `<div class="jersey-text jersey-number">${escapeHTML(data.number)}</div>` : ""}`
    : `<div class="jersey-text jersey-surname">${escapeHTML(data.surname || "")}</div>${data.number ? `<div class="jersey-text jersey-number back-number">${escapeHTML(data.number)}</div>` : ""}`;
  const stickers = designs.map((design) => `<img class="jersey-design" alt="Uploaded design" draggable="false" src="${design.data}" style="left:${design.x}%;top:${design.y}%;width:${design.size}%" ${draggable ? `data-design-id="${escapeHTML(design.id)}"` : ""}>`).join("");
  const cut = data.cut === "sleeveless" ? "sleeveless" : "jersey";
  const cutShape = data.cut === "sleeveless" ? "sleeveless" : "short";
  return `<div class="jersey-stage cut-${cutShape} template-${escapeHTML(data.template || "classic")}" data-preview-side="${side}" style="--jersey-color:${escapeHTML(data.jerseyColor || "#f05a24")};--jersey-secondary:${escapeHTML(data.secondaryColor || "#111111")}">${garmentArtwork(cut, side)}${copy}${stickers}</div>`;
}

function sizeOptions(selected = "M") {
  return SIZES.map((size) => `<option value="${size}" ${size === selected ? "selected" : ""}>${size}</option>`).join("");
}

function renderHome() {
  const heroCustom = { ...defaultCustomization(), teamName: "SPORTIFY", playerName: "", surname: "YOUR TEAM", number: "10" };
  const standardCategories = PRODUCT_LIST.filter((product) => product.kind !== "sleeveless");
  const sleevelessCategories = PRODUCT_LIST.filter((product) => product.kind === "sleeveless");
  app.innerHTML = `<section class="hero">
    <div class="hero-copy"><p class="eyebrow">Custom sportswear</p><h1>Design<br><em>your game.</em></h1><p>Create your identity with performance-ready teamwear. Choose the cut, colors, names, numbers, and artwork.</p><a class="button button-lime" href="#customize">Create your jersey <span aria-hidden="true">↗</span></a></div>
    <div class="hero-art">${renderJersey(heroCustom, "front", false)}${renderJersey(heroCustom, "back", false)}<span class="hero-art-label">YOUR CREW. YOUR COLORS.</span></div>
  </section>
  <section class="section">
    <div class="section-heading"><div><p class="eyebrow">Find your fit</p><h2>Kit for every role.</h2></div><p>From first whistle to final point, get gear that works hard and looks like your team.</p></div>
    <div class="category-group category-group-standard"><h3>Jerseys &amp; essentials</h3><div class="category-grid">${standardCategories.map((product) => `<a class="category-card" href="#shop"><strong>${product.name}</strong><span>Explore the collection ↗</span><div class="category-icon">${garmentArtwork(product.kind, "front")}</div></a>`).join("")}</div></div>
    <div class="category-group category-group-sleeveless"><h3>Sleeveless collection</h3><div class="category-grid">${sleevelessCategories.map((product) => `<a class="category-card" href="#shop"><strong>${product.name}</strong><span>Explore the collection ↗</span><div class="category-icon">${garmentArtwork(product.kind, "front")}</div></a>`).join("")}</div></div>
  </section>
  <section class="manifesto"><h2>One team. One look.<br>All yours.</h2><p>Pick your fit, add your colors, and put your name on it. SPORTIFY makes teamwear feel like it belongs to you — because it does.</p></section>`;
}

function renderShop() {
  const sleevelessProducts = PRODUCT_LIST.filter((product) => product.kind === "sleeveless");
  const otherProducts = PRODUCT_LIST.filter((product) => product.kind !== "sleeveless");
  const productCard = (product) => `<article class="product-card">
      ${productArt(product)}
      <div class="product-info"><div class="product-name-line"><h3>${product.name}</h3><span class="product-price">${money(product.price)}</span></div><p class="product-desc">${product.description}</p>
      <div class="product-controls"><label><span class="field-label">Size</span><select class="select" data-product-size="${product.id}">${sizeOptions()}</select></label><label><span class="field-label">Quantity</span><select class="select" data-product-qty="${product.id}">${[1, 2, 3, 4, 5].map((n) => `<option value="${n}">${n}</option>`).join("")}</select></label></div>
      <div class="product-actions"><button class="button button-small" type="button" data-add-product="${product.id}">Add to cart</button>${product.id === "jersey" || product.id === "sleeveless" ? `<a class="button-link" href="#customize">Customize this jersey ↗</a>` : ""}</div>
      </div></article>`;
  app.innerHTML = `<section class="page-shell"><p class="eyebrow">The collection</p><h1 class="page-title">Shop the lineup.</h1><p class="page-intro">Performance staples and personalized team kits, ready for the next game.</p>
    <section class="shop-section"><div class="shop-section-heading"><p class="eyebrow">Everyday &amp; matchwear</p><h2>Jerseys &amp; essentials</h2></div><div class="product-grid">${otherProducts.map(productCard).join("")}</div></section>
    <section class="shop-section shop-section-sleeveless"><div class="shop-section-heading"><p class="eyebrow">Maximum mobility</p><h2>Sleeveless jerseys</h2></div><div class="product-grid">${sleevelessProducts.map(productCard).join("")}</div></section>
  </section>`;
  app.querySelectorAll("[data-add-product]").forEach((button) => button.addEventListener("click", () => {
    const product = PRODUCT_LIST.find((item) => item.id === button.dataset.addProduct);
    const size = app.querySelector(`[data-product-size="${product.id}"]`).value;
    const quantity = Number(app.querySelector(`[data-product-qty="${product.id}"]`).value);
    addCartItem({ productId: product.id, size, quantity, customization: product.id === "jersey" ? defaultCustomization() : null });
  }));
}

function renderCustomize() {
  if (!custom) custom = defaultCustomization();
  app.innerHTML = `<section class="page-shell"><p class="eyebrow">Design your kit</p><h1 class="page-title">Your jersey. Your rules.</h1><p class="page-intro">Add the details, drop on your artwork, and see it come to life.</p>
  <div class="customize-layout">
    <section class="editor-card" aria-label="Jersey customization form"><h2>Build your jersey</h2>
      <div class="form-section"><h3>Predesign templates</h3><div class="template-grid" id="jersey-template-list">${JERSEY_TEMPLATES.map((template) => `<button class="template-card ${custom.template === template.id ? "selected" : ""}" type="button" data-template="${template.id}" aria-label="Use ${template.name} template"><span class="template-preview template-preview-${template.id}" style="--template-primary:${template.primary};--template-secondary:${template.secondary}"><span></span></span><strong>${template.name}</strong></button>`).join("")}</div></div>
      <div class="form-section"><h3>Jersey layout</h3><div class="form-grid"><label><span class="field-label">Cut</span><select class="select" id="jersey-cut"><option value="short" ${custom.cut !== "sleeveless" ? "selected" : ""}>Short sleeve</option><option value="sleeveless" ${custom.cut === "sleeveless" ? "selected" : ""}>Sleeveless</option></select></label><label><span class="field-label">Text style</span><select class="select" id="font-style"><option value="bold" ${custom.fontStyle !== "athletic" ? "selected" : ""}>Bold</option><option value="athletic" ${custom.fontStyle === "athletic" ? "selected" : ""}>Athletic</option></select></label></div></div>
      <div class="form-section"><h3>Colors</h3><div class="form-grid"><label><span class="field-label">Primary color</span><input class="field color-field" id="jersey-color" type="color" value="${escapeHTML(custom.jerseyColor)}"></label><label><span class="field-label">Secondary color</span><input class="field color-field" id="secondary-color" type="color" value="${escapeHTML(custom.secondaryColor)}"></label></div></div>
      <div class="form-section"><h3>Front details</h3><div class="form-grid">
        <label class="form-field"><span class="field-label">Team name <span aria-hidden="true">*</span></span><input class="field" id="teamName" maxlength="18" value="${escapeHTML(custom.teamName)}" autocomplete="off"><span class="form-error" id="teamName-error"></span></label>
        <label class="form-field"><span class="field-label">Player name <span class="field-label">(optional)</span></span><input class="field" id="playerName" maxlength="18" value="${escapeHTML(custom.playerName)}" autocomplete="off"><span class="form-error" id="playerName-error"></span></label>
      </div><label class="toggle-row"><input type="checkbox" id="frontNumber" ${custom.frontNumber ? "checked" : ""}> Show number on front, too</label></div>
      <div class="form-section"><h3>Back details</h3><div class="form-grid">
        <label class="form-field"><span class="field-label">Surname</span><input class="field" id="surname" maxlength="18" value="${escapeHTML(custom.surname)}" autocomplete="off"><span class="form-error" id="surname-error"></span></label>
        <label class="form-field"><span class="field-label">Number (0–99) <span aria-hidden="true">*</span></span><input class="field" id="number" inputmode="numeric" maxlength="2" value="${escapeHTML(custom.number)}" autocomplete="off"><span class="form-error" id="number-error"></span></label>
      </div></div>
      <div class="form-section"><h3>Make it yours</h3><label class="upload-label" for="design-upload">＋ &nbsp; Upload a design (PNG or JPG, max 5 MB each · up to 3)</label><input class="upload-input" id="design-upload" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" multiple><div class="design-list" id="design-list"></div></div>
      <div class="editor-actions"><button class="button button-outline button-small" id="save-design" type="button">Save design</button><button class="button button-outline button-small" id="load-design" type="button">Load saved</button><button class="button button-outline button-small" id="download-design" type="button">Download preview</button><button class="button-link" id="reset-design" type="button">Reset</button></div>
      <div class="editor-bottom"><label><span class="field-label">Jersey size</span><select class="select" id="custom-size">${sizeOptions(custom.size)}</select></label>
        <label><span class="field-label">Quantity</span><select class="select" id="custom-quantity">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${Number(custom.quantity) === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <button class="button" id="custom-add" type="button">Add jersey · ${money(64 * custom.quantity)}</button></div>
    </section>
    <section class="preview-card" aria-label="Live jersey preview"><div class="preview-heading"><h2>Live preview</h2><div class="view-switch" role="group" aria-label="Jersey side"><button type="button" data-side="front" class="${previewSide === "front" ? "selected" : ""}">Front</button><button type="button" data-side="back" class="${previewSide === "back" ? "selected" : ""}">Back</button></div></div>
      <div class="preview-stage-wrap" id="preview-stage">${renderJersey(custom, previewSide, true)}</div><p class="preview-hint">Drag your design to position it on the jersey.</p></section>
  </div></section>`;
  ["teamName", "playerName", "surname", "number"].forEach((key) => {
    const input = document.getElementById(key);
    input.addEventListener("input", () => {
      custom[key] = input.value;
      validateCustomization(false);
      refreshPreview();
    });
    document.querySelectorAll("[data-template]").forEach((button) => button.addEventListener("click", () => {
      const template = JERSEY_TEMPLATES.find((item) => item.id === button.dataset.template);
      if (!template) return;
      custom.template = template.id;
      custom.jerseyColor = template.primary;
      custom.secondaryColor = template.secondary;
      custom.fontStyle = template.fontStyle;
      document.getElementById("jersey-color").value = template.primary;
      document.getElementById("secondary-color").value = template.secondary;
      document.getElementById("font-style").value = template.fontStyle;
      document.querySelectorAll("[data-template]").forEach((item) => item.classList.toggle("selected", item === button));
      refreshPreview();
    }));
  });
  document.getElementById("frontNumber").addEventListener("change", (event) => {
    custom.frontNumber = event.target.checked;
    refreshPreview();
  });
  document.getElementById("jersey-cut").addEventListener("change", (event) => {
    custom.cut = event.target.value;
    refreshPreview();
    notify(custom.cut === "sleeveless" ? "Sleeveless jersey selected." : "Short-sleeve jersey selected.");
  });
  document.getElementById("jersey-color").addEventListener("input", (event) => {
    custom.jerseyColor = event.target.value;
    refreshPreview();
  });
  document.getElementById("secondary-color").addEventListener("input", (event) => {
    custom.secondaryColor = event.target.value;
    refreshPreview();
  });
  document.getElementById("font-style").addEventListener("change", (event) => {
    custom.fontStyle = event.target.value;
    refreshPreview();
  });
  document.getElementById("custom-size").addEventListener("change", (event) => { custom.size = event.target.value; });
  document.getElementById("custom-quantity").addEventListener("change", (event) => {
    custom.quantity = Number(event.target.value);
    document.getElementById("custom-add").textContent = `Add jersey · ${money(64 * custom.quantity)}`;
  });
  document.getElementById("custom-add").addEventListener("click", () => {
    if (!validateCustomization(true)) return;
    addCartItem({ productId: "jersey", size: custom.size, quantity: Number(custom.quantity), customization: structuredClone(custom) });
  });
  document.getElementById("save-design").addEventListener("click", saveCurrentDesign);
  document.getElementById("load-design").addEventListener("click", loadSavedDesign);
  document.getElementById("download-design").addEventListener("click", downloadDesignPreview);
  document.getElementById("reset-design").addEventListener("click", () => {
    custom = defaultCustomization();
    previewSide = "front";
    renderCustomize();
    notify("Jersey reset.");
  });
  document.querySelectorAll("[data-side]").forEach((button) => button.addEventListener("click", () => {
    previewSide = button.dataset.side;
    refreshPreview();
  }));
  document.getElementById("design-upload").addEventListener("change", (event) => handleUploads(event.target.files));
  renderDesignControls();
  bindDesignDragging();
}

function validateCustomization(showAll) {
  const errors = {
    teamName: custom.teamName.trim() ? "" : "Team name is required.",
    playerName: custom.playerName.length > 18 ? "Use 18 characters or fewer." : "",
    surname: custom.surname.length > 18 ? "Use 18 characters or fewer." : "",
    number: /^(?:[0-9]|[1-9][0-9])$/.test(custom.number) ? "" : "Enter a number from 0 to 99."
  };
  let valid = true;
  Object.entries(errors).forEach(([key, message]) => {
    const field = document.getElementById(`${key}-error`);
    if (field) field.textContent = showAll || message ? message : "";
    if (message) valid = false;
  });
  return valid;
}

function refreshPreview() {
  const stage = document.getElementById("preview-stage");
  if (!stage) return;
  stage.innerHTML = renderJersey(custom, previewSide, true);
  stage.classList.toggle("athletic-text", custom.fontStyle === "athletic");
  document.querySelectorAll("[data-side]").forEach((button) => button.classList.toggle("selected", button.dataset.side === previewSide));
  bindDesignDragging();
}

function renderDesignControls() {
  const list = document.getElementById("design-list");
  if (!list) return;
  list.innerHTML = custom.designs.map((design) => `<div class="design-row">
    <img src="${design.data}" alt="Design thumbnail">
    <div class="design-controls"><span class="design-name">${escapeHTML(design.name)}</span><div class="design-control-line">
      <select aria-label="Place ${escapeHTML(design.name)} on" data-design-side="${design.id}"><option value="front" ${design.side === "front" ? "selected" : ""}>Front</option><option value="back" ${design.side === "back" ? "selected" : ""}>Back</option></select>
      <input type="range" min="10" max="40" value="${design.size}" aria-label="Resize ${escapeHTML(design.name)}" data-design-size="${design.id}"></div></div>
    <button class="remove-design" type="button" aria-label="Remove ${escapeHTML(design.name)}" data-remove-design="${design.id}">×</button></div>`).join("");
  list.querySelectorAll("[data-design-side]").forEach((select) => select.addEventListener("change", () => {
    const design = custom.designs.find((item) => item.id === select.dataset.designSide);
    design.side = select.value;
    refreshPreview();
  }));
  list.querySelectorAll("[data-design-size]").forEach((range) => range.addEventListener("input", () => {
    const design = custom.designs.find((item) => item.id === range.dataset.designSize);
    design.size = Number(range.value);
    refreshPreview();
  }));
  list.querySelectorAll("[data-remove-design]").forEach((button) => button.addEventListener("click", () => {
    custom.designs = custom.designs.filter((item) => item.id !== button.dataset.removeDesign);
    renderDesignControls();
    refreshPreview();
  }));
}

function bindDesignDragging() {
  document.querySelectorAll(".jersey-design[data-design-id]").forEach((image) => {
    image.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const design = custom.designs.find((item) => item.id === image.dataset.designId);
      const stage = image.closest(".jersey-stage");
      const rect = stage.getBoundingClientRect();
      const move = (pointerEvent) => {
        design.x = Math.max(12, Math.min(88, ((pointerEvent.clientX - rect.left) / rect.width) * 100));
        design.y = Math.max(12, Math.min(88, ((pointerEvent.clientY - rect.top) / rect.height) * 100));
        image.style.left = `${design.x}%`;
        image.style.top = `${design.y}%`;
      };
      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
    });
  });
}

function saveCurrentDesign() {
  const key = "sportify-saved-design-v1";
  try {
    localStorage.setItem(key, JSON.stringify(custom));
    notify("Your jersey design was saved.");
  } catch (error) {
    console.error("Could not save the jersey design.", error);
    notify("The design could not be saved in this browser.");
  }
}

function loadSavedDesign() {
  try {
    const saved = JSON.parse(localStorage.getItem("sportify-saved-design-v1") || "null");
    if (!saved) {
      notify("No saved jersey design was found.");
      return;
    }
    custom = { ...defaultCustomization(), ...saved };
    previewSide = "front";
    renderCustomize();
    notify("Saved jersey design loaded.");
  } catch (error) {
    console.error("Could not load the saved jersey design.", error);
    notify("The saved design could not be opened.");
  }
}

function downloadDesignPreview() {
  const side = previewSide === "back" ? "Back" : "Front";
  const copy = previewSide === "back"
    ? `${escapeHTML(custom.surname)} ${escapeHTML(custom.number)}`
    : `${escapeHTML(custom.teamName)}${custom.frontNumber ? ` ${escapeHTML(custom.number)}` : ""}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
    <rect width="900" height="700" fill="#eef1ea"/>
    <text x="450" y="55" text-anchor="middle" fill="#17211d" font-family="Arial, sans-serif" font-size="22" font-weight="700">${side.toUpperCase()} JERSEY PREVIEW</text>
    <path d="M260 150 L340 110 Q450 190 560 110 L640 150 L700 260 L620 330 L585 295 L585 590 L315 590 L315 295 L280 330 L200 260 Z" fill="${escapeHTML(custom.jerseyColor)}" stroke="${escapeHTML(custom.secondaryColor)}" stroke-width="12"/>
    <text x="450" y="380" text-anchor="middle" fill="#ffffff" stroke="${escapeHTML(custom.secondaryColor)}" stroke-width="3" paint-order="stroke" font-family="Arial, sans-serif" font-size="72" font-weight="900">${copy}</text>
  </svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `sportify-jersey-${previewSide}.svg`;
  link.click();
  URL.revokeObjectURL(url);
  notify("Jersey preview downloaded.");
}

async function handleUploads(files) {
  const selected = Array.from(files || []);
  const input = document.getElementById("design-upload");
  if (custom.designs.length + selected.length > 3) {
    notify("You can add up to 3 design images.");
    input.value = "";
    return;
  }
  for (const file of selected) {
    if (!["image/png", "image/jpeg"].includes(file.type) || !/\.(png|jpe?g)$/i.test(file.name)) {
      notify(`${file.name}: choose a PNG or JPG image.`);
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify(`${file.name}: the maximum file size is 5 MB.`);
      continue;
    }
    try {
      const data = await compressImage(file);
      custom.designs.push({ id: crypto.randomUUID(), name: file.name, data, side: previewSide, x: 50, y: 58, size: 24 });
      renderDesignControls();
      refreshPreview();
    } catch (error) {
      console.error("Could not prepare the uploaded design.", error);
      notify(`${file.name}: this image could not be opened.`);
    }
  }
  input.value = "";
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Image read failed."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Image decode failed."));
      image.onload = () => {
        const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", .82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function addCartItem(item) {
  const product = PRODUCT_LIST.find((entry) => entry.id === item.productId);
  const newItem = { id: crypto.randomUUID(), ...item, name: product.name, price: product.price };
  if (storeCart([...cart, newItem])) {
    notify(`${product.name} added to your cart.`);
    if (location.hash === "#cart") renderCart();
  }
}

function cartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cart.length ? 8 : 0;
  return { subtotal, shipping, total: subtotal + shipping };
}

function renderCart() {
  if (!cart.length) {
    app.innerHTML = `<section class="page-shell"><p class="eyebrow">Your bag</p><h1 class="page-title">Cart.</h1><div class="empty-state"><h2>Your cart is waiting for its first lineup.</h2><p>Find the gear that gets your team ready for game day.</p><a class="button" href="#shop">Shop the collection</a></div></section>`;
    return;
  }
  const totals = cartTotals();
  app.innerHTML = `<section class="page-shell"><p class="eyebrow">Your bag · ${cart.reduce((sum, item) => sum + item.quantity, 0)} items</p><h1 class="page-title">Cart.</h1><div class="cart-layout"><div class="cart-list">${cart.map((item) => {
    const isJersey = item.productId === "jersey";
    const c = item.customization;
    const detail = isJersey && c ? `<p class="custom-detail">Team: ${escapeHTML(c.teamName || "—")} · Player: ${escapeHTML(c.playerName || "—")}<br>Surname: ${escapeHTML(c.surname || "—")} · Number: ${escapeHTML(c.number || "—")} · ${c.cut === "sleeveless" ? "Sleeveless" : "Short sleeve"}${c.frontNumber ? " · Front number on" : ""}</p>` : `<p class="custom-detail">Standard design</p>`;
    const designs = isJersey && c?.designs?.length ? `<div class="cart-designs">${c.designs.map((design) => `<img src="${design.data}" alt="Uploaded ${escapeHTML(design.name)} design, ${design.side}">`).join("")}</div>` : "";
    return `<article class="cart-item"><div class="cart-thumb">${isJersey ? renderJersey(c, "front", false) : productArt(PRODUCT_LIST.find((product) => product.id === item.productId))}</div><div class="cart-main"><h3>${escapeHTML(item.name)}</h3><p class="cart-meta">Size ${escapeHTML(item.size)} · ${money(item.price)} each</p>${detail}${designs}<div class="quantity-control"><button type="button" aria-label="Decrease quantity" data-quantity="-1" data-id="${item.id}">−</button><span>${item.quantity}</span><button type="button" aria-label="Increase quantity" data-quantity="1" data-id="${item.id}">+</button></div></div><div class="cart-end"><span class="line-total">${money(item.price * item.quantity)}</span><button class="remove-item" type="button" data-remove-item="${item.id}">Remove</button></div></article>`;
  }).join("")}</div>${summaryMarkup(totals, true)}</div></section>`;
  app.querySelectorAll("[data-quantity]").forEach((button) => button.addEventListener("click", () => {
    const delta = Number(button.dataset.quantity);
    const next = cart.map((item) => item.id === button.dataset.id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item);
    if (storeCart(next)) renderCart();
  }));
  app.querySelectorAll("[data-remove-item]").forEach((button) => button.addEventListener("click", () => {
    if (storeCart(cart.filter((item) => item.id !== button.dataset.removeItem))) renderCart();
  }));
}

function summaryMarkup(totals, checkoutLink) {
  return `<aside class="summary-card"><h2>Order summary</h2><div class="summary-line"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div><div class="summary-line"><span>Shipping</span><span>${money(totals.shipping)}</span></div><div class="summary-line summary-total"><span>Total</span><span>${money(totals.total)}</span></div>${checkoutLink ? `<a class="button" href="#checkout">Proceed to checkout</a>` : ""}<p class="summary-note">Shipping is a placeholder estimate. Payment processing is not enabled in this demo.</p></aside>`;
}

function renderCheckout() {
  if (!cart.length) {
    renderCart();
    return;
  }
  const totals = cartTotals();
  app.innerHTML = `<section class="page-shell"><p class="eyebrow">Almost game time</p><h1 class="page-title">Checkout.</h1><p class="page-intro">Add your delivery details to place this demo order.</p>
    <div class="checkout-layout"><form class="checkout-form" id="checkout-form" novalidate><h2>Delivery details</h2><div class="form-grid">
      <label class="form-field full"><span class="field-label">Full name</span><input class="field" name="name" autocomplete="name" required maxlength="80"><span class="form-error" data-checkout-error="name"></span></label>
      <label class="form-field"><span class="field-label">Email</span><input class="field" name="email" type="email" autocomplete="email" required maxlength="120"><span class="form-error" data-checkout-error="email"></span></label>
      <label class="form-field"><span class="field-label">Phone number</span><input class="field" name="phone" type="tel" autocomplete="tel" required maxlength="24"><span class="form-error" data-checkout-error="phone"></span></label>
      <label class="form-field full"><span class="field-label">Delivery address</span><textarea class="field" name="address" autocomplete="street-address" rows="3" required maxlength="240" style="resize:vertical"></textarea><span class="form-error" data-checkout-error="address"></span></label>
    </div><button class="button" type="submit">Place demo order · ${money(totals.total)}</button><p class="summary-note">No payment will be collected. This is a storefront demo.</p></form>
    <aside class="summary-card"><h2>Your order</h2>${cart.map((item) => `<div class="checkout-summary-item"><span>${escapeHTML(item.name)} · ${escapeHTML(item.size)} × ${item.quantity}</span><strong>${money(item.price * item.quantity)}</strong></div>`).join("")}<div class="summary-line" style="margin-top:17px"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div><div class="summary-line"><span>Shipping</span><span>${money(totals.shipping)}</span></div><div class="summary-line summary-total"><span>Total</span><span>${money(totals.total)}</span></div></aside></div></section>`;
  document.getElementById("checkout-form").addEventListener("submit", placeOrder);
}

function placeOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  const errors = {
    name: values.name.trim().length >= 2 ? "" : "Enter your full name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? "" : "Enter a valid email address.",
    phone: /^[+0-9()\-\s]{7,24}$/.test(values.phone.trim()) ? "" : "Enter a valid phone number.",
    address: values.address.trim().length >= 5 ? "" : "Enter a complete delivery address."
  };
  let valid = true;
  Object.entries(errors).forEach(([field, message]) => {
    form.querySelector(`[data-checkout-error="${field}"]`).textContent = message;
    if (message) valid = false;
  });
  if (!valid) {
    form.querySelector(".form-error:not(:empty)")?.previousElementSibling?.focus();
    return;
  }
  const order = { number: `LU-${Date.now().toString().slice(-8)}`, name: values.name.trim(), email: values.email.trim(), total: cartTotals().total };
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch (error) {
    console.error("Could not save the order confirmation.", error);
  }
  if (!storeCart([])) return;
  location.hash = "#confirmation";
  renderConfirmation(order);
}

function renderConfirmation(order) {
  let savedOrder = order;
  if (!savedOrder) {
    try { savedOrder = JSON.parse(localStorage.getItem(ORDER_KEY) || "null"); }
    catch (error) { console.error("Could not read the last order.", error); }
  }
  if (!savedOrder) {
    app.innerHTML = `<section class="page-shell"><div class="empty-state"><h2>No recent order to show.</h2><a class="button" href="#shop">Shop the collection</a></div></section>`;
    return;
  }
  app.innerHTML = `<section class="confirmation"><div class="confirmation-mark" aria-hidden="true">✓</div><p class="eyebrow">You're on the team</p><h1>Order placed.</h1><p>Thanks, ${escapeHTML(savedOrder.name)}. Your demo order is in the books. No payment has been processed.</p><div class="order-number">${escapeHTML(savedOrder.number)}</div><p>Confirmation details would be sent to ${escapeHTML(savedOrder.email)}.</p><a class="button" href="#shop">Back to the shop</a></section>`;
}

function renderOrders() {
  let order = null;
  try { order = JSON.parse(localStorage.getItem(ORDER_KEY) || "null"); }
  catch (error) { console.error("Could not read saved orders.", error); }
  if (!order) {
    app.innerHTML = `<section class="page-shell"><p class="eyebrow">Your account</p><h1 class="page-title">My orders.</h1><div class="empty-state"><h2>No orders yet.</h2><p>Your order history will appear here after checkout.</p><a class="button" href="#shop">Shop the collection</a></div></section>`;
    return;
  }
  app.innerHTML = `<section class="page-shell"><p class="eyebrow">Your account</p><h1 class="page-title">My orders.</h1><article class="order-card"><div><span class="field-label">Order ${escapeHTML(order.number)}</span><h2>SPORTIFY Team Order</h2><p>Confirmed · Preparing for delivery</p></div><strong>${money(order.total)}</strong></article></section>`;
}

function render() {
  const route = location.hash.replace(/^#/, "").split("?")[0] || "home";
  document.querySelectorAll("[data-nav]").forEach((link) => link.classList.toggle("active", link.dataset.nav === route));
  closeMenu();
  if (route === "home") renderHome();
  else if (route === "shop") renderShop();
  else if (route === "customize") renderCustomize();
  else if (route === "cart") renderCart();
  else if (route === "checkout") renderCheckout();
  else if (route === "confirmation") renderConfirmation();
  else if (route === "orders") renderOrders();
  else if (route === "contact") document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  else app.innerHTML = `<section class="not-found"><h1>Page not found.</h1><a class="button" href="#home">Go home</a></section>`;
  updateCartBadge();
}

const menuToggle = document.getElementById("menu-toggle");
const nav = document.getElementById("main-nav");
function closeMenu() {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}
menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});
window.addEventListener("hashchange", render);
render();
