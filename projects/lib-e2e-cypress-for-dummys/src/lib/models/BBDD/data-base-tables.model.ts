export const bbddDataModel = [
  {
    store: 'tests',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'name',
        keypath: 'name',
        options: { unique: false },
      },
      {
        name: 'createdAt',
        keypath: 'createdAt',
        options: { unique: false },
      },
    ],
  },
  {
    store: 'commands',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'command', keypath: 'command', options: { unique: false } },
      { name: 'testId', keypath: 'testId', options: { unique: false } },
      { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
    ],
  },
  {
    store: 'interceptors',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'interceptor',
        keypath: 'interceptor',
        options: { unique: false },
      },
      { name: 'testId', keypath: 'testId', options: { unique: false } },
      { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
    ],
  },
  {
    store: 'configuration',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'language',
        keypath: 'language',
        options: { unique: false },
      },
      {
        name: 'extendedHttpCommands',
        keypath: 'extendedHttpCommands',
        options: { unique: false },
      },
    ],
  },
];
