import { createI18n } from 'vue-i18n';
import { watch } from 'vue';
import en from './locales/en.json';
import pl from './locales/pl.json';
import es from './locales/es.json';

const LOCALE_KEY = 'locale';
const savedLocale = localStorage.getItem(LOCALE_KEY) || 'en';

const i18n = createI18n({
    legacy: false, // Usage with Composition API
    locale: savedLocale,
    fallbackLocale: 'en',
    messages: {
        en,
        pl,
        es
    }
});

// Persist locale changes to localStorage
watch(i18n.global.locale, (newLocale) => {
    localStorage.setItem(LOCALE_KEY, newLocale);
});

export default i18n;
