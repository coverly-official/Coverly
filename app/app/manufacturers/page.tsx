import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Manufacturers | Coverly',
};

export default function ManufacturersPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-ink font-semibold text-4xl">Manufacturers</h1>
            <p className="text-ink opacity-70">This page is coming soon.</p>
            <Link href="/" className="rounded-full bg-navy text-white px-6 py-3 text-sm font-semibold">Back to home</Link>
        </main>
    );
}
