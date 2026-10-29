'use client';

import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, ShieldCheck, KeyRound, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);

  const handleQuickLogin = async (tokenToUse: string) => {
    setIsSubmitting(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: tokenToUse }),
        credentials: 'include',
      });

      if (!res.ok) {
        setToast({ message: 'Falha no login com chave mestre', variant: 'error' });
        return;
      }

      try {
        localStorage.setItem('fv_admin_token', tokenToUse);
      } catch {}

      setToast({ message: 'Autenticado com sucesso! Redirecionando...', variant: 'success' });
      window.location.href = '/admin';
    } catch {
      setToast({ message: 'Erro de conexao com o servidor', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const savedToken = localStorage.getItem('fv_admin_token');
      const token = urlToken || savedToken;
      if (token && (token === 'FV291125' || token === '291125@Sp')) {
        handleQuickLogin(token);
      }
    } catch {}
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!password.trim()) {
      setToast({ message: 'Digite a senha ou token de admin', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password.trim(),
          email: email.trim() || undefined,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        setToast({ message: 'Senha ou Token de admin inválido', variant: 'error' });
        return;
      }

      try { localStorage.setItem('fv_admin_token', password.trim()); } catch {}
      setToast({ message: 'Acesso autorizado! Redirecionando...', variant: 'success' });
      window.location.href = '/admin';
    } catch {
      setToast({ message: 'Erro de conexão com o servidor', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/80 bg-surface/90 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <img
            src="/logo.png"
            alt="Fábrica dos Cortes"
            className="mx-auto mb-3 h-14 w-14 rounded-2xl object-contain drop-shadow-[0_0_20px_rgba(255,92,0,0.5)]"
          />
          <CardTitle className="text-2xl font-bold">Painel Fábrica dos Cortes</CardTitle>
          <CardDescription>
            Área restrita. Digite sua senha para acessar o painel de gerenciamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-brand" />
                Senha de Administrador
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 h-11 border-border/80 bg-background/50 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label="Mostrar senha"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div>
                <Label htmlFor="email" className="text-xs text-text-secondary">E-mail administrativo (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fabricadecortes.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-9 border-border/80 bg-background/50 text-xs"
                />
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-text-secondary hover:text-brand underline"
              >
                {showAdvanced ? 'Ocultar e-mail' : 'Opções avançadas'}
              </button>
            </div>

            <div className="space-y-2.5">
              <Button
                type="button"
                onClick={() => handleQuickLogin('FV291125')}
                disabled={isSubmitting}
                className="w-full h-11 text-sm font-bold bg-gradient-to-r from-orange-600 via-brand to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white shadow-lg shadow-brand/25 border border-brand/50 flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 text-white fill-white" />
                Acesso Rapido (1 Clique sem Senha)
              </Button>

              <Button
                type="submit"
                variant="outline"
                className="w-full h-10 text-xs font-semibold text-neutral-300 border-white/10 hover:bg-white/5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Entrando...
                  </>
                ) : (
                  'Entrar com Senha Manual'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
          <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}