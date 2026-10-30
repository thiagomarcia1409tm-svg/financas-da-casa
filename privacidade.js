
(function () {
  "use strict";

  const main = document.querySelector("main");
  const header = document.querySelector("header");

  if (!main || !header || document.getElementById("privacyToggle")) {
    return;
  }

  let visible = false;
  let changing = false;

  const originalValues = new WeakMap();
  const moneyPattern = /R\$\s*[-−]?\s*\d[\d.]*,\d{2}/g;

  const button = document.createElement("button");
  button.id = "privacyToggle";
  button.type = "button";
  button.textContent = "👁 Visualizar valores";
  button.setAttribute("aria-pressed", "false");
  button.style.cssText =
    "display:block;width:calc(100% - 32px);margin:12px 16px;background:#e7efeb;color:#17342e";

  header.after(button);

  function updatePrivacy() {
    if (changing) return;
    changing = true;

    const walker = document.createTreeWalker(
      main,
      NodeFilter.SHOW_TEXT
    );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
      if (
        node.parentElement &&
        node.parentElement.closest("script,style,textarea")
      ) {
        continue;
      }

      const original = originalValues.has(node)
        ? originalValues.get(node)
        : node.nodeValue;

      if (visible) {
        if (originalValues.has(node)) {
          node.nodeValue = original;
          originalValues.delete(node);
        }
      } else {
        const masked = original.replace(
          moneyPattern,
          "R$ ••••••"
        );

        if (masked !== original) {
          originalValues.set(node, original);
          node.nodeValue = masked;
        }
      }
    }

    changing = false;
  }

  let pending = false;

  const observer = new MutationObserver(function () {
    if (changing || pending) return;

    pending = true;

    requestAnimationFrame(function () {
      pending = false;
      updatePrivacy();
    });
  });

  observer.observe(main, {
    childList: true,
    subtree: true,
    characterData: true
  });

  button.addEventListener("click", function () {
    visible = !visible;

    button.textContent = visible
      ? "🙈 Ocultar valores"
      : "👁 Visualizar valores";

    button.setAttribute("aria-pressed", String(visible));

    updatePrivacy();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && visible) {
      visible = false;
      button.textContent = "👁 Visualizar valores";
      button.setAttribute("aria-pressed", "false");
      updatePrivacy();
    }
  });

  updatePrivacy();
})();
