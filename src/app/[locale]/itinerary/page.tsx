import { redirect } from 'next/navigation';
import { getDefaultTrip } from '@/config/trips';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ItineraryRedirect({ params }: Props) {
  const { locale } = await params;
  const trip = getDefaultTrip();
  redirect(`/${locale}/${trip.slug}/itinerary`);
}
