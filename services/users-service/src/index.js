import express from 'express';
import morgan from 'morgan';
// import { nanoid } from 'nanoid'; // removed
import { PrismaClient } from '@prisma/client'; // nl
import { createChannel } from './amqp.js';
import { ROUTING_KEYS } from '../common/events.js';

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = process.env.EXCHANGE || 'app.topic';

// const users = new Map(); // removed
const prisma = new PrismaClient(); // nl

let amqp = null;
(async () => {
  try {
    amqp = await createChannel(RABBITMQ_URL, EXCHANGE);
    console.log('[users] AMQP connected');
  } catch (err) {
    console.error('[users] AMQP connection failed:', err.message);
  }
})();

app.get('/health', (req, res) => res.json({ ok: true, service: 'users' }));

app.get('/', async (req, res) => { // nl
  const users = await prisma.user.findMany(); // nl
  res.json(users); // nl
});

app.post('/', async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  try { // nl
    const user = await prisma.user.create({ // nl
      data: { name, email } // nl
    }); // nl

    if (amqp?.ch) {
      const payload = Buffer.from(JSON.stringify(user));
      amqp.ch.publish(EXCHANGE, ROUTING_KEYS.USER_CREATED, payload, { persistent: true });
      console.log('[users] published event:', ROUTING_KEYS.USER_CREATED, user);
    }

    res.status(201).json(user);
  } catch (err) { // nl
    console.error('[users] error creating user:', err.message); // nl
    res.status(500).json({ error: 'Erro ao criar usuário' }); // nl
  }
});

app.get('/:id', async (req, res) => { // nl
  const user = await prisma.user.findUnique({ where: { id: req.params.id } }); // nl
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

app.put('/:id', async (req, res) => { // nl
  const { name, email } = req.body || {}; // nl

  try {
    const user = await prisma.user.update({ // nl
      where: { id: req.params.id }, // nl
      data: { name, email } // nl
    }); // nl

    if (amqp?.ch) {
      const payload = Buffer.from(JSON.stringify({ id: user.id, name: user.name, email: user.email }));
      amqp.ch.publish(EXCHANGE, ROUTING_KEYS.USER_UPDATED, payload, { persistent: true });
      console.log('[users] published event:', ROUTING_KEYS.USER_UPDATED, { id: user.id, name: user.name, email: user.email });
    }

    res.json(user);
  } catch (err) { // nl
    console.error('[users] error updating user:', err.message); // nl
    res.status(500).json({ error: 'Erro ao atualizar usuário' }); // nl
  }
});

app.listen(PORT, () => {
  console.log(`[users] listening on http://localhost:${PORT}`);
});
