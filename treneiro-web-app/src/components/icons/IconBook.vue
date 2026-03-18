<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.53726 18.3 5.2 18.3H20V4H5.2C4.53726 4 4 4.53726 4 5.2V19.5ZM4 19.5C4 20.163 4.53726 20.7 5.2 20.7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 7H16M8 11H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 19.5V5.2C4 4.53726 4.53726 4 5.2 4H20V20.7H5.2C4.53726 20.7 4 20.163 4 19.5Z" fill="url(#bookGrad)" opacity="0.15"/>
    <defs>
      <linearGradient id="bookGrad" x1="4" y1="4" x2="20" y2="20.7" gradientUnits="userSpaceOnUse">
        <stop stop-color="currentColor" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>