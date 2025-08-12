    "use client";
    import React, { useState, useEffect, useRef } from 'react';
    import {
    Share2,
    Copy,
    Download,
    MessageCircle,
    Send,
    Mail,
    Smartphone,
    Check,
    ExternalLink,
    QrCode,
    Users,
    Sparkles,
    ArrowRight
    } from 'lucide-react';
    import StyledQRCode,{StyledQRCodeHandle} from './StyledQRCode';

    interface ShareInterfaceProps {
    inviteLink: string | null;
    whiteboardName: string;
    onContinue: () => void;
    }

    const ShareInterface: React.FC<ShareInterfaceProps> = ({ 
    inviteLink, 
    whiteboardName, 
    onContinue 
    }) => {
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
const qrRef = useRef<StyledQRCodeHandle>(null);

    const handleCopyLink = async () => {
        if (!inviteLink) return;
        
        try {
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadQR = () => {
  qrRef.current?.download();
  setDownloaded(true);
  setTimeout(() => setDownloaded(false), 2000);
};


    const shareOptions = [
        {
        name: 'WhatsApp',
        icon: MessageCircle,
        color: 'from-green-500 to-green-600',
        hoverColor: 'hover:from-green-600 hover:to-green-700',
        url: `https://wa.me/?text=${encodeURIComponent(`Join my collaborative whiteboard "${whiteboardName}": ${inviteLink || ''}`)}`
        },
        {
        name: 'Telegram',
        icon: Send,
        color: 'from-blue-500 to-blue-600',
        hoverColor: 'hover:from-blue-600 hover:to-blue-700',
        url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink || '')}&text=${encodeURIComponent(`Join my collaborative whiteboard "${whiteboardName}"!`)}`
        },
        {
        name: 'Email',
        icon: Mail,
        color: 'from-red-500 to-red-600',
        hoverColor: 'hover:from-red-600 hover:to-red-700',
        url: `mailto:?subject=${encodeURIComponent(`Join My Whiteboard: ${whiteboardName}`)}&body=${encodeURIComponent(`I'd like to invite you to collaborate on my whiteboard "${whiteboardName}": ${inviteLink || ''}`)}`
        },
        {
        name: 'SMS',
        icon: Smartphone,
        color: 'from-purple-500 to-purple-600',
        hoverColor: 'hover:from-purple-600 hover:to-purple-700',
        url: `sms:?body=${encodeURIComponent(`Join my collaborative whiteboard "${whiteboardName}": ${inviteLink || ''}`)}`
        }
    ];

    const handleShare = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!inviteLink) {
        return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating your shareable link...</p>
        </div>
        );
    }

    return (
        <div className="space-y-8">
        {/* Success Toast Notifications */}
        {copied && (
            <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
            <Check size={20} />
            <span className="font-semibold">Link copied successfully!</span>
            </div>
        )}

        {downloaded && (
            <div className="fixed top-6 right-6 z-50 bg-blue-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-in">
            <Download size={20} />
            <span className="font-semibold">QR code downloaded!</span>
            </div>
        )}

        {/* Header */}
        <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 dark:from-purple-900/20 to-pink-100 dark:to-pink-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 size={28} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            Share with Friends
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
            Your whiteboard "{whiteboardName}" is ready! Share it with your team using the QR code or link below.
            </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* QR Code Section */}
            <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-center gap-3">
                <QrCode size={24} className="text-purple-600 dark:text-purple-400" />
                Scan to Join
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                Point your camera at the QR code to instantly join the whiteboard
                </p>

                {/* QR Code Display */}
                <div className="relative inline-block">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-purple-100 dark:border-purple-800 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300 hover:scale-105 transform">
                    <StyledQRCode ref={qrRef} invitelink={inviteLink} />
                </div>
                
                {/* Sparkle Effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles size={12} className="text-white" />
                </div>
                </div>

                {/* Download Button */}
                <button
                onClick={handleDownloadQR}
                className="mt-6 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mx-auto text-sm"
                >
                <Download size={16} />
                Download QR Code
                </button>
            </div>
            </div>

            {/* Link Sharing Section */}
            <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3">
                <ExternalLink size={24} className="text-purple-600 dark:text-purple-400" />
                Share Link
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                Copy the link or share directly to your favorite platforms
                </p>

                {/* Link Display and Copy */}
                <div className="relative mb-6">
                <div className="flex items-center bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 transition-colors duration-300">
                    <div className="flex-1 p-3">
                    <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="w-full bg-transparent text-gray-700 dark:text-gray-300 font-mono text-sm focus:outline-none selection:bg-purple-200 dark:selection:bg-purple-800"
                    />
                    </div>
                    <button
                    onClick={handleCopyLink}
                    className={`p-3 transition-all duration-300 ${
                        copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                    >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
                </div>

                {/* Quick Share Buttons */}
                <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-600 dark:text-purple-400" />
                    Quick Share
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                    {shareOptions.map((option, index) => {
                    const IconComponent = option.icon;
                    return (
                        <button
                        key={option.name}
                        onClick={() => handleShare(option.url)}
                        className={`flex items-center justify-center gap-2 bg-gradient-to-r ${option.color} ${option.hoverColor} text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform text-sm`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        >
                        <IconComponent size={16} />
                        <span>{option.name}</span>
                        </button>
                    );
                    })}
                </div>
                </div>

                {/* Instructions */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mt-6">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 text-sm">How to share:</h4>
                <ul className="text-purple-700 dark:text-purple-400 space-y-1 text-xs">
                    <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    Scan the QR code with any smartphone camera
                    </li>
                    <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    Copy and paste the link directly
                    </li>
                    <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    Use quick share buttons for instant messaging
                    </li>
                </ul>
                </div>
            </div>
            </div>
        </div>

        {/* Footer Action */}
        <div className="text-center pt-6">
            <button 
            onClick={onContinue}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
            >
            Continue to Whiteboard
            <ArrowRight size={18} />
            </button>
        </div>
        </div>
    );
    };

    export default ShareInterface;