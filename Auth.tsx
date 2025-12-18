import React, { useState, useRef } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { Input } from './Input';
import { Button } from './Button';
import { Wallet, ArrowRight, CheckCircle2, Sparkles, Smartphone, Mail, Camera, User as UserIcon } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

// Reuse resize logic (could be moved to a util file in a larger project)
const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200; // Smaller for signup preview
          const MAX_HEIGHT = 200;
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
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (error) => reject(error);
    });
  };

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    emailOrMobile: '',
    password: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const resized = await resizeImage(file);
              setProfileImage(resized);
          } catch (e) {
              console.error(e);
          }
      }
  };

  const validateEmailOrMobile = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/; // Simple 10 digit check
    return emailRegex.test(value) || mobileRegex.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Common Validation
    if (!formData.emailOrMobile || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!validateEmailOrMobile(formData.emailOrMobile)) {
      setError('Please enter a valid Email address (e.g. gmail) or a 10-digit Mobile Number.');
      return;
    }

    if (isLogin) {
      // Login Logic
      const user = StorageService.findUser(formData.emailOrMobile);
      if (user && user.password === formData.password) {
        StorageService.login(user);
        onLogin(user);
      } else {
        setError('Invalid credentials. Please check your email/mobile and password.');
      }
    } else {
      // Signup Logic
      if (!formData.name) {
        setError('Full Name is required.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      
      const existingUser = StorageService.findUser(formData.emailOrMobile);
      if (existingUser) {
        setError('User already exists with this email or mobile number.');
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        name: formData.name,
        emailOrMobile: formData.emailOrMobile,
        password: formData.password,
        profileImage: profileImage
      };

      StorageService.saveUser(newUser);
      setSuccess('Account created successfully! Switching to login...');
      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
        setFormData({ name: '', emailOrMobile: '', password: '', confirmPassword: '' });
        setProfileImage(undefined);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden z-10 my-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="relative z-10 text-2xl font-bold text-white mb-2">Smart Khata Book</h1>
          <p className="relative z-10 text-indigo-100 text-sm font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> AI-Powered Finance
          </p>
        </div>

        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-2 text-sm border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm border border-rose-100 font-medium animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-10 h-10 text-slate-400" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Camera className="w-3 h-3" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </div>
                </div>
            )}

            {!isLogin && (
              <Input
                label="Full Name"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            )}
            
            <div className="relative">
                <Input
                label="Email or Mobile Number"
                name="emailOrMobile"
                placeholder="you@gmail.com or 9876543210"
                value={formData.emailOrMobile}
                onChange={handleChange}
                />
                <div className="absolute top-9 right-3 flex gap-2 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                    <Smartphone className="w-4 h-4" />
                </div>
            </div>
            
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />

            {!isLogin && (
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            )}

            <Button type="submit" className="w-full mt-6 shadow-indigo-200 py-3">
              {isLogin ? 'Login' : 'Sign Up'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-indigo-600 font-bold hover:text-indigo-700 underline underline-offset-2 decoration-2"
            >
              {isLogin ? 'Create one' : 'Login here'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-auto py-4 text-indigo-100/70 text-xs font-medium z-10">
        App Created by Dinesh Kumar
      </div>
    </div>
  );
};