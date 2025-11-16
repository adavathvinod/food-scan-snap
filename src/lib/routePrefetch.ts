// Route prefetching utility to improve navigation speed
export const prefetchRoute = (path: string) => {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
};

export const prefetchCommonRoutes = () => {
  // Prefetch commonly visited pages
  const commonRoutes = ['/history', '/profile', '/goals'];
  commonRoutes.forEach(route => {
    setTimeout(() => prefetchRoute(route), 1000);
  });
};
