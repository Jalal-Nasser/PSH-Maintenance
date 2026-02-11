import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Clock, RefreshCw, Mail, Send, LogIn, LogOut, Edit2, Save, X, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Turnstile from 'react-turnstile';
import ReactDOM from 'react-dom/client';
import React from 'react';
import './src/index.css';

import { supabase } from './src/supabase';

// ... imports
import { useEffect as useEffectOriginal } from 'react';

const CountdownTimer = ({ isAdmin, onEdit }: { isAdmin: boolean; onEdit?: () => void }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 12, minutes: 0, seconds: 0 });

    useEffectOriginal(() => {
        // Load from localStorage
        const saved = localStorage.getItem('maintenance_duration');
        if (saved) {
            setTimeLeft(JSON.parse(saved));
        } else {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 2);
            updateTimer(targetDate);
        }

        const timer = setInterval(() => {
            const targetDate = new Date();
            const saved = localStorage.getItem('maintenance_duration');
            if (saved) {
                const duration = JSON.parse(saved);
                targetDate.setDate(targetDate.getDate() + duration.days);
                targetDate.setHours(targetDate.getHours() + duration.hours);
                targetDate.setMinutes(targetDate.getMinutes() + duration.minutes);
                targetDate.setSeconds(targetDate.getSeconds() + duration.seconds);
            } else {
                targetDate.setDate(targetDate.getDate() + 2);
            }

            updateTimer(targetDate);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const updateTimer = (targetDate: Date) => {
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();

        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            });
        }
    };

    return (
        <div className="flex justify-center gap-2 text-white font-mono text-xl">
            <div className="flex flex-col items-center">
                <span className="bg-slate-700/50 px-2 py-1 rounded">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-xs text-blue-300 mt-1">d</span>
            </div>
            <span className="mt-1">:</span>
            <div className="flex flex-col items-center">
                <span className="bg-slate-700/50 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-xs text-blue-300 mt-1">h</span>
            </div>
            <span className="mt-1">:</span>
            <div className="flex flex-col items-center">
                <span className="bg-slate-700/50 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-xs text-blue-300 mt-1">m</span>
            </div>
            <span className="mt-1">:</span>
            <div className="flex flex-col items-center">
                <span className="bg-slate-700/50 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-xs text-blue-300 mt-1">s</span>
            </div>
            {isAdmin && onEdit && (
                <motion.button
                    onClick={onEdit}
                    className="ml-4 p-2 hover:bg-blue-500/20 rounded-lg transition-all"
                    whileHover={{ scale: 1.1 }}
                    title="Edit duration"
                >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                </motion.button>
            )}
        </div>
    );
};

const DEFAULT_ALLOWED_DOMAINS = [
    'w-sala.com',
    'gscompany.sa',
    'jalalnasser.com',
    'wahl.sa',
    'portal.privetserver.com',
    'destination.com.sa',
    'homecare-cmc.com',
    'canadian-mcsa.com',
    'optmco.com',
    'privetserver.com'
];

