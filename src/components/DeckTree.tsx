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
  onCreateDeck?: () => void
  onSelectNode?: (nodeId: string) => void
  onToggleNode?: (nodeId: string) => void
}

type DeckTreeItemProps = {
  node: DeckTreeNode
  depth?: number
  onSelectNode?: (nodeId: string) => void
  onToggleNode?: (nodeId: string) => void
}

function DeckTreeItem({
  node,
  depth = 0,
  onSelectNode,
  onToggleNode,
}: DeckTreeItemProps) {
  const hasChildren = Boolean(node.children?.length)
  const Icon = node.kind === 'notes' ? FileText : Book

  const handleClick = () => {
    if (hasChildren) {
      onToggleNode?.(node.id)
      return
    }

    onSelectNode?.(node.id)
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`group flex w-full items-center justify-between rounded-md px-1 py-1.5 text-left text-[13px] font-medium transition-colors ${
          node.isActive
            ? 'bg-[#323232] text-[#E0E0E0]'
            : 'cursor-pointer text-[#B0B0B0] hover:bg-[#323232]'
        }`}
        style={depth === 0 ? undefined : { marginLeft: depth * 22 }}
      >
        <span className="flex items-center gap-1.5">
          {hasChildren ? (
            node.isExpanded ? (
              <ChevronDown className="h-[14px] w-[14px] text-[#A0A0A0]" />
            ) : (
              <ChevronRight className="h-[14px] w-[14px] text-[#606060]" />
            )
          ) : (
            <ChevronRight className="h-[14px] w-[14px] text-[#606060] opacity-0 group-hover:opacity-100" />
          )}
          <Icon className="h-[16px] w-[16px] text-[#A0A0A0]" />
          <span>{node.name}</span>
        </span>

        {typeof node.count === 'number' ? (
          <span className="rounded-full bg-[#444444] px-1.5 py-[1px] text-[10px] font-bold text-[#A0A0A0]">
            {node.count}
          </span>
        ) : null}
      </button>

      {hasChildren && node.isExpanded ? (
        <div
          className="my-0.5 flex flex-col gap-0.5 border-l border-[#3a3a3a] pl-2"
          style={{ marginLeft: depth * 22 + 22 }}
        >
          {node.children?.map((child) => (
            <DeckTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectNode={onSelectNode}
              onToggleNode={onToggleNode}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function DeckTree({
  nodes,
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
          onSelectNode={onSelectNode}
          onToggleNode={onToggleNode}
        />
      ))}

      <button
        type="button"
        onClick={onCreateDeck}
        className="mt-1 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-[#7A7A7A] transition-colors hover:bg-[#323232]"
      >
        <Plus className="h-[16px] w-[16px]" />
        <span>New Deck</span>
      </button>
    </div>
  )
}
