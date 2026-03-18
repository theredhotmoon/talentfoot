import { useI18n } from 'vue-i18n';

export function useTranslation() {
    const { locale } = useI18n();

    const getTranslated = (field: Record<string, string> | string | null | undefined): string => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[locale.value] || field['en'] || Object.values(field)[0] || '';
    };

    return { getTranslated, locale };
}
