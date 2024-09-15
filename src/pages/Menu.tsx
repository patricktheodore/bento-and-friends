import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MenuPage: React.FC = () => {
  const { state } = useAppContext();

  const renderMainItems = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {state.mains.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.display}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <img src={item.image} alt={item.display} className="w-full h-48 object-cover rounded-md mb-4" />
            <div className="flex flex-wrap gap-2 mb-2">
              {item.allergens?.map((allergen) => (
                <Badge key={allergen} variant="outline" className='uppercase'>{allergen}</Badge>
              ))}
            </div>
            <p>Price: ${item.price.toFixed(2)}</p>
			<div className='flex items-center space-x-2'>
				{item.isNew && <Badge variant="default">New</Badge>}
				{item.isVegetarian && <Badge variant='secondary'>Vegetarian</Badge>}
			</div>
          </CardContent>
          <CardFooter>
            <Button>Order Now</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  const renderAddOns = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {state.addOns.map((addon) => (
        <Card key={addon.id}>
          <CardHeader>
            <CardTitle>{addon.display}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Price: ${addon.price.toFixed(2)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderProbiotics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {state.probiotics.map((probiotic) => (
        <Card key={probiotic.id}>
          <CardHeader>
            <CardTitle>{probiotic.display}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  const renderFruits = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {state.fruits.map((fruit) => (
        <Card key={fruit.id}>
          <CardHeader>
            <CardTitle>{fruit.display}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );

  const renderDrinks = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {state.drinks.map((drink) => (
        <Card key={drink.id}>
          <CardHeader>
            <CardTitle>{drink.display}</CardTitle>
          </CardHeader>
          <CardContent>
            {drink.image && <img src={drink.image} alt={drink.display} className="w-full h-32 object-cover rounded-md mb-2" />}
            <p>Price: ${drink.price.toFixed(2)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Our Menu</h1>
      <Tabs defaultValue="mains">
        <TabsList>
          <TabsTrigger value="mains">Main Dishes</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="probiotics">Probiotics</TabsTrigger>
          <TabsTrigger value="fruits">Fruits</TabsTrigger>
          {/* <TabsTrigger value="drinks">Drinks</TabsTrigger> */}
        </TabsList>
        <TabsContent value="mains" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Main Dishes</h2>
          {renderMainItems()}
        </TabsContent>
        <TabsContent value="addons" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Add-ons</h2>
          {renderAddOns()}
        </TabsContent>
        <TabsContent value="probiotics" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Probiotics</h2>
          {renderProbiotics()}
        </TabsContent>
        <TabsContent value="fruits" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Fruits</h2>
          {renderFruits()}
        </TabsContent>
        <TabsContent value="drinks" className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Drinks</h2>
          {renderDrinks()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenuPage;