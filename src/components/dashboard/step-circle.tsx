// Numbered step circle used in card headers (1 = Media, 2 = Accounts, 3 = Captions).
// Matches original: 24x24 zinc-950 pill, white text, 14/500 medium.

export function StepCircle({ n }: { n: number }) {
  return (
    <div className="w-6 h-6 bg-zinc-950 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
      {n}
    </div>
  );
}