<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import MermaidViewer from './components/MermaidViewer.vue';
import MermaidEditor from './components/MermaidEditor.vue';

interface Tab {
  id: number;
  name: string;
  code: string;
  scale: number;
}

let nextTabId = 2;

const tabs = ref<Tab[]>([
  {
    id: 1,
    name: 'Diagram 1',
    code: `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`,
    scale: 1
  }
]);

const activeTabId = ref(1);
const error = ref<string | undefined>(undefined);
const leftWidth = ref(40);
const isDragging = ref(false);
const editingTabId = ref<number | null>(null);
const editingTabName = ref('');
const showAbout = ref(false);

const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));

const handleError = (msg: string) => {
  error.value = msg;
};

const handleSuccess = () => {
  error.value = undefined;
};

const updateCode = (newCode: string) => {
  const tab = tabs.value.find(t => t.id === activeTabId.value);
  if (tab) {
    tab.code = newCode;
  }
};

const addTab = () => {
  const newTab: Tab = {
    id: nextTabId++,
    name: `Diagram ${nextTabId - 1}`,
    code: `graph TD
    A[New Diagram]`,
    scale: 1
  };
  tabs.value.push(newTab);
  activeTabId.value = newTab.id;
};

const updateScale = (newScale: number) => {
  const tab = tabs.value.find(t => t.id === activeTabId.value);
  if (tab) {
    tab.scale = newScale;
  }
};

