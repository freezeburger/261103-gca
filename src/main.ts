import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/config/app.config';
import { App } from './app/shell/app';

registerLocaleData(localeFr);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
