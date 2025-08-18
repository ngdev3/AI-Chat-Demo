import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/app-shell';

export default function HomePage() {
  const layout = cookies().get('react-resizable-panels:layout');
  const collapsed = cookies().get('react-resizable-panels:collapsed');

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined;

  return (
    <AppShell
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
    />
  );
}
