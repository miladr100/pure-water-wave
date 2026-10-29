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
import type { AccountKind } from "@/lib/academy/types";

interface WelcomeEmailProps {
  fullName: string;
  kind: AccountKind;
  email: string;
  // null when the educator chose the password: the mail then points at
  // "Esqueci minha senha" instead of printing anything.
  temporaryPassword: string | null;
  appUrl: string;
}

const logoSrc = `cid:${getEmailLogoContentId()}`;

// Where each kind of account lands after the Login (see session-bridge.ts).
const AREA: Record<AccountKind, { name: string; intro: string }> = {
  pastor: {
    name: "Biblioteca",
    intro: "Sua conta dá acesso à Biblioteca Água Pura, com os materiais do movimento.",
  },
  hjteam: {
    name: "Academia",
    intro: "Sua conta dá acesso à Academia Água Pura — os cursos em vídeo — e também à Biblioteca.",
  },
  educador: {
    name: "Painel",
    intro: "Sua conta de educador(a) dá acesso ao Painel da Academia, à Academia e à Biblioteca.",
  },
};

export const WelcomeEmail = ({ fullName, kind, email, temporaryPassword, appUrl }: WelcomeEmailProps) => {
  const area = AREA[kind];
  const loginUrl = `${appUrl.replace(/\/$/, "")}/login`;

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

          <Text style={title}>Bem-vindo(a) à Água Pura</Text>
          <Text style={paragraph}>Olá, {fullName}!</Text>
          <Text style={paragraph}>{area.intro}</Text>

          <Section style={box}>
            <Text style={line}>Área: {area.name}</Text>
            <Text style={line}>Login: {email}</Text>
            {temporaryPassword ? (
              <Text style={line}>
                Senha temporária: <strong style={code}>{temporaryPassword}</strong>
              </Text>
            ) : (
              <Text style={line}>
                Sua senha foi definida pela equipe; use &quot;Esqueci minha senha&quot; se precisar.
              </Text>
            )}
          </Section>

          <Text style={paragraph}>
            Entre em {loginUrl} e, se recebeu uma senha temporária, troque-a no seu perfil
            na primeira visita.
          </Text>

          <Section style={{ textAlign: "center" as const }}>
            <Button href={loginUrl} style={button}>
              Entrar
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

const code = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: "17px",
  letterSpacing: "1px",
};

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
