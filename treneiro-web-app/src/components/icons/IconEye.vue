<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" fill="url(#eyeGrad)" opacity="0.15"/>
    <defs>
      <linearGradient id="eyeGrad" x1="1" y1="4" x2="23" y2="20" gradientUnits="userSpaceOnUse">
        <stop stop-color="currentColor" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>