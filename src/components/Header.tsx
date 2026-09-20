import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Logo from './Logo';
import WaitlistModal from './WaitlistModal';

const Header = () => {
  const router = useRouter();
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch("/api/config");
        const data = await resp.json().catch(() => null);
        if (!cancelled && data?.ok) {
          setWaitlistEnabled(!!data.waitlistEnabled);
        }
      } catch {
        // leave waitlist hidden if config can't be loaded
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        <div className="cursor-pointer" onClick={() => router.push("/")}>
          <Logo />
        </div>
        {waitlistEnabled && <WaitlistModal />}
      </div>
    </div>
  );
};

export default Header;