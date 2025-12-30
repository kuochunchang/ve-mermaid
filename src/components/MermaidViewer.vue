<script setup lang="ts">
import mermaid from 'mermaid';
import { onMounted, ref, watch } from 'vue';

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
  // Theme variables can be injected here if we want specific overrides
  // themeVariables: { ... },
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

const downloadPng = async () => {
  if (!container.value) return;
  
  const svgElement = container.value.querySelector('svg');
  if (!svgElement) return;
  
  // Clone SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Get SVG dimensions
  let svgWidth: number;
  let svgHeight: number;
  
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number);
    svgWidth = parts[2] || 800;
    svgHeight = parts[3] || 600;
  } else {
    // Fallback
    const bbox = svgElement.getBBox();
    svgWidth = bbox.width + bbox.x * 2;
    svgHeight = bbox.height + bbox.y * 2;
  }
  
  const scale = 2; // 2x for better quality
  const width = svgWidth * scale;
  const height = svgHeight * scale;
  
  clonedSvg.setAttribute('width', width.toString());
  clonedSvg.setAttribute('height', height.toString());
  clonedSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  
  // Inline styles
  const allElements = clonedSvg.querySelectorAll('*');
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el as Element);
    const importantStyles = ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline'];
    importantStyles.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        (el as HTMLElement).style.setProperty(prop, value);
      }
    });
  });
  
  // Add white background
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', '#ffffff');
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
  
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);
  
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  const dataUrl = `data:image/svg+xml;base64,${base64}`;
  
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0, width, height);
    
    const link = document.createElement('a');
    link.download = `mermaid-diagram-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  img.src = dataUrl;
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
           // Even if parse fails, we might still want to try rendering or clear
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
    <div class="scroll-container custom-scrollbar">
      <div class="zoom-container" :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }">
         <!-- Note: using transform scale instead of zoom property for better compatibility and text rendering -->
        <div ref="container" class="mermaid-content"></div>
      </div>
    </div>

    <!-- Modern Floating Controls -->
    <div class="controls-panel">
      <div class="control-group">
        <button @click="zoomOut" class="control-btn" title="Zoom Out">
          <span class="material-icons">remove</span>
        </button>
        <div class="zoom-display">
          {{ Math.round(props.scale * 100) }}%
        </div>
        <button @click="zoomIn" class="control-btn" title="Zoom In">
           <span class="material-icons">add</span>
        </button>
      </div>
      
      <div class="divider"></div>
      
      <button @click="resetZoom" class="control-btn" title="Reset Zoom">
        <span class="material-icons">restart_alt</span>
      </button>
      
      <div class="divider"></div>
      
      <button @click="downloadPng" class="control-btn primary" title="Download PNG">
        <span class="material-icons">download</span>
      </button>
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
  background: var(--color-bg-tertiary); /* Slightly different background for viewer area */
  display: flex;
  flex-direction: column;
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 32px; /* Extra padding for better scrolling */
  box-sizing: border-box;
}

.zoom-container {
  /* Use transform for scaling to avoid layout shifts and improve performance */
  transition: transform 0.1s ease-out;
  min-width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center; /* Center horizontally */
}

.mermaid-content {
  /* Ensure content doesn't collapse */
  display: inline-block; 
}

/* Custom Scrollbar */
.scroll-container::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
.scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.scroll-container::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-full);
  border: 2px solid var(--color-bg-tertiary); /* Adds padding effect */
}
.scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

:deep(svg) {
  max-width: none !important; 
  height: auto !important;
  display: block;
  /* Add subtle shadow to the diagram itself */
  filter: drop-shadow(var(--shadow-sm));
}

/* Modern Controls Panel */
.controls-panel {
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: var(--color-bg-glass);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  transition: all var(--transition-normal);
}

.controls-panel:hover {
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  transform: translateY(-2px);
}

.control-group {
  display: flex;
  align-items: center;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-full);
  padding: 2px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.control-btn:hover {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.control-btn.primary {
  background: var(--color-accent-primary);
  color: white;
}

.control-btn.primary:hover {
  background: var(--color-accent-secondary);
  transform: scale(1.05);
}

.control-btn .material-icons {
  font-size: 18px;
}

.zoom-display {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  text-align: center;
  padding: 0 4px;
  cursor: default;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
}
</style>
