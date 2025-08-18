'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const LANGUAGES = ['JavaScript', 'Python', 'TypeScript', 'Java', 'C#', 'Go', 'Rust'];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
}

export function LanguageSelector({ selectedLanguage, onSelectLanguage }: LanguageSelectorProps) {
  return (
    <Select value={selectedLanguage} onValueChange={onSelectLanguage}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {lang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
