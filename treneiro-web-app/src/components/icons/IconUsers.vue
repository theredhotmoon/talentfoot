<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M23 21V19C22.9984 18.1171 22.7042 17.2588 22.1627 16.5562C21.6212 15.8535 20.8623 15.3456 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 3.13C16.8604 3.34685 17.6181 3.8552 18.1581 4.55734C18.6982 5.25947 18.9912 6.11654 18.9912 7C18.9912 7.88346 18.6982 8.74053 18.1581 9.44266C17.6181 10.1448 16.8604 10.6531 16 10.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>
<script setup lang="ts">
defineProps({ size: { type: [Number, String], default: 24 } });
</script>