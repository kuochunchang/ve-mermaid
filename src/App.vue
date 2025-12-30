<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import MermaidEditor from './components/MermaidEditor.vue';
import MermaidViewer from './components/MermaidViewer.vue';

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
const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

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
    <!-- Glassmorphism Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🌊</span>
          <span class="logo-text">VeMermaid</span>
        </div>
        
        <div class="tabs-scroll-container">
          <div class="tabs-container">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab"
              :class="{ active: tab.id === activeTabId }"
              @click="activeTabId = tab.id"
            >
              <div class="tab-content">
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
                  <span class="material-icons">close</span>
                </button>
              </div>
              <div class="tab-indicator" v-if="tab.id === activeTabId"></div>
            </button>
            <button class="tab-add" @click="addTab" title="New diagram">
              <span class="material-icons">add</span>
            </button>
          </div>
        </div>

        <div class="header-actions">
           <button class="action-btn" @click="showAbout = true" title="About">
            <span class="material-icons">info</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Workspace -->
    <div class="workspace">
      <div class="pane-container editor-container" :style="{ width: leftWidth + '%' }">
        <div class="pane-header">
          <div class="pane-header-content">
            <span class="material-icons pane-icon">code</span>
            <span class="pane-title">Editor</span>
          </div>
        </div>
        <div class="pane-content custom-scrollbar">
          <MermaidEditor 
            :model-value="activeTab?.code || ''" 
            @update:model-value="updateCode"
            :error="error" 
          />
        </div>
      </div>
      
      <div class="resizer" @mousedown="startDrag">
        <div class="resizer-handle"></div>
      </div>
      
      <div class="pane-container viewer-container" :style="{ width: (100 - leftWidth) + '%' }">
        <div class="pane-header">
          <div class="pane-header-content">
            <span class="material-icons pane-icon">preview</span>
            <span class="pane-title">Preview</span>
          </div>
        </div>
        <div class="pane-content custom-scrollbar">
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

    <!-- Modern About Modal -->
    <transition name="modal-fade">
      <div v-if="showAbout" class="modal-backdrop" @click="showAbout = false">
        <div class="modal-surface" @click.stop>
          <button class="modal-close-btn" @click="showAbout = false">
            <span class="material-icons">close</span>
          </button>
          
          <div class="modal-header">
            <div class="modal-logo">🌊</div>
            <h2 class="modal-title">VeMermaid</h2>
            <p class="modal-subtitle">A modern, real-time Mermaid diagram editor</p>
          </div>
          
          <div class="modal-body custom-scrollbar">
            <div class="feature-grid">
              <div class="feature-card">
                <span class="feature-icon">⚡</span>
                <h3>Real-time</h3>
                <p>Instant preview of your diagrams as you type.</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">📑</span>
                <h3>Multi-tab</h3>
                <p>Work on multiple diagrams simultaneously.</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">🔒</span>
                <h3>Private</h3>
                <p>All data stays in your browser's local storage.</p>
              </div>
              <div class="feature-card">
                <span class="feature-icon">🖼️</span>
                <h3>Export</h3>
                <p>Export your diagrams as high-quality PNGs.</p>
              </div>
            </div>

            <div class="tips-section">
              <h3>💡 Pro Tips</h3>
              <ul>
                <li>Double-click tab names to rename them</li>
                <li>Drag the center divider to resize panes</li>
                <li>Use standard Mermaid syntax</li>
              </ul>
            </div>

            <div class="modal-footer">
              <p>Powered by <a href="https://mermaid.js.org" target="_blank">Mermaid.js</a></p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--color-bg-primary);
  overflow: hidden;
}

