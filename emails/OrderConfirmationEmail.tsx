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

interface OrderConfirmationEmailProps {
	displayName: string;
	orderNumber: string;
	orderDate: string;
	orderTotal: string;
	mealItems: Array<{
		name: string;
        addOns: string;
        fruit?: string;
        side?: string;
        deliveryDate?: string;
        schoolName?: string;
		quantity: number;
		childName: string;
	}>;
}

export default function OrderConfirmationEmail({
	displayName,
	orderNumber,
	orderDate,
	orderTotal,
	mealItems,
}: OrderConfirmationEmailProps) {
	const display = displayName ?? 'User';
	const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/bento-and-friends.appspot.com/o/assets%2Femails%2Flogo-white%201%20(1)%20(1).png?alt=media&token=0817b832-826c-4ee8-8f14-a47d51abd836';

    mealItems = mealItems ?? [
        {
            name: 'Chicken Teriyaki Bento',
            addOns: ['Extra Chicken'],
            fruit: 'Apples',
            side: 'Yogurt',
            deliveryDate: '2023-10-01',
            schoolName: 'Greenwood Primary School',
            quantity: 1,
            childName: 'Emma'
        },
        {
            name: 'Chicken Teriyaki Bento',
            addOns: ['Extra Chicken'],
            fruit: 'Apples',
            side: 'Yogurt',
            deliveryDate: '2023-10-01',
            schoolName: 'Greenwood Primary School',
            quantity: 1,
            childName: 'Emma'
        },
    ]

	return (
		<Html>
			<Head />
			<Preview>Your Bento & Friends order #{orderNumber} is confirmed!</Preview>
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
						<Heading style={h1}>Order Confirmed!</Heading>

						<Text style={text}>
							Hi {display}, thank you for your order! We're excited to prepare these delicious,
							nutritious meals for your family.
						</Text>

						{/* Order Summary Section */}
						<Section style={orderSummarySection}>
							<Heading style={sectionTitle}>Order Summary</Heading>
							<Row>
								<Column style={summaryColumn}>
									<Text style={summaryLabel}>Order Number</Text>
									<Text style={summaryValue}>#{orderNumber}</Text>
								</Column>
							</Row>
                            <Row>
                                <Column style={summaryColumn}>
									<Text style={summaryLabel}>Order On</Text>
									<Text style={summaryValue}>{orderDate}</Text>
								</Column>
                            </Row>
							<Row>
								<Column style={summaryColumn}>
									<Text style={summaryLabel}>Meals</Text>
									<Text style={summaryValueHighlight}>{mealItems?.length}</Text>
								</Column>
								<Column style={summaryColumn}>
									<Text style={summaryLabel}>Total Amount</Text>
									<Text style={summaryValueHighlight}>${orderTotal}</Text>
								</Column>
							</Row>
						</Section>

						{/* Meal Items Section */}
						<Section style={mealsSection}>
							<Heading style={sectionTitle}>Your Meals</Heading>
							
							{/* This section will be replaced with actual meal cards */}
							<div style={mealItemsContainer}>
								{mealItems?.map((meal, index) => (
										<Section key={index} style={mealCard}>
                                            <Heading style={mealName}>{meal.name}</Heading>
                                            
                                            <Row>
                                                <Column style={summaryColumn}>
                                                    <Text style={mealDetailsLabel}>Add Ons:</Text>
                                                    <Text style={mealDetailsValue}>{meal.addOns}</Text>
                                                </Column>
                                                <Column style={summaryColumn}>
                                                    <Text style={mealDetailsLabel}>Side / Fruit:</Text>
                                                    <Text style={mealDetailsValue}>{meal.side ?? ''} / {meal.fruit ?? ''}</Text>
                                                </Column>
                                            </Row>

                                            <Row>
                                                <Column style={summaryColumn}>
                                                    <Text style={mealDetailsLabel}>For:</Text>
                                                    <Text style={mealDetailsValue}>{meal.childName}</Text>
                                                </Column>
                                                <Column style={summaryColumn}>
                                                    <Text style={mealDetailsLabel}>Delivered on:</Text>
                                                    <Text style={mealDetailsValue}>{meal.deliveryDate}</Text>
                                                </Column>
                                            </Row>

										</Section>
									))}
							</div>
							
						</Section>

						{/* What's Next Section */}
						<Section style={nextStepsSection}>
							<Heading style={sectionTitle}>What's Next?</Heading>
							<Text style={text}>
								That's it for now! <br />
                                Your meals will be prepared and delivered fresh to the school on the scheduled date. <br />
							</Text>
						</Section>

						<Section style={ctaSection}>
							<Button
								style={button}
								href="https://bentoandfriends.com.au/account">
								View Order Details
							</Button>
						</Section>

						<Hr style={hr} />

						<Text style={supportText}>
							Questions about your order?
							<br />
							<a
								href="mailto:bentoandfriends@outlook.com.au"
								style={supportLink}>
								Contact us at bentoandfriends@outlook.com.au
							</a>
						</Text>

						<Text style={footer}>Fresh meals, delivered with love</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

// Reusing base styles from welcome email
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

// Order Summary Styles
const orderSummarySection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '24px 0',
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
	margin: '0',
};

const summaryValueHighlight = {
	color: '#C7893B',
	fontSize: '18px',
	fontWeight: 'bold',
	margin: '0',
};

// Address Styles
const addressSection = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	padding: '16px',
	borderRadius: '6px',
	margin: '24px 0',
};

const addressLabel = {
	color: '#666',
	fontSize: '12px',
	fontWeight: '600',
	margin: '0 0 8px 0',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
};

const addressText = {
	color: '#052D2A',
	fontSize: '14px',
	lineHeight: '1.4',
	margin: '0',
};

// Meals Section Styles
const mealsSection = {
	margin: '32px 0',
};

const mealItemsContainer = {
	margin: '16px 0',
};

const mealCard = {
	backgroundColor: '#ffffff',
	border: '1px solid #e6ebf1',
	borderRadius: '8px',
	padding: '20px',
	margin: '0 0 12px 0',
	boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const mealImageColumn = {
	width: '80px',
	verticalAlign: 'top' as const,
};

const mealImage = {
	width: '70px',
	height: '70px',
	borderRadius: '6px',
	objectFit: 'cover' as const,
};

const mealDetailsRow = {
    margin: '10px 0'
}

const mealDetailsColumn = {
	verticalAlign: 'top' as const,
};

const mealName = {
	color: '#052D2A',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0 0 4px 0',
	lineHeight: '1.3',
};

const mealDetailsLabel = {
	color: '#C7893B',
	fontSize: '12px',
	fontWeight: '600',
	textTransform: 'uppercase' as const,
	letterSpacing: '0.5px',
    margin: '0'
};

const mealDetailsValue = {
	color: '#666',
	fontSize: '12px',
	fontWeight: '600',
    margin: '0'
};

const mealQuantityColumn = {
	width: '50%',
};

const mealPriceColumn = {
	width: '50%',
	textAlign: 'right' as const,
};

const mealQuantity = {
	color: '#666',
	fontSize: '14px',
	margin: '0',
};

const mealPrice = {
	color: '#052D2A',
	fontSize: '16px',
	fontWeight: 'bold',
	margin: '0',
};

// Next Steps Section
const nextStepsSection = {
	backgroundColor: '#F7F4F0',
	padding: '24px',
	borderRadius: '8px',
	margin: '32px 0',
};

const ctaSection = {
	textAlign: 'center' as const,
	margin: '32px 0',
};

const button = {
	backgroundColor: '#C7893B',
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