import { motion } from 'framer-motion';
import { Wrench, Clock, RefreshCw, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import React from 'react';
import './src/index.css';

import { supabase } from './src/supabase';

// ... imports

export default function Maintenance() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        sender_email: email,
                        message: message,
                        recipient: 'support@privetserver.com',
                        created_at: new Date().toISOString(),
                    }
                ]);

            if (!error) {
                setSubmitStatus('success');
                setEmail('');
                setMessage('');
            } else {
                console.error('Supabase Error:', error);
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setSubmitStatus('idle'), 3000);
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
                        <p className="text-blue-200">
                            We'll be back online shortly
                        </p>
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
                        <p className="text-blue-200">
                            Upgrading systems & adding features
                        </p>
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
                    className="mt-12 bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-8 max-w-md mx-auto"
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
                            Contact Us
                        </h3>
                    </div>

                    <p className="text-blue-200 text-sm mb-6 text-center">
                        Need urgent assistance? Send us a message and we'll get back to you soon.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="Your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                            />
                        </div>

                        <div>
                            <textarea
                                placeholder="Your message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-blue-500/30 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                            />
                        </div>

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
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </>
                            )}
                        </motion.button>

                        {submitStatus === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-green-400 text-sm text-center"
                            >
                                ✓ Message sent successfully!
                            </motion.div>
                        )}

                        {submitStatus === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-sm text-center"
                            >
                                ✗ Failed to send. Please try again.
                            </motion.div>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Maintenance />
    </React.StrictMode>,
)