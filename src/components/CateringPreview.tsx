import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const CateringPreviewComponent: React.FC = () => {
    const { state } = useAppContext();

  return (
    <div className="w-full bg-brand-cream py-16 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Catering Services</h2>
          <p className="text-xl max-w-2xl mx-auto">
            From school events to corporate functions, we provide fresh, delicious catering solutions tailored to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {state.platters.map((platter, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 overflow-hidden">
                <img
                  src={platter.image}
                  alt={platter.display}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle>{platter.display}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{platter.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/catering"
            className="inline-flex items-center gap-2 bg-brand-dark-green text-brand-cream hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green ring-offset-2 ring-offset-brand-cream"
          >
            Explore Our Catering Options
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CateringPreviewComponent;