'use client';

import React from 'react';
import { LampContainer } from '@/components/ui/lamp';

interface PageHeaderProps {
  title: React.ReactNode;
  description: React.ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <LampContainer className="min-h-[24rem] pt-36 pb-16 -mt-4 -mb-8">
      <h1 className="text-white text-center text-5xl font-medium tracking-tight md:text-6xl">
        {title}
      </h1>
      <p className="mt-4 text-center text-slate-300 max-w-2xl">{description}</p>
    </LampContainer>
  );
} 