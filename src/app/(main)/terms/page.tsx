import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { LegalSection } from "@/components/legal-content";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms and conditions governing your use of the ${SITE.name} platform.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" description="Last updated: January 2025" />
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <p className="leading-relaxed text-muted-foreground">
            Welcome to {SITE.name}. These Terms & Conditions ("Terms") govern your access to and use
            of the {SITE.name} website, applications and services (collectively, the "Platform"). By
            using the Platform, you agree to these Terms.
          </p>

          <LegalSection title={`1. About ${SITE.name}`}>
            <p>
              {SITE.name} is an online automotive marketplace and import facilitation platform
              operating in Ghana. We connect buyers with vehicle dealers, private sellers, parts
              sellers and service providers, and we facilitate the importation of vehicles.
            </p>
          </LegalSection>

          <LegalSection title="2. Accounts">
            <p>
              You must register for an account to access certain features. You are responsible for
              maintaining the confidentiality of your login credentials and for all activity under
              your account. You must provide accurate information and keep it up to date.
            </p>
          </LegalSection>

          <LegalSection title="3. Listings & Marketplace">
            <p>
              Sellers are solely responsible for the accuracy of their listings, including
              descriptions, photos, videos, pricing and vehicle condition. {SITE.name} does not own
              the vehicles or parts listed and acts as a marketplace intermediary. We verify dealers
              where indicated by the Verified badge, but buyers should always conduct their own due
              diligence and inspection before purchase.
            </p>
          </LegalSection>

          <LegalSection title="4. Import Services & Estimates">
            <p>
              Import duty, shipping and financing figures provided by our calculators are estimates
              for planning purposes only. Final duty is assessed by the Ghana Revenue Authority
              (GRA) Customs Division via the ICUMS platform and may differ. {SITE.name} is not liable
              for differences between estimated and actual charges.
            </p>
          </LegalSection>

          <LegalSection title="5. Payments">
            <p>
              Payments made through the Platform (Mobile Money, Paystack, bank transfer) are
              processed by third-party providers subject to their own terms. You agree to pay all
              applicable fees and taxes. Refunds, where applicable, are governed by the relevant
              seller's return policy and our buyer protection guidelines.
            </p>
          </LegalSection>

          <LegalSection title="6. Prohibited Conduct">
            <p>
              You agree not to post fraudulent, misleading or illegal content; not to infringe
              intellectual property rights; not to attempt to bypass security; and not to use the
              Platform for any unlawful purpose. We may suspend or terminate accounts that violate
              these Terms.
            </p>
          </LegalSection>

          <LegalSection title="7. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, {SITE.name} shall not be liable for any
              indirect, incidental or consequential damages arising from transactions between users,
              reliance on estimates, or use of the Platform.
            </p>
          </LegalSection>

          <LegalSection title="8. Changes to These Terms">
            <p>
              We may update these Terms from time to time. Continued use of the Platform after
              changes constitutes acceptance of the revised Terms.
            </p>
          </LegalSection>

          <LegalSection title="9. Contact">
            <p>
              Questions about these Terms? Contact us at{" "}
              <a href={`mailto:${SITE.supportEmail}`} className="text-brand-600 hover:underline">
                {SITE.supportEmail}
              </a>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  );
}
