import Image from 'next/image';
import { Bar } from '@/lib/bar';
import { Camera } from 'lucide-react';
import { ChangeEvent } from 'react';

interface HeroSectionProps {
  bar: Bar;
  editedBar: Bar | null;
  isEditing: boolean;
  setEditedBar: (bar: Bar | null) => void;
  onImageSelect: (file: File) => void;
}

export function HeroSection({ bar, editedBar, isEditing, setEditedBar, onImageSelect }: HeroSectionProps) {
  const displayBar = isEditing ? editedBar || bar : bar;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const heroImageURL = URL.createObjectURL(file);
    setEditedBar({ ...editedBar || bar, heroImageURL });
    onImageSelect(file);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedBar({ ...editedBar || bar, name: e.target.value });
  };

  const imageUrl = displayBar?.heroImageURL || null;

  return (
    <div className="relative h-[60vh] min-h-[400px]">
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayBar.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl w-full mx-auto px-8 py-12">
          {isEditing ? (
            <input
              type="text"
              value={displayBar.name}
              onChange={handleNameChange}
              className="text-4xl md:text-6xl font-bold text-white bg-transparent border-b border-white/30 focus:border-white outline-none"
            />
          ) : (
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              {displayBar.name}
            </h1>
          )}
        </div>
      </div>

      {isEditing && (
        <label className="absolute top-4 right-4 btn btn-primary">
          Change Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
} 