"use client"

import { CheckCircle, Loader, Ticket } from 'lucide-react';

type Status = 'processing' | 'received' | 'generating' | 'complete' | 'idle';

interface StatusItemProps {
  status: Status;
  currentStatus: Status;
  title: string;
}

const StatusItem = ({ status, currentStatus, title }: StatusItemProps) => {
  const isActive = currentStatus === status || 
                   (currentStatus === 'received' && status === 'processing') ||
                   (currentStatus === 'generating' && (status === 'processing' || status === 'received')) ||
                   (currentStatus === 'complete' && ['processing', 'received', 'generating'].includes(status));

  const isComplete = (currentStatus === 'received' && status === 'processing') ||
                     (currentStatus === 'generating' && (status === 'processing' || status === 'received')) ||
                     (currentStatus === 'complete' && ['processing', 'received', 'generating'].includes(status));

  return (
    <div className="flex items-center gap-4">
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full
        ${isActive ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'}
        transition-colors duration-300
      `}>
        {isComplete ? <CheckCircle size={24} /> : (status === 'generating' || status === 'complete' ? <Ticket size={24} /> : <Loader size={24} className={isActive ? "animate-spin" : ""} />)}
      </div>
      <div>
        <h4 className={`
          font-semibold text-lg 
          ${isActive ? 'text-gray-800' : 'text-gray-400'}
          transition-colors duration-300
        `}>
          {title}
        </h4>
      </div>
    </div>
  );
};

export default function BookingStatus({ status }: { status: Status }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6">
        <StatusItem status="processing" currentStatus={status} title="Processing Payment" />
        <StatusItem status="received" currentStatus={status} title="Payment Received" />
        <StatusItem status="generating" currentStatus={status} title="Generating Ticket" />
      </div>
    </div>
  );
} 