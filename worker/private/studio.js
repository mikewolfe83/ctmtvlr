'use strict';
// This is an interface demo. These are illustrative records, NOT YouTube API data.
const EXAMPLE_TOPICS = [
  {id:1,show:'sports',kind:'SPORTS / NBA',age:9,views:3420000,original:'The ongoing debate about NBA superteams',angle:'ARE NBA SUPERTEAMS HELPING OR HURTING THE GAME?',questions:['Does concentrating stars improve competition or hurt parity?','What matters more: roster talent or team chemistry?','What should fans expect from a successful franchise?']},
  {id:2,show:'thinking',kind:'LIFE / DECISIONS',age:17,views:2970000,original:'Why some people keep making the same mistakes',angle:'WHY DO PEOPLE REPEAT DECISIONS THAT HOLD THEM BACK?',questions:['How do habits shape outcomes over time?','Where is the line between environment and personal responsibility?','How do you recognize when it is time to change direction?']},
  {id:3,show:'reactions',kind:'CULTURE / FAME',age:21,views:2480000,original:'Celebrity money and bad decisions ignite debate',angle:'DOES MONEY MAKE PEOPLE WISER OR JUST MAGNIFY THEIR MISTAKES?',questions:['Why do bad decisions follow some people even after success?','Does fame reduce accountability or increase it?','What should ordinary people learn from public failures?']},
  {id:4,show:'sports',kind:'SPORTS / NFL',age:31,views:2120000,original:'Fans react to the performance of a star quarterback',angle:'IS A QUARTERBACK ONLY AS GOOD AS THE TEAM AROUND HIM?',questions:['How do coaching and roster quality affect results?','Is it fair to judge individual greatness by wins?','What does leadership look like after a tough loss?']},
  {id:5,show:'thinking',kind:'FAMILY / EXPECTATIONS',age:42,views:1960000,original:'Debate around parenting and preparing kids for adulthood',angle:'ARE WE PREPARING OUR CHILDREN FOR THE REAL WORLD?',questions:['Should parents prioritize protection or preparation?','When do expectations become unrealistic?','How can families teach decision-making early?']},
  {id:6,show:'sports',kind:'SPORTS / COLLEGE',age:56,views:1580000,original:'People debate the direction of college sports NIL',angle:'HAS NIL CHANGED THE PURPOSE OF COLLEGE ATHLETICS?',questions:['How can athletes balance opportunity and responsibility?','Is NIL helping competitive fairness?','What obligations should programs have to athletes?']},
  {id:7,show:'thinking',kind:'CAREER / GROWTH',age:61,views:1460000,original:'Top careers and what younger workers should learn',angle:'ARE YOUNG ADULTS CHOOSING CAREERS WITH A LONG-TERM PLAN?',questions:['How should local job opportunities affect career choices?','What transferable skills protect against career changes?','How do you balance income today with opportunity tomorrow?']},
  {id:8,show:'reactions',kind:'CULTURE / SOCIAL MEDIA',age:88,views:1230000,original:'A viral argument over popular opinions on social media',angle:'DO PEOPLE FORM THEIR OWN OPINIONS OR FOLLOW THE CROWD?',questions:['Why are popular opinions so persuasive?','What is the difference between agreement and independent thinking?','What does healthy disagreement look like online?']},
  {id:9,show:'sports',kind:'SPORTS / PERFORMANCE',age:104,views:1080000,original:'Athletes discuss talent versus years of practice',angle:'CAN WORK ETHIC OVERCOME A LACK OF NATURAL TALENT?',questions:['What role does practice play in elite success?','When does talent create an unbeatable advantage?','Can coaches teach the mindset needed to compete?']},
  {id:10,show:'thinking',kind:'MINDSET / DISCIPLINE',age:137,views:925000,original:'People want success without putting in work',angle:'WHY DO PEOPLE WANT SUCCESS BUT RESIST THE WORK?',questions:['How does comfort prevent long-term growth?','What makes consistency harder than motivation?','How do you make difficult habits part of daily life?']},
  {id:11,show:'reactions',kind:'CULTURE / VALUES',age:156,views:840000,original:'Controversy about expectations in relationships',angle:'ARE EXPECTATIONS IN RELATIONSHIPS BECOMING UNREALISTIC?',questions:['What makes expectations healthy or unhealthy?','How should people communicate non-negotiables?','Is public advice helpful or harmful in relationships?']},
  {id:12,show:'sports',kind:'SPORTS / LEADERSHIP',age:166,views:775000,original:'Debate about whether a coach can change a team',angle:'HOW MUCH OF WINNING COMES DOWN TO LEADERSHIP?',questions:['When can coaching overcome roster weaknesses?','How does accountability affect a team?','What separates a talented roster from a championship team?']}
];

