import { Injectable } from '@angular/core';
import { I18N_ES } from '../assets/i18n/es';
import { I18N_EN } from '../assets/i18n/en';

type Lang = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private lang: Lang = this.detectLang();
  private translations = { es: I18N_ES, en: I18N_EN };

  setLang(lang: Lang) {
    this.lang = lang;
  }

  getLang(): Lang {
    return this.lang;
  }

  translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.lang];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return value;
  }

  private detectLang(): Lang {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'es' ? 'es' : 'en';
  }
}