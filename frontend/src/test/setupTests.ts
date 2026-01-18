import '@testing-library/jest-dom';

// jsdom URL origin for components that build URLs
const { location } = window as any;
Object.defineProperty(window, 'location', {
  value: {
    ...location,
    origin: 'http://localhost',
  },
});
