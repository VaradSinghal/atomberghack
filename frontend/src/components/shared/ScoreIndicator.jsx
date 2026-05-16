export default function ScoreIndicator({ score }) {
  if (score === null || score === undefined) {
    return <div className="score-ring bg-gray-100 text-gray-400">—</div>;
  }

  let bg, text;
  if (score >= 90) { bg = "bg-green-100"; text = "text-green-700"; }
  else if (score >= 70) { bg = "bg-lime-100"; text = "text-lime-700"; }
  else if (score >= 50) { bg = "bg-amber-100"; text = "text-amber-700"; }
  else { bg = "bg-red-100"; text = "text-red-700"; }

  return (
    <div className={`score-ring ${bg} ${text}`} title={`Score: ${score}%`}>
      {Math.round(score)}%
    </div>
  );
}
