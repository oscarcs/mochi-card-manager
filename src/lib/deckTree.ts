import type { DeckTreeNode, MochiDeck } from '../types/decks'

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

export function buildDeckTree(decks: MochiDeck[]): DeckTreeNode[] {
  const nodeMap = new Map<string, DeckTreeNode>()
  const childrenMap = new Map<string, DeckTreeNode[]>()

  for (const deck of decks) {
    if (deck['archived?'] || deck['trashed?']) continue

    const node: DeckTreeNode = {
      id: deck.id,
      name: deck.name,
      kind: 'deck',
      count: deck['card-count'],
    }
    nodeMap.set(deck.id, node)

    const parentId = deck['parent-id']
    if (parentId) {
      const siblings = childrenMap.get(parentId) ?? []
      siblings.push(node)
      childrenMap.set(parentId, siblings)
    }
  }

  for (const [parentId, children] of childrenMap) {
    const parent = nodeMap.get(parentId)
    if (parent) {
      parent.children = children
      parent.isExpanded = true
    }
  }

  const roots: DeckTreeNode[] = []
  for (const deck of decks) {
    if (deck['archived?'] || deck['trashed?']) continue
    if (!deck['parent-id'] || !nodeMap.has(deck['parent-id'])) {
      const node = nodeMap.get(deck.id)
      if (node) roots.push(node)
    }
  }

  if (roots.length > 0) {
    roots[0].isActive = true
  }

  return roots
}
