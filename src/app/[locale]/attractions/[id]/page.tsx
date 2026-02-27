import { redirect } from 'next/navigation';
import { getDefaultTrip } from '@/config/trips';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AttractionDetailRedirect({ params }: Props) {
  const { locale, id } = await params;
  const trip = getDefaultTrip();
  redirect(`/${locale}/${trip.slug}/attractions/${id}`);
}
