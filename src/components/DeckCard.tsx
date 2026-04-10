import type { ReactNode } from 'react'
import type { MochiCard } from '../types/decks'
import { getDisplaySides, parseCardContent } from '../lib/mochiCards'

type CardSideProps = {
  value: string
  className: string
  emptyLabel: string
}

function CardSide({ value, className, emptyLabel }: CardSideProps) {
  const { text, imageUrls } = parseCardContent(value)
  const hasContent = text || imageUrls.length > 0

  return (
    <div className={className}>
      {hasContent ? (
        <div className="flex flex-col items-center gap-3">
          {imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="max-h-56 w-auto max-w-full rounded-[8px] object-contain"
            />
          ))}
          {text ? <div className="w-full whitespace-pre-wrap">{text}</div> : null}
        </div>
      ) : (
        <span className="italic text-[#888]">{emptyLabel}</span>
      )}
    </div>
  )
}

export function DeckCard({
  card,
  footer,
  className = '',
  onClick,
}: {
  card: MochiCard
  footer?: ReactNode
  className?: string
  onClick?: () => void
}) {
  const { front, back } = getDisplaySides(card)

  return (
    <div
      className={`mb-4 flex flex-col overflow-hidden break-inside-avoid rounded-[12px] border border-[#3E3E3E] bg-[#323232] shadow-sm ${className}`}
      onClick={onClick}
    >
      <CardSide
        value={front}
        className="flex-1 p-5 text-center text-[14px] font-medium leading-relaxed text-[#E8E8E8]"
        emptyLabel="Empty card"
      />

      {back.trim() && (
        <CardSide
          value={back}
          className="border-t border-dashed border-[#4A4A4A] bg-[#2A2A2A] p-4 text-center text-[14px] leading-relaxed text-[#A0A0A0]"
          emptyLabel="Empty back"
        />
      )}

      {footer ? <div className="border-t border-[#434343] bg-[#2A2A2A] p-3">{footer}</div> : null}
    </div>
  )
}
