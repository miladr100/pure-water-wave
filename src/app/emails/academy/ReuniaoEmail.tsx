import { Body, Button, Container, Head, Hr, Html, Img, Section, Text } from "@react-email/components";

import { emailLogoDimensions, getEmailLogoContentId } from "@/lib/email-assets";

interface ReuniaoEmailProps {
  firstName: string;
  title: string;
  lines: string[];
  ctaLabel: string;
  ctaUrl: string;
}

const logoSrc = `cid:${getEmailLogoContentId()}`;

// One template for every meeting notice: the request to the educator,
// the receipt to the member, the educator's reply to the member.
export function ReuniaoEmail({ firstName, title, lines, ctaLabel, ctaUrl }: ReuniaoEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Body style={{ backgroundColor: "#f4f8fb", fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: 16, margin: "0 auto", maxWidth: 520, padding: "32px 28px" }}>
          <Img src={logoSrc} alt="Água Pura" width={emailLogoDimensions.width} height={emailLogoDimensions.height} style={{ margin: "0 auto 16px" }} />
          <Text style={{ color: "#003668", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>{title}</Text>
          <Text style={{ color: "#1f2933", fontSize: 15, lineHeight: "24px", margin: "0 0 8px" }}>Olá, {firstName}!</Text>
          {lines.map((line, index) => (
            <Text key={index} style={{ color: "#1f2933", fontSize: 15, lineHeight: "24px", margin: "0 0 8px" }}>
              {line}
            </Text>
          ))}
          <Section style={{ margin: "20px 0" }}>
            <Button href={ctaUrl} style={{ backgroundColor: "#0082bb", borderRadius: 999, color: "#ffffff", fontSize: 15, fontWeight: 600, padding: "12px 22px" }}>
              {ctaLabel}
            </Button>
          </Section>
          <Hr style={{ borderColor: "#e3eaf0", margin: "20px 0" }} />
          <Text style={{ color: "#6b7a89", fontSize: 12, lineHeight: "18px", margin: 0 }}>Painel HJ Team · Água Pura</Text>
        </Container>
      </Body>
    </Html>
  );
}
