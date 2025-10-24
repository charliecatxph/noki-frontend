import React, { use, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
 School,
 User,
 Mail,
 Lock,
 Eye,
 EyeOff,
 ArrowRight,
 CheckCircle,
 AlertCircle
} from 'lucide-react';
import { Poppins, Space_Grotesk } from 'next/font/google';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { authGate } from '@/middlewares/secureEnokiGate';
import { GetServerSidePropsContext } from 'next';

const poppins = Poppins({
 subsets: ["latin"],
 weight: ["300", "400", "500", "600", "700", "800", "900"]
});

const spaceGrotesk = Space_Grotesk({
 subsets: ["latin"],
 weight: ["300", "400", "500", "600", "700"]
});

interface FormData {
 email: string;
 institutionId: string;
 name: string;
 password: string;
 confirmPassword: string;
}

interface FormErrors {
 email?: string;
 institutionId?: string;
 name?: string;
 password?: string;
 confirmPassword?: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
 return await authGate(ctx);
}

export default function CreateEnokiInstance({ user, queries, api }: { user: any, queries: any, api: string }) {
 const queryClient = useQueryClient();
 const router = useRouter();
 const [formData, setFormData] = useState<FormData>({
  email: '',
  institutionId: '',
  name: '',
  password: '',
  confirmPassword: ''
 });

 const { rf = "" } = router.query;

 useEffect(() => {
  setFormData({
   ...formData,
   institutionId: rf as string
  })
 }, [rf]);

 const [errors, setErrors] = useState<FormErrors>({});
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [isSuccess, setIsSuccess] = useState(false);

 const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
   newErrors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
   newErrors.email = 'Please enter a valid email address';
  }

  if (!formData.institutionId.trim()) {
   newErrors.institutionId = 'Institution ID is required';
  } else if (formData.institutionId.trim().length < 2) {
   newErrors.institutionId = 'Institution ID must be at least 2 characters';
  }

  // Name validation
  if (!formData.name.trim()) {
   newErrors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
   newErrors.name = 'Name must be at least 2 characters';
  }

  // Password validation
  if (!formData.password) {
   newErrors.password = 'Password is required';
  } else if (formData.password.length < 8) {
   newErrors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
   newErrors.password = 'Password must contain uppercase, lowercase, and number';
  }

  // Confirm password validation
  if (!formData.confirmPassword) {
   newErrors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
   newErrors.confirmPassword = 'Passwords do not match';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsLoading(true);

  try {
   // Simulate API call

   const res = await queryClient.fetchQuery({
    queryKey: ['enoki-instance'],
    queryFn: async () => {
     const res = await axios.post(`${api}/join-institution`, {
      email: formData.email,
      name: formData.name,
      password: formData.password,
      institutionId: formData.institutionId
     });
     return res.data;
    }
   });

   console.log(res)

   // Simulate success
   setIsSuccess(true);

   // Redirect after success
   setTimeout(() => {
    router.push('/login');
   }, 2000);

  } catch (error) {
   console.error('Registration failed:', error);
  } finally {
   setIsLoading(false);
  }
 };

 const handleInputChange = (field: keyof FormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear error when user starts typing
  if (errors[field]) {
   setErrors(prev => ({ ...prev, [field]: undefined }));
  }
 };

 if (isSuccess) {
  return (
   <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4`}>
    <motion.div
     className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md text-center"
     initial={{ scale: 0.8, opacity: 0 }}
     animate={{ scale: 1, opacity: 1 }}
     transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
     <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: "spring", damping: 25, stiffness: 300 }}
     >
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
     </motion.div>
     <h2 className={`${spaceGrotesk.className} text-2xl font-bold text-gray-800 mb-2`}>
      You have joined the instance.
     </h2>
     <p className="text-gray-600 mb-4">
      You have successfully joined the instance for <strong>{formData.institutionId}</strong>.
     </p>
     <p className="text-sm text-gray-500">
      Redirecting to login page...
     </p>
    </motion.div>
   </div>
  );
 }

 return (
  <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4`}>
   <motion.div
    className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-2xl"
    initial={{ scale: 0.95, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    transition={{ type: "spring", damping: 25, stiffness: 300 }}
   >
    {/* Header */}
    <div className="text-center mb-10 mt-3">
     <div className="mx-auto w-max">
      <img src="enokiinv.svg" alt="" className='w-full max-w-[200px]' />
     </div>
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-6">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Email */}
      <div className="md:col-span-2">
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Email Address
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <input
         type="email"
         value={formData.email}
         onChange={(e) => handleInputChange('email', e.target.value)}
         className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
         placeholder="admin@yourschool.edu"
        />
       </div>
       {errors.email && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
         <AlertCircle className="h-4 w-4" />
         {errors.email}
        </p>
       )}
      </div>

      {/* Institution ID */}
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Institution ID
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <School className="h-5 w-5 text-gray-400" />
        </div>
        <input
         type="text"
         value={formData.institutionId}
         onChange={(e) => handleInputChange('institutionId', e.target.value)}
         className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.institutionId ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
         placeholder="Your Institution ID"
        />
       </div>
       {errors.institutionId && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
         <AlertCircle className="h-4 w-4" />
         {errors.institutionId}
        </p>
       )}
      </div>


      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Name
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <User className="h-5 w-5 text-gray-400" />
        </div>
        <input
         type="text"
         value={formData.name}
         onChange={(e) => handleInputChange('name', e.target.value)}
         className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
         placeholder="Your Name"
        />
       </div>
       {errors.name && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
         <AlertCircle className="h-4 w-4" />
         {errors.name}
        </p>
       )}
      </div>

      {/* Password */}
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Password
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
         type={showPassword ? 'text' : 'password'}
         value={formData.password}
         onChange={(e) => handleInputChange('password', e.target.value)}
         className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
         placeholder="Create a strong password"
        />
        <button
         type="button"
         onClick={() => setShowPassword(!showPassword)}
         className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
         {showPassword ? (
          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
         ) : (
          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
         )}
        </button>
       </div>
       {errors.password && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
         <AlertCircle className="h-4 w-4" />
         {errors.password}
        </p>
       )}
      </div>

      {/* Confirm Password */}
      <div>
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Confirm Password
       </label>
       <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
         <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
         type={showConfirmPassword ? 'text' : 'password'}
         value={formData.confirmPassword}
         onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
         className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
         placeholder="Confirm your password"
        />
        <button
         type="button"
         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
         className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
         {showConfirmPassword ? (
          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
         ) : (
          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
         )}
        </button>
       </div>
       {errors.confirmPassword && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
         <AlertCircle className="h-4 w-4" />
         {errors.confirmPassword}
        </p>
       )}
      </div>
     </div>

     {/* Submit Button */}
     <motion.button
      type="submit"
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: isLoading ? 1 : 1.01 }}
      whileTap={{ scale: isLoading ? 1 : 0.99 }}
     >
      {isLoading ? (
       <>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        Joining Instance...
       </>
      ) : (
       <>
        Join Instance
        <ArrowRight className="h-5 w-5" />
       </>
      )}
     </motion.button>

     {/* Login Link */}
     <div className="text-center">
      <p className="text-gray-600">
       Already have an account?{' '}
       <button
        type="button"
        onClick={() => router.push('/login')}
        className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
       >
        Sign in here
       </button>
      </p>
     </div>
    </form>
   </motion.div>
  </div>
 );
}
