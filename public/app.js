"use strict";
const KEY = "isu_lms_v2", LOAN_DAYS = 7, MAX_LOANS = 3, MAX_RENEWALS = 1, DAY = 864e5;
const $ = id => document.getElementById(id);
const seed = () => ({
  books: [
    ["Introduction to Information Technology","J. Santos","Technology",3],["Science, Technology and Society","M. Reyes","Science",2],
    ["Business Communication","A. Cruz","Communication",1],["The Contemporary World","L. Garcia","Social Science",2],
    ["Creative and Critical Thinking","R. Dela Cruz","Education",2],["Web Development Fundamentals","P. Mendoza","Technology",3],
    ["Database Systems","K. Villanueva","Technology",1],["Research Methods","C. Aquino","Research",2],
    ["Academic Writing","S. Navarro","Language",2],["Library and Information Science","T. Ramos","Library",2]
  ].map(([title,author,category,copies],i)=>({id:i+1,title,author,category,copies,available:copies})),
  loans: [], history: [], nextId: 11,
  messages: [{from:"helper",who:"Library Helper",text:"Hello! Ask me about a book's availability, borrowing, or returning."}],
  user: null
});
function load(){
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.books)) return d; } catch (e) {}
  return seed();
}
let state = load();
function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast("Storage unavailable — changes won't persist."); } }
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt = t => new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
const isLib = () => state.user && state.user.role === "librarian";
const isOverdue = l => l.due < Date.now();
function toast(msg){
  document.querySelectorAll(".toast").forEach(t=>t.remove());
  const t = document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(),2800);
}
function log(action,title){ state.history.push({action,title,user:state.user.email,at:Date.now()}); }

