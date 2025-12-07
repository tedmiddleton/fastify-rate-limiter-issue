// prehandler-ratelimit.test.ts
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import rateLimit from '@fastify/rate-limit';

describe('preHandler + rateLimit', () => {
  let app: FastifyInstance;
  const handlerSpy = jest.fn();

  beforeAll(async () => {
    app = Fastify({ logger: false });

    // Uncomment this and we fail
    //await app.register(rateLimit, {
    //  max: 10,
    //  timeWindow: '1 minute',
    //});

    // Route under test
    app.post(
      '/test',
      {
        preHandler: async (req: FastifyRequest, reply: FastifyReply) => {
          // Simulate auth failure
          reply.code(401);
          await reply.send({ error: 'unauthorized from preHandler' });
          // Fastify should stop here - we should NOT enter the POST handler
        },
      },
      async (req: FastifyRequest, reply: FastifyReply) => {
        // This must NOT run if preHandler already sent the response
        handlerSpy();
        return { ok: true };
      }
    );

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not call handler when preHandler sends 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/test',
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: 'unauthorized from preHandler' });

    // Critical assertion: handler should never be invoked
    expect(handlerSpy).not.toHaveBeenCalled();
  });
});
