import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface MagicLinkEmailProps {
  recipientName?: string;
  projectTitle?: string;
  projectId?: string;
  magicLink?: string;
  expiresIn?: string;
}

export const MagicLinkEmail = ({
  recipientName = "User",
  projectTitle = "Your Project",
  projectId = "12345",
  magicLink = "#",
  expiresIn = "24 hours",
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Access Your Project: {projectTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>CAPCo</Text>
        </Section>

        <Section style={contentSection}>
          <Text style={heading}>Project Access</Text>

          <Text style={paragraph}>Hi {recipientName},</Text>

          <Text style={paragraph}>
            You've been granted access to view a project in the CAPCo Fire
            Protection System.
          </Text>

          <Section style={projectCard}>
            <Text style={projectTitle}>📋 {projectTitle}</Text>
            <Text style={projectId}>Project ID: {projectId}</Text>
          </Section>

          <Text style={paragraph}>
            Click the button below to securely access your project. This link
            will automatically log you in and take you directly to the project.
          </Text>

          <Section style={btnContainer}>
            <Button style={buttonPrimary} href={magicLink}>
              View Project
            </Button>
          </Section>

          <Section style={alertBox}>
            <Text style={alertText}>
              ⏰ This link expires in {expiresIn}. For security reasons, please
              don't share this link with others.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from CAPCo Project Management
            System.
            <br />
            If you didn't request this access or have questions, please contact
            our support team.
          </Text>

          {/* Magic Link at the bottom */}
          <Hr style={hr} />
          <Section style={magicLinkSection}>
            <Text style={magicLinkText}>
              🔗 <strong>Direct Access Link:</strong>
            </Text>
            <Text style={magicLinkUrl}>{magicLink}</Text>
            <Text style={magicLinkNote}>
              If the button above doesn't work, copy and paste this link into
              your browser.
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

// Styles
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0",
};

const contentSection = {
  backgroundColor: "#ffffff",
  padding: "32px",
  borderRadius: "8px",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px 0",
};

const projectCard = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const projectTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1f2937",
  margin: "0 0 8px 0",
};

const projectId = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const buttonPrimary = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  border: "none",
};

const buttonSecondary = {
  backgroundColor: "#6b7280",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  border: "none",
};

const alertBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const alertText = {
  fontSize: "14px",
  color: "#92400e",
  margin: "0",
  lineHeight: "20px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  textAlign: "center" as const,
  lineHeight: "20px",
};

const magicLinkSection = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0 0 0",
};

const magicLinkText = {
  fontSize: "14px",
  color: "#475569",
  margin: "0 0 8px 0",
  fontWeight: "bold",
};

const magicLinkUrl = {
  fontSize: "12px",
  color: "#3b82f6",
  margin: "0 0 8px 0",
  wordBreak: "break-all" as const,
  fontFamily: "monospace",
  backgroundColor: "#f1f5f9",
  padding: "8px",
  borderRadius: "4px",
};

const magicLinkNote = {
  fontSize: "12px",
  color: "#64748b",
  margin: "0",
  fontStyle: "italic",
};
