"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Ported section structure from terms_conditions.dart (privacy policy + cookie policy).
const PRIVACY = [
  ["1. Information We Collect", "We collect information you provide directly, such as name, email, phone number and institutional records, to operate the ERP."],
  ["2. How We Use Your Information", "To provide and maintain the service, manage staff and student records, process payroll and communicate with you."],
  ["3. How We Share Your Information", "We do not sell your data. Information is shared only with your institution's authorised administrators and service providers."],
  ["4. Data Security", "We use industry-standard measures to protect your data against unauthorised access, alteration or disclosure."],
  ["5. Data Retention", "We retain records for as long as your institution maintains an active account or as required by law."],
  ["6. Your Rights", "You may request access to, correction of, or deletion of your personal data through your administrator."],
  ["7. Children's Privacy", "Student data is managed by the institution under applicable regulations; access is restricted to authorised staff."],
  ["8. Contact Us", "For privacy queries, contact support@edastra.in."],
];

const COOKIES = [
  ["1. What Are Cookies?", "Cookies are small text files stored on your device to keep you signed in and remember preferences."],
  ["2. How We Use Cookies", "We use cookies to maintain your session (the auth token) and remember your theme preference."],
  ["3. Types of Cookies We Use", "Essential cookies (authentication) and preference cookies (theme). We do not use advertising cookies."],
  ["5. Your Choices Regarding Cookies", "You can clear cookies via your browser; doing so will sign you out."],
  ["6. Managing Cookies", "Most browsers let you control cookies through their settings."],
  ["7. Changes to This Cookie Policy", "We may update this policy; changes will be reflected on this page."],
  ["10. Contact Us", "For questions about cookies, contact support@edastra.in."],
];

function Sections({ items }: { items: string[][] }) {
  return (
    <div className="space-y-6">
      {items.map(([title, body]) => (
        <section key={title}>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </section>
      ))}
    </div>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Terms & Policies" description="Privacy policy, cookie policy and terms." />
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="privacy">
            <TabsList>
              <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              <TabsTrigger value="cookies">Cookie Policy</TabsTrigger>
            </TabsList>
            <TabsContent value="privacy">
              <Sections items={PRIVACY} />
            </TabsContent>
            <TabsContent value="cookies">
              <Sections items={COOKIES} />
            </TabsContent>
          </Tabs>
          <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Ed-Astra · Vonisha Service Foundation. Last updated {new Date().toLocaleDateString()}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
