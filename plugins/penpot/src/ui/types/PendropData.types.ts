// Pendrop data structure from JSON configuration
export interface PendropData {
  content?: {
    [entityType: string]: {
      [bundle: string]: {
        fields?: {
          [fieldName: string]: unknown;
        };
      };
    };
  };
  config?: {
    views?: {
      [viewName: string]: {
        displays?: {
          [displayName: string]: unknown;
        };
      };
    };
  };
  design_system?: unknown;
}

