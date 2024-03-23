import MEModule from "../module";
import resources from "./locales";

class MEI18n extends MEModule {

    private lang: string = 'en'
    private resources: { [lang: string]: { [key: string]: string } }
    constructor(instance) {
        super(instance)
    }

    async prepare(): Promise<boolean> {
        this.lang = this.instance.options.locale?.lang || 'en'
        this.resources = {
            ...resources,
            ...(this.instance.options.locale?.resources || {})
        }
        return true
    }

    t(key: string) {
        const { lang, resources } = this;
        return resources[lang]?.[key] || resources.en[key] || key;
    }

    addLocales(resources: { [lang: string]: { [key: string]: string } }, lang?: string) {
        this.resources = {
            ...this.resources,
            ...resources
        }
        this.lang = lang || this.lang
    }

    changeLanguage(lang: string) {
        this.lang = lang;
    }
}

export default MEI18n;