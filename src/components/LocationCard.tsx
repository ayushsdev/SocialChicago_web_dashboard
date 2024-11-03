import { Bar } from '@/lib/bar';
import { MapPin } from 'lucide-react';

interface LocationCardProps {
  bar: Bar;
  editedBar: Bar | null;
  isEditing: boolean;
  setEditedBar: (bar: Bar | null) => void;
}

export function LocationCard({ bar, editedBar, isEditing, setEditedBar }: LocationCardProps) {
  const displayBar = isEditing ? editedBar || bar : bar;

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const [neighborhood = '', city = '', state = ''] = e.target.value.split('\n');
    setEditedBar({
      ...editedBar || bar,
      address: { neighborhood, city, state }
    });
  };

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          <MapPin className="w-5 h-5" />
          Location
        </h2>
        
        {isEditing ? (
          <textarea
            value={`${displayBar.address.neighborhood}\n${displayBar.address.city}\n${displayBar.address.state}`}
            onChange={handleAddressChange}
            className="textarea textarea-bordered w-full"
            rows={3}
          />
        ) : (
          <p className="whitespace-pre-line">
            {`${displayBar.address.neighborhood}\n${displayBar.address.city}\n${displayBar.address.state}`}
          </p>
        )}
      </div>
    </div>
  );
} 