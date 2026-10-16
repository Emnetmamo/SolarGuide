import { notFound } from "@tanstack/react-router";
import { getProjectBundle } from "@/lib/server-fns";
import { demoBundleFor, isDemoId } from "@/lib/demo";

/** One loader for every project screen: demo projects are generated, real ones come from the database. */
export async function loadProjectBundle(projectId) {
  if (isDemoId(projectId)) {
    const bundle = demoBundleFor(projectId);
    if (!bundle) throw notFound();
    return bundle;
  }
  const bundle = await getProjectBundle({ data: { id: projectId } });
  if (!bundle) throw notFound();
  return bundle;
}

export function projectTitle(project) {
  return project?.name ?? "Project";
}