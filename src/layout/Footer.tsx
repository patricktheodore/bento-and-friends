import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo-white.png';

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
				{ to: '/', label: 'Our Vision' },
				{ to: '/contact', label: 'Contact Us' },
			],
		},
		{
			title: 'Our Menu',
			links: [
				{ to: '/menu', label: 'Full Menu' },
			],
		},
		{
			title: 'Customer Service',
			links: [
				{ to: '/contact', label: 'FAQ' },
				{ to: '/account', label: 'My Account' },
			],
		},
	];

	return (
		<footer className="bg-brand-dark-green text-brand-cream py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img src={logo} alt="Bento&Friends Logo" className="h-16 w-auto" />
            </Link>
          </div>

          {sections.map((section, index) => (
            <FooterSection key={index} title={section.title} links={section.links} />
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-brand-cream/30 flex flex-col items-center">
          <div className="flex flex-wrap justify-center space-x-4 mb-6">
            <span>&copy; Bento & Friends 2024</span>
          </div>
        </div>
        <div className="text-brand-cream text-opacity-75 text-sm text-center max-w-screen-md">
            <span>As we cook our meals fresh and deliver all our school lunches in accordance to current WA Food
Act & Food Standards Australia NZ, any food items from our bento meals not consumed within a 4 hour period from
production must be discarded/ deemed unfit for consumption.</span>
        </div>
      </div>
    </footer>
	);
};

export default Footer;
