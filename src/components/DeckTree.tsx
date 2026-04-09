import { Book, ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react'

export type DeckTreeNode = {
  id: string
  name: string
  kind: 'deck' | 'notes'
  count?: number
  isActive?: boolean
  isExpanded?: boolean
  children?: DeckTreeNode[]
}

export type DeckTreeProps = {
  nodes: DeckTreeNode[]
  selectedNodeId?: string | null
  onCreateDeck?: () => void
  onSelectNode?: (nodeId: string) => void
  onToggleNode?: (nodeId: string) => void
}

type DeckTreeItemProps = {
  node: DeckTreeNode
  selectedNodeId?: string | null
  depth?: number
  onSelectNode?: (nodeId: string) => void
  onToggleNode?: (nodeId: string) => void
}

function DeckTreeItem({
  node,
  selectedNodeId,
  depth = 0,
  onSelectNode,
  onToggleNode,
}: DeckTreeItemProps) {
  const hasChildren = Boolean(node.children?.length)
  const isExpandable = node.kind === 'deck'
  const Icon = node.kind === 'notes' ? FileText : Book
  const isSelected = node.id === selectedNodeId

  const handleSelect = () => {
    onSelectNode?.(node.id)
  }

  return (
    <div>
      <div
        className={`group flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-left text-[13px] font-medium transition-colors ${
          isSelected
            ? 'bg-[#323232] text-[#E0E0E0]'
            : 'cursor-pointer text-[#B0B0B0] hover:bg-[#323232]'
        }`}
      >
        <div
          className="flex min-w-0 flex-1 items-center gap-1.5"
          style={depth === 0 ? undefined : { paddingLeft: depth * 12 }}
        >
          <button
            type="button"
            onClick={() => onToggleNode?.(node.id)}
            disabled={!isExpandable}
            className={`flex h-[12px] w-[12px] flex-shrink-0 items-center justify-center ${
              isExpandable ? 'cursor-pointer' : 'cursor-default'
            }`}
            aria-label={isExpandable ? (node.isExpanded ? 'Collapse deck' : 'Expand deck') : undefined}
          >
            {isExpandable ? (
              node.isExpanded ? (
                <ChevronDown className="h-[12px] w-[12px] text-[#8C8C8C]" />
              ) : (
                <ChevronRight className="h-[12px] w-[12px] text-[#6A6A6A]" />
              )
            ) : (
              <ChevronRight className="h-[12px] w-[12px] text-[#606060] opacity-0" />
            )}
          </button>
          <Icon className="h-[13px] w-[13px] text-[#A0A0A0]" />
          <button
            type="button"
            onClick={handleSelect}
            className="min-w-0 cursor-pointer truncate text-left"
          >
            {node.name}
          </button>
        </div>

        {typeof node.count === 'number' ? (
          <span className="ml-auto rounded-full bg-[#444444] px-1.5 py-[1px] text-[10px] font-bold text-[#A0A0A0]">
            {node.count}
          </span>
        ) : null}
      </div>

      {isExpandable && node.isExpanded ? (
        <div className="my-0.5 flex flex-col gap-0.5">
          {node.children?.map((child) => (
            <DeckTreeItem
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              depth={depth + 1}
              onSelectNode={onSelectNode}
              onToggleNode={onToggleNode}
            />
          ))}

          {!hasChildren ? (
            <p className="px-1 py-1 pl-[25px] text-[12px] text-[#6F6F6F]">No decks inside</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function DeckTree({
  nodes,
  selectedNodeId,
  onCreateDeck,
  onSelectNode,
  onToggleNode,
}: DeckTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <DeckTreeItem
          key={node.id}
          node={node}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onToggleNode={onToggleNode}
        />
      ))}

      <button
        type="button"
        onClick={onCreateDeck}
        className="mt-1 flex w-full items-center rounded-md px-1 py-1.5 text-[13px] font-medium text-[#7A7A7A] transition-colors hover:bg-[#323232]"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-[12px] w-[12px] flex-shrink-0" aria-hidden="true" />
          <Plus className="h-[13px] w-[13px]" />
          <span>New Deck</span>
        </span>
      </button>
    </div>
  )
}
