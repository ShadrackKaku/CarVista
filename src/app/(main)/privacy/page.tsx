import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { LegalSection } from "@/components/legal-content";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CarVista collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: January 2025" />
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <p className="leading-relaxed text-muted-foreground">
            {SITE.name} ("we", "us") respects your privacy. This Policy explains what personal data
            we collect, how we use it, and your rights, in line with Ghana's Data Protection Act,
            2012 (Act 843).
          </p>

          <LegalSection title="1. Information We Collect">
            <p>
              We collect information you provide directly — such as your name, email, phone number,
              location and listing details — as well as information collected automatically, such as
              device data, IP address and usage analytics. Payment information is processed securely
              by our payment partners and is not stored on our servers.
            </p>
          </LegalSection>

          <LegalSection title="2. How We Use Your Data">
            <p>We use your data to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Provide and improve the Platform and its features;</li>
              <li>Facilitate transactions, imports and communications between users;</li>
              <li>Send you verification, transactional and (with consent) marketing messages;</li>
              <li>Detect and prevent fraud and abuse;</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Sharing Your Data">
            <p>
              We share data with sellers/buyers as necessary to complete transactions, with service
              providers (hosting, payments, email, analytics) under confidentiality obligations, and
              with authorities where required by law. We never sell your personal data.
            </p>
          </LegalSection>

          <LegalSection title="4. Cookies">
            <p>
              We use cookies and similar technologies to keep you signed in, remember preferences,
              and understand how the Platform is used. You can control cookies through your browser
              settings.
            </p>
          </LegalSection>

          <LegalSection title="5. Data Security">
            <p>
              We implement industry-standard measures — encryption in transit, hashed passwords,
              access controls and rate limiting — to protect your data. No system is completely
              secure, so we encourage you to use a strong, unique password.
            </p>
          </LegalSection>

          <LegalSection title="6. Your Rights">
            <p>
              You have the right to access, correct, or delete your personal data, and to withdraw
              consent to marketing at any time. To exercise these rights, contact us at{" "}
              <a href={`mailto:${SITE.supportEmail}`} className="text-brand-600 hover:underline">
                {SITE.supportEmail}
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="7. Changes">
            <p>
              We may update this Policy periodically. We'll post the updated version here with a new
              "last updated" date.
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  );
}
