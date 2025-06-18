export const bbddDataModel = [
  {
    store: 'tests',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      {
        name: 'description',
        keypath: 'description',
        options: { unique: false },
      },
      {
        name: 'commandsAndItBlock',
        keypath: 'commandsAndItBlock',
        options: { unique: false },
      },
      { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
    ],
  },
  {
    store: 'interceptors',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'commands', keypath: 'commands', options: { unique: false } },
      { name: 'testId', keypath: 'testId', options: { unique: false } },
      { name: 'createdAt', keypath: 'createdAt', options: { unique: false } },
    ],
  },
];
