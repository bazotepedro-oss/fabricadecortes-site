'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import { FAQ } from '@/lib/faq-data';



export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative border-b border-border py-20 md:py-24">
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="text-center space-y-3 mb-10">
          <Badge variant="brand" className="mb-1">
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> Dúvidas Frequentes
          </Badge>
          <h2 className="font-display text-3xl font-extrabold text-text-primary md:text-4xl">
            Tire todas as suas <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">dúvidas</span>
          </h2>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
            Tudo o que você precisa saber sobre o modelo de créditos, entrega instantânea e funcionamento da IA.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border transition-all duration-200',
                  isOpen
                    ? 'border-brand/50 bg-surface shadow-lg ring-1 ring-brand/30'
                    : 'border-border/80 bg-surface/60 hover:border-brand/30'
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left font-semibold text-text-primary text-sm sm:text-base"
                >
                  <span>{item.q}</span>
                  <span
                    className={cn(
                      'ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-sm text-brand transition-transform duration-200',
                      isOpen && 'rotate-45 bg-brand text-white'
                    )}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-text-secondary border-t border-border/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}