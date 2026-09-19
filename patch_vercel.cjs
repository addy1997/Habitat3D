const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'startServer();',
  `if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startServer();
} else if (!process.env.VERCEL) {
  startServer();
}

export default app;`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts for Vercel');
