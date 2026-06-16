    const categories = {
      coffee: {
        title: "커피",
        description: "사이즈와 온도를 선택할 수 있습니다.",
        items: [
          { category: "커피", name: "아메리카노", price: 3000, image: "./assets/menu/americano.jpg" },
          { category: "커피", name: "라떼", price: 4000, image: "./assets/menu/latte.jpg" },
          { category: "커피", name: "콜드브루", price: 4500, image: "./assets/menu/coldbrew.jpg" }
        ]
      },
      noncoffee: {
        title: "논커피",
        description: "스무디는 ICE만 선택 가능합니다.",
        items: [
          { category: "논커피", name: "스무디", price: 5000, iceOnly: true, image: "./assets/menu/smoothie.jpg" },
          { category: "논커피", name: "아이스티", price: 3500, image: "./assets/menu/icetea.jpg" },
          { category: "논커피", name: "초코라떼", price: 4500, image: "./assets/menu/choco-latte.jpg" }
        ]
      },
      dessert: {
        title: "디저트",
        description: "디저트는 옵션 없이 수량만 선택합니다.",
        items: [
          { category: "디저트", name: "치즈케이크", price: 5500, dessert: true, image: "./assets/menu/cheesecake.jpg" },
          { category: "디저트", name: "두쫀쿠", price: 4000, dessert: true, image: "./assets/menu/cookie.jpg" },
          { category: "디저트", name: "버터떡", price: 3500, dessert: true, image: "./assets/menu/ricecake.jpg" }
        ]
      }
    };

    const paymentQrImages = {
      "카카오페이": {
        src: "./assets/qr/kakaopay-qr.png",
        alt: "카카오페이 데모 QR 이미지"
      },
      "네이버페이": {
        src: "./assets/qr/naverpay-qr.png",
        alt: "네이버페이 데모 QR 이미지"
      }
    };

    const sizePrices = { Small: 0, Medium: 500, Large: 1000 };
    let currentCategory = "coffee";
    let selectedItem = null;
    let selectedSize = "Small";
    let selectedTemperature = "HOT";
    let selectedPayment = "카드 결제";
    let cart = [];
    let orderNumber = 1001;
    let completedOrder = null;

    const won = value => value.toLocaleString("ko-KR") + "원";
    const byId = id => document.getElementById(id);

    const menuList = byId("menuList");
    const cartItems = byId("cartItems");
    const optionDialog = byId("optionDialog");
    const paymentDialog = byId("paymentDialog");
    const receiptDialog = byId("receiptDialog");
    const quantityInput = byId("quantity");

    function renderMenu() {
      const data = categories[currentCategory];
      byId("categoryTitle").textContent = data.title;
      byId("categoryDescription").textContent = data.description;
      menuList.innerHTML = data.items.map((item, index) => `
        <article class="menu-card">
          <div class="menu-art">
            <img src="${item.image}" alt="${item.name} 메뉴 이미지" loading="lazy">
          </div>
          <div class="menu-info">
            <h3>${item.name}</h3>
            <p class="price">${won(item.price)}</p>
          </div>
          <button type="button" data-index="${index}">선택</button>
        </article>
      `).join("");

      menuList.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", () => openOptions(data.items[Number(button.dataset.index)]));
      });
    }

    function setCategory(category) {
      currentCategory = category;
      document.querySelectorAll(".category-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.category === category);
      });
      renderMenu();
    }

    function openOptions(item) {
      selectedItem = item;
      selectedSize = "Small";
      selectedTemperature = item.iceOnly ? "ICE" : "HOT";
      quantityInput.value = 1;

      byId("optionTitle").textContent = item.name;
      byId("optionPrice").textContent = `${item.category} · 기본 ${won(item.price)}`;
      byId("sizeGroup").style.display = item.dessert ? "none" : "grid";
      byId("temperatureGroup").style.display = item.dessert ? "none" : "grid";

      document.querySelectorAll("[data-size]").forEach(button => {
        button.classList.toggle("active", button.dataset.size === selectedSize);
      });

      document.querySelectorAll("[data-temperature]").forEach(button => {
        button.disabled = item.iceOnly && button.dataset.temperature === "HOT";
        button.classList.toggle("active", button.dataset.temperature === selectedTemperature);
      });

      updateOptionSubtotal();
      optionDialog.showModal();
    }

    function optionUnitPrice() {
      return selectedItem.price + (selectedItem.dessert ? 0 : sizePrices[selectedSize]);
    }

    function updateOptionSubtotal() {
      const quantity = Math.max(1, Number(quantityInput.value) || 1);
      quantityInput.value = quantity;
      byId("optionSubtotal").textContent = won(optionUnitPrice() * quantity);
    }

    function addSelectedToCart() {
      const quantity = Math.max(1, Number(quantityInput.value) || 1);
      const newItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        menu: selectedItem.name,
        category: selectedItem.category,
        basePrice: selectedItem.price,
        size: selectedItem.dessert ? null : selectedSize,
        temperature: selectedItem.dessert ? null : selectedTemperature,
        quantity,
        unitPrice: optionUnitPrice()
      };
      cart.push(newItem);
      renderCart();
      optionDialog.close();
      showToast(`${selectedItem.name} ${quantity}개를 장바구니에 담았습니다.`);
    }

    function lineSubtotal(item) {
      return item.unitPrice * item.quantity;
    }

    function cartTotal() {
      return cart.reduce((sum, item) => sum + lineSubtotal(item), 0);
    }

    function itemDescription(item) {
      const options = [item.category];
      if (item.size) options.push(item.size);
      if (item.temperature) options.push(item.temperature);
      return options.join(" · ");
    }

    function renderCart() {
      byId("totalPrice").textContent = won(cartTotal());
      byId("nextOrder").textContent = orderNumber;

      if (!cart.length) {
        cartItems.innerHTML = `<div class="empty">장바구니가 비어 있습니다.<br>메뉴를 선택해 주문을 시작하세요.</div>`;
        return;
      }

      cartItems.innerHTML = cart.map(item => `
        <article class="cart-line">
          <div class="line-top">
            <div>
              <strong>${item.menu}</strong>
              <div class="line-meta">${itemDescription(item)} · 단가 ${won(item.unitPrice)}</div>
            </div>
            <div class="line-price">${won(lineSubtotal(item))}</div>
          </div>
          <div class="line-controls">
            <div class="stepper">
              <button type="button" data-decrease="${item.id}" aria-label="수량 감소">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-increase="${item.id}" aria-label="수량 증가">+</button>
            </div>
            <button type="button" class="remove-btn" data-remove="${item.id}">삭제</button>
          </div>
        </article>
      `).join("");
    }

    function changeQuantity(id, delta) {
      const item = cart.find(entry => entry.id === id);
      if (!item) return;
      if (item.quantity + delta <= 0) {
        showToast("수량은 1개 이상이어야 합니다.");
        return;
      }
      item.quantity += delta;
      renderCart();
    }

    function removeItem(id) {
      cart = cart.filter(item => item.id !== id);
      renderCart();
    }

    function openPayment() {
      if (!cart.length) {
        showToast("장바구니가 비어 있어 결제할 수 없습니다.");
        return;
      }
      selectedPayment = "카드 결제";
      renderPayment();
      paymentDialog.showModal();
    }

    function renderPayment() {
      byId("reviewList").innerHTML = cart.map(item => `
        <div class="review-line">
          <span>${item.menu}${item.size ? ` (${item.size}, ${item.temperature})` : ""} x ${item.quantity}</span>
          <strong>${won(lineSubtotal(item))}</strong>
        </div>
      `).join("");
      byId("paymentTotal").textContent = won(cartTotal());
      document.querySelectorAll(".payment-option").forEach(button => {
        button.classList.toggle("active", button.dataset.payment === selectedPayment);
      });
      const qrBox = byId("qrBox");
      const qrImage = paymentQrImages[selectedPayment];
      qrBox.classList.toggle("show", Boolean(qrImage));
      qrBox.innerHTML = qrImage
        ? `<img src="${qrImage.src}" alt="${qrImage.alt}"><span>${selectedPayment} QR 결제 안내</span>`
        : "";
    }

    function completePayment() {
      completedOrder = {
        orderNumber,
        items: cart.map(item => ({ ...item })),
        total: cartTotal(),
        payment: selectedPayment
      };
      orderNumber += 1;
      byId("nextOrder").textContent = orderNumber;
      paymentDialog.close();
      renderReceipt(true);
      receiptDialog.showModal();
    }

    function renderReceipt(showDetails) {
      byId("receiptSummary").textContent = `주문번호 ${completedOrder.orderNumber} · ${completedOrder.payment}`;
      byId("receiptBody").style.display = showDetails ? "grid" : "none";
      byId("receiptList").innerHTML = completedOrder.items.map(item => `
        <div class="receipt-line">
          <span>${item.menu}${item.size ? ` (${item.size}, ${item.temperature})` : ""} x ${item.quantity}</span>
          <strong>${won(lineSubtotal(item))}</strong>
        </div>
      `).join("");
      byId("receiptTotal").textContent = won(completedOrder.total);
      byId("showReceipt").classList.toggle("active", showDetails);
      byId("hideReceipt").classList.toggle("active", !showDetails);
    }

    function resetOrder() {
      cart = [];
      completedOrder = null;
      renderCart();
      receiptDialog.close();
      showToast("새 주문을 시작합니다.");
    }

    let toastTimer = null;
    function showToast(message) {
      const toast = byId("toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    }

    document.querySelectorAll(".category-btn").forEach(button => {
      button.addEventListener("click", () => setCategory(button.dataset.category));
    });

    document.querySelectorAll("[data-size]").forEach(button => {
      button.addEventListener("click", () => {
        selectedSize = button.dataset.size;
        document.querySelectorAll("[data-size]").forEach(item => item.classList.toggle("active", item === button));
        updateOptionSubtotal();
      });
    });

    document.querySelectorAll("[data-temperature]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        selectedTemperature = button.dataset.temperature;
        document.querySelectorAll("[data-temperature]").forEach(item => item.classList.toggle("active", item === button));
      });
    });

    byId("qtyDown").addEventListener("click", () => {
      quantityInput.value = Math.max(1, Number(quantityInput.value) - 1);
      updateOptionSubtotal();
    });
    byId("qtyUp").addEventListener("click", () => {
      quantityInput.value = Math.max(1, Number(quantityInput.value) + 1);
      updateOptionSubtotal();
    });
    quantityInput.addEventListener("input", updateOptionSubtotal);

    byId("optionForm").addEventListener("submit", event => {
      event.preventDefault();
      addSelectedToCart();
    });

    cartItems.addEventListener("click", event => {
      const target = event.target;
      if (target.dataset.increase) changeQuantity(target.dataset.increase, 1);
      if (target.dataset.decrease) changeQuantity(target.dataset.decrease, -1);
      if (target.dataset.remove) removeItem(target.dataset.remove);
    });

    byId("clearCart").addEventListener("click", () => {
      if (!cart.length) {
        showToast("비울 장바구니가 없습니다.");
        return;
      }
      cart = [];
      renderCart();
      showToast("장바구니를 비웠습니다.");
    });

    byId("demoFill").addEventListener("click", () => {
      cart = [
        { id: "demo-1", menu: "아메리카노", category: "커피", basePrice: 3000, size: "Large", temperature: "ICE", quantity: 2, unitPrice: 4000 },
        { id: "demo-2", menu: "치즈케이크", category: "디저트", basePrice: 5500, size: null, temperature: null, quantity: 1, unitPrice: 5500 }
      ];
      renderCart();
      showToast("예시 주문을 담았습니다.");
    });

    byId("checkout").addEventListener("click", openPayment);
    byId("closePayment").addEventListener("click", () => paymentDialog.close());

    byId("paymentList").addEventListener("click", event => {
      const button = event.target.closest(".payment-option");
      if (!button) return;
      selectedPayment = button.dataset.payment;
      renderPayment();
    });

    byId("completePayment").addEventListener("click", completePayment);
    byId("closeReceipt").addEventListener("click", () => receiptDialog.close());
    byId("showReceipt").addEventListener("click", () => renderReceipt(true));
    byId("hideReceipt").addEventListener("click", () => renderReceipt(false));
    byId("newOrder").addEventListener("click", resetOrder);

    renderMenu();
    renderCart();
