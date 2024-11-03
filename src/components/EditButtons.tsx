import { Save, X, Edit2 } from 'lucide-react';

interface EditButtonsProps {
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  handleSave: () => void;
}

export function EditButtons({ isEditing, setIsEditing, handleSave }: EditButtonsProps) {
  return (
    <div className="fixed top-6 right-6 z-50">
      {isEditing ? (
        <div className="flex gap-3 backdrop-blur-md bg-base-200/80 p-2 rounded-lg shadow-lg">
          <button
            onClick={handleSave}
            className="btn btn-primary btn-sm hover:scale-105 transition-transform"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="btn btn-error btn-sm hover:scale-105 transition-transform"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-sm hover:scale-105 transition-transform backdrop-blur-md bg-base-200/80"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </button>
      )}
    </div>
  );
} 