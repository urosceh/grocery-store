export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Grocery Store API',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/api',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      DomainError: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'alice' },
          password: { type: 'string', example: 'password' },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['username', 'name', 'password', 'role', 'storeId'],
        properties: {
          username: { type: 'string', example: 'bob' },
          name: { type: 'string', example: 'Bob' },
          password: { type: 'string', example: 'secret' },
          role: { type: 'string', enum: ['manager', 'employee'] },
          storeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', example: '000000000000000000000001' },
        },
      },
      User: {
        type: 'object',
        properties: {
          username: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['manager', 'employee'] },
          storeId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        },
      },
      PersonnelResponse: {
        type: 'object',
        properties: {
          personnel: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
        },
      },
      StoreNode: {
        type: 'object',
        properties: {
          id: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', example: '000000000000000000000001' },
          displayName: { type: 'string', example: 'Radnja 1' },
          kind: { type: 'string', example: 'STORE' },
        },
      },
      StoresResponse: {
        type: 'object',
        properties: {
          stores: {
            type: 'array',
            items: { $ref: '#/components/schemas/StoreNode' },
          },
        },
      },
    },
  },
  paths: {
    '/user/login': {
      post: {
        summary: 'Login',
        description: 'Authenticate with username and password and obtain a JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'JWT token string',
            content: {
              'application/json': {
                schema: { type: 'string', example: 'eyJhbGciOi...' },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
        },
      },
    },
    '/user': {
      post: {
        summary: 'Create user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' },
            },
          },
        },
        responses: {
          '204': { description: 'Created' },
          '400': {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
          '403': {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
        },
      },
    },
    '/user/logout': {
      post: {
        summary: 'Logout',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': { description: 'No Content' },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
        },
      },
    },
    '/store/user-stores': {
      get: {
        summary: 'Get stores user has access to',
        description: 'Returns the subtree of stores visible to the authenticated user.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Stores list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/StoresResponse' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
          '403': {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
        },
      },
    },
    '/store/{storeId}/personnel': {
      get: {
        summary: 'Get personnel for a store',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'storeId',
            in: 'path',
            required: true,
            schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['manager', 'employee', 'all'] },
          },
          {
            name: 'includeChildNodes',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 0, default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'Personnel list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PersonnelResponse' } } },
          },
          '400': {
            description: 'Bad request',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
          '401': {
            description: 'Unauthorized',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
          '403': {
            description: 'Forbidden',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DomainError' } } },
          },
        },
      },
    },
  },
} as const;
