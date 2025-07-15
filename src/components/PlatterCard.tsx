import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, DollarSign } from 'lucide-react';
import { Platter } from '@/models/item.model';

interface PlatterCardProps {
    platter: Platter;
}

const PlatterCard: React.FC<PlatterCardProps> = ({ platter }) => {
    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col">
                {/* Image Section */}
                <div className="w-full h-48 relative bg-gray-100">
                    {platter.image ? (
                        <img
                            src={platter.image}
                            alt={platter.display}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ChefHat className="h-12 w-12 text-gray-400" />
                        </div>
                    )}
                    {/* Price Badge Overlay */}
                    <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-gray-900 border border-gray-200 shadow-sm">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {platter.price}
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                            {platter.display}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {platter.description}
                        </p>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
};

export default PlatterCard;