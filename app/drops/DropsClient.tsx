'use client';

import { DROPS } from '@/lib/drops';
import DropCard, { NotListedCard } from '../DropCard';
import { useSite } from '../Site';

export default function DropsClient() {
  const { t } = useSite();
  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>{t.dropsTitle}</h1>
          <p>{t.dropsSub}</p>
        </div>
      </div>
      <div className="drops">
        {DROPS.map((d) => <DropCard key={d.id} drop={d} />)}
        <NotListedCard />
      </div>
      <p className="tiny muted">{t.dropsSample}</p>
    </main>
  );
}
