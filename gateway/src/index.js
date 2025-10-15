import express from 'express';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const USERS_URL = process.env.USERS_URL || 'http://localhost:3001';
const ORDERS_URL = process.env.ORDERS_URL || 'http://localhost:3002';


console.log('[gateway] configurando rotas...');      // nl
console.log(`[gateway] USERS_URL: ${USERS_URL}`);    // nl 
console.log(`[gateway] ORDERS_URL: ${ORDERS_URL}`);  // nl


// Health
app.get('/health', (req, res) => res.json({ ok: true, service: 'gateway' }));




// criando console.log para saber onde esta dando probleba, e pode localizar

// Intercepta todas as requisições antes do proxy  // nl **
app.use((req, res, next) => {
  console.log(`[gateway] recebendo requisição: ${req.method} ${req.url}`);
  next();
});

// Roteamento de APIs
app.use('/users', createProxyMiddleware({
  target: USERS_URL,
  changeOrigin: true,
  pathRewrite: {'^/users': ''},
  onProxyReq: (proxyReq, req, res) => {  //
    console.log(`[gateway] Proxying para USERS: ${req.method} ${req.url}`);  //
  },
  onError: (err, req, res) => {  //
    console.error('[gateway] Erro no proxy USERS:', err.message);  //
    res.status(500).json({ error: 'Erro ao redirecionar para Users Service' });  //
  }
}));



app.use('/orders', createProxyMiddleware({
  target: ORDERS_URL,
  changeOrigin: true,
  pathRewrite: {'^/orders': ''},
  onProxyReq: (proxyReq, req, res) => {  //
    console.log(`[gateway] Proxying para ORDERS: ${req.method} ${req.url}`);  //
  },
  onError: (err, req, res) => {  //
    console.error('[gateway] Erro no proxy ORDERS:', err.message);  //
    res.status(500).json({ error: 'Erro ao redirecionar para Orders Service' });  //
  }
}));
app.use(express.json());  // colocando para baixo para pode ir 

app.listen(PORT, () => {
  console.log(`[gateway] listening on http://localhost:${PORT}`);
  console.log(`[gateway] users -> ${USERS_URL}`);
  console.log(`[gateway] orders -> ${ORDERS_URL}`);
});
