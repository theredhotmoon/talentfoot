<template>
  <div>
    <div class="mb-8">
      <h1 class="font-heading font-extrabold text-3xl gradient-text mb-2">{{ $t('footer.privacy') }}</h1>
      <p class="text-sm" style="color: var(--tf-text-muted);">Last updated: March 2026</p>
    </div>

    <div class="card-static p-8 space-y-6" style="border-radius: var(--tf-radius-xl);">
      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">1. Information We Collect</h2>
        <p style="color: var(--tf-text-muted);">We collect information you provide directly to us, such as when you create an account, subscribe to our service, participate in challenges, or contact us. This may include your name, email address, and usage data.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">2. How We Use Your Information</h2>
        <p style="color: var(--tf-text-muted);">We use the information we collect to: provide, maintain, and improve our services; track your progress through challenges and courses; send you notifications about your account and progress; respond to your comments, questions, and requests.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">3. Data Storage</h2>
        <p style="color: var(--tf-text-muted);">Your data is stored securely on our servers. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">4. Cookies</h2>
        <p style="color: var(--tf-text-muted);">We use cookies and similar tracking technologies to track activity on our service and hold certain information. Cookies are files with a small amount of data that are sent to your browser from a website and stored on your device.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">5. Your Rights</h2>
        <p style="color: var(--tf-text-muted);">You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us directly. Under GDPR, you also have the right to data portability and the right to restrict processing.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">6. Changes to This Policy</h2>
        <p style="color: var(--tf-text-muted);">We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.</p>
      </section>

      <section>
        <h2 class="font-heading font-bold text-xl mb-3" style="color: var(--tf-text);">7. Contact Us</h2>
        <p style="color: var(--tf-text-muted);">If you have questions about this Privacy Policy, please <router-link to="/contact" style="color: var(--tf-accent-emerald);">contact us</router-link>.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
