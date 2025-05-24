import { Role } from '../../../../models/user.js';
import { StatusCodes } from 'http-status-codes';

export default async function (fastify) {
  // GET route for listing allergies
  fastify.get(
    '',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            perPage: { type: 'integer' },
            allergy: { type: 'string' },
          },
        },
      },
      response: {
        [StatusCodes.OK]: {
          type: 'array',
          items: {
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
      const { page = '1', perPage = '25', allergy } = request.query;

      const options = {
        page,
        perPage,
        orderBy: [{ name: 'asc' }],
        where: { name: { contains: allergy.trim(), mode: 'insensitive' } },
      };

      const { records, total } = await fastify.prisma.allergy.paginate(options);
      reply.setPaginationHeaders(page, perPage, total).send(records);
    }
  );

  // POST route for creating allergies
  fastify.post(
    '',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['DRUG', 'OTHER'] },
            system: { type: 'string', enum: ['SNOMED', 'RXNORM', 'ICD10'] },
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
      const { name, type, system = 'SNOMED', code = 'CUSTOM' } = request.body;
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
