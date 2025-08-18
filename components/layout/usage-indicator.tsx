'use client';

import useSWR from 'swr';
import axios from 'axios';
import { Progress } from '@/components/ui/progress';
import { Button } from '../ui/button';
import Link from 'next/link';

const FREE_TIER_MESSAGE_LIMIT = 20;

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function UsageIndicator() {
  const { data, error } = useSWR('/api/user/usage', fetcher, {
    revalidateOnFocus: false,
  });

  if (error) return <div>Failed to load usage data.</div>;
  if (!data) return <div>Loading...</div>;
  if (data.isPro) {
    return (
        <div className="text-center p-4">
            <p className="text-sm font-medium">You are on the Pro plan.</p>
            <p className="text-xs text-muted-foreground">Unlimited messages.</p>
        </div>
    )
  }


  const percentage = (data.messageCount / FREE_TIER_MESSAGE_LIMIT) * 100;

  return (
    <div className="p-4 space-y-2">
      <p className="text-center text-sm font-medium">
        Free Messages Used: {data.messageCount} / {FREE_TIER_MESSAGE_LIMIT}
      </p>
      <Progress value={percentage} className="h-2" />
      <Link href="/settings" passHref>
        <Button variant="link" className="w-full">Upgrade to Pro</Button>
      </Link>
    </div>
  );
}
