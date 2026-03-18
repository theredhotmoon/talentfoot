<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 15.5C17 18.5376 14.7614 21 12 21C9.23858 21 7 18.5376 7 15.5C7 11.5 10 9.5 10 9.5C10 9.5 8.5 11 8.5 13.5C8.5 13.5 11 3 14.5 5.5C14.5 5.5 13 8.5 15 10.5C17 12.5 17 15.5 17 15.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 15.5C17 18.5376 14.7614 21 12 21C9.23858 21 7 18.5376 7 15.5C7 11.5 10 9.5 10 9.5C10 9.5 8.5 11 8.5 13.5C8.5 13.5 11 3 14.5 5.5C14.5 5.5 13 8.5 15 10.5C17 12.5 17 15.5 17 15.5Z" fill="url(#flameGrad)" opacity="0.15"/>
    <defs>
      <linearGradient id="flameGrad" x1="7" y1="3" x2="17" y2="21" gradientUnits="userSpaceOnUse">
        <stop stop-color="currentColor" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>
