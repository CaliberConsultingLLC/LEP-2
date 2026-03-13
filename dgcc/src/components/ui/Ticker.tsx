export function Ticker({ text }: { text: string }) {
  return (
    <div className="ticker">
      <div className="ticker-inner">{text}</div>
    </div>
  )
}
