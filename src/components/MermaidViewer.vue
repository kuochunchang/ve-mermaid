<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import mermaid from 'mermaid';

const props = defineProps<{
  code: string;
  scale: number;
}>();

const emit = defineEmits<{
  (e: 'error', message: string): void;
  (e: 'success'): void;
  (e: 'update:scale', scale: number): void;
}>();

const container = ref<HTMLDivElement | null>(null);

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 50,
    rankSpacing: 50,
    padding: 15,
    useMaxWidth: false,
  },
  maxTextSize: 100000,
  wrap: true,
  fontSize: 14,
});

const zoomIn = () => {
  const newScale = Number((props.scale + 0.1).toFixed(1));
  emit('update:scale', newScale);
};

const zoomOut = () => {
  if (props.scale > 0.2) {
    const newScale = Number((props.scale - 0.1).toFixed(1));
    emit('update:scale', newScale);
  }
};

const resetZoom = () => {
  emit('update:scale', 1);
};

const renderDiagram = async () => {
  if (container.value && props.code) {
    try {
      container.value.innerHTML = '';
      
      try {
          await mermaid.parse(props.code);
      } catch (e) {
          if (e instanceof Error) {
              emit('error', e.message);
          } else {
              emit('error', 'Syntax error');
          }
          return;
      }

      const { svg } = await mermaid.render('mermaid-svg-' + Date.now(), props.code);
      container.value.innerHTML = svg;
      emit('success');
    } catch (error) {
      console.error('Mermaid rendering error:', error);
      if (error instanceof Error) {
        emit('error', error.message);
      } else {
        emit('error', 'Unknown error during rendering');
      }
    }
  }
};

onMounted(() => {
  renderDiagram();
});

watch(() => props.code, () => {
  renderDiagram();
});
</script>

<template>
  <div class="viewer-root">
    <div class="controls">
      <button @click="zoomOut" class="control-btn" title="Zoom Out">
        <span class="btn-text">−</span>
      </button>
      <div class="zoom-display">
        <span class="zoom-value">{{ Math.round(props.scale * 100) }}%</span>
      </div>
      <button @click="zoomIn" class="control-btn" title="Zoom In">
        <span class="btn-text">+</span>
      </button>
      <button @click="resetZoom" class="control-btn reset-btn" title="Reset Zoom">
        <span class="btn-text">↻</span>
      </button>
    </div>

    <div class="scroll-container">
      <div class="zoom-container" :style="{ zoom: props.scale }">
        <div ref="container" class="mermaid-content"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewer-root {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  flex: 1;
  background: #fafafa;
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
}

.zoom-container {
  margin: auto;
  flex-shrink: 0;
}

.mermaid-content {
  padding: 24px;
  box-sizing: border-box;
}

:deep(svg) {
  max-width: none !important; 
  height: auto !important;
  display: block;
  margin: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: white;
  border-radius: 4px;
  padding: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  color: #616161;
  padding: 0;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.control-btn:active {
  background: #bbdefb;
}

.reset-btn {
  border-left: 1px solid #e0e0e0;
  margin-left: 4px;
  padding-left: 8px;
}

.btn-text {
  font-size: 18px;
  line-height: 1;
}

.zoom-display {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.zoom-value {
  font-size: 13px;
  font-weight: 500;
  color: #424242;
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: center;
}
</style>
