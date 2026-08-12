import CONFIG from './merged-config';

function normalizeRoutePath(path) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // NOTE: Accept either a raw pathname or a URL
  try {
    const url = new URL(path, window.location.origin);
    path = url.pathname + url.search + url.hash;
  }
  catch (error) {
    // NOTE: Leave path as-is if it is not a valid URL.
  }

  if (CONFIG.pathPrefix && path.startsWith(CONFIG.pathPrefix)) {
    path = path.slice(CONFIG.pathPrefix.length) || "/";
  }

  return path;
}

export function initMessageBus(router) {
  let pendingRoute = null;
  let isRouterReady = false;
  let suppressParentNotification = false;

  function navigateToRoute(path) {
    const normalizedPath = normalizeRoutePath(path);

    if (!normalizedPath) {
      return;
    }

    if (normalizedPath === router.currentRoute.value.fullPath) {
      return;
    }

    suppressParentNotification = true;
    router.replace(normalizedPath)
      .catch(() => {
        // NOTE: Ignore navigation failures from repeated or invalid route messages.
      })
      .finally(() => {
        setTimeout(() => {
          suppressParentNotification = false;
        });
      });
  }

  window.addEventListener("message", (event) => {
    if (window.parent === window) {
      return;
    }

    if (isRouterReady) {
      navigateToRoute(event.data.path);
    }
    else {
      pendingRoute = event.data.path;
    }
  });

  // NOTE: Notify parent application when route changes
  router.afterEach((to) => {
    if (window.parent !== window && !suppressParentNotification) {
      window.parent.postMessage(
        {
          type: "stac-route-changed",
          path: to.fullPath,
        },
        "*",
      );
    }
  });

  // NOTE: Send initial route when iframe first loads
  router.isReady().then(() => {
    isRouterReady = true;
    if (pendingRoute) {
      navigateToRoute(pendingRoute);
      pendingRoute = null;
    }

    if (window.parent !== window) {
      window.parent.postMessage(
        {
          type: "stac-route-changed",
          path: router.currentRoute.value.fullPath,
        },
        "*",
      );
    }
  });
}
