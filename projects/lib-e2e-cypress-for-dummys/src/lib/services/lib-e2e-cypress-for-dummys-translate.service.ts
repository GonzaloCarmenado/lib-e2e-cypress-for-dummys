import { Injectable } from '@angular/core';
import { I18N_FR } from '../assets/i18n/fr';
import { I18N_IT } from '../assets/i18n/it';
import { I18N_DE } from '../assets/i18n/de';
import { I18N_ES } from '../assets/i18n/es';
import { I18N_EN } from '../assets/i18n/en';
export type Lang = 'es' | 'en' | 'fr' | 'it' | 'de';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private lang: Lang = this.detectLang();
  private readonly translations = {
    es: I18N_ES,
    en: I18N_EN,
    fr: I18N_FR,
    it: I18N_IT,
    de: I18N_DE,
  };
  public setLang(lang: Lang) {
    this.lang = lang;
  }

  public getLang(): Lang {
    return this.lang;
  }

  public translate(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.lang];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return value;
  }

  public detectLang(): Lang {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'es' ? 'es' : 'en';
  }
}
