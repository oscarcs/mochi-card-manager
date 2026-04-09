import type { DeckTreeNode } from '../../types/decks'

export function DeckView({ deck }: { deck: DeckTreeNode | null }) {
  return (
    <section className="mx-auto flex h-full w-full max-w-[1100px] flex-col rounded-[16px] border border-[#363636] bg-[#242424] p-6 shadow-2xl">
      <div className="border-b border-[#303030] pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#767676]">
          Deck Preview
        </p>
        <h1 className="mt-2 text-[24px] font-semibold text-[#F2F2F2]">
          {deck?.name ?? 'No deck selected'}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#6F6F6F]">Deck preview UI not implemented yet.</p>
      </div>
    </section>
  )
}
