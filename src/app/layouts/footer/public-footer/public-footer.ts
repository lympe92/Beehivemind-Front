import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * The public footer: a blurb, then Software, How to and Follow us, over a
 * legal line. Content is fixed rather than passed in — it is the same on
 * every page. Styles: styles/components/layout/public-layout.css.
 */
@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-footer.html',
})
export class PublicFooterComponent {
  readonly year = new Date().getFullYear();

  // The Android app ships under the `org.beehivemind` package id, carried
  // over from the 2019 native build so it updates that existing listing.
  readonly software: FooterLink[] = [
    { label: 'Features', href: '/features' },
    { label: 'App', href: '/app' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Android App', href: 'https://play.google.com/store/apps/details?id=org.beehivemind', external: true },
    { label: 'iOS App', href: 'https://apps.apple.com/app/beehivemind', external: true },
    { label: 'Help', href: '/help' },
    { label: 'Contact', href: '/contact' },
  ];

  readonly howTo: FooterLink[] = [
    { label: 'Inspections', href: '/inspections' },
    { label: 'Apiaries & Hives', href: '/apiariesandbeehives' },
    { label: 'Harvest & Feeding', href: '/harvestandfeeding' },
    { label: 'Financial', href: '/financial' },
  ];

  readonly social: FooterLink[] = [
    { label: 'Facebook', href: 'https://www.facebook.com/beehivemind.org', external: true },
    { label: 'Instagram', href: 'https://www.instagram.com/beehivemind_org', external: true },
    { label: 'Twitter', href: 'https://twitter.com/Beehivemind_org', external: true },
    { label: 'Linkedin', href: 'https://www.linkedin.com/company/beehivemind-beekeeping-software', external: true },
    { label: 'Youtube', href: 'https://www.youtube.com/channel/UCSacxrpIMgWoWhLORBY5HcQ', external: true },
  ];

  readonly columns = [
    { heading: 'Software', links: this.software },
    { heading: 'How to', links: this.howTo },
    { heading: 'Follow us', links: this.social },
  ];
}
