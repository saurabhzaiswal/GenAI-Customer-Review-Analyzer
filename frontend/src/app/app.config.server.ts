import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

class ServerTranslateLoader implements TranslateLoader {
  getTranslation(_lang: string): Observable<TranslationObject> {
    // Route metadata is plain text, so translations are not needed to emit the
    // crawler-facing document head. Avoid making HTTP asset requests at build time.
    return of({});
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: TranslateLoader, useClass: ServerTranslateLoader },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
