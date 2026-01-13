import { defineConfig } from 'orval'

export default defineConfig({
  auth: {
    input: {
      target: '../auth/api/docs/swagger.yaml',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/auth',
      schemas: 'src/api/auth/model',
      client: 'axios-functions',
      mock: false,
      override: {
        mutator: {
          path: 'src/lib/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
  spored: {
    input: {
      target: '../spored/api/docs/swagger.yaml',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/spored',
      schemas: 'src/api/spored/model',
      client: 'axios-functions',
      mock: false,
      override: {
        mutator: {
          path: 'src/lib/spored-instance.ts',
          name: 'sporedInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
  nakup: {
    input: {
      target: '../nakup/api/docs/swagger.yaml',
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/nakup',
      schemas: 'src/api/nakup/model',
      client: 'axios-functions',
      mock: false,
      override: {
        mutator: {
          path: 'src/lib/nakup-instance.ts',
          name: 'nakupInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
})
