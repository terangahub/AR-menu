import { LegalPage } from "@/components/landing/legal-page";

const SECTION_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"];

export default function PrivacyPage() {
  return <LegalPage translationKey="privacy" sectionKeys={SECTION_KEYS} />;
}
