import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Since we have a `[locale]` segment, this root layout is always
// rendered as a server component and will never be client-side rendered.
export default function RootLayout({ children }: Props) {
  return children;
}
