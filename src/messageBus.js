export function initMessageBus(router) {
  // NOTE: Notify parent application when route changes
  router.afterEach((to) => {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "stac-route-changed",
          path: to.fullPath,
        },
        "*", // TODO: Replace with React app origin in production
      );
    }
  });

  // NOTE: Send initial route when iframe first loads
  router.isReady().then(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "stac-route-changed",
          path: router.currentRoute.value.fullPath,
        },
        "*", // TODO: Replace with React app origin in production
      );
    }
  });
}
