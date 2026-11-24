(() => {
"use strict";
const DB_NAME = "burger-machine-cashier", DB_VERSION = 1;
const CATEGORIES = ["REGULAR BURGERS","BUY 1 TAKE 1 – DOUBLE BURGERS","BUY 1 TAKE 1 – JUMBO BURGERS","ADD-ONS","SNACKS","DRINKS","SAUCES"];
const initialMenu = [
["REGULAR BURGERS","Jumbo Burger",61],["REGULAR BURGERS","BM Classic Burger",36],["REGULAR BURGERS","Double Chicken Burger",62],["REGULAR BURGERS","Double Longganisa Burger",63],["REGULAR BURGERS","Double Bartburger",68],["REGULAR BURGERS","Club Burger",62],["REGULAR BURGERS","Ultimate Double Burger",82],
["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Bart Burger",90],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Burger with Egg",92],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Burger with Bacon",92],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Burger with Cheese",92],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Cheesy Bacon",108],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Bart with Egg",120],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Burger with Egg & Cheese",122],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Burger with Egg & Bacon",122],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Burger with Chili & Bacon",122],["BUY 1 TAKE 1 – DOUBLE BURGERS","Double Ultimate Burger",138],
["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Cheese Burger",91],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Egg Burger",91],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Burger with Bacon",91],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Bart with Cheese",119],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Bart with Egg",119],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Burger with Egg & Cheese",121],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Burger with Egg & Bacon",121],["BUY 1 TAKE 1 – JUMBO BURGERS","Jumbo Burger with Chili & Cheese",121],
["ADD-ONS","Chili Con Carne",15],["ADD-ONS","Egg",15],["ADD-ONS","Sliced Cheese",15],["ADD-ONS","Bacon Bits",15],["ADD-ONS","Coleslaw",14],
["SNACKS","Sanrival",28],
["DRINKS","Soft Drinks",31],["DRINKS","Mango Cooler",30],["DRINKS","Calamansi Chill",30],["DRINKS","Bottled Water 500ml",25],["DRINKS","3-in-1 Coffee",30],["DRINKS","Hot Choco",35],
["SAUCES","Spicy Barbecue",null],["SAUCES","Pepper Sauce",null],["SAUCES","Catsup & Mayo",null]
].map((x,i)=>({id:"p"+(i+1),category:x[0],name:x[1],price:x[2]===null?0:x[2],priceUnset:x[2]===null}));