/* Header Styles */
.app-header {
  height: 64px;
  background: var(--color-bg-glass);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom: 1px solid var(--color-border);
  z-index: 50;
  display: flex;
  align-items: center;
  padding: 0 16px;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-text-primary);
  min-width: fit-content;
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  background: var(--color-accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Tabs Styles */
.tabs-scroll-container {
  flex: 1;
  overflow-x: auto;
  margin: 0 16px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.tabs-scroll-container::-webkit-scrollbar {
  display: none;
}

.tabs-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 4px 0 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
  min-width: 140px;
  max-width: 200px;
}

.tab:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.tab.active {
  background: var(--color-bg-secondary);
  color: var(--color-accent-primary);
  box-shadow: var(--shadow-sm);
}

.tab-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.tab-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.tab-name-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  outline: 2px solid var(--color-accent-primary);
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: all var(--transition-fast);
}

.tab:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: var(--color-error);
  color: white;
}

.tab-close .material-icons {
  font-size: 14px;
}

.tab-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
  background: var(--color-bg-tertiary);
}

.tab-add:hover {
  background: var(--color-accent-primary);
  color: white;
  transform: rotate(90deg);
}

.tab-add .material-icons {
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-accent-primary);
}

/* Workspace Styles */
.workspace {
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--color-bg-tertiary);
  padding: 16px;
  gap: 2px;
}

.pane-container {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: box-shadow var(--transition-normal);
  border: 1px solid var(--color-border);
}

.pane-container:focus-within {
  box-shadow: var(--shadow-lg), var(--shadow-glow); /* Subtle glow on focus */
  border-color: var(--color-border-hover);
}

.pane-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.pane-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.pane-icon {
  font-size: 18px;
  color: var(--color-accent-primary);
}

.pane-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pane-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Resizer */
.resizer {
  width: 12px;
  margin: 0 -6px;
  z-index: 10;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.resizer-handle {
  width: 4px;
  height: 40px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.resizer:hover .resizer-handle {
  background: var(--color-accent-primary);
  height: 60px;
  width: 6px;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-surface {
  background: var(--color-bg-secondary);
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  transition: all var(--transition-fast);
  z-index: 10;
  background: var(--color-bg-tertiary);
}

.modal-close-btn:hover {
  background: var(--color-error);
  color: white;
  transform: rotate(90deg);
}

.modal-header {
  padding: 40px 40px 20px;
  text-align: center;
  background: linear-gradient(to bottom, var(--color-bg-tertiary), var(--color-bg-secondary));
}

.modal-logo {
  font-size: 3rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.modal-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 8px;
  background: var(--color-accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-subtitle {
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.modal-body {
  padding: 24px 40px 40px;
  overflow-y: auto;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.feature-card {
  background: var(--color-bg-tertiary);
  padding: 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-accent-primary);
}

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 12px;
  display: block;
}

.feature-card h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text-primary);
}

.feature-card p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.tips-section {
  background: rgba(99, 102, 241, 0.05); /* Very subtle accent tint */
  padding: 24px;
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-accent-primary);
}

.tips-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-accent-primary);
  margin-bottom: 12px;
}

.tips-section ul {
  list-style: none;
  padding: 0;
}

.tips-section li {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips-section li::before {
  content: "•";
  color: var(--color-accent-primary);
  font-weight: bold;
}

.modal-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}

.modal-footer a {
  color: var(--color-accent-primary);
  font-weight: 600;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-surface,
.modal-fade-leave-active .modal-surface {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-fade-enter-from .modal-surface {
  transform: scale(0.9) translateY(20px);
}
.modal-fade-leave-to .modal-surface {
  transform: scale(0.9) translateY(-20px);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .workspace {
    flex-direction: column;
    padding: 8px;
  }
  
  .pane-container {
    width: 100% !important;
    height: 50%;
  }
  
  .resizer {
    width: 100%;
    height: 12px;
    margin: -6px 0;
    cursor: row-resize;
  }
  
  .resizer-handle {
    width: 40px;
    height: 4px;
  }
  
  .resizer:hover .resizer-handle {
    width: 60px;
    height: 6px;
  }

  .header-content {
    gap: 12px;
  }
  
  .logo-text {
    display: none;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
