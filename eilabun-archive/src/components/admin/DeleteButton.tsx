"use client";

export default function DeleteButton({ label = "Delete", message }: { label?: string; message: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="btn min-h-[40px] border border-crimson/40 bg-surface text-crimson hover:bg-crimson hover:text-white"
    >
      🗑 {label}
    </button>
  );
}
