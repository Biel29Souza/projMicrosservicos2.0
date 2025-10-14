// import amqplib from 'amqplib';

// export async function createChannel(url, exchange) {
//   const conn = await amqplib.connect(url);
//   const ch = await conn.createChannel();
//   await ch.assertExchange(exchange, 'topic', { durable: true });
//   return { conn, ch };
// }


import amqplib from 'amqplib';

export async function createChannel(url, exchange, retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqplib.connect(url);
      const ch = await conn.createChannel();
      await ch.assertExchange(exchange, 'topic', { durable: true });
      return { conn, ch };
    } catch (err) {
      console.error(`[AMQP] tentativa ${i + 1} falhou: ${err.message}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('[AMQP] todas as tentativas de conexão falharam');
}
