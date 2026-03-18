<template>
  <div>
    <div class="mb-8">
      <h1 class="font-heading font-extrabold text-3xl gradient-text mb-2">{{ $t('footer.terms') }}</h1>
      <p class="text-sm" style="color: var(--tf-text-muted);">Last updated: March 2026</p>
    </div>

    <div class="card-static p-8 space-y-6" style="border-radius: var(--tf-radius-xl);">
      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">1. Acceptance of Terms</h2>
        <p style="color: var(--tf-text-muted);">By accessing and using TalentFoot, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">2. Use License</h2>
        <p style="color: var(--tf-text-muted);">Permission is granted to temporarily access the materials on TalentFoot for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose; attempt to decompile or reverse-engineer any software contained on the platform; remove any copyright or other proprietary notations from the materials.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">3. Subscriptions</h2>
        <p style="color: var(--tf-text-muted);">Access to premium content requires an active subscription. Subscriptions auto-renew unless cancelled. You may cancel your subscription at any time through your account settings. Refunds are handled on a case-by-case basis.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">4. Content</h2>
        <p style="color: var(--tf-text-muted);">All video content, training materials, and educational resources provided on TalentFoot are protected by copyright. You may not redistribute, sell, or share any content from the platform without explicit written permission.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">5. Challenges</h2>
        <p style="color: var(--tf-text-muted);">Challenges are designed to track your learning progress. Each challenge can be completed once per course. Upon completion, you retain access to the course content for the duration of your subscription.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">6. Disclaimer</h2>
        <p style="color: var(--tf-text-muted);">The materials on TalentFoot are provided on an "as is" basis. TalentFoot makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">7. Contact</h2>
        <p style="color: var(--tf-text-muted);">If you have questions about these Terms & Conditions, please <router-link to="/contact" style="color: var(--tf-accent-emerald);">contact us</router-link>.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
