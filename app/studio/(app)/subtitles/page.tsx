import { pickCreator, readHub } from '@/lib/hub/store';
import { aiReady } from '@/lib/hub/ai';
import { currentCreatorId } from '@/lib/hub/current';
import SubtitleDesk from './SubtitleDesk';

export const metadata = { title: '자막 편집' };

export default async function Subtitles({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  if (!creator) return null;
  const projects = hub.projects.filter((x) => x.creatorId === creator.id);
  const project = projects.find((x) => x.id === p) ?? null;
  return <SubtitleDesk key={project?.id ?? 'list'} creatorId={creator.id} projects={projects} project={project} aiReady={aiReady()} />;
}
