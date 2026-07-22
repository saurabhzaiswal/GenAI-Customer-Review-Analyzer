import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, startWith } from 'rxjs';

interface SeoData {
  title: string;
  description: string;
  image: string;
  imageWidth: string;
  imageHeight: string;
  imageAlt: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly origin = 'https://gen-ai-customer-review-analyzer.vercel.app';

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.updateRouteMetadata());
  }

  private updateRouteMetadata(): void {
    let activeRoute = this.route;
    while (activeRoute.firstChild) activeRoute = activeRoute.firstChild;

    const seo = activeRoute.snapshot.data['seo'] as SeoData | undefined;
    if (!seo) return;

    const path = this.router.url.split(/[?#]/, 1)[0];
    const canonicalUrl = `${this.origin}${path === '/' ? '/' : path}`;
    const imageUrl = new URL(seo.image, this.origin).href;

    this.title.setTitle(seo.title);
    this.meta.updateTag({ name: 'description', content: seo.description });
    this.updateProperty('og:title', seo.title);
    this.updateProperty('og:description', seo.description);
    this.updateProperty('og:url', canonicalUrl);
    this.updateProperty('og:image', imageUrl);
    this.updateProperty('og:image:secure_url', imageUrl);
    this.updateProperty('og:image:width', seo.imageWidth);
    this.updateProperty('og:image:height', seo.imageHeight);
    this.updateProperty('og:image:alt', seo.imageAlt);
    this.meta.updateTag({ name: 'twitter:title', content: seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: seo.description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image:alt', content: seo.imageAlt });
    this.updateCanonical(canonicalUrl);
  }

  private updateProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private updateCanonical(url: string): void {
    let canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }
    canonical.href = url;
  }
}
