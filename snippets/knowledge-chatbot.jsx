import { useEffect } from "react";

/**
 * Embeds the GBase (gptbase) chatbot plugin on /knowledge/* pages only.
 *
 * IMPORTANT: Mintlify compiles this snippet so that ONLY the exported component
 * is in scope — module-level helper consts/functions are NOT visible from
 * inside the component. So everything must live inside the component/effect.
 *
 * What this handles:
 *
 * 1. Scoping + visibility.
 *    plugin.js is injected exactly once per session (it registers anonymous
 *    window listeners that cannot be removed and guards re-init with
 *    `gptbaseConfig.embedSuccess`, so re-injecting would leak listeners).
 *    Visibility follows a single global route watcher — not React
 *    mount/unmount — because Mintlify (Next.js App Router) overlaps route
 *    transitions and unmount ordering is unreliable. Show the widget iff inside
 *    /knowledge, hide it everywhere else.
 *
 * 2. React "removeChild of null" crash on navigation.
 *    plugin.js's open/close handlers do
 *      document.querySelector('meta[name="viewport"]').parentNode.removeChild(...)
 *    i.e. they DETACH the first viewport <meta>. But that node is owned/hoisted
 *    by React (Next.js Float, fiber tag 26). Once detached, React's next commit
 *    runs `node.parentNode.removeChild(node)` with a null parentNode and throws.
 *    Fix: keep a decoy <meta name="viewport"> as the FIRST viewport meta (via a
 *    MutationObserver), so the plugin always removes the DECOY and never React's
 *    node. We never override removeChild, so React's reconciliation is intact.
 */
export const KnowledgeChatbot = () => {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const CHATBOT_ID = "5c7ce716-1196-4b0c-92a2-12900ff360c8";
    const HIDE_STYLE_ID = "gptbase-hide-style";
    const WATCHER_FLAG = "__gbaseKnowledgeWatcherInstalled";
    const DECOY_FLAG = "__gbaseViewportDecoyInstalled";
    const DECOY_ATTR = "data-gbase-viewport-decoy";
    const WIDGET_SELECTOR =
      "#gptbase-bubble-button, #gptbase-message-bubbles, #gptbase-bubble-window";

    const onKnowledgeRoute = () =>
      window.location.pathname.startsWith("/knowledge");

    // --- Fix #2: decoy viewport meta -----------------------------------------
    // Keep a decoy as the first <meta name="viewport"> and prune the plugin's
    // leftovers, so the plugin never detaches React's hoisted viewport node.
    const ensureViewportDecoy = () => {
      const head = document.head;
      const metas = Array.prototype.slice.call(
        head.querySelectorAll('meta[name="viewport"]')
      );
      if (metas.length === 0) return;

      // 1) Guarantee a decoy sits before the first real viewport meta.
      if (!metas[0].hasAttribute(DECOY_ATTR)) {
        const decoy = document.createElement("meta");
        decoy.setAttribute("name", "viewport");
        decoy.setAttribute(DECOY_ATTR, "1");
        decoy.setAttribute(
          "content",
          metas[0].getAttribute("content") ||
            "width=device-width, initial-scale=1"
        );
        head.insertBefore(decoy, metas[0]);
      }

      // 2) Prune extras. Never touch React's node (unmarked, no user-scalable).
      let keptDecoy = false;
      Array.prototype.forEach.call(
        head.querySelectorAll('meta[name="viewport"]'),
        (meta) => {
          const isDecoy = meta.hasAttribute(DECOY_ATTR);
          const isPluginMeta = (meta.getAttribute("content") || "").includes(
            "user-scalable=no"
          );
          if (isDecoy) {
            if (keptDecoy) meta.remove();
            else keptDecoy = true;
          } else if (isPluginMeta) {
            meta.remove(); // plugin's anti-zoom meta — safe to drop
          }
        }
      );
    };

    const installViewportDecoyOnce = () => {
      if (window[DECOY_FLAG]) return;
      window[DECOY_FLAG] = true;
      ensureViewportDecoy();
      const observer = new MutationObserver(() => ensureViewportDecoy());
      observer.observe(document.head, { childList: true });
    };

    // --- Fix #1: visibility ---------------------------------------------------
    const showWidget = () => {
      const style = document.getElementById(HIDE_STYLE_ID);
      if (style) style.remove();
    };

    const hideWidget = () => {
      if (document.getElementById(HIDE_STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = HIDE_STYLE_ID;
      style.textContent = `${WIDGET_SELECTOR} { display: none !important; }`;
      document.head.appendChild(style);
    };

    const syncVisibility = () => {
      if (onKnowledgeRoute()) showWidget();
      else hideWidget();
    };

    const injectPluginOnce = () => {
      if (document.getElementById(CHATBOT_ID)) return;

      window.gptbaseConfig = {
        chatbotId: CHATBOT_ID,
        baseUrl: "https://admin.gbase.ai",
        apiBaseUrl: "https://admin.gbase.ai/api",
      };

      const script = document.createElement("script");
      script.src = "https://gbase.ai/plugin/plugin.js";
      script.id = CHATBOT_ID;
      script.defer = true;
      document.body.appendChild(script);
    };

    const installRouteWatcherOnce = () => {
      if (window[WATCHER_FLAG]) return;
      window[WATCHER_FLAG] = true;

      const fire = () => window.requestAnimationFrame(syncVisibility);

      ["pushState", "replaceState"].forEach((method) => {
        const original = window.history[method];
        window.history[method] = function patched(...args) {
          const result = original.apply(this, args);
          fire();
          return result;
        };
      });

      window.addEventListener("popstate", fire);
      window.addEventListener("hashchange", fire);
    };

    try {
      installViewportDecoyOnce();
      injectPluginOnce();
      installRouteWatcherOnce();
      syncVisibility();
    } catch (error) {
      // Never let widget wiring break the page.
      console.error("[KnowledgeChatbot] setup failed:", error);
    }
  }, []);

  return null;
};
