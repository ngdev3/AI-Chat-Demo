import { MainLayout } from '@/components/layout/main-layout';
import { SettingsForm } from '@/components/settings/settings-form';
import { checkSubscription } from '@/lib/subscription';

export default async function SettingsPage() {
  const isPro = await checkSubscription();

  return (
    <MainLayout defaultLayout={undefined} navCollapsedSize={4}>
      <div className="flex-grow p-4 md:p-8">
        <SettingsForm isPro={isPro} />
      </div>
    </MainLayout>
  );
}
