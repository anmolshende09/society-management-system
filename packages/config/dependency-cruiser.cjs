/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-module-internal-imports',
      severity: 'error',
      comment: 'Modules must only import another module through its public api/ directory',
      from: {
        path: '^modules/([^/]+)/'
      },
      to: {
        path: '^modules/([^/]+)/',
        pathNot: [
          // Same module internal imports are allowed
          '^modules/$1/',
          // Cross-module imports MUST be to the public api/ directory
          '^modules/[^/]+/api/'
        ]
      }
    },
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      comment: 'Circular dependencies between files or modules are strictly forbidden',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'dag-resident-violations',
      severity: 'error',
      comment: 'Resident module (L1) cannot synchronously import Finance, Workforce, Maintenance, Security, or Community',
      from: {
        path: '^modules/resident/'
      },
      to: {
        path: '^modules/(finance|workforce|maintenance|security|community)/'
      }
    },
    {
      name: 'dag-finance-violations',
      severity: 'error',
      comment: 'Finance module (L2) cannot synchronously import Workforce, Maintenance, Security, or Community',
      from: {
        path: '^modules/finance/'
      },
      to: {
        path: '^modules/(workforce|maintenance|security|community)/'
      }
    },
    {
      name: 'shared-kernel-pure-rule',
      severity: 'error',
      comment: 'shared-kernel must remain pure value objects and types without importing business modules or I/O',
      from: {
        path: '^packages/shared-kernel/'
      },
      to: {
        path: '^(modules/|apps/|node_modules/(pg|drizzle|ioredis|fastify|@nestjs))'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
