import type { AppConfig, FormDataMap } from './app.config.types';
import type { EntityTypeMappingFormData } from './ui/components/Forms/EntityTypeMappingForm/EntityTypeMappingForm.types';

export const appConfig: AppConfig = {
  forms: [
    {
      id: 'entity-type-mapping',
      storageLocation: 'node',
      component: 'EntityTypeMappingForm',
      tab: 'entity-type-mapping',
      tabLabel: 'Entity Type Mapping',
      props: {
        schemaData: true
      },
      enabled: () => {
        return true;
      },
      buildProps: (formData, _parentNodesContext, schemaData) => {
        return {
          modelValue: formData as FormDataMap['entity-type-mapping'],
          schemaData: schemaData
        };
      }
    },
    {
      id: 'entity-field-mapping',
      storageLocation: 'node',
      component: 'EntityFieldMappingForm',
      tab: 'entity-field-mapping',
      tabLabel: 'Entity Field Mapping',
      props: {
        schemaData: true
      },
      enabled: (_formData, parentNodesContext) => {
        // Find first parent node with entity-type-mapping data
        const parentWithEntityType = parentNodesContext.find(
          node => node.data && node.data['entity-type-mapping']
        );

        if (parentWithEntityType?.data['entity-type-mapping']) {
          const entityTypeData = parentWithEntityType.data['entity-type-mapping'] as EntityTypeMappingFormData;
          return !!(entityTypeData?.contentType && entityTypeData?.bundle);
        }

        return false;
      },
      buildProps: (formData, parentNodesContext, schemaData) => {
        // Find first parent node with entity-type-mapping data
        const parentWithEntityType = parentNodesContext.find(
          node => node.data && node.data['entity-type-mapping']
        );

        if (parentWithEntityType?.data['entity-type-mapping']) {
          const entityTypeData = parentWithEntityType.data['entity-type-mapping'] as EntityTypeMappingFormData;
          return {
            modelValue: formData as FormDataMap['entity-field-mapping'],
            inheritedEntityType: entityTypeData.contentType || '',
            inheritedBundle: entityTypeData.bundle || '',
            schemaData: schemaData
          };
        }

        return {
          modelValue: formData as FormDataMap['entity-field-mapping'],
          inheritedEntityType: '',
          inheritedBundle: '',
          schemaData: schemaData
        };
      }
    },
    {
      id: 'view-configuration',
      storageLocation: 'node',
      component: 'ViewConfigurationForm',
      tab: 'view-configuration',
      tabLabel: 'View Configuration',
      props: {
        schemaData: true
      },
      enabled: () => {
        return true;
      },
      buildProps: (formData, _parentNodesContext, schemaData) => {
        return {
          modelValue: formData as FormDataMap['view-configuration'],
          schemaData: schemaData
        };
      }
    },
    {
      id: 'json-configuration',
      storageLocation: 'file',
      component: 'PenDropJsonConfigurationForm',
      tab: 'json-configuration',
      tabLabel: 'JSON Configuration',
      props: {},
      enabled: () => {
        return true;
      },
      buildProps: (formData) => {
        return {
          modelValue: formData as FormDataMap['json-configuration']
        };
      }
    }
  ]
};

