export default function PolicyList({ items }) {
  return (
    <ul className="space-y-3 w-full">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-base sm:text-lg text-muted-foreground leading-relaxed text-justify">
          <span className="mt-[0.6rem] h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
