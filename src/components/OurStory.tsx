import React, { useEffect, useState } from 'react';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import placeholder from '@/assets/banner.png';

const OurStoryComponent: React.FC = () => {
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      const storage = getStorage();
      try {
        const url1 = await getDownloadURL(ref(storage, 'images/BentoFriendsImage (1).jpg'));
        const url2 = await getDownloadURL(ref(storage, 'images/1000029387 (1).jpg'));
        setImage1(url1);
        setImage2(url2);
      } catch (error) {
        console.error("Error fetching images:", error);
        setImage1(placeholder);
        setImage2(placeholder);
      }
    };

    fetchImages();
  }, []);


  return (
    <div className='w-full bg-brand-cream text-primary py-12 lg:py-24 px-4 md:px-8'>
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
          Bento & Friends
          <br/>School Vision

          </h2>
          
          <p className="text-lg text-justify max-w-xl">
          As busy parents & hospitality professionals ourselves, Bento & Friends are passionately looking to advance the
school lunch environment by providing nutritious & yummy all-in-one complete bento set meals. We understand the
time constraints & challenges of preparing engaging lunches everyday for our children, therefore our services aim to
assist busy parents whilst alleviating any existing canteen workload/ volunteer issues to directly benefit
schoolchildren with our all-in-one bento school lunches.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-auto overflow-hidden pb-24">
            <img src={image1} alt="Chef preparing bento boxes in large quantity" className="w-full h-full rounded-lg object-cover" />
          </div>
          <div className="aspect-auto overflow-hidden pt-24">
            <img src={image2} alt="School child enjoying meal" className="w-full h-full rounded-lg object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStoryComponent;