import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from "@react-email/components";
import { emailLogoDimensions, getEmailLogoContentId } from "@/lib/email-assets";

interface NewStudentEmailProps {
  studentName: string;
  studentEmail: string;
  country: string;
  language: string;
  adminUrl: string;
}

const logoSrc = `cid:${getEmailLogoContentId()}`;

export const NewStudentEmail = ({
  studentName,
  studentEmail,
  country,
  language,
  adminUrl,
}: NewStudentEmailProps) => {
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

          <Text style={title}>Novo aluno na Academia</Text>
          <Text style={paragraph}>
            <strong>{studentName}</strong> acabou de se cadastrar na Academia
            Água Pura.
          </Text>

          <Section style={box}>
            <Text style={line}>E-mail: {studentEmail}</Text>
            <Text style={line}>País: {country || "—"}</Text>
            <Text style={line}>Idioma: {language}</Text>
          </Section>

          <Text style={paragraph}>
            Faça o primeiro contato e registre no painel para que a equipe saiba
            que o aluno já foi acolhido.
          </Text>

          <Section style={{ textAlign: "center" as const }}>
            <Button href={adminUrl} style={button}>
              Abrir o painel
            </Button>
          </Section>

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

const logoSection = { textAlign: "center" as const, marginBottom: "24px" };
const logo = { margin: "0 auto", display: "block" };

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

const box = {
  backgroundColor: "#f0f4f8",
  borderRadius: "10px",
  padding: "12px 16px",
  margin: "8px 0 24px",
};

const line = { fontSize: "15px", lineHeight: "24px", color: "#1e3a5f", margin: 0 };

const button = {
  backgroundColor: "#1a4d7a",
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

const brandName = {
  fontSize: "16px",
  fontWeight: "bold",
  lineHeight: "24px",
  color: "#1e3a5f",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const hr = { borderColor: "#eaeaea", margin: "28px 0" };

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "0",
};
