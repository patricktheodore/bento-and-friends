// import {
// 	Html,
// 	Head,
// 	Body,
// 	Container,
// 	Text,
// 	Button,
// 	Hr,
// 	Heading,
// 	Preview,
// 	Section,
// 	Row,
// 	Column,
// 	Img,
// } from '@react-email/components';

// interface ContactFormSubmissionEmailProps {
// 	name: string;
// 	email: string;
// 	phone: string;
// 	message: string;
// 	submittedAt?: string;
// }

// export default function ContactFormSubmissionEmail({
// 	name,
// 	email,
// 	phone,
// 	message,
// 	submittedAt,
// }: ContactFormSubmissionEmailProps) {
// 	const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/bento-and-friends.appspot.com/o/assets%2Femails%2Flogo-white%201%20(1)%20(1).png?alt=media&token=0817b832-826c-4ee8-8f14-a47d51abd836';
	
// 	// Format the submission time or use current time
// 	const formattedDate = submittedAt || new Date().toLocaleString('en-AU', {
// 		timeZone: 'Australia/Perth',
// 		year: 'numeric',
// 		month: 'long',
// 		day: 'numeric',
// 		hour: '2-digit',
// 		minute: '2-digit',
// 	});

// 	return (
// 		<Html>
// 			<Head />
// 			<Preview>New contact form submission from {name}</Preview>
// 			<Body style={main}>
// 				<Container style={container}>
// 					{/* Header with brand colors */}
// 					<Section style={header}>
// 						<Img
// 							src={logoUrl}
// 							alt="Bento & Friends Logo"
// 							style={logo}
// 						/>
// 					</Section>

// 					<Section style={content}>
// 						<Heading style={h1}>New Contact Form Submission</Heading>

// 						<Text style={text}>
// 							You've received a new message through your website contact form.
// 						</Text>

// 						{/* Contact Details Section */}
// 						<Section style={contactDetailsSection}>
// 							<Heading style={sectionTitle}>Contact Information</Heading>
							
// 							<Row>
// 								<Column style={detailColumn}>
// 									<Text style={detailLabel}>Name</Text>
// 									<Text style={detailValue}>{name}</Text>
// 								</Column>
// 								<Column style={detailColumn}>
// 									<Text style={detailLabel}>Submitted On</Text>
// 									<Text style={detailValue}>{formattedDate}</Text>
// 								</Column>
// 							</Row>

// 							<Row>
// 								<Column style={detailColumn}>
// 									<Text style={detailLabel}>Email</Text>
// 									<Text style={detailValue}>
// 										<a href={`mailto:${email}`} style={emailLink}>
// 											{email}
// 										</a>
// 									</Text>
// 								</Column>
// 								<Column style={detailColumn}>
// 									<Text style={detailLabel}>Phone</Text>
// 									<Text style={detailValue}>
// 										<a href={`tel:${phone}`} style={phoneLink}>
// 											{phone}
// 										</a>
// 									</Text>
// 								</Column>
// 							</Row>
// 						</Section>

// 						{/* Message Section */}
// 						<Section style={messageSection}>
// 							<Heading style={sectionTitle}>Message</Heading>
// 							<Section style={messageBox}>
// 								<Text style={messageText}>
// 									{message}
// 								</Text>
// 							</Section>
// 						</Section>

// 						{/* Quick Actions Section */}
// 						<Section style={actionsSection}>
// 							<Heading style={sectionTitle}>Quick Actions</Heading>
// 							<Text style={text}>
// 								You can reply to this inquiry directly using the contact information above.
// 							</Text>
							
// 							<Row>
// 								<Column style={actionColumn}>
// 									<Button
// 										style={primaryButton}
// 										href={`mailto:${email}?subject=Re: Your inquiry to Bento & Friends&body=Hi ${name},%0D%0A%0D%0AThank you for reaching out to Bento & Friends.%0D%0A%0D%0A`}>
// 										Reply via Email
// 									</Button>
// 								</Column>
// 								<Column style={actionColumn}>
// 									<Button
// 										style={secondaryButton}
// 										href={`tel:${phone}`}>
// 										Call Now
// 									</Button>
// 								</Column>
// 							</Row>
// 						</Section>

// 						<Hr style={hr} />

// 						{/* Footer Section */}
// 						<Section style={footerSection}>
// 							<Text style={footerText}>
// 								This message was sent through the contact form on bentoandfriends.com.au
// 							</Text>
// 							<Text style={footerText}>
// 								Business hours: Mon-Fri 8:30AM-3:00PM
// 							</Text>
// 						</Section>
// 					</Section>
// 				</Container>
// 			</Body>
// 		</Html>
// 	);
// }

