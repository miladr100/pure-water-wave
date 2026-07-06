import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailLogoDimensions, getEmailLogoContentId } from "@/lib/email-assets";

interface RemarketingDonationEmailProps {
  userFirstname: string;
  donationUrl: string;
}

const logoSrc = `cid:${getEmailLogoContentId()}`;

export const RemarketingDonationEmail = ({
  userFirstname,
  donationUrl,
}: RemarketingDonationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {userFirstname}, sua doação ainda pode fazer a diferença. Conclua em poucos cliques.
      </Preview>

      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={logoSrc}
              alt="Pure Water Wave"
              width={emailLogoDimensions.width}
              height={emailLogoDimensions.height}
              style={logo}
            />
          </Section>

          <Text style={title}>Sua doação ainda está esperando por você</Text>
          <Text style={lead}>
            Olá, {userFirstname}. Notamos que você iniciou uma doação hoje, mas ainda não
            conseguiu concluí-la.
          </Text>

          <Text style={paragraph}>
            Sabemos que o dia a dia é corrido — mas cada contribuição, por menor que pareça,
            ajuda jovens a acessarem formação, ações sociais e experiências que transformam
            vidas e famílias.
          </Text>
          <Text style={highlight}>
            Que tal retomar de onde parou? Leva apenas alguns minutos.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href={donationUrl}>
              Concluir minha doação
            </Button>
          </Section>

          <Text style={paragraph}>
            Sua generosidade fortalece um movimento de pureza, transformação e esperança para
            as próximas gerações.
          </Text>

          <Text style={brandName}>Pure Water Wave</Text>
          <Text style={brandTagline}>
            Pureza. Transformação. Uma onda que alcança gerações.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Este é um e-mail automático. Por favor, não responda a este e-mail.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f4f4f7",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  color: "#333333",
  padding: "20px",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  margin: "0 auto",
  padding: "40px 32px",
  maxWidth: "600px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const title = {
  fontSize: "24px",
  fontWeight: "bold",
  lineHeight: "32px",
  color: "#1e3a5f",
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const lead = {
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "28px",
  color: "#333333",
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#444444",
  margin: "0 0 16px",
};

const highlight = {
  fontSize: "16px",
  lineHeight: "26px",
  fontWeight: "600",
  color: "#1e3a5f",
  margin: "0 0 8px",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1e3a5f",
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const brandName = {
  fontSize: "16px",
  fontWeight: "bold",
  lineHeight: "24px",
  color: "#1e3a5f",
  margin: "24px 0 4px",
  textAlign: "center" as const,
};

const brandTagline = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#666666",
  margin: "0",
  textAlign: "center" as const,
};

const hr = {
  borderColor: "#eaeaea",
  margin: "28px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "0",
};
