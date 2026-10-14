"use client";

import { useRef, useState } from "react";
import { Users, Plus, Pencil, Building2, Mail, Phone, X, Check, UserRound, Handshake, Shapes, Info } from "lucide-react";
import ContentEditor from "@/components/ContentEditor";
import ConfirmDelete from "@/components/ConfirmDelete";
import { C, tone, toneSoft } from "@/lib/theme";

export const CUSTOMER_STATUS = {
  lead: { label: "در حال مذاکره", tone: "amber" },
  active: { label: "فعال", tone: "jade" },
  inactive: { label: "غیرفعال", tone: "slate" },
};
export const CUSTOMER_STATUS_ORDER = ["lead", "active", "inactive"];
export const CUSTOMER_TYPE = { person: "شخص", company: "شرکت", intermediary: "واسطه", other: "موارد دیگر" };
const blank = { name: "", company: "", email: "", phone: "", status: "lead", type: "person" };
const TYPE_META = {
  person: { icon: UserRound, tone: "blue" },
  company: { icon: Building2, tone: "jade" },
  intermediary: { icon: Handshake, tone: "violet" },
  other: { icon: Shapes, tone: "amber" },
};

export default function CustomersPanel({ projectName, customers, shownCustomers: matchingCustomers, canEdit, onSelectProject, onAdd, onPatch, onDelete }) {
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const shownCustomers = matchingCustomers.filter(customer=>typeFilter==="all" || (customer.type || "person")===typeFilter);
  const [saving, setSaving] = useState(false);
  const pending = useRef(new Set());
  const [busy, setBusy] = useState(new Set());
  const mutate = async (id, operation) => {
    if (pending.current.has(id)) return false;
    pending.current.add(id); setBusy(new Set(pending.current));
    try { return await operation(); }
    catch { setNotice("ذخیره انجام نشد؛ دوباره تلاش کنید."); return false; }
    finally { pending.current.delete(id); setBusy(new Set(pending.current)); }
  };
  const close = () => { if (saving) return; setForm(null); setEditingId(null); setError(""); };
  const start = (customer = null) => {
    setEditingId(customer?.id || null);
    setForm(customer ? { ...customer } : { ...blank, type: typeFilter === "all" ? "person" : typeFilter });
    setError("");
    setNotice("");
  };
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) { setError("نام مشتری را وارد کنید."); return; }
    const data = Object.fromEntries(Object.keys(blank).map(key => [key, form[key].trim()]));
    setSaving(true); setError("");
    try {
      const ok = editingId ? await mutate(editingId, () => onPatch(editingId, data)) : await onAdd(data);
      if (!ok) { setError("ذخیره انجام نشد. اطلاعات فرم حفظ شده؛ دوباره تلاش کنید."); return; }
      setNotice(editingId ? "اطلاعات مشتری ذخیره شد." : "مشتری ثبت شد.");
      setTypeFilter("all"); setForm(null); setEditingId(null);
    } catch { setError("ارتباط برقرار نشد. دوباره تلاش کنید."); }
    finally { setSaving(false); }
  };
  const inputClass = "ops-input w-full rounded-xl px-3 py-3 text-sm outline-none mt-2 focus:ring-2 focus:ring-blue-400";

  return <div className="p-4 sm:p-5">
    <div className="customer-hero flex flex-wrap items-center justify-between gap-4 mb-4 rounded-2xl border p-4 sm:p-5" style={{ borderColor: C.border }}>
      <div className="flex items-center gap-3">
        <span className="customer-hero-icon flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: C.panel, color: tone("blue"), boxShadow: "var(--shadow-sm)" }}><Users size={23} strokeWidth={1.6} /></span>
        <div><div className="flex items-center gap-2"><h3 className="text-lg font-semibold">دفتر مشتریان</h3><span className="tnum rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: tone("blue"), background: C.panel }}>{customers.length.toLocaleString("fa-IR")} مشتری</span></div><p className="text-xs mt-1 leading-6" style={{ color: C.muted }}>اطلاعات تماس، وضعیت و یادداشت‌های مشتریان</p></div>
      </div>
      {canEdit ? <button type="button" onClick={() => start()} className="ops-tap ops-primary flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium"><Plus size={15} />مشتری جدید</button>
        : <button type="button" onClick={onSelectProject} className="ops-tap rounded-lg px-3 py-2 text-xs" style={{ color: tone("blue"), background: toneSoft("blue") }}>باز کردن پروژه</button>}
    </div>
    <p className="mb-5 flex items-start gap-2 text-[11px] leading-6" style={{ color: C.muted }}><Info size={14} className="mt-1 shrink-0" style={{ color: tone("amber") }}/>مشتریان به همین پروژه تعلق دارند و فقط در حساب شما دیده می‌شوند. تغییرات پس از ذخیره در دیتابیس نگهداری می‌شوند.</p>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="فیلتر نوع مشتری">
      {[["all","همه مشتریان"],...Object.entries(CUSTOMER_TYPE)].map(([key,label])=>{
        const Icon = TYPE_META[key]?.icon || Users;
        const count = customers.filter(customer=>key==="all" || (customer.type || "person")===key).length;
        return <button key={key} type="button" aria-pressed={typeFilter===key} onClick={()=>setTypeFilter(key)} className="customer-filter ops-tap flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs" style={{ borderColor:typeFilter===key?tone("blue"):C.border,background:typeFilter===key?toneSoft("blue"):C.panel,color:typeFilter===key?tone("blue"):C.muted }}><Icon size={14}/>{label}<span className="tnum rounded-md px-1.5 py-0.5 text-[10px]" style={{ background:typeFilter===key?C.panel:C.panelAlt }}>{count.toLocaleString("fa-IR")}</span></button>;
      })}
    </div>
    {form && canEdit && <form onSubmit={submit} className="mb-5 rounded-2xl border p-4 sm:p-5" style={{ background: C.panelAlt, borderColor: tone("blue"), boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold">{editingId ? "ویرایش مشتری" : "مشتری جدید"}</h4><button type="button" disabled={saving} onClick={close} className="ops-tap rounded-lg p-2" aria-label="بستن فرم مشتری"><X size={15} /></button></div>
      <fieldset disabled={saving} className="mb-4"><legend className="text-xs mb-2" style={{ color: C.muted }}>نوع مشتری</legend>
        <div role="radiogroup" aria-label="نوع مشتری" className="grid grid-cols-2 sm:grid-cols-4 gap-2">{Object.entries(CUSTOMER_TYPE).map(([key,label])=>{
          const Icon = TYPE_META[key].icon;
          return <label key={key} className="ops-tap flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs focus-within:ring-2 focus-within:ring-blue-400" style={{ background:form.type===key?toneSoft("blue"):C.panel,borderColor:form.type===key?tone("blue"):C.border,color:form.type===key?tone("blue"):C.muted }}><input type="radio" name="customer-type" className="sr-only" value={key} checked={(form.type || "person")===key} onChange={()=>setForm(old=>({...old,type:key}))}/><Icon size={16}/>{label}</label>;
        })}</div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        {[["name","نام مشتری *","text"],["company","شرکت یا مجموعه","text"],["phone","شماره تماس","tel"],["email","ایمیل","email"]].map(([key,label,type]) => <label key={key} className="text-xs" style={{ color: C.muted }}>{label}<input disabled={saving} maxLength={key==="name"?160:key==="company"?200:key==="email"?254:80} autoFocus={key === "name"} required={key === "name"} type={type} dir={key === "phone" || key === "email" ? "ltr" : "auto"} value={form[key]} onChange={e => setForm(old=>({...old,[key]:e.target.value}))} className={inputClass}/></label>)}
        <label className="text-xs" style={{ color: C.muted }}>وضعیت مشتری<select disabled={saving} className={inputClass} value={form.status} onChange={e=>setForm(old=>({...old,status:e.target.value}))}>{CUSTOMER_STATUS_ORDER.map(key=><option key={key} value={key}>{CUSTOMER_STATUS[key].label}</option>)}</select></label>
      </div>
      {error && <p role="alert" className="mt-3 text-xs" style={{ color: tone("red") }}>{error}</p>}
      <div className="mt-4 flex items-center gap-2"><button className="ops-tap ops-primary flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs" disabled={saving} type="submit"><Check size={14}/>{saving ? "در حال ذخیره…" : editingId ? "ذخیره تغییرات" : "افزودن مشتری"}</button><button type="button" onClick={close} className="ops-tap px-3 py-2 rounded-lg text-xs" style={{ color: C.muted }}>لغو</button></div>
    </form>}
    <p role="status" className={notice ? "mb-3 text-xs" : "sr-only"} style={{ color: tone("jade") }}>{notice}</p>
    {!shownCustomers.length ? <div className="rounded-xl border border-dashed py-10 text-center" style={{ borderColor: C.border, color: C.muted }}><Users size={26} className="mx-auto mb-3"/><p className="text-sm">{customers.length ? "مشتری مطابق جست‌وجو و فیلتر پیدا نشد." : "هنوز مشتری برای این پروژه ثبت نشده است."}</p></div>
      : <div className="customer-grid">{shownCustomers.map((customer, index) => {
        const status = CUSTOMER_STATUS[customer.status] || CUSTOMER_STATUS.lead;
        const type = TYPE_META[customer.type] || TYPE_META.person;
        const TypeIcon = type.icon;
        return <article key={customer.id} className="customer-card rounded-2xl border p-4 sm:p-5 min-w-0"
          style={{ "--customer-accent": tone(type.tone), "--customer-soft": toneSoft(type.tone), "--customer-delay": `${Math.min(index, 5) * 35}ms` }}>
          <div className="flex flex-wrap items-start gap-3">
            <span className="customer-avatar flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: toneSoft(type.tone), color: tone(type.tone) }}><TypeIcon size={21} strokeWidth={1.6}/></span>
            <div className="min-w-0 flex-1"><h4 className="text-base font-medium leading-7 break-words">{customer.name}</h4><p className="mt-1 text-[11px]" style={{ color: C.muted }}>{CUSTOMER_TYPE[customer.type] || CUSTOMER_TYPE.person}{customer.company && ` · ${customer.company}`}</p></div>
            {canEdit ? <select aria-label={`وضعیت ${customer.name}`} disabled={busy.has(customer.id)} value={customer.status} onChange={e=>mutate(customer.id,()=>onPatch(customer.id,{status:e.target.value}))} className="rounded-lg px-2 py-1.5 text-xs font-medium" style={{ background: toneSoft(status.tone), color: tone(status.tone) }}>{CUSTOMER_STATUS_ORDER.map(key=><option key={key} value={key}>{CUSTOMER_STATUS[key].label}</option>)}</select> : <span className="rounded-lg px-2 py-1.5 text-xs" style={{ background: toneSoft(status.tone), color: tone(status.tone) }}>{status.label}</span>}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs">
            {[["phone","شماره تماس",Phone],["email","ایمیل",Mail]].map(([key,label,Icon])=><div key={key} className="min-w-0 rounded-xl px-3 py-2.5" style={{ background:C.panelAlt }}>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color:C.faint }}><Icon size={12}/>{label}</span>
              <span dir="ltr" className="mt-1 block truncate text-right leading-6" title={customer[key] || ""} style={{ color:customer[key]?C.text:C.muted }}>{customer[key] || "ثبت نشده"}</span>
            </div>)}
          </div>
          {canEdit && <div className="mt-3 flex items-center justify-between"><button type="button" disabled={busy.has(customer.id) || saving} onClick={()=>start(customer)} className="ops-tap flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs" aria-label={`ویرایش ${customer.name}`} style={{ color:tone("blue") }}><Pencil size={13}/>ویرایش اطلاعات</button><ConfirmDelete disabled={busy.has(customer.id) || saving} title="حذف مشتری" onConfirm={async()=>{if(await mutate(customer.id,()=>onDelete(customer.id))){setNotice("مشتری حذف شد.");if(editingId===customer.id)close();}}}/></div>}
          {canEdit ? <div className="customer-note"><ContentEditor value={customer.notes || ""} label="یادداشت مشتری" appearance="paper" collapsible detailActions onSave={notes=>mutate(customer.id,()=>onPatch(customer.id,{notes}))}/></div>
            : customer.notes && <p className="mt-3 text-xs truncate" style={{ color: C.muted }}>{customer.notes}</p>}
        </article>;
      })}</div>}
  </div>;
}
