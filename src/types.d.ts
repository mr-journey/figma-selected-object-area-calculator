// Type declarations for CDN-loaded libraries and Figma globals

declare global {
  // React from CDN
  const React: any;
  const ReactDOM: any;
  
  // Figma plugin globals (these should be provided by @figma/plugin-typings)
  const __html__: string;
  
  // Extend window for React
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

// Import Figma plugin types
/// <reference types="@figma/plugin-typings" />

export {};