(() => {
  const $$ = s => document.querySelector(s);
  const show = $$('#studio-show');
  const period = $$('#studio-period');
  const search = $$('#studio-search');
  const list = $$('#studio-list');
  const source = $$('#studio-source');
  const title = $$('#studio-title');
  const questions = $$('#studio-questions');
  const agendaList = $$('#studio-agenda');
  let selected = EXAMPLE_TOPICS[0];
  let agenda = [];
  try { agenda = JSON.parse(localStorage.getItem('ctm-demo-rundown') || '[]'); if (!Array.isArray(agenda)) agenda = []; } catch { agenda = []; }
  let toastTimer;
  function toast(message) {
    const node = $$('#studio-toast');
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2700);
  }
  function persist() { try { localStorage.setItem('ctm-demo-rundown', JSON.stringify(agenda)); } catch { /* local file security may disable storage */ } }
  function formatViews(n) { return n >= 1e6 ? `${(n/1e6).toFixed(2)}M` : `${Math.round(n/1e3)}K`; }
  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function selectTopic(topic) {
    selected = topic;
    source.textContent = `SOURCE IDEA: ${topic.original}`;
    title.value = topic.angle;
    questions.replaceChildren();
    topic.questions.forEach(q => questions.append(make('li','',q)));
    list.querySelectorAll('[data-topic-id]').forEach(b => b.classList.toggle('is-current', Number(b.dataset.topicId) === topic.id));
  }
  function renderTopics() {
    const query = search.value.trim().toLowerCase();
    const days = Number(period.value);
    const filter = show.value;
    const shown = EXAMPLE_TOPICS.filter(t => (filter === 'all' || t.show === filter) && t.age <= days && (`${t.original} ${t.angle} ${t.kind}`).toLowerCase().includes(query)).sort((a,b)=>b.views-a.views).slice(0,10);
    $$('#result-count').textContent = String(shown.length);
    list.replaceChildren();
    if (!shown.length) { list.append(make('p','studio-empty','No example topics match these filters. Try a wider date window.')); return; }
    shown.forEach((topic,i) => {
      const row = make('article','studio-topic');
      row.append(make('div','studio-topic__rank',String(i+1).padStart(2,'0')));
      const details = make('div');
      details.append(make('div','studio-topic__label',topic.kind));
      details.append(make('h3','',topic.original));
      details.append(make('div','studio-topic__meta',`${formatViews(topic.views)} sample views • ${topic.age} hours old (illustrative)`));
      row.append(details);
      const actions = make('div','studio-topic__actions');
      const rewrite = make('button','studio-mini-btn','REWRITE →');
      rewrite.type = 'button';
      rewrite.dataset.topicId = String(topic.id);
      rewrite.addEventListener('click', () => { selectTopic(topic); if (window.innerWidth < 960) $$('#rewrite-label').scrollIntoView({behavior:'smooth',block:'start'}); });
      const research = make('a','studio-mini-btn studio-mini-btn--ghost','SEARCH ↗');
      research.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.original)}`;
      research.target = '_blank'; research.rel = 'noopener noreferrer';
      research.title = 'Search YouTube for this topic. This demo does not link to a specific source video.';
      actions.append(rewrite,research);
      row.append(actions);
      list.append(row);
    });
    if (!shown.includes(selected)) selectTopic(shown[0]);
    else selectTopic(selected);
  }
  function renderAgenda() {
    $$('#agenda-count').textContent = String(agenda.length);
    agendaList.replaceChildren();
    if (!agenda.length) { agendaList.append(make('p','studio-empty','No topics saved yet. Add an idea from the rewriter.')); return; }
    agenda.forEach((item,i) => {
      const row = make('div','studio-agenda__item');
      row.append(make('span','',`${i+1}. ${item}`));
      const remove = make('button','','REMOVE');
      remove.type = 'button'; remove.setAttribute('aria-label',`Remove topic ${i+1}`);
      remove.addEventListener('click',()=>{agenda.splice(i,1);persist();renderAgenda();});
      row.append(remove); agendaList.append(row);
    });
  }
  function agendaText() {
    return `CTM MEDIA NETWORK\nEPISODE RUNDOWN (DEMO)\n\n${agenda.length ? agenda.map((x,i)=>`${i+1}. ${x}`).join('\n\n') : '(No topics selected)'}\n\n---\nCreated with the local CTM Creator Studio prototype.\n`;
  }
  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); toast('Copied to clipboard.'); }
    catch {
      const tmp = document.createElement('textarea');tmp.value=value;tmp.style.position='fixed';tmp.style.left='-9999px';document.body.append(tmp);tmp.select();
      try { document.execCommand('copy');toast('Copied to clipboard.'); }
      catch { toast('Copy unavailable. Select the text manually.'); }
      tmp.remove();
    }
  }
  [show,period,search].forEach(el=>el.addEventListener(el===search?'input':'change',renderTopics));
  $$('#studio-add').addEventListener('click',()=>{
    const value=title.value.trim();if(!value){toast('Select or enter a title first.');return;}
    if(agenda.includes(value)){toast('This title is already in your rundown.');return;}
    agenda.push(value);persist();renderAgenda();toast('Added to the episode rundown.');
  });
  $$('#studio-copy-title').addEventListener('click',()=>title.value.trim()?copyText(title.value.trim()):toast('Select a topic first.'));
  $$('#agenda-copy').addEventListener('click',()=>copyText(agendaText()));
  $$('#agenda-clear').addEventListener('click',()=>{if(!agenda.length)return; if(!window.confirm('Clear all saved demo topics?'))return;agenda=[];persist();renderAgenda();toast('Rundown cleared.');});
  $$('#agenda-download').addEventListener('click',()=>{
    const blob=new Blob([agendaText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='ctm-episode-rundown.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Text rundown downloaded.');
  });
  renderTopics();renderAgenda();
})();
