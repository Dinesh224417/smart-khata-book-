import React, { useState, useRef } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { Button } from './Button';
import { Input } from './Input';
import { X, Camera, User as UserIcon, Building2, MapPin, Mail } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
}

// Utility to resize image to avoid localStorage quota limits
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    companyName: user.companyName || '',
    address: user.address || ''
  });
  const [profileImage, setProfileImage] = useState<string | undefined>(user.profileImage);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }
      try {
        const resizedImage = await resizeImage(file);
        setProfileImage(resizedImage);
      } catch (error) {
        console.error("Error processing image", error);
        alert("Could not process image. Please try another one.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updatedUser: User = {
      ...user,
      name: formData.name,
      companyName: formData.companyName,
      address: formData.address,
      profileImage: profileImage
    };

    StorageService.updateUser(updatedUser);
    onUserUpdate(updatedUser);
    
    // Simulate slight delay for UX
    setTimeout(() => {
        setLoading(false);
        onClose();
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Background Pattern */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors backdrop-blur-sm"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Profile Image - Overlapping Header */}
        <div className="px-6 relative -mt-16 text-center">
            <div className="relative inline-block group">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex items-center justify-center">
                    {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                            <UserIcon className="w-16 h-16" />
                        </div>
                    )}
                </div>
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all border-2 border-white"
                    title="Change Photo"
                >
                    <Camera className="w-4 h-4" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            <p className="mt-2 text-sm text-slate-500 font-medium">{user.emailOrMobile}</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
            <div className="space-y-4">
                <div className="relative">
                    <Input 
                        label="Full Name"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        className="pl-10"
                    />
                    <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-9 pointer-events-none" />
                </div>

                <div className="relative">
                    <Input 
                        label="Company Name"
                        placeholder="e.g. My Awesome Shop"
                        value={formData.companyName}
                        onChange={e => setFormData({...formData, companyName: e.target.value})}
                        className="pl-10"
                    />
                    <Building2 className="w-5 h-5 text-slate-400 absolute left-3 top-9 pointer-events-none" />
                </div>

                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">Business Address</label>
                    <div className="relative">
                        <textarea 
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none h-24"
                            placeholder="e.g. 123 Main Street..."
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                         <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 ml-1">This address will appear on your PDF invoices.</p>
                </div>
            </div>

            <Button type="submit" className="w-full py-3" isLoading={loading}>
                Save Profile
            </Button>
        </form>
      </div>
    </div>
  );
};
