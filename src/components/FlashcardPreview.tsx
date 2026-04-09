import { ArrowDown, MoreHorizontal } from 'lucide-react'

export type FlashcardPreviewProps = {
  prompt: string
  actionLabel: string
  actionShortcut?: string
  onOpenMenu?: () => void
  onAdvance?: () => void
}

export function FlashcardPreview({
  prompt,
  actionLabel,
  actionShortcut,
  onOpenMenu,
  onAdvance,
}: FlashcardPreviewProps) {
  return (
    <section className="flex h-[340px] w-[520px] flex-col justify-between overflow-hidden rounded-[10px] border border-[#3E3E3E] bg-[#323232] shadow-2xl">
      <div className="flex justify-end p-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="cursor-pointer p-1 text-[#606060] transition-colors hover:text-[#A0A0A0]"
          aria-label="Open card actions"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-12 pb-6">
        <p className="text-[15px] font-medium tracking-wide text-[#E8E8E8]">
          {prompt}
        </p>
      </div>

      <button
        type="button"
        onClick={onAdvance}
        className="mt-auto flex h-[44px] cursor-pointer items-center justify-center gap-2 bg-[#383838] transition-colors hover:bg-[#3D3D3D]"
      >
        <ArrowDown className="h-[14px] w-[14px] text-[#A0A0A0]" />
        <span className="text-[13px] font-semibold text-[#D0D0D0]">
          {actionLabel}
        </span>
        {actionShortcut ? (
          <span className="ml-[6px] flex items-center justify-center rounded border border-[#404040] bg-[#2C2C2C] px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-wider text-[#808080] shadow-sm">
            {actionShortcut}
          </span>
        ) : null}
      </button>
    </section>
  )
}
