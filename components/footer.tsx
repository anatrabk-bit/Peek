import Link from "next/link";

type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={`border-t border-peek-border bg-peek-surface ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="text-xl font-bold text-peek-primary">
            Peek
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-peek-muted">
            When you can&apos;t be there, someone nearby can help — anonymously
            and for free.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
          <div className="space-y-3">
            <p className="font-semibold text-peek-text">Need help</p>
            <ul className="space-y-2 text-peek-muted">
              <li>
                <Link href="/post-request" className="hover:text-peek-primary">
                  Post a request
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-peek-primary">
                  Open tasks nearby
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-peek-text">Account</p>
            <ul className="space-y-2 text-peek-muted">
              <li>
                <Link href="/login" className="hover:text-peek-primary">
                  Join Peek
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-peek-primary">
                  Profile &amp; stars
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-peek-border py-4 text-center text-xs text-peek-muted">
        © {new Date().getFullYear()} Peek
      </div>
    </footer>
  );
}