function renderBooks(){
  const q = $("searchInput").value.toLowerCase().trim(), st = $("statusFilter").value, cat = $("categoryFilter").value;
  const cats = [...new Set(state.books.map(b=>b.category))].sort();
  $("categoryFilter").innerHTML = '<option value="all">All categories</option>' + cats.map(c=>`<option ${c===cat?"selected":""}>${esc(c)}</option>`).join("");
  const list = state.books.filter(b =>
    (st==="all" || (st==="available") === (b.available>0)) && (cat==="all" || b.category===cat) &&
    `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(q));
  $("bookGrid").innerHTML = list.map(b => {
    const ok = b.available>0, low = ok && b.available===1;
    return `<article class="book"><div class="book-cover" aria-hidden="true">📖</div>
      <h3>${esc(b.title)}</h3><div class="author">${esc(b.author)}</div>
      <div class="book-meta"><span class="tag ${ok?(low?"low":"available"):"borrowed"}">${ok?`${b.available} of ${b.copies} available`:"All copies on loan"}</span><small>${esc(b.category)}</small></div>
      <div class="row-actions"><button class="${ok?"primary":"small-btn"}" ${ok?"":"disabled"} data-act="borrow" data-id="${b.id}">${ok?"Borrow Book":"Unavailable"}</button>
      ${isLib()?`<button class="small-btn danger" data-act="delete" data-id="${b.id}" aria-label="Delete ${esc(b.title)}">Delete</button>`:""}</div></article>`;
  }).join("") || '<div class="empty">No books match your search.</div>';
  const out = state.loans.length;
  $("totalBooks").textContent = state.books.length;
  $("availableBooks").textContent = state.books.reduce((n,b)=>n+b.available,0);
  $("borrowedBooks").textContent = out;
  $("overdueBooks").textContent = state.loans.filter(isOverdue).length;
}
function renderTransactions(){
  const u = state.user;
  $("loansTitle").textContent = isLib() ? "All current loans" : "My current loans";
  const loans = !u ? [] : isLib() ? state.loans : state.loans.filter(l=>l.user===u.email);
  $("myLoans").innerHTML = !u ? '<div class="empty">Log in to see your loans.</div>' : loans.length ? loans.map(l => `
    <div class="loan-row"><span><b>${esc(l.title)}</b>${isLib()?`<br><small>${esc(l.user)}</small>`:""}<br>
      <small>Due ${fmt(l.due)} ${isOverdue(l)?'<span class="tag overdue">Overdue</span>':""}</small></span>
      <span class="row-actions"><button class="small-btn" data-act="renew" data-id="${l.id}" ${l.renewals>=MAX_RENEWALS?"disabled":""}>Renew</button>
      <button class="small-btn" data-act="return" data-id="${l.id}">Return</button></span></div>`).join("") : '<div class="empty">No current loans.</div>';
  const hist = !u ? [] : (isLib() ? state.history : state.history.filter(h=>h.user===u.email)).slice().reverse().slice(0,50);
  $("history").innerHTML = hist.length ? hist.map(h=>`<div class="history-row"><span><b>${esc(h.action)}</b> — ${esc(h.title)}${isLib()?` <small>(${esc(h.user)})</small>`:""}</span><small>${new Date(h.at).toLocaleString()}</small></div>`).join("") : '<div class="empty">No transactions yet.</div>';
}
function renderChat(){
  const box = $("chatMessages");
  box.innerHTML = state.messages.map(m=>`<div class="msg ${m.from==="helper"?"helper":"user"}">${esc(m.text)}${m.who?`<small>${esc(m.who)}</small>`:""}</div>`).join("");
  box.scrollTop = box.scrollHeight;
}
function renderUser(){
  $("openLogin").textContent = state.user ? `Logout (${state.user.email.split("@")[0]})` : "Login";
  $("admin").hidden = !isLib();
  $("chatInput").placeholder = isLib() ? "Reply as library helper..." : "Type a message to the library helper...";
}
const renderAll = () => { renderUser(); renderBooks(); renderTransactions(); renderChat(); };
function requireLogin(){ if (state.user) return true; toast("Please log in first."); openModal(); return false; }

function borrow(id){
  if (!requireLogin()) return;
  const b = state.books.find(x=>x.id===id); if (!b || b.available<1) return;
  if (state.loans.filter(l=>l.user===state.user.email).length >= MAX_LOANS) return toast(`Loan limit reached (${MAX_LOANS} books).`);
  if (state.loans.some(l=>l.user===state.user.email && l.bookId===id)) return toast("You already borrowed this title.");
  b.available--; state.loans.push({id:state.nextId++,bookId:id,title:b.title,user:state.user.email,due:Date.now()+LOAN_DAYS*DAY,renewals:0});
  log("Borrowed",b.title); save(); renderAll(); toast(`Borrowed. Due in ${LOAN_DAYS} days.`);
}
function giveBack(id){
  const i = state.loans.findIndex(l=>l.id===id); if (i<0) return;
  const [l] = state.loans.splice(i,1), b = state.books.find(x=>x.id===l.bookId);
  if (b) b.available = Math.min(b.copies,b.available+1);
  log("Returned",l.title); save(); renderAll(); toast("Book returned.");
}
function renew(id){
  const l = state.loans.find(x=>x.id===id); if (!l || l.renewals>=MAX_RENEWALS) return;
  l.due = Math.max(l.due,Date.now()) + LOAN_DAYS*DAY; l.renewals++; log("Renewed",l.title); save(); renderAll(); toast(`Renewed until ${fmt(l.due)}.`);
}
function removeBook(id){
  const b = state.books.find(x=>x.id===id); if (!b || !isLib()) return;
  if (state.loans.some(l=>l.bookId===id)) return toast("Can't delete: copies are on loan.");
  if (!confirm(`Delete "${b.title}"?`)) return;
  state.books = state.books.filter(x=>x.id!==id); log("Removed",b.title); save(); renderAll();
}
const actions = {borrow, return:giveBack, renew, delete:removeBook};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (el) actions[el.dataset.act](Number(el.dataset.id));
});
["searchInput","statusFilter","categoryFilter"].forEach(id => $(id).addEventListener(id==="searchInput"?"input":"change",renderBooks));

$("bookForm").addEventListener("submit", e => {
  e.preventDefault(); if (!isLib()) return;
  const copies = Math.max(1,Math.min(50,parseInt($("bkCopies").value,10)||1));
  const title = $("bkTitle").value.trim();
  state.books.push({id:state.nextId++,title,author:$("bkAuthor").value.trim(),category:$("bkCategory").value.trim(),copies,available:copies});
  log("Added",title); save(); e.target.reset(); $("bkCopies").value=1; renderAll(); toast("Book added.");
});

function botReply(text){
  const t = text.toLowerCase(), words = t.split(/\W+/).filter(w=>w.length>3);
  const hit = state.books.find(b=>t.includes(b.title.toLowerCase())) || state.books.find(b=>words.some(w=>b.title.toLowerCase().includes(w)));
  if (hit) return hit.available>0 ? `"${hit.title}" is available (${hit.available} of ${hit.copies} copies). You can borrow it from the Books section.` : `All copies of "${hit.title}" are on loan. Please check back soon.`;
  if (/borrow|return|renew|due/.test(t)) return `Loans last ${LOAN_DAYS} days, you can hold up to ${MAX_LOANS} books, and each can be renewed ${MAX_RENEWALS} time.`;
  return "Thanks for your message. A librarian will review it and follow up.";
}
$("chatForm").addEventListener("submit", e => {
  e.preventDefault(); const text = $("chatInput").value.trim(); if (!text) return;
  if (!requireLogin()) return;
  state.messages.push(isLib() ? {from:"helper",who:"Librarian",text} : {from:"user",who:state.user.email.split("@")[0],text});
  state.messages = state.messages.slice(-100); $("chatInput").value=""; save(); renderChat();
  if (!isLib()) setTimeout(()=>{ state.messages.push({from:"helper",who:"Library Helper",text:botReply(text)}); save(); renderChat(); },500);
});

const modal = $("loginModal");
function openModal(){ modal.classList.add("show"); modal.setAttribute("aria-hidden","false"); $("email").focus(); }
function closeModal(){ modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); $("loginNotice").textContent=""; }
$("openLogin").onclick = () => { if (state.user) { state.user=null; save(); renderAll(); toast("Logged out."); } else openModal(); };
$("closeLogin").onclick = closeModal;
modal.addEventListener("click", e => { if (e.target===modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key==="Escape") closeModal(); });
$("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const email = $("email").value.trim().toLowerCase(), pw = $("password").value;
  const lib = email === "librarian@isu.edu.ph";
  if (lib && pw !== "library123") { $("loginNotice").textContent = "Incorrect librarian password."; return; }
  state.user = {email, role: lib ? "librarian" : "student"}; save(); e.target.reset(); closeModal(); renderAll();
  toast(`Welcome, ${email.split("@")[0]} (${state.user.role}).`);
});
$("menuBtn").onclick = () => { const o = $("nav").classList.toggle("open"); $("menuBtn").setAttribute("aria-expanded",o); };
$("nav").addEventListener("click", e => { if (e.target.tagName==="A") $("nav").classList.remove("open"); });
$("resetBtn").onclick = () => { if (confirm("Reset all demo data in this browser?")) { state = seed(); save(); renderAll(); toast("Demo data reset."); } };
renderAll();
