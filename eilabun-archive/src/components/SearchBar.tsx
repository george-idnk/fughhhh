export default function SearchBar({
  defaultValue,
  placeholder,
  buttonLabel,
  size = "lg",
  hidden,
}: {
  defaultValue?: string;
  placeholder: string;
  buttonLabel: string;
  size?: "lg" | "md";
  hidden?: Record<string, string>;
}) {
  const big = size === "lg";
  return (
    <form action="/search" method="get" role="search" className="w-full">
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <div
        className={`flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 shadow-card focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/30 ${
          big ? "ps-4" : "ps-3"
        }`}
      >
        <span aria-hidden className="text-lg text-muted">
          🔍
        </span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="search"
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent text-ink placeholder:text-muted/70 focus:outline-none ${
            big ? "h-12 text-base sm:text-lg" : "h-10 text-base"
          }`}
        />
        <button type="submit" className={`btn-primary shrink-0 ${big ? "min-h-[48px] px-6" : ""}`}>
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