const startEditTabName = (tabId: number, currentName: string) => {
  editingTabId.value = tabId;
  editingTabName.value = currentName;
  nextTick(() => {
    const input = document.querySelector('.tab-name-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  });
};

const closeTab = (tabId: number) => {
  if (tabs.value.length === 1) return; // Don't close last tab
  
  const index = tabs.value.findIndex(t => t.id === tabId);
  if (index === -1) return;
  
  tabs.value.splice(index, 1);
  
  // If closing active tab, switch to another
  if (activeTabId.value === tabId) {
    const newIndex = Math.max(0, index - 1);
    const newTab = tabs.value[newIndex];
    if (newTab) {
      activeTabId.value = newTab.id;
    }
  }
};

const saveTabName = (tabId: number) => {
  const tab = tabs.value.find(t => t.id === tabId);
  if (tab && editingTabName.value.trim()) {
    tab.name = editingTabName.value.trim();
  }
  editingTabId.value = null;
  editingTabName.value = '';
};

const cancelEditTabName = () => {
  editingTabId.value = null;
  editingTabName.value = '';
};

const startDrag = () => {
  isDragging.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const stopDrag = () => {
  isDragging.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  const containerWidth = window.innerWidth;
  const newLeftWidth = (e.clientX / containerWidth) * 100;
  
  if (newLeftWidth > 20 && newLeftWidth < 80) {
    leftWidth.value = newLeftWidth;
  }
};

onMounted(() => {
  // Load tabs from localStorage
  const savedTabs = localStorage.getItem('mermaid-tabs');
  const savedActiveTabId = localStorage.getItem('mermaid-active-tab');
  
  if (savedTabs) {
    try {
      const parsed = JSON.parse(savedTabs);
      if (Array.isArray(parsed) && parsed.length > 0) {
        tabs.value = parsed;
        nextTabId = Math.max(...parsed.map(t => t.id)) + 1;
      }
    } catch (e) {
      console.error('Failed to load tabs from localStorage', e);
    }
  }
  
  if (savedActiveTabId) {
    const parsed = parseInt(savedActiveTabId, 10);
    if (!isNaN(parsed) && tabs.value.find(t => t.id === parsed)) {
      activeTabId.value = parsed;
    }
  }
  
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
});

// Watch tabs and save to localStorage
watch(tabs, (newTabs) => {
  localStorage.setItem('mermaid-tabs', JSON.stringify(newTabs));
}, { deep: true });

// Watch activeTabId and save to localStorage
watch(activeTabId, (newId) => {
  localStorage.setItem('mermaid-active-tab', newId.toString());
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div class="app-root">
    <header class="app-header">
      <div class="tabs-container">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: tab.id === activeTabId }"
          @click="activeTabId = tab.id"
        >
          <input
            v-if="editingTabId === tab.id"
            v-model="editingTabName"
            class="tab-name-input"
            @blur="saveTabName(tab.id)"
            @keydown.enter="saveTabName(tab.id)"
            @keydown.esc="cancelEditTabName"
            @click.stop
            ref="tabNameInput"
          />
          <span
            v-else
            class="tab-name"
            @dblclick="startEditTabName(tab.id, tab.name)"
          >
            {{ tab.name }}
          </span>
          <button
            v-if="tabs.length > 1"
            class="tab-close"
            @click.stop="closeTab(tab.id)"
            title="Close tab"
          >
            ×
          </button>
        </button>
        <button class="tab-add" @click="addTab" title="New diagram">
          +
        </button>
        <div class="spacer"></div>
        <button class="about-btn" @click="showAbout = true" title="About">
          <span class="material-icons">info</span>
        </button>
      </div>
    </header>

    <div class="app-container">
      <div class="pane-wrapper" :style="{ width: leftWidth + '%' }">
        <div class="pane-header editor-header">
          <span class="pane-title">Editor</span>
        </div>
        <div class="pane editor-pane">
          <MermaidEditor 
            :model-value="activeTab?.code || ''" 
            @update:model-value="updateCode"
            :error="error" 
          />
        </div>
      </div>
      
      <div class="resizer" @mousedown="startDrag"></div>
      
      <div class="pane-wrapper" :style="{ width: (100 - leftWidth) + '%' }">
        <div class="pane-header viewer-header">
          <span class="pane-title">Preview</span>
        </div>
        <div class="pane viewer-pane">
          <MermaidViewer 
            :code="activeTab?.code || ''" 
            :scale="activeTab?.scale || 1"
            @error="handleError" 
            @success="handleSuccess"
            @update:scale="updateScale"
          />
        </div>
        </div>
      </div>

    <!-- About Dialog -->
    <div v-if="showAbout" class="modal-overlay" @click="showAbout = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showAbout = false">×</button>
        <h2 class="modal-title">About</h2>
        
        <div class="modal-body">
          <section class="info-section">
            <h3>Features</h3>
            <ul>
              <li>Real-time editing and preview of Mermaid diagrams</li>
              <li>Multi-tab management for handling multiple diagrams</li>
              <li>Zoom controls for adjusting diagram size</li>
              <li>Adjustable editor and preview pane widths</li>
            </ul>
          </section>

          <section class="info-section highlight">
            <h3>Local Storage</h3>
            <p>
              <strong>All diagrams are stored locally in your browser (localStorage)</strong>. 
              No data is uploaded to any server.
            </p>
            <ul>
              <li>Data is saved on your computer</li>
              <li>Diagrams persist after closing the browser</li>
              <li>Works without an internet connection</li>
              <li>Clearing browser data will delete all diagrams</li>
            </ul>
          </section>

          <section class="info-section">
            <h3>Tips</h3>
            <ul>
              <li>Double-click tab names to rename</li>
              <li>Drag the divider to adjust pane widths</li>
              <li>Use <code>&lt;br&gt;</code> tags for line breaks in labels</li>
              <li>Use zoom controls in the bottom right corner</li>
            </ul>
          </section>

          <section class="info-section">
            <p class="footer-note">
              Powered by <a href="https://mermaid.js.org" target="_blank">Mermaid.js</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.app-header {
  background: #212121;
  color: white;
  padding: 8px 16px 0 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 10;
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  min-width: 120px;
  position: relative;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.tab.active {
  background: #fafafa;
  color: #212121;
  font-weight: 500;
}

.tab-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}

.tab-name-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  padding: 2px 6px;
  color: white;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
}

.tab.active .tab-name-input {
  background: white;
  border: 1px solid #1976d2;
  color: #212121;
}

.tab-close {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #757575;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.tab-close:hover {
  background: rgba(0,0,0,0.1);
  color: #424242;
}

.tab-add {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.tab-add:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.spacer {
  flex: 1;
}

.about-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-right: 4px;
}

.about-btn .material-icons {
  font-size: 20px;
}

.about-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 450px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  color: #757575;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #e0e0e0;
  color: #424242;
}

.modal-title {
  padding: 16px 20px 10px 20px;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #212121;
  border-bottom: 2px solid #1976d2;
}

.modal-body {
  padding: 20px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #424242;
}

.info-section p {
  margin: 0 0 8px 0;
  line-height: 1.4;
  font-size: 0.85rem;
  color: #616161;
}

.info-section ul {
  margin: 0;
  padding-left: 20px;
  line-height: 1.4;
  font-size: 0.85rem;
  color: #616161;
}

.info-section li {
  margin-bottom: 4px;
}

.info-section.highlight {
  background: #e3f2fd;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #1976d2;
}

.info-section.highlight h3 {
  color: #1976d2;
}

.info-section code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.9em;
  color: #d32f2f;
}

.footer-note {
  text-align: center;
  font-size: 0.875rem;
  color: #9e9e9e;
}

.footer-note a {
  color: #1976d2;
  text-decoration: none;
}

.footer-note a:hover {
  text-decoration: underline;
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background: #fafafa;
}

.pane-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pane {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

.pane-header {
  padding: 12px 16px;
  background: #bdbdbd;
  border-bottom: 1px solid #9e9e9e;
  height: 40px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.pane-title {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #757575;
}



.resizer {
  width: 4px;
  background: #9e9e9e;
  cursor: col-resize;
  transition: all 0.2s ease;
  z-index: 10;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.resizer:hover {
  background: #757575;
}

.resizer-handle {
  display: none;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .pane {
    width: 100% !important;
    height: 50%;
  }
  
  .resizer {
    width: 100%;
    height: 4px;
    cursor: row-resize;
  }
  
  .resizer-handle {
    width: 40px;
    height: 2px;
  }
  
  .editor-pane {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
}
</style>
