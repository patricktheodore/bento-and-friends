import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons';

const FooterSection: React.FC<{ title: string; links: { to: string; label: string }[] }> = ({ title, links }) => (
	<div className="mb-8">
		<h3 className="text-xl font-semibold mb-4">{title}</h3>
		<ul className="space-y-2 text-sm">
			{links.map((link, index) => (
				<li key={index} className='hover:text-brand-gold'>
					<Link to={link.to}>{link.label}</Link>
				</li>
			))}
		</ul>
	</div>
);

const Footer: React.FC = () => {
	const sections = [
		{
			title: 'About Us',
			links: [
				{ to: '/about', label: 'Our Story' },
				{ to: '/how-it-works', label: 'How It Works' },
				{ to: '/contact', label: 'Contact Us' },
			],
		},
		{
			title: 'Our Menu',
			links: [
				{ to: '/menu', label: 'Full Menu' },
				{ to: '/nutritional-info', label: 'Nutritional Information' },
				{ to: '/dietary-options', label: 'Dietary Options' },
				{ to: '/alergy-information', label: 'Alergy Information' },
			],
		},
		{
			title: 'Customer Service',
			links: [
				{ to: '/faq', label: 'FAQ' },
				{ to: '/ordering-help', label: 'Ordering Help' },
				{ to: '/account', label: 'My Account' },
				{ to: '/feedback', label: 'Give Feedback' },
			],
		},
	];

	return (
		<footer className="bg-brand-dark-green text-brand-cream py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img src="src/assets/logo-white.png" alt="Bento&Friends Logo" className="h-16 w-auto" />
            </Link>
          </div>

          {sections.map((section, index) => (
            <FooterSection key={index} title={section.title} links={section.links} />
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-brand-cream/30 flex flex-col items-center">
          <div className="flex flex-wrap justify-center space-x-4 mb-6">
            <span>&copy; Bento&Friends {new Date().getFullYear()}</span>
          </div>
          <div className="flex space-x-6 mb-6">
            {[faTwitter, faInstagram, faFacebook].map((icon, index) => (
              <a key={index} href="#" className="text-2xl hover:text-brand-gold transition-colors duration-300">
                <FontAwesomeIcon icon={icon} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
	);
};

export default Footer;
