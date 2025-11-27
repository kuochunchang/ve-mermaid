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
    
    <transition name="error-slide">
      <div v-if="error" class="error-toast">
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
  font-family: 'Roboto Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  border: none;
  outline: none;
  background-color: #fafafa;
  color: #212121;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
}

.editor-textarea:focus {
  background-color: #ffffff;
}

.editor-textarea.has-error {
  background-color: #ffebee;
}

.editor-textarea::placeholder {
  color: #9e9e9e;
  opacity: 1;
}

.error-toast {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: #f44336;
  color: white;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
  line-height: 1.4;
  font-weight: 400;
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.3s ease;
}

.error-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.error-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
