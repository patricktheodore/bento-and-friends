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

interface WelcomeEmailProps {
	displayName: string;
	email: string;
}

export default function WelcomeEmail({ displayName, email }: WelcomeEmailProps) {
	const display = displayName ?? 'User';
	const emailAddress = email ?? '';
	const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/bento-and-friends.appspot.com/o/assets%2Femails%2Flogo-white%201%20(1)%20(1).png?alt=media&token=0817b832-826c-4ee8-8f14-a47d51abd836';

	return (
		<Html>
			<Head />
			<Preview>Welcome to Bento & Friends!</Preview>
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
						<Heading style={h1}>Welcome to our family, {display}!</Heading>

						<Text style={text}>
							We're absolutely thrilled to have you join the Bento & Friends community! Your account has
							been successfully created and you're all set to start ordering nutritious, delicious meals
							for your children.
						</Text>

						<Text style={text}>
							<strong>Your registered email:</strong> {emailAddress}
						</Text>

						{/* Feature highlights */}
						<Section style={featuresSection}>
							<Text style={featuresTitle}>What you can do now:</Text>
							<Row>
								<Column style={feature}>
									<Text style={featureLabel}>Family Setup</Text>
									<Text style={featureText}>Add your children to your account</Text>
								</Column>
								<Column style={feature}>
									<Text style={featureLabel}>Browse Menus</Text>
									<Text style={featureText}>Browse our menu items</Text>
								</Column>
							</Row>
							<Row>
								<Column style={feature}>
									<Text style={featureLabel}>Fresh Meals</Text>
									<Text style={featureText}>Order healthy, fresh meals</Text>
								</Column>
								<Column style={feature}>
									<Text style={featureLabel}>Easy Management</Text>
									<Text style={featureText}>Manage orders easily online</Text>
								</Column>
							</Row>
						</Section>

						<Section style={ctaSection}>
							<Button
								style={button}
								href="https://bentoandfriends.com.au/order">
								Start Ordering Meals
							</Button>
						</Section>

						<Hr style={hr} />

						<Text style={supportText}>
							Got questions? Our friendly team is here to help!
							<br />
							<a
								href="mailto:bentoandfriends@outlook.com.au"
								style={supportLink}>
								Contact us at bentoandfriends@outlook.com.au
							</a>
						</Text>

						<Text style={footer}>Making school meals simple, one bento at a time</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Brand-aligned styles
const main = {
	backgroundColor: '#F7F4F0', // Your brand background color
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
	backgroundColor: '#052D2A', // Your primary brand color
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

const featuresSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '32px 0',
};

const featuresTitle = {
	color: '#052D2A',
	fontSize: '18px',
	fontWeight: 'bold',
	margin: '0 0 20px 0',
	textAlign: 'center' as const,
};

const feature = {
	width: '50%',
	textAlign: 'center' as const,
	padding: '12px',
};

const featureLabel = {
	color: '#C7893B',
	fontSize: '14px',
	fontWeight: 'bold',
	margin: '0 0 8px 0',
	textAlign: 'center' as const,
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
};

const featureText = {
	color: '#052D2A',
	fontSize: '14px',
	fontWeight: '600',
	margin: '0',
	textAlign: 'center' as const,
	lineHeight: '1.4',
};

const ctaSection = {
	textAlign: 'center' as const,
	margin: '32px 0',
};

const button = {
	backgroundColor: '#C7893B', // Your accent color
	borderRadius: '8px',
	color: '#ffffff',
	fontSize: '18px',
	fontWeight: 'bold',
	textDecoration: 'none',
	textAlign: 'center' as const,
	display: 'inline-block',
	padding: '16px 32px',
	margin: '0',
	boxShadow: '0 2px 4px rgba(199, 137, 59, 0.3)',
	transition: 'all 0.2s ease',
};

const hr = {
	borderColor: '#e6ebf1',
	margin: '32px 0',
};

const supportText = {
	color: '#666',
	fontSize: '14px',
	lineHeight: '1.6',
	margin: '0 0 24px 0',
	textAlign: 'center' as const,
};

const supportLink = {
	color: '#C7893B',
	textDecoration: 'none',
	fontWeight: '600',
};

const footer = {
	color: '#8898aa',
	fontSize: '12px',
	lineHeight: '1.4',
	textAlign: 'center' as const,
	margin: '0',
	fontStyle: 'italic',
};
