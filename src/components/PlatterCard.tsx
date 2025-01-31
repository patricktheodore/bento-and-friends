import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Platter } from '@/models/item.model';

interface PlatterCardProps {
    platter: Platter;
}

const PlatterCard: React.FC<PlatterCardProps> = ({ platter }) => {
    return (
        <Card className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-1/3 h-36 md:h-auto relative">
                    <img
                        src={platter.image}
                        alt={platter.display}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content Section */}
                <div className="flex-1">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{platter.display}</span>
                            <span className="text-2xl">${platter.price}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <span className="text-brand-taupe">{platter.description}</span>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
};

export default PlatterCard;