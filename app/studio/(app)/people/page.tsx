import { addEntry, removeEntry, saveCreator } from '../../actions';
import { pickCreator, readHub } from '@/lib/hub/store';
import { currentCreatorId } from '@/lib/hub/current';
import ActionForm from '../ActionForm';
import CardStudio from './CardStudio';

export const metadata = { title: '인물·카드뉴스' };

export default async function People() {
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  return (
    <>
      <header className="page-head">
        <div>
          <h1>인물·카드뉴스</h1>
          <p>이 사람의 경력과 명언을 쌓아 두면, 입력한 문장 그대로 카드뉴스를 만들어요. AI가 문장을 바꾸지 않아요.</p>
        </div>
      </header>

      {creator && <CardStudio creator={creator} />}

      {creator && (
        <div className="two">
          <section>
            <h2>경력 {creator.career.length}개</h2>
            <ActionForm action={addEntry} className="form" resetOnOk>
              <input type="hidden" name="creatorId" value={creator.id} />
              <input type="hidden" name="kind" value="career" />
              <label>기간<input name="label" placeholder="2015~2019" /></label>
              <label>내용<textarea name="text" rows={2} required /></label>
              <button className="btn" type="submit">경력 추가</button>
            </ActionForm>
            <ul className="list list-tight">
              {creator.career.map((e) => (
                <li key={e.id}>
                  <span className="cell-title">{e.text}<small>{e.label}, {e.addedAt} 입력</small></span>
                  <form action={async () => { 'use server'; await removeEntry(creator.id, 'career', e.id); }}><button className="link-btn danger" type="submit">삭제</button></form>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>명언 {creator.quotes.length}개</h2>
            <ActionForm action={addEntry} className="form" resetOnOk>
              <input type="hidden" name="creatorId" value={creator.id} />
              <input type="hidden" name="kind" value="quote" />
              <label>출처<input name="label" placeholder="인터뷰, 책, 영상 제목" /></label>
              <label>문장<textarea name="text" rows={2} required /></label>
              <button className="btn" type="submit">명언 추가</button>
            </ActionForm>
            <ul className="list list-tight">
              {creator.quotes.map((e) => (
                <li key={e.id}>
                  <span className="cell-title">{e.text}<small>{e.label}, {e.addedAt} 입력</small></span>
                  <form action={async () => { 'use server'; await removeEntry(creator.id, 'quotes', e.id); }}><button className="link-btn danger" type="submit">삭제</button></form>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <div className="two">
        {creator && (
          <section>
            <h2>이 계정 정보</h2>
            <ActionForm action={saveCreator} className="form" key={creator.id}>
              <input type="hidden" name="id" value={creator.id} />
              <label>이름<input name="name" defaultValue={creator.name} required /></label>
              <label>인스타 아이디<input name="handle" defaultValue={creator.handle} /></label>
              <label>말투 메모 (AI 자막과 첫 문장 제안에 쓰여요)<textarea name="voice" rows={2} defaultValue={creator.voice} /></label>
              <label>메모<textarea name="note" rows={2} defaultValue={creator.note} /></label>
              <div className="form-row">
                <label>게시 시간 1<input type="time" name="slot1" defaultValue={creator.slots[0]} /></label>
                <label>게시 시간 2<input type="time" name="slot2" defaultValue={creator.slots[1]} /></label>
              </div>
              <button className="btn" type="submit">저장</button>
            </ActionForm>
          </section>
        )}
        <section>
          <h2>새 계정 추가</h2>
          <ActionForm action={saveCreator} className="form" resetOnOk>
            <label>이름<input name="name" required /></label>
            <label>인스타 아이디<input name="handle" placeholder="@account.kr" /></label>
            <label>말투 메모<textarea name="voice" rows={2} /></label>
            <button className="btn btn-main" type="submit">계정 추가</button>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
