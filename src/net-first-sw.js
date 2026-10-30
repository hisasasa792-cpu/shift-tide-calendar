// Classic script (loaded by sw.js via importScripts, and by the tests).
// Network-first, but on a weak signal fall back to the cache after timeoutMs instead of hanging.
self.networkFirst = async function networkFirst(request, { fetchFn, match, put, timeoutMs = 3000 }) {
  const net = fetchFn(request).then((res) => {
    if (res.ok) put(request, res.clone());
    return res;
  });
  const cached = await match(request);
  if (!cached) return net;
  const timer = new Promise((resolve) => setTimeout(() => resolve(cached), timeoutMs));
  return Promise.race([net.catch(() => cached), timer]);
};
