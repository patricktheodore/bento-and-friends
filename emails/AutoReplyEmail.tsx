import {
	Html,
	Head,
	Body,
	Container,
	Text,
	Button,
	Hr,
	Heading,
	Preview,
	Section,
	Row,
	Column,
	Img,
} from '@react-email/components';

interface ContactFormAutoReplyEmailProps {
	name: string;
	email: string;
	phone: string;
	message: string;
	submittedAt?: string;
}

export default function ContactFormAutoReplyEmail({
	name,
	email,
	phone,
	message,
	submittedAt,
}: ContactFormAutoReplyEmailProps) {
	const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/bento-and-friends.appspot.com/o/assets%2Femails%2Flogo-white%201%20(1)%20(1).png?alt=media&token=0817b832-826c-4ee8-8f14-a47d51abd836';
	
	// Format the submission time or use current time
	const formattedDate = submittedAt || new Date().toLocaleString('en-AU', {
		timeZone: 'Australia/Perth',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});

	return (
		<Html>
			<Head />
			<Preview>Thanks for contacting Bento & Friends, {name}! We'll get back to you soon.</Preview>
			<Body style={main}>
				<Container style={container}>
					{/* Header with brand colors */}
					<Section style={header}>
						<Img
							src={logoUrl}
							alt="Bento & Friends Logo"
							style={logo}
						/>
					</Section>

					<Section style={content}>
						<Heading style={h1}>Thanks for getting in touch!</Heading>

						<Text style={text}>
							Hi {name},
						</Text>

						<Text style={text}>
							Thank you for reaching out to Bento & Friends! We've received your message and 
							will get back to you within 24 hours during our business hours.
						</Text>

						{/* Confirmation Section */}
						<Section style={confirmationSection}>
							<Heading style={sectionTitle}>Message Received</Heading>
							
							<Row>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Submitted On</Text>
									<Text style={detailValue}>{formattedDate}</Text>
								</Column>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Your Email</Text>
									<Text style={detailValue}>{email}</Text>
								</Column>
							</Row>

							<Row>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Your Phone</Text>
									<Text style={detailValue}>{phone}</Text>
								</Column>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Reference</Text>
									<Text style={detailValue}>#{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
								</Column>
							</Row>
						</Section>

						{/* Message Review Section */}
						<Section style={messageSection}>
							<Heading style={sectionTitle}>Your Message</Heading>
							<Text style={text}>
								Here's a copy of the message you sent us:
							</Text>
							<Section style={messageBox}>
								<Text style={messageText}>
									testinseitnseitnisnt iest se tse ise ijsi sidfjidsj iixczidudbvd sdz fszdgf pszidfs
								</Text>
							</Section>
						</Section>

						{/* Business Hours & Contact Section */}
						<Section style={businessHoursSection}>
							<Heading style={sectionTitle}>Business Hours & Contact</Heading>
							<Text style={text}>
								We're available Monday to Friday, 8:30AM - 3:00PM (Perth time). 
								If you need immediate assistance, you can also reach us directly:
							</Text>
							
							<Row>
								<Column style={contactColumn}>
									<Section style={contactCard}>
										<Text style={contactLabel}>Phone</Text>
										<Text style={contactValue}>
											<a href="tel:0405787777" style={contactLink}>
												0405 787 777
											</a>
										</Text>
									</Section>
								</Column>
								<Column style={contactColumn}>
									<Section style={contactCard}>
										<Text style={contactLabel}>Email</Text>
										<Text style={contactValue}>
											<a href="mailto:bentoandfriends@outlook.com.au" style={contactLink}>
												bentoandfriends@outlook.com.au
											</a>
										</Text>
									</Section>
								</Column>
							</Row>
						</Section>

						{/* What's Next Section */}
						<Section style={nextStepsSection}>
							<Heading style={sectionTitle}>What happens next?</Heading>
							<Text style={text}>
								Our team will review your message and get back to you with a personal response. 
								In the meantime, feel free to explore our website or check out our FAQ section 
								which covers many common questions about our school lunch service.
							</Text>
						</Section>

						{/* CTA Section */}
						<Section style={ctaSection}>
							<Row>
								<Column style={buttonColumn}>
									<Button
										style={primaryButton}
										href="https://bentoandfriends.com.au">
										Visit Our Website
									</Button>
								</Column>
								<Column style={buttonColumn}>
									<Button
										style={secondaryButton}
										href="https://bentoandfriends.com.au/contact">
										View FAQ
									</Button>
								</Column>
							</Row>
						</Section>

						<Hr style={hr} />

						{/* Footer Section */}
						<Section style={footerSection}>
							<Text style={footerText}>
								This is an automated confirmation email. Please don't reply to this email - 
								our team will respond to your original message directly.
							</Text>
							<Text style={footerText}>
								<strong>Bento & Friends</strong> | Perth, WA | Fresh meals, delivered with love
							</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Styles - consistent with your existing email templates
const main = {
	backgroundColor: '#F7F4F0',
	fontFamily:
		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
	padding: '20px 0',
};

const container = {
	backgroundColor: '#ffffff',
	margin: '0 auto',
	borderRadius: '8px',
	boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
	overflow: 'hidden',
	maxWidth: '600px',
};

const header = {
	backgroundColor: '#052D2A',
	padding: '30px 24px',
	textAlign: 'center' as const,
};

const logo = {
	width: '240px',
	height: 'auto',
	margin: '0 auto',
	display: 'block',
};

const content = {
	padding: '40px 24px',
};

const h1 = {
	color: '#052D2A',
	fontSize: '28px',
	fontWeight: 'bold',
	margin: '0 0 24px 0',
	textAlign: 'center' as const,
	lineHeight: '1.2',
};

const text = {
	color: '#333',
	fontSize: '16px',
	lineHeight: '1.6',
	margin: '0 0 20px 0',
};

const sectionTitle = {
	color: '#052D2A',
	fontSize: '20px',
	fontWeight: 'bold',
	margin: '0 0 16px 0',
	borderBottom: '2px solid #C7893B',
	paddingBottom: '8px',
};

// Confirmation Section
const confirmationSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '24px 0',
};

const detailColumn = {
	width: '50%',
	padding: '8px',
};

const detailLabel = {
	color: '#666',
	fontSize: '12px',
	fontWeight: '600',
	margin: '0 0 4px 0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
};

const detailValue = {
	color: '#052D2A',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0 0 16px 0',
};

// Message Section
const messageSection = {
	margin: '32px 0',
};

const messageBox = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	borderRadius: '8px',
	padding: '20px',
	margin: '16px 0',
	borderLeft: '4px solid #C7893B',
};

