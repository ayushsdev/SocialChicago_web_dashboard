'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect, use, ChangeEvent } from 'react';
import { Bar } from '@/lib/bar';
// import { EditButtons } from '@/components/EditButtons';
import { EditButtons } from '@/components/EditButtons';
import { HeroSection } from '@/components/HeroSection';
import { LocationCard } from '../../../components/LocationCard';
import { ContactCard } from '../../../components/ContactCard';
import { HappyHoursSection } from '../../../components/HappyHoursSection';
import Link from 'next/link';
import {  HappyHourSession, APIResponse } from '@/types/flask_happyhour';
import { Timestamp } from 'firebase/firestore';
import { WeekDay } from '@/lib/bar';
import { PDFViewer } from '@/components/PDFViewer';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BarPage({ params }: PageProps) {
  const { id } = use(params);
  const [bar, setBar] = useState<Bar | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBar, setEditedBar] = useState<Bar | null>(null);
  const [uploadedHappyHours, setUploadedHappyHours] = useState<HappyHourSession[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchBar = async () => {
      if (!id) return;
      const barDoc = await getDoc(doc(db, 'bars', id));
      const barData = barDoc.data() as Bar;
      const sanitizedBarData = {
        ...barData,
        happyHours: barData.happyHours.map(hh => ({
          ...hh,
          day: hh.day || []
        }))
      };
      setBar(sanitizedBarData);
      setEditedBar(sanitizedBarData);
    };
    fetchBar();
  }, [id]);

  const handleSave = async () => {
    if (!editedBar) return;
    try {
      // Upload PDF if one is selected
      if (selectedFile) {
        for (const happyHour of editedBar.happyHours) {
          const storageRef = ref(
            storage, 
            `happyHourMenu/${editedBar.name}/${happyHour.id}.pdf`
          );
          await uploadBytes(storageRef, selectedFile);
        }
      }

      const barRef = doc(db, 'bars', id);
      const updates = {
        name: editedBar.name,
        heroImageURL: editedBar.heroImageURL,
        'address.fullAddress': editedBar.fullAddress,
        'address.neighborhood': editedBar.address.neighborhood,
        'address.city': editedBar.address.city,
        'address.state': editedBar.address.state,
        phoneNumber: editedBar.phoneNumber,
        website: editedBar.website,
        happyHours: editedBar.happyHours,
      };
      await updateDoc(barRef, updates);
      setBar(editedBar);
      setIsEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error saving bar:', error);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bar) return;
    
    setSelectedFile(file);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Check if the API URL is defined
      const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL;
      if (!apiUrl) {
        throw new Error('AI API URL is not configured');
      }

      // First analyze the PDF
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: APIResponse = await response.json();
      const parsedAnalysis = JSON.parse(data.analysis as unknown as string);
      console.log(parsedAnalysis);
      setUploadedHappyHours(parsedAnalysis.happy_hours);

      const convertTimeToTimestamp = (timeStr: string): Timestamp | null => {
        try {
          if (!timeStr || typeof timeStr !== 'string') return null;
          
          // Validate time string format (HH:mm)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(timeStr)) return null;
          
          const [hours, minutes] = timeStr.split(':').map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          
          if (isNaN(date.getTime())) return null;
          
          return Timestamp.fromDate(date);
        } catch (error) {
          console.error('Error converting time:', error);
          return null;
        }
      };

      const convertedHappyHours = parsedAnalysis.happy_hours
        .map((session: HappyHourSession) => {
          // Convert times, but allow null values
          const startTime = session.schedule?.start_time ? 
            convertTimeToTimestamp(session.schedule.start_time) : 
            null;
          
          const endTime = session.schedule?.end_time ? 
            convertTimeToTimestamp(session.schedule.end_time) : 
            null;

          // Convert days, but allow empty array
          const days = (session.schedule?.days || [])
            .map(day => {
              try {
                const upperDay = day.toUpperCase();
                return WeekDay[upperDay as keyof typeof WeekDay] || null;
              } catch (error) {
                console.error('Error processing day:', day, error);
                return null;
              }
            })
            .filter((day): day is WeekDay => day !== null);

          return {
            id: uuidv4(),
            name: session.name || "Happy Hour",
            day: days,
            startTime,
            endTime,
            drinks: [],
            deals: (session.deals || []).map(deal => ({
              item: deal.item || "Unknown Item",
              description: deal.description || "No description available",
              deal: deal.deal || "Price not specified"
            })),
            deals_summary: session.deals_summary || ""
          };
        });

      // Only update if we have valid happy hours with at least some data
      if (convertedHappyHours.length > 0) {
        // Upload the PDF for each new happy hour
        for (const happyHour of convertedHappyHours) {
          if (!bar) return;
          const storageRef = ref(
            storage, 
            `happyHourMenu/${bar.name}/${happyHour.id}.pdf`
          );
          await uploadBytes(storageRef, file);
        }

        setEditedBar(prev => prev ? {
          ...prev,
          happyHours: [...prev.happyHours, ...convertedHappyHours]
        } : null);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!bar) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-xl font-semibold">Loading bar details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="flex justify-between items-center p-4">
        <Link 
          href="/" 
          className="btn btn-ghost"
        >
          ← Back to Dashboard
        </Link>
        <EditButtons 
          isEditing={isEditing} 
          setIsEditing={setIsEditing} 
          handleSave={handleSave} 
        />
      </div>

      <HeroSection 
        bar={bar} 
        editedBar={editedBar} 
        isEditing={isEditing} 
        setEditedBar={setEditedBar} 
      />

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        <div className="card bg-base-200 p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4">Import Happy Hours from PDF</h2>
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="file-input file-input-bordered w-full max-w-xs"
              disabled={isUploading}
            />
            {isUploading && (
              <div className="flex items-center gap-3 text-primary">
                <span className="loading loading-spinner"></span>
                <span className="font-medium">Analyzing PDF...</span>
              </div>
            )}
          </div>
        </div>

        {selectedFile && <PDFViewer file={selectedFile} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <LocationCard 
            bar={bar} 
            editedBar={editedBar} 
            isEditing={isEditing} 
            setEditedBar={setEditedBar} 
          />
          
          <ContactCard 
            bar={bar} 
            editedBar={editedBar} 
            isEditing={isEditing} 
            setEditedBar={setEditedBar} 
          />

          {bar.happyHours && bar.happyHours.length > 0 && (
            <HappyHoursSection 
              bar={bar} 
              editedBar={editedBar} 
              isEditing={isEditing} 
              setEditedBar={setEditedBar}
              handleFileUpload={handleFileUpload}
            />
          )}
        </div>
      </div>

      {uploadedHappyHours && uploadedHappyHours.length > 0 && (
        <div className="col-span-full">
          <h2 className="text-2xl font-bold mb-4">Analyzed Happy Hours</h2>
          <div className="bg-base-200 p-4 rounded-lg space-y-6">
            {uploadedHappyHours.map((happyHour, index) => (
              <div key={index} className="card bg-base-100 shadow-xl p-4">
                <h3 className="text-xl font-bold mb-2">{happyHour.name}</h3>
                
                <div className="mb-3">
                  <h4 className="font-semibold">Schedule:</h4>
                  <p>Days: {happyHour.schedule.days.join(', ')}</p>
                  <p>Times: {happyHour.schedule.start_time} - {happyHour.schedule.end_time}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Deals:</h4>
                  <div className="space-y-2">
                    {happyHour.deals.map((deal, dealIndex) => (
                      <div key={dealIndex} className="p-2 bg-base-200 rounded">
                        <p className="font-medium">{deal.item}</p>
                        <p>{deal.description}</p>
                        <p className="text-primary">{deal.deal}</p>
                      </div>
                    ))}
                  </div>
                  <h4 className="font-semibold mb-2">Deals Summary:</h4>
                  <p>{happyHour.deals_summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