// // Styles - consistent with your order confirmation email
// const main = {
// 	backgroundColor: '#F7F4F0',
// 	fontFamily:
// 		'"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
// 	padding: '20px 0',
// };

// const container = {
// 	backgroundColor: '#ffffff',
// 	margin: '0 auto',
// 	borderRadius: '8px',
// 	boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
// 	overflow: 'hidden',
// 	maxWidth: '600px',
// };

// const header = {
// 	backgroundColor: '#052D2A',
// 	padding: '30px 24px',
// 	textAlign: 'center' as const,
// };

// const logo = {
// 	width: '240px',
// 	height: 'auto',
// 	margin: '0 auto',
// 	display: 'block',
// };

// const content = {
// 	padding: '40px 24px',
// };

// const h1 = {
// 	color: '#052D2A',
// 	fontSize: '28px',
// 	fontWeight: 'bold',
// 	margin: '0 0 24px 0',
// 	textAlign: 'center' as const,
// 	lineHeight: '1.2',
// };

// const text = {
// 	color: '#333',
// 	fontSize: '16px',
// 	lineHeight: '1.6',
// 	margin: '0 0 20px 0',
// };

// const sectionTitle = {
// 	color: '#052D2A',
// 	fontSize: '20px',
// 	fontWeight: 'bold',
// 	margin: '0 0 16px 0',
// 	borderBottom: '2px solid #C7893B',
// 	paddingBottom: '8px',
// };

// // Contact Details Section
// const contactDetailsSection = {
// 	backgroundColor: '#F7F4F0',
// 	padding: '24px',
// 	borderRadius: '8px',
// 	margin: '24px 0',
// };

// const detailColumn = {
// 	width: '50%',
// 	padding: '8px',
// };

// const detailLabel = {
// 	color: '#666',
// 	fontSize: '12px',
// 	fontWeight: '600',
// 	margin: '0 0 4px 0',
// 	textTransform: 'uppercase' as const,
// 	letterSpacing: '0.5px',
// };

// const detailValue = {
// 	color: '#052D2A',
// 	fontSize: '16px',
// 	fontWeight: 'bold',
// 	margin: '0 0 16px 0',
// };

// const emailLink = {
// 	color: '#C7893B',
// 	textDecoration: 'none',
// 	fontWeight: '600',
// };

// const phoneLink = {
// 	color: '#C7893B',
// 	textDecoration: 'none',
// 	fontWeight: '600',
// };

// // Message Section
// const messageSection = {
// 	margin: '32px 0',
// };

// const messageBox = {
// 	backgroundColor: '#ffffff',
// 	border: '1px solid #e6ebf1',
// 	borderRadius: '8px',
// 	padding: '20px',
// 	margin: '16px 0',
// 	borderLeft: '4px solid #C7893B',
// };

// const messageText = {
// 	color: '#333',
// 	fontSize: '16px',
// 	lineHeight: '1.6',
// 	margin: '0',
// 	whiteSpace: 'pre-wrap' as const,
// };

// // Actions Section
// const actionsSection = {
// 	backgroundColor: '#F7F4F0',
// 	padding: '24px',
// 	borderRadius: '8px',
// 	margin: '32px 0',
// };

// const actionColumn = {
// 	width: '50%',
// 	padding: '8px',
// 	textAlign: 'center' as const,
// };

// const primaryButton = {
// 	backgroundColor: '#C7893B',
// 	borderRadius: '8px',
// 	color: '#ffffff',
// 	fontSize: '16px',
// 	fontWeight: 'bold',
// 	textDecoration: 'none',
// 	textAlign: 'center' as const,
// 	display: 'inline-block',
// 	padding: '12px 24px',
// 	margin: '0',
// 	boxShadow: '0 2px 4px rgba(199, 137, 59, 0.3)',
// };

// const secondaryButton = {
// 	backgroundColor: '#052D2A',
// 	borderRadius: '8px',
// 	color: '#ffffff',
// 	fontSize: '16px',
// 	fontWeight: 'bold',
// 	textDecoration: 'none',
// 	textAlign: 'center' as const,
// 	display: 'inline-block',
// 	padding: '12px 24px',
// 	margin: '0',
// 	boxShadow: '0 2px 4px rgba(5, 45, 42, 0.3)',
// };

// const hr = {
// 	borderColor: '#e6ebf1',
// 	margin: '32px 0',
// };

// // Footer Section
// const footerSection = {
// 	textAlign: 'center' as const,
// 	margin: '0',
// };

// const footerText = {
// 	color: '#8898aa',
// 	fontSize: '12px',
// 	lineHeight: '1.4',
// 	textAlign: 'center' as const,
// 	margin: '0 0 8px 0',
// };