const messageText = {
	color: '#333',
	fontSize: '16px',
	lineHeight: '1.6',
	margin: '0',
	fontStyle: 'italic',
};

// Business Hours Section
const businessHoursSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '32px 0',
};

const contactColumn = {
	width: '50%',
	padding: '8px',
};

const contactCard = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	borderRadius: '6px',
	padding: '16px',
	textAlign: 'center' as const,
	margin: '0 0 8px 0',
};

const contactLabel = {
	color: '#666',
	fontSize: '12px',
	fontWeight: '600',
	margin: '0 0 8px 0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
};

const contactValue = {
	color: '#052D2A',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0',
};

const contactLink = {
	color: '#C7893B',
	textDecoration: 'none',
	fontWeight: '600',
};

// Next Steps Section
const nextStepsSection = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	borderRadius: '8px',
	padding: '24px',
	margin: '32px 0',
};

// CTA Section
const ctaSection = {
	textAlign: 'center' as const,
	margin: '32px 0',
};

const buttonColumn = {
	width: '50%',
	padding: '8px',
	textAlign: 'center' as const,
};

const primaryButton = {
	backgroundColor: '#C7893B',
	borderRadius: '8px',
	color: '#ffffff',
	fontSize: '16px',
	fontWeight: 'bold',
	textDecoration: 'none',
	textAlign: 'center' as const,
	display: 'inline-block',
	padding: '12px 24px',
	margin: '0',
	boxShadow: '0 2px 4px rgba(199, 137, 59, 0.3)',
};

const secondaryButton = {
	backgroundColor: '#052D2A',
	borderRadius: '8px',
	color: '#ffffff',
	fontSize: '16px',
	fontWeight: 'bold',
	textDecoration: 'none',
	textAlign: 'center' as const,
	display: 'inline-block',
	padding: '12px 24px',
	margin: '0',
	boxShadow: '0 2px 4px rgba(5, 45, 42, 0.3)',
};

const hr = {
	borderColor: '#e6ebf1',
	margin: '32px 0',
};

// Footer Section
const footerSection = {
	textAlign: 'center' as const,
	margin: '0',
};

const footerText = {
	color: '#8898aa',
	fontSize: '12px',
	lineHeight: '1.4',
	textAlign: 'center' as const,
	margin: '0 0 8px 0',
};