let db, menu=[], orders=[], cart=new Map(), selectedCategory=CATEGORIES[0], toastTimer;
const $ = id => document.getElementById(id);
const money = n => "₱"+Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;d.createObjectStore("settings",{keyPath:"key"});d.createObjectStore("orders",{keyPath:"id"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function tx(store,mode="readonly"){return db.transaction(store,mode).objectStore(store);}
function getAll(store){return new Promise((res,rej)=>{const r=tx(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
function getSetting(key){return new Promise((res,rej)=>{const r=tx("settings").get(key);r.onsuccess=()=>res(r.result?.value);r.onerror=()=>rej(r.error);});}
function setSetting(key,value){return new Promise((res,rej)=>{const t=db.transaction("settings","readwrite");t.objectStore("settings").put({key,value});t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
function saveOrder(order){return new Promise((res,rej)=>{const t=db.transaction("orders","readwrite");t.objectStore("orders").put(order);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
function deleteOrder(id){return new Promise((res,rej)=>{const t=db.transaction("orders","readwrite");t.objectStore("orders").delete(id);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
function saveMenu(){return setSetting("menu",menu);}
function showToast(msg){$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2300);}
function moneyPrice(p){return p===0?"₱0.00":money(p);}
function nextOrderNumber(){return getSetting("nextOrderNumber").then(n=>n||1001);}
function setView(name){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===name));if(name==="hub")renderHub();if(name==="history")renderHistory();if(name==="menu")renderManageMenu();}
function renderCategoryChips(){ $("category-chips").innerHTML=CATEGORIES.map(c=>`<button class="category-chip ${selectedCategory===c?"active":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");}
function renderProducts(){const list=menu.filter(p=>p.category===selectedCategory);$("product-grid").innerHTML=list.length?list.map(p=>`<button class="product-card" data-add="${esc(p.id)}"><strong>${esc(p.name)}</strong><span>${p.priceUnset?"Set price":money(p.price)}</span></button>`).join(""):'<p class="empty">No items in this category.</p>';}
function addToCart(id){const p=menu.find(x=>x.id===id);if(!p)return;const row=cart.get(id)||{id,name:p.name,price:Number(p.price)||0,qty:0};row.qty++;cart.set(id,row);renderCart();}
function changeQty(id,delta){const row=cart.get(id);if(!row)return;row.qty+=delta;if(row.qty<=0)cart.delete(id);renderCart();}
function renderCart(){const rows=[...cart.values()];$("cart-items").innerHTML=rows.length?rows.map(r=>`<div class="cart-line"><div class="cart-line-top"><span>${esc(r.name)}</span><span>${money(r.qty*r.price)}</span></div><div class="cart-line-sub">${money(r.price)} each</div><div class="qty-row"><button class="qty-btn" data-qty="${esc(r.id)}" data-delta="-1">−</button><span class="qty-num">${r.qty}</span><button class="qty-btn" data-qty="${esc(r.id)}" data-delta="1">＋</button><button class="remove-line" data-remove="${esc(r.id)}">Remove</button></div></div>`).join(""):'<p class="empty">Tap menu items to add them.</p>';const total=rows.reduce((s,r)=>s+r.qty*r.price,0);$("cart-total").textContent=money(total);$("confirm-order").disabled=!rows.length;}
function totalOf(o){return o.items.reduce((s,i)=>s+i.qty*i.price,0);}
function formatTime(t){return new Date(t).toLocaleString("en-PH",{dateStyle:"medium",timeStyle:"short"});}
function statusClass(s){return "status-"+s.toLowerCase();}
function itemsText(o){return o.items.map(i=>`${i.qty} × ${esc(i.name)}`).join("<br>");}
function card(o,history=false){const status=`<span class="status ${statusClass(o.status)}">${esc(o.status)}</span>`;return `<article class="order-card"><div class="order-card-head"><div><div class="order-number">Order #${o.number} ${o.customer?`· ${esc(o.customer)}`:""}</div><div class="order-time">${formatTime(o.createdAt)}</div></div>${status}</div><div class="order-items">${itemsText(o)}${o.note?`<br><i>Note: ${esc(o.note)}</i>`:""}</div><div class="order-card-foot"><strong class="order-total">${money(totalOf(o))}</strong><div class="order-actions">${history?`<button class="small-btn" data-details="${o.id}">Details</button><button class="small-btn delete-btn" data-delete="${o.id}">Delete</button>`:`<select aria-label="Change order status" data-status="${o.id}">${["Confirmed","Preparing","Ready","Completed","Cancelled"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select><button class="small-btn delete-btn" data-delete="${o.id}">Delete</button>`}</div></div></article>`;}
function renderHub(){const active=orders.filter(o=>!["Completed","Cancelled"].includes(o.status)).sort((a,b)=>a.number-b.number);$("active-count").textContent=active.length;$("hub-list").innerHTML=active.length?active.map(o=>card(o)).join(""):'<div class="order-card empty">No active orders right now.</div>';}
function renderHistory(){const q=$("history-search").value.trim().toLowerCase();const list=orders.filter(o=>["Completed","Cancelled"].includes(o.status)).filter(o=>String(o.number).includes(q)||(o.customer||"").toLowerCase().includes(q)).sort((a,b)=>b.number-a.number);$("history-list").innerHTML=list.length?list.map(o=>card(o,true)).join(""):'<div class="order-card empty">No matching completed or cancelled orders.</div>';}
function renderManageMenu(){let html="";for(const c of CATEGORIES){const items=menu.filter(p=>p.category===c);html+=`<div class="manage-category">${esc(c)}</div>`;html+=items.map(p=>`<div class="manage-row"><span class="item-name">${esc(p.name)}</span><span class="item-price">${p.priceUnset?"Not set":money(p.price)}</span><button data-edit="${esc(p.id)}">Edit</button></div>`).join("");} $("manage-menu").innerHTML=html;}
function updateCounts(){const n=orders.filter(o=>!["Completed","Cancelled"].includes(o.status)).length;$("active-count").textContent=n;}
function showConfirm(title,message,action){$("confirm-title").textContent=title;$("confirm-message").textContent=message;const dlg=$("confirm-dialog");const yes=$("confirm-yes");const handler=()=>{yes.removeEventListener("click",handler);action();};yes.addEventListener("click",handler);dlg.showModal();}
async function confirmOrder(){const rows=[...cart.values()];if(!rows.length)return;const number=await nextOrderNumber();const order={id:"o"+Date.now()+"-"+Math.random().toString(36).slice(2,7),number,createdAt:Date.now(),customer:$("customer-name").value.trim(),note:$("order-note").value.trim(),items:rows.map(r=>({...r})),status:"Confirmed"};await saveOrder(order);await setSetting("nextOrderNumber",number+1);orders.push(order);cart.clear();$("customer-name").value="";$("order-note").value="";renderCart();$("next-number").textContent=number+1;updateCounts();showToast(`Order #${number} confirmed and saved.`);setView("hub");}
async function changeStatus(id,status){const o=orders.find(x=>x.id===id);if(!o)return;o.status=status;await saveOrder(o);renderHub();renderHistory();updateCounts();showToast(`Order #${o.number}: ${status}`);}
async function removeOrder(id){const o=orders.find(x=>x.id===id);if(!o)return;showConfirm("Delete order?",`Delete Order #${o.number}? This cannot be undone.`,async()=>{await deleteOrder(id);orders=orders.filter(x=>x.id!==id);renderHub();renderHistory();updateCounts();showToast(`Order #${o.number} deleted.`);});}
function openProductDialog(p=null){$("product-dialog-title").textContent=p?"Edit menu item":"Add menu item";$("edit-product-id").value=p?.id||"";$("edit-product-name").value=p?.name||"";$("edit-product-category").innerHTML=CATEGORIES.map(c=>`<option ${p?.category===c?"selected":""}>${esc(c)}</option>`).join("");$("edit-product-price").value=p&&!p.priceUnset?p.price:"";$("remove-product").style.display=p?"block":"none";$("product-dialog").showModal();}
async function saveProduct(e){e.preventDefault();const id=$("edit-product-id").value;const name=$("edit-product-name").value.trim();const category=$("edit-product-category").value;const raw=$("edit-product-price").value;const priceUnset=raw==="";const price=priceUnset?0:Number(raw);if(!name||!Number.isFinite(price)||price<0){showToast("Please enter a valid item name and price.");return;}if(id){const p=menu.find(x=>x.id===id);if(p)Object.assign(p,{name,category,price,priceUnset});}else{menu.push({id:"p"+Date.now(),name,category,price,priceUnset});}await saveMenu();$("product-dialog").close();renderProducts();renderManageMenu();showToast("Menu saved.");}
async function removeProduct(){const id=$("edit-product-id").value;if(!id)return;const p=menu.find(x=>x.id===id);showConfirm("Remove menu item?",`Remove ${p?.name||"this item"} from the menu?`,async()=>{menu=menu.filter(x=>x.id!==id);cart.delete(id);await saveMenu();$("product-dialog").close();renderProducts();renderCart();renderManageMenu();showToast("Menu item removed.");});}
function bindEvents(){
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("category-chips").addEventListener("click",e=>{const b=e.target.closest("[data-cat]");if(!b)return;selectedCategory=b.dataset.cat;renderCategoryChips();renderProducts();});
$("product-grid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b)addToCart(b.dataset.add);});
$("cart-items").addEventListener("click",e=>{const q=e.target.closest("[data-qty]");const r=e.target.closest("[data-remove]");if(q)changeQty(q.dataset.qty,Number(q.dataset.delta));if(r){cart.delete(r.dataset.remove);renderCart();}});
$("clear-cart").addEventListener("click",()=>{cart.clear();renderCart();});
$("confirm-order").addEventListener("click",confirmOrder);
$("hub-list").addEventListener("change",e=>{const s=e.target.closest("[data-status]");if(s)changeStatus(s.dataset.status,s.value);});
$("hub-list").addEventListener("click",e=>{const b=e.target.closest("[data-delete]");if(b)removeOrder(b.dataset.delete);});
$("refresh-hub").addEventListener("click",async()=>{orders=await getAll("orders");renderHub();showToast("Order list refreshed.");});
$("history-search").addEventListener("input",renderHistory);
$("history-list").addEventListener("click",e=>{const del=e.target.closest("[data-delete]");if(del){removeOrder(del.dataset.delete);return;}const b=e.target.closest("[data-details]");if(!b)return;const o=orders.find(x=>x.id===b.dataset.details);if(o)showToast(`Order #${o.number} · ${o.items.map(i=>`${i.qty} ${i.name}`).join(", ")} · ${money(totalOf(o))}`);});
$("add-product").addEventListener("click",()=>openProductDialog());
$("manage-menu").addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(b)openProductDialog(menu.find(p=>p.id===b.dataset.edit));});
$("product-form").addEventListener("submit",saveProduct);
$("remove-product").addEventListener("click",removeProduct);
}
async function init(){try{db=await openDB();menu=await getSetting("menu")||initialMenu;orders=await getAll("orders");if(!(await getSetting("nextOrderNumber")))await setSetting("nextOrderNumber",Math.max(1001,...orders.map(o=>o.number+1)));}catch(err){document.body.innerHTML='<main><h1>Storage unavailable</h1><p>Please open this app in a modern browser with site storage enabled.</p></main>';return;}
renderCategoryChips();renderProducts();renderCart();renderHub();renderHistory();renderManageMenu();$("next-number").textContent=await nextOrderNumber();bindEvents();
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
init();
})();