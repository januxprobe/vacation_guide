import { redirect } from 'next/navigation';
import { getTripRepository } from '@/lib/repositories';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MapRedirect({ params }: Props) {
  const { locale } = await params;
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getDefault();
  redirect(`/${locale}/${trip.slug}/planner`);
}
