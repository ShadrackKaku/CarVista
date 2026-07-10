import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ContactForm } from "@/components/contact-form";
import { SITE } from "@/lib/constants";
import { whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the CarVista team. We're here to help with buying, importing and servicing your vehicle.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const details = [
    { icon: MapPin, label: "Visit us", value: SITE.address },
    { icon: Phone, label: "Call us", value: SITE.phone },
    { icon: Mail, label: "Email us", value: SITE.supportEmail },
    { icon: Clock, label: "Hours", value: "Mon–Sat, 8am – 6pm GMT" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Have a question about a listing, an import, or your order? Reach out and our Ghana-based team will help."
      />
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            {details.map((d) => (
              <div key={d.label} className="flex items-start gap-4 rounded-xl border bg-card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  <d.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{d.label}</p>
                  <p className="font-semibold">{d.value}</p>
                </div>
              </div>
            ))}
            <a
              href={whatsappUrl(SITE.whatsapp, "Hi CarVista, I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl bg-[#25D366] p-5 text-white transition-opacity hover:opacity-95"
            >
              <MessageCircle className="h-6 w-6" />
              <div>
                <p className="text-sm text-white/90">Fastest response</p>
                <p className="font-semibold">Chat with us on WhatsApp</p>
              </div>
            </a>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
