import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { emailLogoDimensions, getEmailLogoContentId } from "@/lib/email-assets";

export type FeedbackEmailProps = {
  typeLabel: string;
  message: string;
  page: string;
  link: string;
  imageNames: string[];
  fullName: string;
  email: string;
  login: string;
  phone: string;
  churchName: string;
  country: string;
  language: string;
  role: string;
};

const logoSrc = `cid:${getEmailLogoContentId()}`;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Text style={field}>
      <span style={fieldLabel}>{label}: </span>
      {value || "—"}
    </Text>
  );
}

export const FeedbackEmail = ({
  typeLabel,
  message,
  page,
  link,
  imageNames,
  fullName,
  email,
  login,
  phone,
  churchName,
  country,
  language,
  role,
}: FeedbackEmailProps) => {
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

          <Text style={title}>Erros e sugestões</Text>
          <Text style={paragraph}>
            Um usuário da Biblioteca Água Pura enviou um relatório.
          </Text>

          <Section style={box}>
            <Field label="Tipo" value={typeLabel} />
            <Field label="Página" value={page} />
            <Text style={field}>
              <span style={fieldLabel}>Link: </span>
              {link ? (
                <Link href={link} style={linkStyle}>
                  {link}
                </Link>
              ) : (
                "—"
              )}
            </Text>
            <Field
              label="Anexos"
              value={
                imageNames.length > 0 ? imageNames.join(", ") : "Nenhuma imagem"
              }
            />
            <Text style={field}>
              <span style={fieldLabel}>Mensagem:</span>
            </Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Text style={sectionTitle}>Dados do usuário</Text>
          <Section style={box}>
            <Field label="Nome" value={fullName} />
            <Field label="E-mail" value={email} />
            <Field label="Login" value={login} />
            <Field label="Telefone" value={phone} />
            <Field label="Igreja" value={churchName} />
            <Field label="País" value={country} />
            <Field label="Idioma" value={language} />
            <Field label="Perfil" value={role} />
          </Section>

          <Hr style={hr} />
          <Text style={brandName}>Água Pura</Text>
          <Text style={footer}>
            Você pode responder este e-mail para falar diretamente com o usuário.
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

const sectionTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#1e3a5f",
  margin: "8px 0 12px",
};

const box = {
  backgroundColor: "#f0f4f8",
  borderRadius: "10px",
  padding: "16px 18px",
  margin: "0 0 20px",
};

const field = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#333333",
  margin: "0 0 6px",
};

const fieldLabel = {
  fontWeight: "700",
  color: "#1e3a5f",
};

const linkStyle = {
  color: "#2563eb",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const messageText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#333333",
  margin: "8px 0 0",
  whiteSpace: "pre-wrap" as const,
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
