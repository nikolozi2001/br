// Mock AsyncStorage so modules importing it can be unit-tested off-device.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
