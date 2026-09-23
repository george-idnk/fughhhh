"use client";

import { useRef } from "react";

export interface FilterSelect {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  anyLabel?: string;
}

/** GET form of filters; changing any select re-submits immediately. */
export default function FilterForm({
  action,
  selects,
  hidden,
  applyLabel,
  resetLabel,
  resetHref,
}: {
  action: string;
  selects: FilterSelect[];
  hidden: Record<string, string>;
  applyLabel: string;
  resetLabel: string;
  resetHref: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={action} method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {selects.map((s) => (
        <label key={s.name} className="block min-w-0">
          <span className="label">{s.label}</span>
          <select
            name={s.name}
            defaultValue={s.value}
            onChange={() => ref.current?.requestSubmit()}
            className="input appearance-auto pe-8"
          >
            {s.anyLabel !== undefined && <option value="">{s.anyLabel}</option>}
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-4">
        <button type="submit" className="btn-primary">
          {applyLabel}
        </button>
        <a href={resetHref} className="btn-ghost">
          {resetLabel}
        </a>
      </div>
    </form>
  );
}
