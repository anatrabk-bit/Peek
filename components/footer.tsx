import Link from "next/link";

type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={`border-t-2 border-peek-peach/50 bg-gradient-to-b from-peek-cream to-peek-peach/30 ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="peek-logo text-xl">
            Peek ✨
          </Link>
          <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-peek-muted">
            When you can&apos;t be there, someone nearby can help — anonymously,
            kindly, and for free. Peeks earn stars for doing good.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
          <div className="space-y-3">
            <p className="font-extrabold text-peek-text">Need help</p>
            <ul className="space-y-2 font-medium text-peek-muted">
              <li>
                <Link href="/post-request" className="hover:text-peek-primary">
                  Post a request
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-peek-primary">
                  See what&apos;s open nearby
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-extrabold text-peek-text">Join in</p>
            <ul className="space-y-2 font-medium text-peek-muted">
              <li>
                <Link href="/login" className="hover:text-peek-primary">
                  Join Peek
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-peek-primary">
                  Your profile &amp; stars
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-peek-peach/40 py-4 text-center text-xs font-semibold text-peek-muted">
        © {new Date().getFullYear()} Peek — spread a little good 🌈
      </div>
    </footer>
  );
}
