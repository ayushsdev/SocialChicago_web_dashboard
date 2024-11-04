import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// import firebase from 'firebase/app';
import 'firebase/firestore';
import Link from 'next/link';
import { Bar } from '@/lib/bar';
import Image from 'next/image';

interface DashboardProps {
  user: User;
  signOut: () => Promise<void>;
}

export default function Dashboard({ user, signOut }: DashboardProps) {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const barsCollection = collection(db, 'bars');
        const barsSnapshot = await getDocs(barsCollection);
        const barsData = barsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bar[];
        setBars(barsData);
      } catch (error) {
        console.error('Error fetching bars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBars();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome, {user.displayName}</h1>
            <p className="text-foreground/70">{user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-foreground/70">Loading bars...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bars.map((bar) => (
              <div key={bar.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                 <Link href={`/bars/${bar.id}`} className="block">
                 <Image 
                    src={bar.heroImageURL} 
                    alt={bar.name}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                    onError={() => console.error('Image failed to load:', bar.heroImageURL)}
                  />
                </Link>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-black mb-2">{bar.name}</h2>
                  <p className="text-foreground/70 text-sm mb-4">
                    {bar.address.neighborhood} • {bar.fullAddress}
                  </p>
                  
                  {bar.happyHours && bar.happyHours.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-black mb-2">Happy Hours:</h3>
                      {bar.happyHours.map((hh, index) => (
                        <div key={index} className="text-sm text-black/70">
                          <p className="font-medium">{hh.name}</p>
                          <p>{hh.day.join(', ')}</p>
                          <p>{hh.startTime?.seconds ? new Date(hh.startTime.seconds * 1000).toLocaleTimeString() : ''} - 
                             {hh.endTime?.seconds ? new Date(hh.endTime.seconds * 1000).toLocaleTimeString() : ''}</p>
                          <ul className="list-disc list-inside mt-1">
                            {hh.drinks.slice(0, 3).map((drink, i) => (
                              <li key={i}>{drink}</li>
                            ))}
                            {hh.drinks.length > 3 && <li>...</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 mt-4 px-6 pb-6">
                  <a 
                    href={`tel:${bar.phoneNumber}`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {bar.phoneNumber}
                  </a>
                  <a 
                    href={bar.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Website
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 