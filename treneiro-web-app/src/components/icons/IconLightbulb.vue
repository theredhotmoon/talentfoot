<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18H15M10 22H14M15 14C16.5912 13.0649 17.6534 11.4589 17.9332 9.61057C18.213 7.76226 17.6816 5.85871 16.4862 4.39803C15.2907 2.93736 13.5463 2.06203 11.7139 2.00392C9.88147 1.9458 8.14668 2.71077 6.88876 4.07593C5.63085 5.4411 4.97525 7.26914 5.08866 9.123C5.20207 10.9769 6.07519 12.6715 7.48165 13.8427C8.42874 14.6306 9 15.7724 9 17V18H15V14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>