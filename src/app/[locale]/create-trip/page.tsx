import { getTranslations } from 'next-intl/server';
import GenericHeader from '@/components/layout/GenericHeader';
import TripChat from '@/components/trip-creator/TripChat';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tripCreator' });
  return { title: t('title') };
}

export default async function CreateTripPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tripCreator' });

  return (
    <>
      <GenericHeader />
      <div className="flex flex-col flex-1">
        <div className="border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
        </div>
        <div className="flex-1 min-h-0">
          <TripChat />
        </div>
      </div>
    </>
  );
}
