import { Role } from '../../../../models/user.js';
import { StatusCodes } from 'http-status-codes';

export default async function (fastify, _opts) {
  fastify.post(
    '/create',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['DRUG', 'OTHER'] },
            system: { type: 'string' },
            code: { type: 'string' },
          },
        },
        response: {
          [StatusCodes.CREATED]: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              system: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
      onRequest: fastify.requireUser([Role.ADMIN, Role.STAFF, Role.VOLUNTEER]),
    },
    async (request, reply) => {
      const { name, type, system = 'CUSTOM', code = 'CUSTOM' } = request.body;
      const userId = request.user.id;

      try {
        const newAllergy = await fastify.prisma.allergy.create({
          data: {
            name,
            type,
            system,
            code,
          },
        });

        reply.code(StatusCodes.CREATED).send(newAllergy);
      } catch (error) {
        throw error;
      }
    }
  );
}
