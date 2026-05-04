function TwitterGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function FacebookGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  );
}

function InstagramGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative mt-12 overflow-hidden rounded-t-[28px] py-[34px] pb-10 text-white shadow-[0_-10px_40px_rgba(0,0,0,.10)]"
      style={{
        background:
          "linear-gradient(90deg,#343d4f 0%, #041235 48%, #232b3b 100%)",
      }}
    >
      <div className="container flex flex-wrap justify-between gap-6">
        <div className="max-w-[500px]">
          <h3 className="mb-2 text-[30px]">SmartEstate</h3>
          <p className="text-sm leading-7 text-white/75">
            SmartEstate is an AI-assisted platform for property pricing, land
            evaluation, and loan guidance, designed to help users make clearer
            real estate decisions in the Jordanian market.
          </p>
        </div>
        <div className="text-sm leading-7 text-white/75">
          info@smartestate.ai
          <br />
          Amman, Jordan
        </div>
      </div>
      <div className="absolute right-3 bottom-3 flex flex-col gap-2">
        <a
          href="#"
          aria-label="Twitter"
          className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#111] shadow-md transition hover:-translate-y-1"
        >
          <TwitterGlyph size={14} />
        </a>
        <a
          href="#"
          aria-label="Facebook"
          className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#111] shadow-md transition hover:-translate-y-1"
        >
          <FacebookGlyph size={14} />
        </a>
        <a
          href="#"
          aria-label="Instagram"
          className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#111] shadow-md transition hover:-translate-y-1"
        >
          <InstagramGlyph size={14} />
        </a>
      </div>
    </footer>
  );
}
