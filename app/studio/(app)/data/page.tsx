import { addFollowers, addPost, importFollowers, importPosts } from '../../actions';
import { pickCreator, readHub } from '@/lib/hub/store';
import { currentCreatorId } from '@/lib/hub/current';
import { todayKST } from '@/lib/hub/types';
import ActionForm from '../ActionForm';
import CsvBox from './CsvBox';

export const metadata = { title: '수치 입력' };

export default async function DataInput() {
  const hub = await readHub();
  const creator = pickCreator(hub, await currentCreatorId());
  if (!creator) return null;
  const today = todayKST();
  const recent = hub.followers.filter((p) => p.creatorId === creator.id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 7);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>수치 입력</h1>
          <p>게시물과 팔로워 수를 넣으면 분석·보관함·보고서에 바로 반영돼요. 이미 있는 게시물의 수치는 보관함에서 고쳐요.</p>
        </div>
      </header>

      <div className="two">
        <section>
          <h2>게시물 하나 추가</h2>
          <ActionForm action={addPost} className="form form-grid" resetOnOk>
            <input type="hidden" name="creatorId" value={creator.id} />
            <label className="span2">게시일<input type="date" name="date" defaultValue={today} required /></label>
            <label className="span2">종류
              <select name="kind" defaultValue="reel">
                <option value="reel">릴스</option>
                <option value="carousel">캐러셀</option>
                <option value="image">사진</option>
              </select>
            </label>
            <label className="span4">제목<input name="title" maxLength={120} required /></label>
            <label className="span4">첫 문장(훅)<input name="hook" maxLength={200} /></label>
            <label className="span2">훅 유형<input name="hook_type" placeholder="질문형" /></label>
            <label className="span2">주제<input name="topic" placeholder="거리 인터뷰" /></label>
            <label className="span4">스타일<input name="style" placeholder="노란 큰자막" /></label>
            <label>조회수<input name="views" inputMode="numeric" /></label>
            <label>도달<input name="reach" inputMode="numeric" /></label>
            <label>좋아요<input name="likes" inputMode="numeric" /></label>
            <label>댓글<input name="comments" inputMode="numeric" /></label>
            <label>저장<input name="saves" inputMode="numeric" /></label>
            <label>공유<input name="shares" inputMode="numeric" /></label>
            <label>팔로우<input name="follows" inputMode="numeric" /></label>
            <label>평균 시청(초)<input name="avg_watch_sec" inputMode="decimal" /></label>
            <p className="hint span4">조회수를 비워 두면 수치 없이 보관함에만 들어가요.</p>
            <div className="span4 row-actions"><button className="btn btn-main" type="submit">게시물 저장</button></div>
          </ActionForm>
        </section>

        <section>
          <h2>팔로워 수</h2>
          <ActionForm action={addFollowers} className="form" resetOnOk>
            <input type="hidden" name="creatorId" value={creator.id} />
            <div className="form-row">
              <label>날짜<input type="date" name="date" defaultValue={today} required /></label>
              <label>팔로워<input name="followers" inputMode="numeric" required /></label>
            </div>
            <button className="btn" type="submit">팔로워 저장</button>
          </ActionForm>
          {recent.length > 0 && (
            <ul className="list list-tight">
              {recent.map((p) => (
                <li key={p.date}><span className="when">{p.date}</span><span className="num">{p.followers.toLocaleString('ko-KR')}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="two">
        <section>
          <h2>게시물 CSV로 한꺼번에</h2>
          <p className="hint">필수 열은 date, title, views예요. 같은 날짜·제목이 이미 있으면 새로 만들지 않고 수치만 갱신해요. <a href="/api/hub/templates/posts.csv">양식 받기</a></p>
          <ActionForm action={importPosts} className="form">
            <input type="hidden" name="creatorId" value={creator.id} />
            <CsvBox placeholder="date,title,kind,hook,...,views" />
            <button className="btn" type="submit">게시물 가져오기</button>
          </ActionForm>
        </section>
        <section>
          <h2>팔로워 CSV로 한꺼번에</h2>
          <p className="hint">date, followers 두 열이에요. 같은 날짜는 덮어써요. <a href="/api/hub/templates/followers.csv">양식 받기</a></p>
          <ActionForm action={importFollowers} className="form">
            <input type="hidden" name="creatorId" value={creator.id} />
            <CsvBox placeholder="date,followers" />
            <button className="btn" type="submit">팔로워 가져오기</button>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
