import Link from 'next/link';
import { Button } from '@/components';

/**
 * Custom 404 page — brand-consistent "not found" with navigation back.
 * This is a Server Component.
 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
      <h1 className="text-[clamp(72px,10vw,120px)] font-display font-light text-accent leading-none mb-4 -tracking-[0.03em] drop-shadow-xl">
        404
      </h1>

      <h2 className="font-display text-[clamp(24px,4vw,36px)] font-light text-foreground mb-3">
        Page not found
      </h2>

      <p className="text-muted-foreground max-w-[420px] leading-relaxed mb-8">
        The page you're looking for doesn't exist or may have been moved. 
        Let's get you back on track.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/">
          <Button size="lg" className="px-8 shadow-lg shadow-primary/20">
            Back to Home
          </Button>
        </Link>
        <Link href="/menu">
          <Button variant="outline" size="lg" className="px-8 bg-surface">
            Browse Menu
          </Button>
        </Link>
      </div>
    </div>
  );
}
