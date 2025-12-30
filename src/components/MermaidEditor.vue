<script setup lang="ts">
defineProps<{
  modelValue: string;
  error?: string;
}>();

defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
  <div class="editor-container">
    <textarea
      class="editor-textarea"
      :class="{ 'has-error': error }"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      placeholder="Enter Mermaid syntax here...

Example:
graph TD
    A[Start] --> B[Process]
    B --> C[End]"
      spellcheck="false"
    ></textarea>
    
    <transition name="toast-slide">
      <div v-if="error" class="error-toast">
        <div class="toast-indicator"></div>
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  flex: 1;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  resize: none;
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  border: none;
  outline: none;
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
  box-sizing: border-box;
  transition: background-color var(--transition-normal);
}

.editor-textarea:focus {
  background-color: var(--color-bg-primary); 
}

.editor-textarea::placeholder {
  color: var(--color-text-tertiary);
  opacity: 1;
}

/* Custom Scrollbar for Textarea */
.editor-textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.editor-textarea::-webkit-scrollbar-track {
  background: transparent;
}
.editor-textarea::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-full);
}
.editor-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* Error Toast Modernization */
.error-toast {
  position: absolute;
  bottom: 24px;
  left: 24px;
  right: 24px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-error);
  overflow: hidden;
  z-index: 20;
}

/* Red line on the left */
.toast-indicator {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background: var(--color-error);
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-left: 4px;
}

.error-text {
  flex: 1;
  line-height: 1.4;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all var(--transition-bounce);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
