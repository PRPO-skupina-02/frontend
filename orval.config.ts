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
})
