<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent, markRaw, watch, type Component } from 'vue';
import { Tabs, TabItem, TabPanel } from './components/Tabs';
import NotificationToast from './components/Notification';
import { useNotification } from './composables/useNotification';
import { useForms } from './composables/useForms';
import { appConfig } from '../app.config';
import type { FormId } from '../app.config.types';
import type { ParentNode } from './types/ParentNode.types';

const tabsRef = ref<InstanceType<typeof Tabs>>();
const theme = ref('dark'); // Default to dark
const currentActiveTab = ref<string | null>(null);

// Use composables
const { show: showNotification, currentNotification, hide: hideNotification, success } = useNotification();
const { save, getFormProps, updateFormData, formData } = useForms();

// Manage parent nodes context directly
const parentNodesContext = ref<ParentNode[]>([]);

// Schema data comes from json-configuration form
const schemaData = computed(() => formData.value['json-configuration']);

// Dynamically load form components
const formComponents = ref<Record<string, Component>>({});

// Load form components dynamically
appConfig.forms.forEach(form => {
  formComponents.value[form.id] = markRaw(defineAsyncComponent(() => 
    import(`./components/Forms/${form.component}/${form.component}.vue`)
  ));
});

// Get visible tabs (only show tabs that have at least one enabled form)
const tabs = computed(() => {
  const tabsWithEnabledForms = new Set<string>();
  
  appConfig.forms.forEach(form => {
    const props = getFormProps(form.id, parentNodesContext.value, schemaData.value);
    if (props.enabled) {
      tabsWithEnabledForms.add(form.tab);
    }
  });
  
  return Array.from(tabsWithEnabledForms);
});

// Get forms grouped by tab
const formsByTab = computed(() => {
  const grouped: Record<string, typeof appConfig.forms> = {};
  appConfig.forms.forEach(form => {
    if (!grouped[form.tab]) {
      grouped[form.tab] = [];
    }
    grouped[form.tab].push(form);
  });
  return grouped;
});

// Get tab label from config
const getTabLabel = (tabKey: string) => {
  const form = appConfig.forms.find(f => f.tab === tabKey);
  return form?.tabLabel || tabKey;
};

onMounted(() => {
  // Get theme from URL
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  if (themeParam) {
    theme.value = themeParam;
  }

  // Set first tab as active
  if (tabs.value.length > 0) {
    currentActiveTab.value = tabs.value[0];
    tabsRef.value?.setActiveTab(tabs.value[0]);
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'form-saved') {
      // Generic success notification for any form save
      success('Saved!');
    } else if (message.type === 'theme-change') {
      theme.value = message.theme;
    } else if (message.type === 'selection-change') {
      // Update parent nodes context
      parentNodesContext.value = message.parentNodes || [];
      
      // Broadcast selection-change to all components via custom event
      // This triggers form reloads in useForms
      window.dispatchEvent(new CustomEvent('penpot-selection-change', { 
        detail: { 
          hasSelection: message.hasSelection,
          currentNodeId: message.currentNodeId,
          parentNodes: message.parentNodes || []
        } 
      }));
    }
  });

  // Notify plugin that UI is ready
  // This triggers initial selection-change to populate parentNodesContext
  setTimeout(() => {
    parent.postMessage({ type: 'ui-ready' }, '*');
  }, 100);
});

// Handle save events from forms
const handleSave = (formId: FormId, data: any) => {
  save(formId, data);
};

// Handle clear events from forms
const handleClear = (formId: FormId) => {
  save(formId, null);
};

// Handle update events from forms
const handleUpdate = (formId: FormId, data: any) => {
  updateFormData(formId, data);
};

// Get props for a form
const getPropsForForm = (formId: FormId) => {
  return computed(() => {
    return getFormProps(formId, parentNodesContext.value, schemaData.value);
  });
};

// Handle tab change event
const handleTabChange = (tabName: string) => {
  currentActiveTab.value = tabName;
};

// Watch for changes in visible tabs and switch to first visible tab if current tab is no longer visible
watch(tabs, (newTabs) => {
  if (newTabs.length === 0) return;
  
  // Check if the currently active tab is still in the list of visible tabs
  const isCurrentTabStillVisible = currentActiveTab.value && newTabs.includes(currentActiveTab.value);
  
  // Only switch tabs if the current tab is no longer visible
  if (!isCurrentTabStillVisible && tabsRef.value) {
    currentActiveTab.value = newTabs[0];
    tabsRef.value.setActiveTab(newTabs[0]);
  }
});
</script>

<template>
  <div class="plugin-container" style="padding: 1px !important;" :data-theme="theme">
    <Tabs ref="tabsRef" @tab-change="handleTabChange">
      <template #tabs>
        <TabItem 
          v-for="tab in tabs" 
          :key="tab"
          :name="tab" 
          :label="getTabLabel(tab)" 
        />
      </template>

      <TabPanel 
        v-for="tab in tabs" 
        :key="tab"
        :name="tab"
      >
        <template v-for="form in formsByTab[tab]" :key="form.id">
          <component
            v-if="getPropsForForm(form.id).value.enabled"
            :is="formComponents[form.id]"
            v-bind="getPropsForForm(form.id).value"
            @update:modelValue="(data: any) => handleUpdate(form.id, data)"
            @save="(data: any) => handleSave(form.id, data)"
            @clear="() => handleClear(form.id)"
            :style="form.id !== formsByTab[tab][0]?.id ? 'margin-top: 1rem;' : ''"
          />
        </template>
      </TabPanel>
    </Tabs>

    <NotificationToast 
      :show="showNotification"
      :message="currentNotification.message"
      :duration="currentNotification.duration"
      :type="currentNotification.type"
      @hide="hideNotification"
    />
  </div>
</template>

<style scoped>
.plugin-container {
  padding: 1rem;
  min-height: 100vh;
}
</style>
