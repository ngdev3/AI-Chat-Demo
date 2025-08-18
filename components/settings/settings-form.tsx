'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import axios from 'axios';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SettingsFormProps {
  isPro: boolean;
}

export function SettingsForm({ isPro }: SettingsFormProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscription = async () => {
    setIsLoading(true);
    try {
      // The checkout-session route will handle both new subscriptions and managing existing ones
      const response = await axios.get('/api/stripe/checkout-session');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating stripe session', error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account and subscription.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image ?? ''} />
            <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium">Subscription</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You are currently on the <span className="font-semibold">{isPro ? 'Pro Plan' : 'Free Plan'}</span>.
          </p>
          <Button onClick={handleSubscription} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
