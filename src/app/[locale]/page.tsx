import { redirect } from 'next/navigation';
import { getDefaultTrip } from '@/config/trips';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * Root locale page redirects to the default trip.
 * When multiple trips exist, this will become a trip selector page.
 */
export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  const trip = getDefaultTrip();
  redirect(`/${locale}/${trip.slug}`);
}
