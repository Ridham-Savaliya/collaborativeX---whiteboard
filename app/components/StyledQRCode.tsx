'use client'
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import QRCodeStyling from 'qr-code-styling'

interface StyledQRCodeProps {
  invitelink: string | null;
}

export interface StyledQRCodeHandle {
  download: () => void;
}

const StyledQRCode = forwardRef<StyledQRCodeHandle, StyledQRCodeProps>(
  ({ invitelink }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const qrCodeRef = useRef<QRCodeStyling | null>(null);

    useImperativeHandle(ref, () => ({
      download: () => {
        if (qrCodeRef.current) {
          qrCodeRef.current.download({
            name: 'whiteboard-qr',
            extension: 'png',
          });
        }
      },
    }));

    useEffect(() => {
      if (!invitelink) return;

      if (!qrCodeRef.current) {
        qrCodeRef.current = new QRCodeStyling({
          width: 200,
          height: 200,
          data: invitelink,
          image: '/logo.png',
          dotsOptions: {
            color: "#6b21a8",
            type: "rounded"
          },
          cornersSquareOptions: {
            color: "#4c1d95",
            type: "extra-rounded"
          },
          cornersDotOptions: {
            color: "#4c1d95",
            type: "dot"
          },
          backgroundOptions: {
            color: "#ffffff"
          },
          imageOptions: {
            crossOrigin: "anonymous",
            margin: 0,
            imageSize: 0.2,
          },
        });
      } else {
        qrCodeRef.current.update({ data: invitelink });
      }

      if (containerRef.current && qrCodeRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeRef.current.append(containerRef.current);
      }
    }, [invitelink]);

    if (!invitelink) {
      return (
        <div className="w-[200px] h-[200px] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <div ref={containerRef} className="rounded-lg overflow-hidden" />
      </div>
    );
  }
);

export default StyledQRCode;
