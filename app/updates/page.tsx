"use client";
import { Disclosure, GroupedList, ListRow, SectionHeader, activityTitle, shortDate, humanText } from "@/components/consumer";
import { Suspense, useEffect, useState } from "react";
import { PageHead } from "@/components/ui";
import { AnimatedList } from "@/components/motion/AnimatedList";
import { UpdatesSkeleton } from "@/components/motion/Skeleton";

import { useStore } from "@/components/StoreProvider";
import { useSearchParams } from "next/navigation";
type Item = { id: string; type: string; title: string; detail?: string | null; date: string; href: string; read?: boolean };
type Education = { slug: string; title: string; summary: string; sourceName: string };
function UpdatesContent() {
  const {s}=useStore();
  const [items, setItems] = useState<Item[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const params=useSearchParams(); const attentionOnly=params.get("view")==="attention";
  const [mode, setMode] = useState("owner");
  const [error, setError] = useState("");
  const [history,setHistory]=useState<Item[]>([]),[nextPage,setNextPage]=useState<number|null>(0),[total,setTotal]=useState<number|null>(null),[loadingHistory,setLoadingHistory]=useState(false);
  const [loadedView, setLoadedView] = useState<string | null>(null);
  const loaded = loadedView === String(attentionOnly);
  async function loadHistory(){if(nextPage===null||loadingHistory)return;setLoadingHistory(true);try{const response=await fetch(`/api/updates?view=history&page=${nextPage}`,{cache:"no-store"});const body=await response.json();if(!response.ok)throw Error(body.error?.message||"History unavailable");setHistory(previous=>[...previous,...body.data.items]);setNextPage(body.data.nextPage);setTotal(body.data.total);}catch(e){setError(e instanceof Error?e.message:"History unavailable");}finally{setLoadingHistory(false);}}
  useEffect(() => { const attention=attentionOnly; void fetch(attention?"/api/home":"/api/updates", { cache: "no-store" }).then(async (response) => { const body = await response.json() as { data?: { mode: string; items: Item[]; attention?:Item[]; education: Education[] }; error?: { message?: string } }; if (!response.ok || !body.data) throw new Error(body.error?.message || "Updates could not be loaded."); setMode(body.data.mode); setItems(attention?(body.data.attention||[]):body.data.items); setEducation(Array.isArray(body.data.education)?body.data.education:[]); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Updates could not be loaded.")).finally(() => setLoadedView(String(attention))); }, [attentionOnly]);
  const today = new Date(); today.setHours(0,0,0,0);
  const groups = attentionOnly?[{name:"Your next steps", rows:items}]:[
    {name:"Today", rows:items.filter(i=>new Date(i.date).getTime()>=today.getTime()&&new Date(i.date).getTime()<today.getTime()+86400000)},
    {name:"This week", rows:items.filter(i=>new Date(i.date).getTime()<today.getTime() && new Date(i.date).getTime()>=today.getTime()-6*86400000)},
    {name:"Upcoming dates", rows:items.filter(i=>new Date(i.date).getTime()>=today.getTime()+86400000)},
    {name:"Earlier", rows:items.filter(i=>new Date(i.date).getTime()<today.getTime()-6*86400000 || Number.isNaN(new Date(i.date).getTime()))}
  ];
  return <div><PageHead title={attentionOnly?"Needs attention":"Updates"} sub={mode==="shared"?"Shared with you":undefined} />
    <div className="space-y-6 pb-6">
      {error&&<p role="alert" className="text-red-700">{error}</p>}
      {!loaded&&!error ? <UpdatesSkeleton /> : null}
      {loaded&&!items.length&&!error ? <p className="text-ink-muted p-5">You’re all caught up. New activity will appear here.</p> : null}
      {groups.filter(g=>g.rows.length).map(g=><section key={g.name}><SectionHeader title={g.name} detail={String(g.rows.length)}/><GroupedList><AnimatedList stagger={false}>{g.rows.map(item=><Disclosure key={`${item.type}-${item.id}`} title={activityTitle(item.title,item.detail)} detail={`${s.properties.find(p=>item.href.includes(p.id))?.name||"Your account"} · ${shortDate(item.date)}`}><GroupedList><ListRow title="Open related record" href={item.href}/></GroupedList>{item.detail&&<details><summary>Activity details</summary><p className="whitespace-pre-wrap break-words text-sm">{humanText(item.detail)}</p></details>}</Disclosure>)}</AnimatedList></GroupedList></section>)}
      {!attentionOnly&&<section><SectionHeader title="Complete property history" detail={total===null?undefined:`${history.length} of ${total} events`}/><GroupedList><AnimatedList stagger={false}>{history.map(item=><Disclosure key={item.id} title={activityTitle(item.title,item.detail)} detail={`${s.properties.find(p=>item.href.includes(p.id))?.name||"Shared property"} · ${shortDate(item.date)}`}><ListRow title="Open related record" href={item.href}/>{item.detail&&<p className="text-sm whitespace-pre-wrap">{humanText(item.detail)}</p>}</Disclosure>)}</AnimatedList></GroupedList>{nextPage!==null?<button type="button" className="primary-disclosure motion-pressable" disabled={loadingHistory} onClick={()=>void loadHistory()}>{loadingHistory?"Loading history…":history.length?"See older events":"Browse all property history"}</button>:<p className="text-sm text-ink-muted">All {total} events shown.</p>}</section>}
      <Disclosure title="Helpful reading" detail={`${education.length} current guides`}><p className="text-[14px] text-ink-muted mb-4">Reviewed, effective content. Not legal, tax, title, market or government advice.</p><GroupedList>{education.map(row=><ListRow key={row.slug} href={`/guides/${row.slug}`} title={row.title} detail={row.sourceName}/>)}</GroupedList>{!education.length&&<p>No current published education.</p>}</Disclosure>
    </div></div>;
}
export default function UpdatesPage(){return <Suspense><UpdatesContent/></Suspense>;}
