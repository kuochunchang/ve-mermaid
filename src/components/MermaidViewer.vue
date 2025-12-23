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

const downloadPng = async () => {
  if (!container.value) return;
  
  const svgElement = container.value.querySelector('svg');
  if (!svgElement) return;
  
  // Clone SVG
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  
  // Get SVG dimensions from viewBox or attributes (not getBoundingClientRect which can be clipped)
  let svgWidth: number;
  let svgHeight: number;
  
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number);
    svgWidth = parts[2] || 800;
    svgHeight = parts[3] || 600;
  } else {
    // Fallback to width/height attributes or getBBox
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
  
  // Inline all computed styles to avoid external dependencies
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
  
  // Add white background rect
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', '#ffffff');
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
  
  // Serialize SVG to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);
  
  // Encode to base64 data URL (avoids CORS/tainted canvas issues)
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  const dataUrl = `data:image/svg+xml;base64,${base64}`;
  
  const img = new Image();
  img.onload = () => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Download
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
      <button @click="downloadPng" class="control-btn download-btn" title="Download PNG">
        <span class="material-icons">download</span>
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

.download-btn {
  border-left: 1px solid #e0e0e0;
  margin-left: 4px;
  padding-left: 8px;
}

.download-btn .material-icons {
  font-size: 18px;
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
