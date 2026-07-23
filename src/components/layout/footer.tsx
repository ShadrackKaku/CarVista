import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Logo } from "@/components/logo";
import { NewsletterForm } from "@/components/newsletter-form";
import { SITE } from "@/lib/constants";

const socials = [
  { Icon: Facebook, url: SITE.socials.facebook, label: "Facebook" },
  { Icon: Instagram, url: SITE.socials.instagram, label: "Instagram" },
  { Icon: Twitter, url: SITE.socials.twitter, label: "Twitter" },
].filter((s) => s.url);

const footerNav = [
  {
    title: "Marketplace",
    links: [
      { label: "Buy a Car", href: "/vehicles" },
      { label: "Sell Your Car", href: "/vehicles/new" },
      { label: "Car Parts", href: "/parts" },
      { label: "Dealer Directory", href: "/dealers" },
      { label: "Automotive Services", href: "/services" },
    ],
  },
  {
    title: "Import",
    links: [
      { label: "Import a Car", href: "/import" },
      { label: "Import Duty Calculator", href: "/calculators/import-duty" },
      { label: "Shipping Calculator", href: "/calculators/shipping" },
      { label: "Financing Calculator", href: "/calculators/financing" },
      { label: "Track My Import", href: "/import/track" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Testimonials", href: "/testimonials" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.description}
            </p>
            <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-brand-500" /> {SITE.address}
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-500" /> {SITE.phone}
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-500" /> {SITE.supportEmail}
              </p>
            </div>
            {socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socials.map(({ Icon, url, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-brand-400 hover:text-brand-600"
                    aria-label={`${SITE.name} on ${label}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-5">
            {footerNav.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-brand-600"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-semibold">Stay in the loop</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Get new arrivals, import deals and market insights in your inbox.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved. Made in Ghana 🇬🇭
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Mobile Money</span>
            <span>·</span>
            <span>Paystack</span>
            <span>·</span>
            <span>Bank Transfer</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
