import type { DeckTreeNode } from '../types/decks'

function mapDeckTree(
  nodes: DeckTreeNode[],
  updater: (node: DeckTreeNode) => DeckTreeNode
): DeckTreeNode[] {
  return nodes.map((node) => ({
    ...updater(node),
    children: node.children ? mapDeckTree(node.children, updater) : undefined,
  }))
}

export function activateDeck(nodes: DeckTreeNode[], activeId: string): DeckTreeNode[] {
  return mapDeckTree(nodes, (node) => ({
    ...node,
    isActive: node.id === activeId,
  }))
}

export function toggleDeck(nodes: DeckTreeNode[], deckId: string): DeckTreeNode[] {
  return mapDeckTree(nodes, (node) =>
    node.id === deckId && node.kind === 'deck'
      ? {
          ...node,
          isExpanded: !node.isExpanded,
        }
      : node
  )
}

export function findNodeById(nodes: DeckTreeNode[], id: string): DeckTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    if (node.children?.length) {
      const childNode = findNodeById(node.children, id)

      if (childNode) {
        return childNode
      }
    }
  }

  return null
}

export function findActiveDeck(nodes: DeckTreeNode[]): DeckTreeNode | null {
  for (const node of nodes) {
    if (node.isActive) {
      return node
    }

    if (node.children?.length) {
      const activeChild = findActiveDeck(node.children)

      if (activeChild) {
        return activeChild
      }
    }
  }

  return null
}
