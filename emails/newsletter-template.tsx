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
  render,
} from '@react-email/components';
import * as React from 'react';

interface NewsletterEmailProps {
  subject: string;
  content: string;
  unsubscribeUrl: string;
}

const baseUrl = 'https://www.laurynluxebeautystudio.com';

export const NewsletterEmail = ({ subject, content, unsubscribeUrl }: NewsletterEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${baseUrl}/lauryn-luxe-logo.png`}
            width="160"
            alt="Lauryn Luxe Beauty Studio"
          />
        </Section>
        <Section style={contentSection}>
          <Text style={heading}>{subject}</Text>
          <Text style={paragraph}>{content}</Text>
        </Section>
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            Lauryn Luxe Beauty Studio, Blantyre, Malawi.
          </Text>
          <Text style={footerLink}>
            Changed your mind? <a href={unsubscribeUrl} style={link}>Unsubscribe</a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export const renderNewsletterEmail = (props: NewsletterEmailProps) =>
  render(<NewsletterEmail {...props} />, {
    pretty: true,
  });

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const logoContainer = {
  padding: '20px 0',
  textAlign: 'center' as const,
};

const contentSection = {
  padding: '0 35px',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  lineHeight: '1.3',
  color: '#484848',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#484848',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};

const footerText = {
  margin: '0 0 5px 0',
}

const footerLink = {
  textDecoration: 'underline',
};

const link = {
  color: '#8898aa',
} 