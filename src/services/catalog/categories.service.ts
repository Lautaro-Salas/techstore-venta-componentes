import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { BreadcrumbItem, CategoryNode } from "@/types/catalog";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: string | null;
}

function buildTree(rows: CategoryRow[]): CategoryNode[] {
  const byParent = new Map<string | null, CategoryRow[]>();
  for (const row of rows) {
    const list = byParent.get(row.parentId) ?? [];
    list.push(row);
    byParent.set(row.parentId, list);
  }
  const build = (parentId: string | null, basePath: string): CategoryNode[] =>
    (byParent.get(parentId) ?? []).map((row) => {
      const href = `${basePath}/${row.slug}`;
      return { ...row, href, children: build(row.id, href) };
    });
  return build(null, "");
}

/** Árbol completo de categorías activas (memoizado por request). */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, icon: true, description: true, parentId: true },
  });
  return buildTree(rows);
});

export function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}

export function descendantIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

/** Resuelve una ruta tipo ["componentes", "procesadores"] respetando la jerarquía. */
export async function findCategoryByPath(path: string[]): Promise<{ node: CategoryNode; trail: CategoryNode[] } | null> {
  let level = await getCategoryTree();
  const trail: CategoryNode[] = [];
  for (const slug of path) {
    const match = level.find((n) => n.slug === slug);
    if (!match) return null;
    trail.push(match);
    level = match.children;
  }
  const node = trail.at(-1);
  return node ? { node, trail } : null;
}

export async function findCategoryById(id: string): Promise<{ node: CategoryNode; trail: CategoryNode[] } | null> {
  const tree = await getCategoryTree();
  const walk = (nodes: CategoryNode[], trail: CategoryNode[]): { node: CategoryNode; trail: CategoryNode[] } | null => {
    for (const n of nodes) {
      const next = [...trail, n];
      if (n.id === id) return { node: n, trail: next };
      const found = walk(n.children, next);
      if (found) return found;
    }
    return null;
  };
  return walk(tree, []);
}

export async function findCategoryBySlug(slug: string): Promise<CategoryNode | null> {
  return flattenTree(await getCategoryTree()).find((n) => n.slug === slug) ?? null;
}

export function categoryBreadcrumbs(trail: CategoryNode[]): BreadcrumbItem[] {
  return [{ name: "Inicio", href: "/" }, ...trail.map((n) => ({ name: n.name, href: n.href }))];
}
