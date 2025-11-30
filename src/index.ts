import { fastify } from 'fastify';
import { save } from './api/save';
import { open } from './api';
import { setlists } from './api/setlists';

const server = fastify();

server.register(save, { prefix: '/api/save' });
server.register(open, { prefix: '/api' });
server.register(setlists, { prefix: '/api/setlists' });

server.get('*', async (request, reply) => {
  reply.status(404).send({ status: 'Not found' });
});

server.listen({port: 5000}, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
