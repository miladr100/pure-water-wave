import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from "@react-email/components";
import { emailLogoDimensions, getEmailLogoContentId } from "@/lib/email-assets";

interface SuccessDonationEmailProps {
  userFirstname: string;
  amount: string;
}

const logoSrc = `cid:${getEmailLogoContentId()}`;

const impactItems = [
  "Formação de jovens líderes com propósito;",
  "Fortalecimento de valores familiares;",
  "Desenvolvimento de projetos sociais e comunitários;",
  "Criação de oportunidades que transformam vidas.",
];

export const SuccessDonationEmail = ({
  amount,
  userFirstname,
}: SuccessDonationEmailProps) => {
  return (
    <Html>
      <Head />
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

          <Text style={title}>❤️ Obrigado {userFirstname || ""} pela sua contribuição!</Text>
          <Text style={lead}>Sua doação de R$ {amount || ""} foi recebida com sucesso.</Text>

          <Text style={paragraph}>
            Obrigado por acreditar que o futuro da sociedade começa dentro da família.
          </Text>
          <Text style={paragraph}>
            Através da sua generosidade, jovens terão acesso a programas de formação,
            ações sociais, experiências transformadoras e oportunidades para desenvolver
            liderança, caráter e propósito de vida.
          </Text>
          <Text style={paragraph}>
            Cada contribuição — seja uma doação única ou um compromisso contínuo — ajuda a
            fortalecer famílias, transformar comunidades e inspirar uma nova geração a fazer
            a diferença no mundo.
          </Text>
          <Text style={highlight}>
            Hoje, você se tornou parte desta onda de transformação.
          </Text>

          <Hr style={hr} />

          <Text style={sectionTitle}>O impacto da sua doação</Text>
          {impactItems.map((item) => (
            <Text key={item} style={listItem}>
              ✓ {item}
            </Text>
          ))}

          <Hr style={hr} />

          <Text style={closingTitle}>Muito obrigado!</Text>
          <Text style={paragraph}>
            Sua generosidade alcançará famílias, comunidades e futuras gerações.
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
  textAlign: "center" as const,
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

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  lineHeight: "28px",
  color: "#1e3a5f",
  margin: "0 0 16px",
};

const listItem = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#444444",
  margin: "0 0 8px",
  paddingLeft: "4px",
};

const closingTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  lineHeight: "28px",
  color: "#333333",
  margin: "0 0 12px",
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
