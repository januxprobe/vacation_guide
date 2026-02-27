import { MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Pagina niet gevonden
      </h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        De pagina die je zoekt bestaat niet of is verplaatst.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
      >
        Terug naar reizen
      </a>
    </div>
  );
}
