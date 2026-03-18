<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18C1.64539 18.3024 1.55328 18.6453 1.55446 18.9945C1.55564 19.3436 1.65008 19.6868 1.82827 19.9897C2.00645 20.2926 2.26227 20.5447 2.56997 20.7208C2.87768 20.897 3.2267 20.9912 3.58 21H20.42C20.7733 20.9912 21.1223 20.897 21.43 20.7208C21.7377 20.5447 21.9936 20.2926 22.1717 19.9897C22.3499 19.6868 22.4444 19.3436 22.4455 18.9945C22.4467 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32313 12.9757 3.14934C12.6708 2.97555 12.3197 2.87546 11.965 2.8561C11.6103 2.83674 11.261 2.8986 10.9423 3.03714C10.6236 3.17568 10.3438 3.38743 10.12 3.66" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>