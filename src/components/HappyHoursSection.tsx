import { Bar, Deal, HappyHour } from '@/lib/bar';
import { Clock } from 'lucide-react';
import { WeekDay } from '@/lib/bar';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface HappyHoursSectionProps {
  bar: Bar;
  editedBar: Bar | null;
  isEditing: boolean;
  setEditedBar: (bar: Bar | null) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const WEEKDAYS = Object.values(WeekDay);

type NullableTimestamp = Timestamp | null;

export function HappyHoursSection({ bar, editedBar, isEditing, setEditedBar, handleFileUpload }: HappyHoursSectionProps) {
  const displayBar = isEditing ? editedBar || bar : bar;

  const [pdfUrls, setPdfUrls] = useState<{ [key: string]: string }>({});
  const [loadingPdfs, setLoadingPdfs] = useState<{ [key: string]: boolean }>({});
  const [analyzingPdfs, setAnalyzingPdfs] = useState<{ [key: string]: boolean }>({});

  // Ensure happyHours is always an array
  if (!displayBar.happyHours) {
    displayBar.happyHours = [];
  }

  const handleHappyHourChange = (index: number, field: keyof HappyHour) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newHappyHours = [...(displayBar.happyHours || [])];
    
    if (field === 'startTime' || field === 'endTime') {
      try {
        const timeStr = e.target.value;
        if (!timeStr) {
          newHappyHours[index] = {
            ...newHappyHours[index],
            [field]: null,
          };
        } else {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hours || 0, minutes || 0, 0, 0);
          
          if (!isNaN(date.getTime())) {
            newHappyHours[index] = {
              ...newHappyHours[index],
              [field]: Timestamp.fromDate(date),
            };
          }
        }
      } catch (error) {
        console.error(`Error setting ${field}:`, error);
        return; // Don't update if there's an error
      }
    } else if (field === 'drinks') {
      newHappyHours[index] = {
        ...newHappyHours[index],
        drinks: e.target.value.split(',').map(drink => drink.trim()),
      };
    } else {
      newHappyHours[index] = {
        ...newHappyHours[index],
        [field]: field === 'day' ? [e.target.value as WeekDay] : e.target.value,
      };
    }
    
    setEditedBar({ ...displayBar, happyHours: newHappyHours });
  };

  const addHappyHour = () => {
    const newHappyHours = [
      ...(displayBar.happyHours || []),
      { 
        id: uuidv4(),
        name: '',
        day: [] as WeekDay[],
        drinks: [],
        startTime: null,
        endTime: null,
        deals: [] as Deal[],
        deals_summary: ''
      } as HappyHour,
    ];
    setEditedBar({ ...displayBar, happyHours: newHappyHours });
  };

  const removeHappyHour = (index: number) => {
    const newHappyHours = [...(displayBar.happyHours || [])].filter((_, i) => i !== index);
    setEditedBar({ ...displayBar, happyHours: newHappyHours });
  };

  const formatTime = (timestamp: NullableTimestamp) => {
    try {
      if (!timestamp || !timestamp.toDate) return '';
      const date = timestamp.toDate();
      if (isNaN(date.getTime())) return ''; // Check for invalid date
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const handleDealChange = (happyHourIndex: number, dealIndex: number, field: keyof Deal) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newHappyHours = [...(displayBar.happyHours || [])];
    const newDeals = [...(newHappyHours[happyHourIndex].deals || [])];
    newDeals[dealIndex] = {
      ...newDeals[dealIndex],
      [field]: e.target.value,
    };
    newHappyHours[happyHourIndex] = {
      ...newHappyHours[happyHourIndex],
      deals: newDeals,
    };
    setEditedBar({ ...displayBar, happyHours: newHappyHours });
  };

  const addDeal = (happyHourIndex: number) => {
    const newHappyHours = [...(displayBar.happyHours || [])];
    newHappyHours[happyHourIndex] = {
      ...newHappyHours[happyHourIndex],
      deals: [
        ...(newHappyHours[happyHourIndex].deals || []),
        { item: '', description: '', deal: '' },
      ],
    };
    setEditedBar({ ...displayBar, happyHours: newHappyHours });
  };

  const removeDeal = (happyHourIndex: number, dealIndex: number) => {
    const newHappyHours = [...(displayBar.happyHours || [])];
    newHappyHours[happyHourIndex] = {
      ...newHappyHours[happyHourIndex],
      deals: newHappyHours[happyHourIndex].deals.filter((_, i) => i !== dealIndex),
    };
    setEditedBar({ ...displayBar, happyHours: newHappyHours });
  };

  const handleViewPdf = async (happyHourId: string) => {
    try {
      setLoadingPdfs(prev => ({ ...prev, [happyHourId]: true }));
      
      // Only fetch URL if we haven't already
      if (!pdfUrls[happyHourId]) {
        const pdfRef = ref(storage, `happyHourMenu/${happyHourId}.pdf`);
        const url = await getDownloadURL(pdfRef);
        setPdfUrls(prev => ({ ...prev, [happyHourId]: url }));
      }

      // Open PDF in new tab
      window.open(pdfUrls[happyHourId] || '', '_blank');
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoadingPdfs(prev => ({ ...prev, [happyHourId]: false }));
    }
  };

  const handleAnalyzePdf = async (happyHourId: string) => {
    try {
      setAnalyzingPdfs(prev => ({ ...prev, [happyHourId]: true }));
      
      // Use the API route instead of direct Firebase Storage URL
      const response = await fetch(`/api/pdf/${happyHourId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pdfBlob = await response.blob();
      const file = new File([pdfBlob], `${happyHourId}.pdf`, { type: 'application/pdf' });
      const event = {
        target: {
          files: [file]
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      await handleFileUpload(event);
      
    } catch (error) {
      console.error('Error analyzing PDF:', error);
    } finally {
      setAnalyzingPdfs(prev => ({ ...prev, [happyHourId]: false }));
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl col-span-full">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">
            <Clock className="w-5 h-5" />
            Happy Hours
          </h2>
          {isEditing && (
            <button 
              onClick={addHappyHour}
              className="btn btn-primary btn-sm"
            >
              Add Happy Hour
            </button>
          )}
        </div>

        <div className="grid gap-6 mt-4">
          {displayBar.happyHours?.map((happyHour, index) => (
            <div key={index} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Happy Hour Name</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={happyHour.name}
                          onChange={handleHappyHourChange(index, 'name')}
                          className="input input-bordered flex-1"
                          placeholder="e.g., Early Bird Special"
                        />
                        <button 
                          onClick={() => removeHappyHour(index)}
                          className="btn btn-error"
                          title="Remove this happy hour"
                        >
                          Remove Happy Hour
                        </button>
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Days</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map((day) => (
                          <button
                            key={day}
                            onClick={() => {
                              const newHappyHours = [...(displayBar.happyHours || [])];
                              const currentDays = newHappyHours[index].day;
                              
                              newHappyHours[index] = {
                                ...newHappyHours[index],
                                day: currentDays.includes(day)
                                  ? currentDays.filter(d => d !== day)
                                  : [...currentDays, day],
                              };
                              setEditedBar({ ...displayBar, happyHours: newHappyHours });
                            }}
                            className={`btn btn-sm ${
                              happyHour.day.includes(day) 
                                ? 'btn-primary' 
                                : 'btn-outline'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Start Time</span>
                      </label>
                      <input
                        type="time"
                        value={happyHour.startTime ? format(happyHour.startTime.toDate(), 'HH:mm') : ''}
                        onChange={handleHappyHourChange(index, 'startTime')}
                        className="input input-bordered required"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">End Time</span>
                      </label>
                      <input
                        type="time"
                        value={happyHour.endTime ? format(happyHour.endTime.toDate(), 'HH:mm') : ''}
                        onChange={handleHappyHourChange(index, 'endTime')}
                        className="input input-bordered required"
                      />
                    </div>
                    <div className="form-control lg:col-span-2">
                      <label className="label">
                        <span className="label-text">Drinks</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={(happyHour.drinks || []).join(', ')}
                          onChange={handleHappyHourChange(index, 'drinks')}
                          className="input input-bordered flex-1"
                          placeholder="e.g., $5 Draft Beers, $7 House Wines"
                        />
                        <button 
                          onClick={() => removeHappyHour(index)}
                          className="btn btn-error btn-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="form-control lg:col-span-2 mt-4">
                      <div className="flex justify-between items-center">
                        <label className="label">
                          <span className="label-text">Food Deals</span>
                        </label>
                        <button 
                          onClick={() => addDeal(index)}
                          className="btn btn-primary btn-sm"
                        >
                          Add Deal
                        </button>
                      </div>
                      {happyHour.deals?.map((deal, dealIndex) => (
                        <div key={dealIndex} className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-2">
                          <input
                            type="text"
                            value={deal.item}
                            onChange={handleDealChange(index, dealIndex, 'item')}
                            className="input input-bordered input-sm"
                            placeholder="Item name"
                          />
                          <input
                            type="text"
                            value={deal.description}
                            onChange={handleDealChange(index, dealIndex, 'description')}
                            className="input input-bordered input-sm"
                            placeholder="Description"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={deal.deal}
                              onChange={handleDealChange(index, dealIndex, 'deal')}
                              className="input input-bordered input-sm flex-1"
                              placeholder="Deal price/discount"
                            />
                            <button 
                              onClick={() => removeDeal(index, dealIndex)}
                              className="btn btn-error btn-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="form-control lg:col-span-2 mt-4">
                      <label className="label">
                        <span className="label-text">Deals Summary</span>
                      </label>
                      <input
                        type="text"
                        value={happyHour.deals_summary || ''}
                        onChange={handleHappyHourChange(index, 'deals_summary')}
                        className="input input-bordered"
                        placeholder="Brief summary of all deals"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{happyHour.name}</h3>
                      <div className="flex gap-2">
                        {isEditing && (
                          <button
                            onClick={() => removeHappyHour(index)}
                            className="btn btn-error"
                          >
                            Remove Happy Hour
                          </button>
                        )}
                        <button
                          onClick={() => handleViewPdf(happyHour.id)}
                          className="btn btn-sm btn-ghost"
                          disabled={loadingPdfs[happyHour.id]}
                        >
                          {loadingPdfs[happyHour.id] ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <span className="ml-2">View Menu</span>
                        </button>
                        <button
                          onClick={() => handleAnalyzePdf(happyHour.id)}
                          className="btn btn-sm btn-primary"
                          disabled={analyzingPdfs[happyHour.id]}
                        >
                          {analyzingPdfs[happyHour.id] ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            <span>Analyze Menu</span>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm opacity-75">
                      <p>{happyHour.day.join(', ')} • {formatTime(happyHour.startTime)} - {formatTime(happyHour.endTime)}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">{(happyHour.drinks || []).join(', ')}</p>
                    </div>
                    {happyHour.deals?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Food Deals:</p>
                        <ul className="list-disc list-inside">
                          {happyHour.deals.map((deal, dealIndex) => (
                            <li key={dealIndex} className="text-sm">
                              {deal.item}: {deal.description} - {deal.deal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="text-sm italic">{happyHour.deals_summary}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 