<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9.09009 9C9.32519 8.33167 9.78924 7.76811 10.4001 7.40913C11.011 7.05016 11.729 6.91894 12.4273 7.03871C13.1255 7.15849 13.7589 7.52152 14.2152 8.06353C14.6714 8.60553 14.9211 9.29152 14.9201 10C14.9201 12 11.9201 13 11.9201 13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>