<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-mask" @click.self="$emit('update:modelValue', false)">
      <div class="modal-box panel-border">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  max-width: 90%;
  max-height: 90vh;
  overflow: auto;
  padding: 16px;
  background: #fff;
}
</style>