export default function Maintenance() {
    const [requestId] = useState(() => `PSH-${Math.random().toString(36).substring(2, 11).toUpperCase()}`);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [serviceType, setServiceType] = useState('Hosting');
    const [section, setSection] = useState('Support');
    const [relatedDomain, setRelatedDomain] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);

    const [allowedDomains, setAllowedDomains] = useState<string[]>(() => {
        const saved = localStorage.getItem('allowed_domains');
        return saved ? JSON.parse(saved) : DEFAULT_ALLOWED_DOMAINS;
    });


    // Admin state
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDomainModal, setShowDomainModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [editDays, setEditDays] = useState(2);
    const [editHours, setEditHours] = useState(12);
    const [editMinutes, setEditMinutes] = useState(0);
    const [editSeconds, setEditSeconds] = useState(0);
    const [newDomain, setNewDomain] = useState('');


    const handleAdminLogin = () => {
        const correctPassword = 'R@sha1988#'; // Change this to your desired password
        if (adminPassword === correctPassword) {
            setIsAdminLoggedIn(true);
            setShowLoginModal(false);
            setAdminPassword('');
            setPasswordError('');
        } else {
            setPasswordError('Incorrect password');
            setAdminPassword('');
        }
    };

    const handleAdminLogout = () => {
        setIsAdminLoggedIn(false);
    };

    const handleEditDuration = () => {
        // Load current saved duration if exists
        const saved = localStorage.getItem('maintenance_duration');
        if (saved) {
            const duration = JSON.parse(saved);
            setEditDays(duration.days);
            setEditHours(duration.hours);
            setEditMinutes(duration.minutes);
            setEditSeconds(duration.seconds);
        }
        setShowEditModal(true);
    };

    const handleSaveDuration = () => {
        const newDuration = {
            days: editDays,
            hours: editHours,
            minutes: editMinutes,
            seconds: editSeconds
        };
        localStorage.setItem('maintenance_duration', JSON.stringify(newDuration));
        setShowEditModal(false);
    };

    const handleAddDomain = () => {
        if (newDomain && !allowedDomains.includes(newDomain)) {
            const updated = [...allowedDomains, newDomain.toLowerCase().trim()];
            setAllowedDomains(updated);
            localStorage.setItem('allowed_domains', JSON.stringify(updated));
            setNewDomain('');
        }
    };

    const handleRemoveDomain = (domain: string) => {
        const updated = allowedDomains.filter(d => d !== domain);
        setAllowedDomains(updated);
        localStorage.setItem('allowed_domains', JSON.stringify(updated));
    };

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        // Domain Whitelist Validation
        const domainToWhiteList = relatedDomain.toLowerCase().trim();
        const isAllowed = allowedDomains.some((domain: string) =>
            domainToWhiteList === domain || domainToWhiteList.endsWith(`.${domain}`)
        );


        if (!isAllowed) {
            setSubmitStatus('error');
            setErrorMessage(`The domain "${relatedDomain}" is not in our allowed service list. Please enter a valid domain (e.g., wahl.sa, privetserver.com).`);
            setIsSubmitting(false);
            return;
        }

        if (!captchaToken) {
            setSubmitStatus('error');
            setErrorMessage("Please complete the security check.");
            setIsSubmitting(false);
            return;
        }


        try {
            // Insert into database
            const { error: dbError } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        request_id: requestId,
                        first_name: firstName,
                        last_name: lastName,
                        sender_email: email,
                        company_name: companyName,
                        service_type: serviceType,
                        section: section,
                        related_domain: relatedDomain,
                        message: message,
                        recipient: 'support@privetserver.com',
                        created_at: new Date().toISOString(),
                    }
                ]);

            if (dbError) throw dbError;

            // Trigger the email edge function
            const { data: funcData, error: funcError } = await supabase.functions.invoke('send-email', {
                body: {
                    request_id: requestId,
                    first_name: firstName,
                    last_name: lastName,
                    sender_email: email,
                    company_name: companyName,
                    service_type: serviceType,
                    section: section,
                    related_domain: relatedDomain,
                    message: message,
                    captcha_token: captchaToken
                }

            });

            if (funcError) {
                console.error('Full Function Error:', funcError);
                console.error('Function Error Context:', (funcError as any).context);
                console.error('Function Data:', funcData);

                let errorDetails = '';
                try {
                    const errorBody = (funcError as any).context?.error || funcData;

                    if (typeof errorBody === 'string') {
                        errorDetails = errorBody;
                    } else if (errorBody && typeof errorBody === 'object') {
                        errorDetails = errorBody.error || errorBody.message || JSON.stringify(errorBody);
                    }

                    if (!errorDetails) {
                        errorDetails = funcError.message;
                    }
                } catch (e) {
                    console.error('Error parsing error:', e);
                }

                const finalMsg = errorDetails || 'Email service error - check console for details';
                throw new Error(finalMsg);
            }

            setShowSuccessModal(true);
            setSubmitStatus('success');
            setFirstName('');
            setLastName('');
            setEmail('');
            setCompanyName('');
            setServiceType('Hosting');
            setSection('Support');
            setRelatedDomain('');
            setMessage('');
        } catch (error: any) {
            console.error('Error:', error);
            setSubmitStatus('error');
            setErrorMessage(error.message || error.error_description || 'Unknown error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center">
                <motion.div
                    className="absolute top-8 left-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.img
                        src="/logo.png"
                        alt="Logo"
                        className="h-20 w-auto logo-glow"
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>

                {/* Admin Button */}
                <motion.div
                    className="absolute top-8 right-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {!isAdminLoggedIn ? (
                        <motion.button
                            onClick={() => setShowLoginModal(true)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-all"
                            whileHover={{ scale: 1.1 }}
                            title="Admin Login"
                        >
                            <LogIn className="w-6 h-6 text-blue-400" />
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={handleAdminLogout}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                            whileHover={{ scale: 1.1 }}
                            title="Admin Logout"
                        >
                            <LogOut className="w-6 h-6 text-red-400" />
                        </motion.button>
                    )}
                </motion.div>

                <motion.div
                    className="relative inline-block mb-8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    <motion.div
                        className="absolute inset-0 bg-blue-500/30 blur-3xl rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                        className="relative bg-slate-800/50 backdrop-blur-sm p-8 rounded-full border border-blue-500/30"
                        whileHover={{ scale: 1.05 }}
                    >
                        <Wrench className="w-24 h-24 text-blue-400" />
                    </motion.div>
                </motion.div>

                <motion.h1
                    className="text-5xl md:text-6xl font-bold text-white mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Under Maintenance
                </motion.h1>

                <motion.p
                    className="text-xl text-blue-200 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    We're working hard to improve your experience
                </motion.p>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                    <motion.div
                        className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Expected Duration
                        </h3>
                        <p className="text-blue-200 mb-4">
                            We'll be back online within
                        </p>
                        <CountdownTimer isAdmin={isAdminLoggedIn} onEdit={handleEditDuration} />
                        {isAdminLoggedIn && (
                            <motion.button
                                onClick={() => setShowDomainModal(true)}
                                className="mt-4 w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30 transition-all flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <RefreshCw className="w-3 h-3" />
                                Manage Domains
                            </motion.button>
                        )}
                    </motion.div>

                    <motion.div
                        className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                            What We're Doing
                        </h3>
                        <p className="text-blue-200 mb-4">
                            Upgrading systems & adding features
                        </p>
                        <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-400"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    className="flex justify-center items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-3 h-3 bg-blue-400 rounded-full"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </motion.div>

                <motion.p
                    className="text-blue-300 mt-8 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    Thank you for your patience. We appreciate your understanding.
                </motion.p>

                <motion.div
                    className="mt-12 bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                >
                    <div className="flex items-center justify-center mb-6">
                        <motion.div
                            className="bg-blue-500/20 p-3 rounded-full"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Mail className="w-6 h-6 text-blue-400" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-white ml-3">
                            Support Request
                        </h3>
                    </div>

                    <p className="text-blue-200 text-sm mb-4 text-center">
                        Need assistance? Submit a support request and we'll get back to you soon.
                    </p>

                    {/* Request ID Display */}
                    <div className="mb-4 p-3 bg-slate-700/30 border border-blue-400/30 rounded-lg">
                        <p className="text-blue-300 text-sm text-center">
                            <span className="font-semibold">Request ID:</span> {requestId}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-blue-300 text-xs block mb-1 text-left">First Name *</label>
                                <input
                                    type="text"
                                    placeholder="First name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-blue-300 text-xs block mb-1 text-left">Last Name *</label>
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-blue-300 text-xs block mb-1 text-left">Email Address *</label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                            />
                        </div>

                        {/* Company Name */}
                        <div>
                            <label className="text-blue-300 text-xs block mb-1 text-left">Company Name *</label>
                            <input
                                type="text"
                                placeholder="Company name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                            />
                        </div>

                        {/* Dropdowns Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-blue-300 text-xs block mb-1 text-left">Service Type *</label>
                                <select
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                >
                                    <option>Hosting</option>
                                    <option>Domain</option>
                                    <option>Email</option>
                                    <option>Security</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-blue-300 text-xs block mb-1 text-left">Section *</label>
                                <select
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                >
                                    <option>Support</option>
                                    <option>Billing</option>
                                    <option>Sales</option>
                                    <option>Security</option>
                                </select>
                            </div>
                        </div>

                        {/* Related Domain */}
                        <div>
                            <label className="text-blue-300 text-xs block mb-1 text-left">Related Domain/Service *</label>
                            <input
                                type="text"
                                placeholder="example.com"
                                value={relatedDomain}
                                onChange={(e) => setRelatedDomain(e.target.value)}
                                required
                                className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-blue-300 text-xs block mb-1 text-left">Message *</label>
                            <textarea
                                placeholder="Please describe your issue or question..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none text-sm"
                            />
                        </div>

                        {/* Bot Protection */}
                        <div className="flex justify-center mb-4">
                            <Turnstile
                                sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onVerify={(token) => setCaptchaToken(token)}
                                theme="dark"
                            />
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                        >
                            {isSubmitting ? (
                                <>
                                    <motion.div
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit Request
                                </>
                            )}
                        </motion.button>

                        {/* Status Messages */}


                        {submitStatus === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center"
                            >
                                ✗ Failed to submit: {errorMessage}
                            </motion.div>
                        )}
                    </form>
                </motion.div>

                {/* Admin Login Modal */}
                <AnimatePresence>
                    {showLoginModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLoginModal(false)}
                        >
                            <motion.div
                                className="bg-slate-800 border border-blue-500/30 rounded-lg p-8 max-w-sm w-full mx-4"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>

                                <div className="mb-4">
                                    <label className="text-blue-300 text-sm block mb-2">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter admin password"
                                        value={adminPassword}
                                        onChange={(e) => {
                                            setAdminPassword(e.target.value);
                                            setPasswordError('');
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAdminLogin();
                                            }
                                        }}
                                        className="w-full px-4 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                    />
                                </div>

                                {passwordError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-sm mb-4 text-center"
                                    >
                                        {passwordError}
                                    </motion.div>
                                )}

                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={handleAdminLogin}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Login
                                    </motion.button>
                                    <motion.button
                                        onClick={() => {
                                            setShowLoginModal(false);
                                            setAdminPassword('');
                                            setPasswordError('');
                                        }}
                                        className="flex-1 bg-slate-700/50 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Admin Edit Duration Modal */}
                <AnimatePresence>
                    {showEditModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                        >
                            <motion.div
                                className="bg-slate-800 border border-blue-500/30 rounded-lg p-8 max-w-md w-full mx-4"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">Edit Duration</h2>
                                    <motion.button
                                        onClick={() => setShowEditModal(false)}
                                        className="p-1 hover:bg-slate-700 rounded transition-all"
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <X className="w-5 h-5 text-red-400" />
                                    </motion.button>
                                </div>

                                <div className="grid grid-cols-4 gap-3 mb-6">
                                    <div>
                                        <label className="text-blue-300 text-xs block mb-2 text-center">Days</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={editDays}
                                            onChange={(e) => setEditDays(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full px-2 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-blue-300 text-xs block mb-2 text-center">Hours</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={23}
                                            value={editHours}
                                            onChange={(e) => setEditHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-full px-2 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-blue-300 text-xs block mb-2 text-center">Minutes</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={editMinutes}
                                            onChange={(e) => setEditMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-full px-2 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-blue-300 text-xs block mb-2 text-center">Seconds</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={editSeconds}
                                            onChange={(e) => setEditSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-full px-2 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={handleSaveDuration}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-500 hover:to-green-400 transition-all flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Save className="w-4 h-4" />
                                        Save
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 bg-slate-700/50 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Admin Domain Management Modal */}
                <AnimatePresence>

                    {showDomainModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDomainModal(false)}
                        >
                            <motion.div
                                className="bg-slate-800 border border-blue-500/30 rounded-lg p-8 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-white">Manage Domains</h2>
                                    <motion.button
                                        onClick={() => setShowDomainModal(false)}
                                        className="p-1 hover:bg-slate-700 rounded transition-all"
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        <X className="w-5 h-5 text-red-400" />
                                    </motion.button>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Add new domain (e.g. example.com)"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                                        className="flex-1 px-3 py-2 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 text-sm"
                                    />
                                    <motion.button
                                        onClick={handleAddDomain}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Add
                                    </motion.button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {allowedDomains.map((domain) => (
                                        <div
                                            key={domain}
                                            className="flex items-center justify-between p-3 bg-slate-900/30 border border-blue-500/10 rounded-lg group"
                                        >
                                            <span className="text-blue-200 text-sm">{domain}</span>
                                            <button
                                                onClick={() => handleRemoveDomain(domain)}
                                                className="text-slate-500 hover:text-red-400 transition-colors"
                                                title="Remove domain"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-700">
                                    <motion.button
                                        onClick={() => setShowDomainModal(false)}
                                        className="w-full bg-slate-700/50 text-white font-semibold py-2 rounded-lg hover:bg-slate-700 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Close
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Modal */}
                <AnimatePresence>
                    {showSuccessModal && (
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSuccessModal(false)}
                        >
                            <motion.div
                                className="bg-slate-800 border-2 border-green-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)]"
                                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.8, y: 20, opacity: 0 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <motion.div
                                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", damping: 12 }}
                                >
                                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                                </motion.div>

                                <h2 className="text-3xl font-bold text-white mb-2">Success!</h2>
                                <div className="mb-6">
                                    <p className="text-blue-100 mb-2 leading-relaxed">
                                        Your support request has been sent successfully.
                                    </p>
                                    <div className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-3 inline-block">
                                        <p className="text-blue-300 text-xs mb-1 uppercase tracking-wider font-semibold">Request ID</p>
                                        <p className="text-white font-mono text-lg">{requestId}</p>
                                    </div>
                                </div>
                                <p className="text-blue-200 text-sm mb-8">
                                    We'll be in touch with you shortly.
                                </p>


                                <motion.button
                                    onClick={() => setShowSuccessModal(false)}
                                    className="w-full bg-green-500 hover:bg-green-400 text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Great, thanks!
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>


            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Maintenance />
    </React.StrictMode>,
)