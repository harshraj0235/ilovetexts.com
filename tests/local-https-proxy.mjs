// Local-only TLS fixture for production browser tests. Certificates stay in the
// ignored test-results directory; never use this self-signed fixture publicly.
import https from 'node:https';
import http from 'node:http';
import { readFileSync } from 'node:fs';

const server = https.createServer({
  key: readFileSync('test-results/localhost-key.pem'),
  cert: readFileSync('test-results/localhost-cert.pem'),
}, (request, response) => {
  const upstream = http.request({
    hostname: '127.0.0.1', port: 4116, path: request.url,
    method: request.method, headers: { ...request.headers, host: 'localhost:4116' },
  }, result => {
    response.writeHead(result.statusCode, result.headers);
    result.pipe(response);
  });
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502);
    response.end('Local preview server unavailable.');
  });
  request.pipe(upstream);
});
server.listen(4117, '127.0.0.1', () => console.log('Local TLS fixture: https://127.0.0.1:4117 → http://127.0.0.1:4116'));
process.on('SIGINT', () => server.close(() => process.exit(0)));
