import type { ParentNode } from './ui/types/Context.types';
import type { PendropData } from './ui/types/PendropData.types';
import type { EntityTypeMappingFormData } from './ui/components/Forms/EntityTypeMappingForm/EntityTypeMappingForm.types';
import type { EntityFieldMappingFormData } from './ui/components/Forms/EntityFieldMappingForm/EntityFieldMappingForm.types';
import type { ViewConfigurationFormData } from './ui/components/Forms/ViewConfigurationForm/ViewConfigurationForm.types';
import type { PenDropJsonConfigurationFormData } from './ui/components/Forms/PenDropJsonConfigurationForm/PenDropJsonConfigurationForm.types';

export type StorageLocation = 'node' | 'file';

export type FormDataMap = {
  'entity-type-mapping': EntityTypeMappingFormData | null;
  'entity-field-mapping': EntityFieldMappingFormData | null;
  'view-configuration': ViewConfigurationFormData | null;
  'json-configuration': PenDropJsonConfigurationFormData | null;
};

export type FormId = keyof FormDataMap;

export interface FormConfig {
  id: FormId;
  storageLocation: StorageLocation;
  component: string; // Component name for dynamic import
  tab: string; // Tab key where form should be displayed
  tabLabel: string; // Human-readable tab label
  props: {
    schemaData?: boolean; // Whether form needs schemaData prop
    [key: string]: unknown; // Allow additional prop configurations
  };
  enabled: (formData: FormDataMap[FormId] | null, parentNodesContext: ParentNode[]) => boolean;
  buildProps: (
    formData: FormDataMap[FormId] | null,
    parentNodesContext: ParentNode[],
    schemaData?: PendropData | null
  ) => Record<string, unknown>;
}

export interface AppConfig {
  forms: FormConfig[];
}

