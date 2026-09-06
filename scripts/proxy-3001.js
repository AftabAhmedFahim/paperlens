const http = require("http");

const TARGET_PORT = 3000;
const PROXY_PORT = 3001;

const server = http.createServer((req, res) => {
  const options = {
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end(`Proxy to port ${TARGET_PORT} error: ${err.message}`);
  });

  req.pipe(proxyReq, { end: true });
});

server.on("upgrade", (req, socket, head) => {
  const proxyReq = http.request({
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${TARGET_PORT}` },
  });

  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    let headersStr = `HTTP/1.1 101 Switching Protocols\r\n`;
    for (const [key, val] of Object.entries(proxyRes.headers)) {
      headersStr += `${key}: ${val}\r\n`;
    }
    headersStr += "\r\n";
    socket.write(headersStr);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on("error", () => {
    socket.destroy();
  });

  proxyReq.end();
});

server.listen(PROXY_PORT, () => {
  console.log(`[Proxy] Forwarding http://localhost:${PROXY_PORT} -> http://localhost:${TARGET_PORT}`);
});
