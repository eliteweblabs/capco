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

interface ProjectNotificationEmailProps {
  recipientName?: string;
  projectTitle?: string;
  projectId?: string;
  statusMessage?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
}

export const ProjectNotificationEmail = ({
  recipientName = "User",
  projectTitle = "Your Project",
  projectId = "12345",
  statusMessage = "Your project has been updated.",
  actionRequired = false,
  actionUrl = "#",
  actionText = "View Project",
}: ProjectNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Project Update: {projectTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>CAPCo</Text>
        </Section>

        <Section style={contentSection}>
          <Text style={heading}>Project Update</Text>

          <Text style={paragraph}>Hi {recipientName},</Text>

          <Section style={projectCard}>
            <Text style={projectTitleStyle}>📋 {projectTitle}</Text>
            <Text style={projectIdStyle}>Project ID: {projectId}</Text>
          </Section>

          <Text style={paragraph}>{statusMessage}</Text>

          {actionRequired && (
            <>
              <Section style={alertBox}>
                <Text style={alertText}>
                  ⚠️ Action Required: Please review and take necessary action on
                  this project.
                </Text>
              </Section>

              <Section style={btnContainer}>
                <Button style={buttonPrimary} href={actionUrl}>
                  {actionText}
                </Button>
              </Section>
            </>
          )}

          {!actionRequired && (
            <Section style={btnContainer}>
              <Button style={buttonSecondary} href={actionUrl}>
                {actionText}
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from CAPCo Project Management
            System.
            <br />
            If you have questions, please contact our support team.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ProjectNotificationEmail;

// Styles
const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
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
  padding: "32px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
};

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#374151",
  margin: "0 0 16px",
};

const projectCard = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};

const projectTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 8px",
};

const projectId = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
  fontFamily: "monospace",
};

const alertBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "6px",
  padding: "16px",
  margin: "20px 0",
};

const alertText = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0 24px",
};

const buttonPrimary = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "600",
};

const buttonSecondary = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "600",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "0",
};
