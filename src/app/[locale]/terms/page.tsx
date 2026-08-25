import { LegalPage } from "@/components/landing/legal-page";

const SECTION_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"];

export default function TermsPage() {
  return <LegalPage translationKey="terms" sectionKeys={SECTION_KEYS} />;
}
