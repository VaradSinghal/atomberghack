export default function WeightageBar({ current, max = 100 }) {
  const pct = Math.min((current / max) * 100, 100);
  const isExact = Math.abs(current - max) < 0.01;
  const isOver = current > max;

  let color = "bg-brand-500";
  if (isExact) color = "bg-green-500";
  else if (isOver) color = "bg-red-500";
  else if (pct > 80) color = "bg-amber-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-gray-500">Total Weightage</span>
        <span className={`text-sm font-bold ${isExact ? "text-green-600" : isOver ? "text-red-600" : "text-gray-700"}`}>
          {current}% / {max}%
        </span>
      </div>
      <div className="weightage-bar">
        <div className={`weightage-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {!isExact && current > 0 && (
        <p className={`text-xs mt-1 font-medium ${isOver ? "text-red-500" : "text-amber-600"}`}>
          {isOver
            ? `${current - max}% over — remove ${current - max}% before submitting`
            : `${max - current}% remaining — you need ${max - current}% more before submitting`
          }
        </p>
      )}
    </div>
  );
}
