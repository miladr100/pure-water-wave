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

interface PasswordChangedEmailProps {
  userFirstname: string;
}

const logoSrc = `cid:${getEmailLogoContentId()}`;

export const PasswordChangedEmail = ({
  userFirstname,
}: PasswordChangedEmailProps) => {
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

          <Text style={title}>Senha alterada</Text>
          <Text style={paragraph}>
            Olá{userFirstname ? ` ${userFirstname}` : ""}, a senha da sua conta
            na Biblioteca Água Pura foi alterada com sucesso.
          </Text>
          <Text style={paragraph}>
            Se você fez essa alteração, pode ignorar este e-mail. Se não
            reconhece essa mudança, acesse a página de login e use a opção
            “Esqueci minha senha” para proteger sua conta.
          </Text>

          <Hr style={hr} />
          <Text style={brandName}>Água Pura</Text>
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
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#444444",
  margin: "0 0 16px",
};

const brandName = {
  fontSize: "16px",
  fontWeight: "bold",
  lineHeight: "24px",
  color: "#1e3a5f",
  margin: "0 0 8px",
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
