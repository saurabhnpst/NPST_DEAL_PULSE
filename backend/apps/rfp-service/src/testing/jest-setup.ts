import { Inject } from '@nestjs/common';

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: (entity: { name: string }) =>
    Inject(`${entity.name}Repository`),
  InjectDataSource: () => Inject('DataSource'),
  TypeOrmModule: {
    forRoot: () => ({ module: class TypeOrmRootMock {} }),
    forRootAsync: () => ({ module: class TypeOrmRootAsyncMock {} }),
    forFeature: () => ({
      module: class TypeOrmFeatureMock {},
      providers: [],
      exports: [],
    }),
  },
  getRepositoryToken: (entity: { name: string }) => `${entity.name}Repository`,
}));