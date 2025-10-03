import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
 Mail,
 Lock,
 Eye,
 EyeOff,
 LogIn,
 AlertCircle,
} from 'lucide-react';
import { Poppins, Space_Grotesk } from 'next/font/google';
import { GetServerSidePropsContext } from 'next';
import { authGate } from '@/middlewares/secureEnokiGate';
import { useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

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
 password: string;
}

interface FormErrors {
 email?: string;
 password?: string;
 general?: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
 return await authGate(ctx);
}

export default function Login({ user, queries, api }: any) {
 const queryClient = useQueryClient();
 const router = useRouter();
 const [formData, setFormData] = useState<FormData>({
  email: '',
  password: ''
 });

 const [errors, setErrors] = useState<FormErrors>({});
 const [showPassword, setShowPassword] = useState(false);
 const [isLoading, setIsLoading] = useState(false);
 const [rememberMe, setRememberMe] = useState(false);

 const validateForm = (): boolean => {
  const newErrors: FormErrors = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
   newErrors.email = 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
   newErrors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!formData.password) {
   newErrors.password = 'Password is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsLoading(true);
  setErrors({});

  try {
   // Simulate API call
   const r = await queryClient.fetchQuery({
    queryKey: ['login'],
    queryFn: async () => {
     const res = await axios.post(`${api}/login`, {
      email: formData.email,
      password: formData.password
     }, {
      withCredentials: true
     });
     return true;
    }
   });
   console.log(r);
   router.push("/")

  } catch (error: any) {
   console.log(error)
   if (error?.response.data.code === "USER_NOT_FOUND") {
    setErrors({ email: "Instituition Not Found. " });
   } else if (error?.response.data.code === "INVALID_CREDENTIALS") {
    setErrors({ password: "Incorrect password. " });
   } else {
    setErrors({ general: 'An error occurred. Please try again.' });
   }

  } finally {
   setIsLoading(false);
  }
 };

 const handleInputChange = (field: keyof FormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  // Clear errors when user starts typing
  if (errors[field] || errors.general) {
   setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  }
 };

 return (
  <div className={`${poppins.className} min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4`}>
   <motion.div
    className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md"
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

    {/* Demo Credentials */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
     <p className="text-xs text-blue-800 font-medium mb-1">Demo Credentials:</p>
     <p className="text-xs text-blue-700">Email: admin@demo.edu</p>
     <p className="text-xs text-blue-700">Password: password123</p>
    </div>

    {/* General Error */}
    {errors.general && (
     <motion.div
      className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
     >
      <p className="text-sm text-red-800 flex items-center gap-2">
       <AlertCircle className="h-4 w-4" />
       {errors.general}
      </p>
     </motion.div>
    )}

    {/* Form */}
    <form onSubmit={handleSubmit} className="space-y-6">
     {/* Email */}
     <div>
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
        placeholder="Enter your email"
        autoComplete="email"
       />
      </div>
      {errors.email && (
       <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {errors.email}
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
        placeholder="Enter your password"
        autoComplete="current-password"
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

     {/* Remember Me & Forgot Password */}
     <div className="flex items-center justify-end">

      <button
       type="button"
       className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
      >
       Forgot password?
      </button>
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
        Signing In...
       </>
      ) : (
       <>
        Sign In
        <LogIn className="h-5 w-5" />
       </>
      )}
     </motion.button>


    </form>

    {/* Footer */}
    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
     <p className="text-xs text-gray-500">
      Powered by <span className="font-semibold">E-Noki</span> - Smart Attendance Management
     </p>
    </div>
   </motion.div>
  </div>
 );
}
