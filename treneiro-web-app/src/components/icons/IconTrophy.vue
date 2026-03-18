<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 21H16M12 17V21M7 4H17M4 4H7V8C7 10.7614 9.23858 13 12 13C14.7614 13 17 10.7614 17 8V4H20M4 4C4 5.65685 5.34315 7 7 7M20 4C20 5.65685 18.6569 7 17 7M12 13C9.23858 13 7 10.7614 7 8V4H17V8C17 10.7614 14.7614 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 13C9.23858 13 7 10.7614 7 8V4H17V8C17 10.7614 14.7614 13 12 13Z" fill="url(#trophyGrad)" opacity="0.2"/>
    <defs>
      <linearGradient id="trophyGrad" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
        <stop stop-color="currentColor" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>