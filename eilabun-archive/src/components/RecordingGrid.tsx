import type { CardData, CardLabels } from "@/lib/cards";
import RecordingCard from "./RecordingCard";

export default function RecordingGrid({
  items,
  labels,
  closeLabel,
}: {
  items: CardData[];
  labels: CardLabels;
  closeLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((rec) => (
        <RecordingCard key={rec.id} rec={rec} labels={labels} closeLabel={closeLabel} />
      ))}
    </div>
  );
}
