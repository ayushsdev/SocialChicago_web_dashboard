import { Bar } from '@/lib/bar';
import { Phone, Globe } from 'lucide-react';

interface ContactCardProps {
  bar: Bar;
  editedBar: Bar | null;
  isEditing: boolean;
  setEditedBar: (bar: Bar | null) => void;
}

export function ContactCard({ bar, editedBar, isEditing, setEditedBar }: ContactCardProps) {
  const displayBar = isEditing ? editedBar || bar : bar;

  const handleContactChange = (field: keyof Bar) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedBar({ ...editedBar || bar, [field]: e.target.value });
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body space-y-4">
        <h2 className="card-title">Contact</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {isEditing ? (
              <input
                type="tel"
                value={displayBar.phoneNumber || ''}
                onChange={handleContactChange('phoneNumber')}
                className="input input-bordered w-full"
                placeholder="Phone number"
              />
            ) : (
              <span>{displayBar.phoneNumber || 'No phone number'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {isEditing ? (
              <input
                type="url"
                value={displayBar.website || ''}
                onChange={handleContactChange('website')}
                className="input input-bordered w-full"
                placeholder="Website URL"
              />
            ) : (
              <a 
                href={displayBar.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="link link-primary"
              >
                {displayBar.website || 'No website'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 