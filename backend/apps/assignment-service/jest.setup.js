jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
  getRepositoryToken: (entity) => `${entity.name}Repository`,
  TypeOrmModule: {
    forRoot: () => ({ module: class TypeOrmRootModule {} }),
    forFeature: () => ({ module: class TypeOrmFeatureModule {} }),
  },
}));