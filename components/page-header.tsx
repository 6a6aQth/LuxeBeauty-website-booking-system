'use client';

import React from 'react';
import { LampContainer } from '@/components/ui/lamp';

interface PageHeaderProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  backgroundImage?: string;
}

export function PageHeader({ title, description, breadcrumb, backgroundImage }: PageHeaderProps) {
  return (
    <LampContainer className="min-h-[24rem] pt-28 pb-16 md:pt-36 md:pb-20 -mt-4 -mb-8">
       {breadcrumb && (
        <div className="text-center text-slate-300 text-sm mb-4">
          {breadcrumb}
        </div>
      )}
      <h1 className="text-white text-center text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
        {title}
      </h1>
      <p className="mt-4 px-4 text-center text-sm text-slate-300 max-w-2xl sm:text-base">
        {description}
      </p>
    </LampContainer>
  );
} 