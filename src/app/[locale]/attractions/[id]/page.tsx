import { redirect } from 'next/navigation';
import { getTripRepository } from '@/lib/repositories';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AttractionDetailRedirect({ params }: Props) {
  const { locale, id } = await params;
  const tripRepo = getTripRepository();
  const trip = await tripRepo.getDefault();
  redirect(`/${locale}/${trip.slug}/attractions/${id}`);
}
