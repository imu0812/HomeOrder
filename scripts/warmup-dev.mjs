const baseUrl = process.env.DEV_BASE_URL ?? "http://localhost:3000";

const requests = [
  { path: "/dashboard" },
  { path: "/inventory/products" },
  { path: "/inventory/packagings" },
  { path: "/products" },
  { path: "/packagings" },
  { path: "/orders" },
  { path: "/orders/o_shortage" },
  { path: "/orders/o_multiday" },
  { path: "/schedule" },
  { path: "/api/products" },
  { path: "/api/packagings" },
  { path: "/api/orders" },
  { path: "/api/orders/o_shortage" },
  { path: "/api/orders/o_multiday" },
  { path: "/api/orders/o_shortage/packaging-check", method: "HEAD" },
  { path: "/api/orders/o_multiday/packaging-check", method: "HEAD" }
];

let hasConnectionFailure = false;

for (const request of requests) {
  const startedAt = Date.now();
  const method = request.method ?? "GET";
  try {
    const response = await fetch(`${baseUrl}${request.path}`, { method, redirect: "manual" });
    console.log(`${method} ${request.path} ${response.status} ${Date.now() - startedAt}ms`);
  } catch (error) {
    hasConnectionFailure = true;
    console.error(`${method} ${request.path} failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (hasConnectionFailure) {
  console.error(`\nDev server is not reachable at ${baseUrl}. Start it first with: npm run dev`);
  process.exitCode = 1;
}
