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
import * as React from "react";

interface WelcomeEmailProps {
  name?: string;
  appName?: string;
}

export const WelcomeEmail = ({ name = "User", appName = "CAPCo" }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {appName} - Let's get started!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>{appName}</Text>
        </Section>

        <Section style={contentSection}>
          <Text style={heading}>Welcome to {appName}!</Text>
          <Text style={paragraph}>Hi {name},</Text>
          <Text style={paragraph}>
            We're thrilled to have you join our platform! Your account has been successfully
            created, and you're now ready to explore all the features we have to offer.
          </Text>

          <Section style={btnContainer}>
            <Button style={button} href="https://yourapp.com/dashboard">
              Get Started
            </Button>
          </Section>

          <Text style={paragraph}>
            If you have any questions or need assistance, don't hesitate to reach out to our support
            team.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,
            <br />
            The {appName} Team
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logoSection = {
  padding: "20px 0",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0",
};

const contentSection = {
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#374151",
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "0 0 16px",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "600",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "20px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};
