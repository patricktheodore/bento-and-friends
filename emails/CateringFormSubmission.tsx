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

interface PlatterSelection {
	id: string;
	name: string;
	quantity: number;
	price: number;
}

interface CateringEnquiryEmailProps {
	contact: {
		name: string;
		email: string;
		phone: string;
	};
	event: {
		date: string;
		message: string;
	};
	platters: PlatterSelection[];
	submittedAt?: string;
}

export default function CateringEnquiryEmail({
	contact,
	event,
	platters,
	submittedAt,
}: CateringEnquiryEmailProps) {
	const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/bento-and-friends.appspot.com/o/assets%2Femails%2Flogo-white%201%20(1)%20(1).png?alt=media&token=0817b832-826c-4ee8-8f14-a47d51abd836';

	// Calculate total items
	const totalItems = platters?.reduce((sum, platter) => sum + platter.quantity, 0) ?? 1;

    // mock data
    contact = contact ?? {
        name: 'John Doe',
        email: 'test@gmail.com',
        phone: '1234567890',
    }

    event = event ?? {
        date: '2023-10-01',
        message: 'Looking forward to the event!',
    };

    platters = platters ?? [
        { id: '1', name: 'Sushi Platter', quantity: 2, price: 50 },
        { id: '2', name: 'Fruit Platter', quantity: 1, price: 30 },
    ];

    submittedAt = submittedAt || new Date().toLocaleDateString();

	return (
		<Html>
			<Head />
			<Preview>New catering enquiry from {contact.name} for {event.date}</Preview>
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
						<Heading style={h1}>New Catering Enquiry</Heading>

						<Text style={text}>
							You've received a new catering enquiry through your website. Here are the details:
						</Text>

						{/* Contact Details Section */}
						<Section style={contactDetailsSection}>
							<Heading style={sectionTitle}>Contact Information</Heading>
							
							<Row>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Name</Text>
									<Text style={detailValue}>{contact.name}</Text>
								</Column>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Submitted On</Text>
									<Text style={detailValue}>{submittedAt}</Text>
								</Column>
							</Row>

							<Row>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Email</Text>
									<Text style={detailValue}>
										<a href={`mailto:${contact.email}`} style={emailLink}>
											{contact.email}
										</a>
									</Text>
								</Column>
								<Column style={detailColumn}>
									<Text style={detailLabel}>Phone</Text>
									<Text style={detailValue}>
										<a href={`tel:${contact.phone}`} style={phoneLink}>
											{contact.phone}
										</a>
									</Text>
								</Column>
							</Row>
						</Section>

						{/* Event Summary Section */}
                            <Section style={eventSummarySection}>
                                <Heading style={sectionTitle}>Your Event Summary</Heading>
                                
                                <Row>
                                    <Column style={summaryColumn}>
                                        <Text style={summaryLabel}>Total Platters</Text>
                                        <Text style={summaryValue}>{totalItems} items</Text>
                                    </Column>
                                    <Column style={summaryColumn}>
                                        <Text style={summaryLabel}>Phone</Text>
                                        <Text style={summaryValue}>{contact.phone}</Text>
                                    </Column>
                                </Row>
    
                                {/* Platter Selection */}
                                <Section style={platterSummaryBox}>
                                    <Text style={platterSummaryTitle}>Platter Selection:</Text>
                                    {platters.map((platter, index) => (
                                        <Row key={platter.id} style={platterSummaryRow}>
                                            <Column style={platterNameColumn}>
                                                <Text style={platterSummaryName}>{platter.name}</Text>
                                            </Column>
                                            <Column style={platterQuantityColumn}>
                                                <Text style={platterSummaryQuantity}>× {platter.quantity}</Text>
                                            </Column>
                                        </Row>
                                    ))}
                                    {platters.length === 0 && (
                                        <Text style={noPlattersText}>No specific platters selected - custom requirements</Text>
                                    )}
                                </Section>
                            </Section>

						{/* Additional Information Section */}
						<Section style={messageSection}>
							<Heading style={sectionTitle}>Additional Information</Heading>
							<Section style={messageBox}>
								<Text style={messageText}>
									{event.message}
								</Text>
							</Section>
						</Section>

						{/* Quick Actions Section */}
						<Section style={actionsSection}>
							<Heading style={sectionTitle}>Quick Actions</Heading>
							<Text style={text}>
								You can reply to this catering enquiry directly using the contact information above.
							</Text>
							
							<Row>
								<Column style={actionColumn}>
									<Button
										style={primaryButton}
										href={`mailto:${contact.email}?subject=Re: Your catering enquiry for ${event.date}`}>
										Reply via Email
									</Button>
								</Column>
							</Row>
						</Section>

						<Hr style={hr} />

						{/* Footer Section */}
						<Section style={footerSection}>
							<Text style={footerText}>
								This enquiry was sent through the catering form on bentoandfriends.com.au
							</Text>
							<Text style={footerText}>
								Business hours: Mon-Fri 8:30AM-3:00PM
							</Text>
						</Section>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Styles - consistent with your contact form email
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

// Contact Details Section
const contactDetailsSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '24px 0',
};

// Event Details Section
const eventDetailsSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '24px 0',
};

const eventSummarySection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '32px 0',
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

const emailLink = {
	color: '#C7893B',
	textDecoration: 'none',
	fontWeight: '600',
};

const phoneLink = {
	color: '#C7893B',
	textDecoration: 'none',
	fontWeight: '600',
};

// Platter Section
const platterSection = {
	margin: '32px 0',
};

const platterBox = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	borderRadius: '8px',
	padding: '20px',
	margin: '16px 0',
	borderLeft: '4px solid #C7893B',
};

const platterRow = {
	borderBottom: '1px solid #f0f0f0',
	paddingBottom: '8px',
	marginBottom: '8px',
};

const platterNameColumn = {
	width: '70%',
};

const platterQuantityColumn = {
	width: '30%',
	textAlign: 'right' as const,
};

const platterName = {
	color: '#052D2A',
	fontSize: '16px',
	fontWeight: '600',
	margin: '0',
};

const platterQuantity = {
	color: '#C7893B',
	fontSize: '14px',
	fontWeight: 'bold',
	margin: '0',
};

const noPlattersText = {
	color: '#666',
	fontSize: '14px',
	fontStyle: 'italic',
	margin: '0',
	textAlign: 'center' as const,
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
};

// Actions Section
const actionsSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '32px 0',
};

const actionColumn = {
	width: '100%',
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

const summaryColumn = {
	width: '50%',
	padding: '8px',
};

const summaryLabel = {
	color: '#666',
	fontSize: '12px',
	fontWeight: '600',
	margin: '0 0 4px 0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
};

const summaryValue = {
	color: '#052D2A',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0 0 16px 0',
};

const platterSummaryBox = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	borderRadius: '6px',
	padding: '16px',
	margin: '16px 0 0 0',
};

const platterSummaryTitle = {
	color: '#666',
	fontSize: '12px',
	fontWeight: '600',
	margin: '0 0 12px 0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
};

const platterSummaryRow = {
	marginBottom: '8px',
};

const platterSummaryName = {
	color: '#052D2A',
	fontSize: '14px',
	fontWeight: '500',
	margin: '0',
};

const platterSummaryQuantity = {
	color: '#C7893B',
	fontSize: '14px',
	fontWeight: 'bold',
	margin: '0',
};