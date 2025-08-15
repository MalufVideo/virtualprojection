// Frontend using server-side proxy endpoints (no token in client)

const CONFIG = {
  apiBase: '', // same-origin
  // Correct table ID for produtoras
  tableId: 'moxaifq5xp4bl76',
  viewId: 'vw6ib2i5pt04m4io',
  // Column mapping (adjust to your NocoDB columns)
  columns: {
    name: 'Produtora',
    website: 'site',
    since: 'data',
    inviter: 'quem convida',
  },
};

const DATASET = [
  ['511 Filmes','511filmes.com.br','2014-02-10'],
  ['Academiadefilmes','academiadefilmes.com.br','1996-01-01'],
  ['Anonymouscontent','www.anonymouscontent.com','2024-06-12'],
  ['Antfood','www.antfood.com','2019-01-21'],
  ['Balmafilms','balmafilms.com','2025-08-05'],
  ['Barrycompany','www.barrycompany.com.br','2008-06-01'],
  ['Bionicafilmes','www.bionicafilmes.com.br','2023-05-30'],
  ['Bigbonsai','www.bigbonsai.com.br','2014-02-01'],
  ['Bigstudios','bigstudios.com.br','2024-12-19'],
  ['Blackmadre','www.blackmadre.com','2023-12-01'],
  ['Boilerfilmes','boilerfilmes.com.br','2017-09-06'],
  ['Brigittefilmes','brigittefilmes.com.br','2023-03-16'],
  ['Broders','broders.tv','2024-10-24'],
  ['Cabaretstudio','www.cabaretstudio.com.br','2024-03-21'],
  ['Caferoyal','www.caferoyal.art.br','2019-04-10'],
  ['Canja','www.canja.audio','2025-08-06'],
  ['Capuri','capuri.tv','2020-08-31'],
  ['Casablancafx','casablancafx.com.br','2004-01-01'],
  ['Cave','www.cave.tv.br','2020-08-07'],
  ['Cine','www.cine.com.br','1995-01-01'],
  ['Conspira','www.conspira.com.br','1990-01-01'],
  ['Ladoanimation','ladoanimation.com','2012-05-26'],
  ['Coracaodaselva','www.coracaodaselva.com.br','2024-12-19'],
  ['Corazon','www.corazon.tv.br','2022-02-03'],
  ['Cremecompany','cremecompany.tv','2024-07-01'],
  ['Czar','czar.com','2023-10-02'],
  ['Digital21','www.digital21.com.br','2002-10-01'],
  ['Dahouseaudio','dahouseaudio.com.br','2019-08-05'],
  ['Damascofilmes','damascofilmes.com','2020-06-17'],
  ['Dlktsn','dlktsn.com.br','2016-12-01'],
  ['Dwrk','www.dwrk.it','2021-04-28'],
  ['Domo','www.domo.tv.br','2015-01-16'],
  ['Donttouchmysoda','donttouchmysoda.com','2024-12-17'],
  ['Fantasticafilmes','www.fantasticafilmes.com','2010-10-25'],
  ['Fishprodutora','www.fishprodutora.com.br','2023-09-29'],
  ['Gullane','www.gullane.com.br','2017-05-17'],
  ['Saigon','www.saigon.com.br','2022-04-22'],
  ['Vimeo','vimeo.com','2024-07-15'],
  ['Hungryman','hungryman.com','2009-07-01'],
  ['Iconoclast','www.iconoclast.tv','2016-12-13'],
  ['Immigrant','www.immigrant.studio','2022-05-18'],
  ['Ingoodcompany','www.ingoodcompany.com.br','2020-06-01'],
  ['Insula Ai','insula-ai.com','2017-05-17'],
  ['Intropictures','www.intropictures.tv','2022-10-05'],
  ['Kaus','www.kaus.film','2023-06-21'],
  ['Landia','www.landia.com','2015-06-08'],
  ['Liramusica','www.liramusica.com.br','2020-04-09'],
  ['Lovepicturescompany','lovepicturescompany.com','2024-09-24'],
  ['Magma','magma.cx','2022-03-16'],
  ['Mercuria','mercuria.tv','2023-01-24'],
  ['Misssunshinefilms','misssunshinefilms.com','2025-07-08'],
  ['Mixer','www.mixer.com.br','1975-01-01'],
  ['Modernistasp','www.modernistasp.com','2021-02-17'],
  ['Estudiomol','estudiomol.tv','2024-08-22'],
  ['Moonheist','www.moonheist.com','2020-08-07'],
  ['Earemovie','www.wearemovie.tv','1981-01-01'],
  ['Mugshot','www.mugshot.com.br','2019-02-26'],
  ['Mymama','www.mymama.com.br','2016-11-16'],
  ['Nocandy','nocandy.film','2021-09-17'],
  ['Nuv M','www.nuv-m.co','2022-05-18'],
  ['O2 Filmes','www.o2filmes.com','1986-01-01'],
  ['Oceanfilms','www.oceanfilms.com.br','2022-06-10'],
  ['Estudiopegrande','www.estudiopegrande.com.br','2025-04-01'],
  ['Pancs','www.pancs.tv','2002-03-22'],
  ['Paranoidbr','www.paranoidbr.com','2009-09-01'],
  ['Peoplemedia','peoplemedia.io','2025-04-04'],
  ['Piloto','www.piloto.tv','2008-02-01'],
  ['Pingado','pingado.audio','2025-08-06'],
  ['Play9','www.play9.com.br','2021-08-17'],
  ['Pluralimagemesom','pluralimagemesom.com.br','2025-04-01'],
  ['Polvo','www.polvo.art','2018-05-25'],
  ['Primocontent','www.primocontent.com','2023-09-29'],
  ['Prodigo','www.prodigo.com.br','2001-01-01'],
  ['Associados','associados.tv','1988-01-01'],
  ['Quietcity','www.quietcity.co','2024-02-08'],
  ['Rebolucion','www.rebolucion.com','2011-10-01'],
  ['Sailor','sailor.studio','2024-12-12'],
  ['Santatransmedia','www.santatransmedia.com','2011-04-01'],
  ['Sateliteaudio','www.sateliteaudio.com','2017-05-17'],
  ['Sdesamba','www.sdesamba.com.br','2020-03-04'],
  ['Seiva','seiva.tv','2021-02-10'],
  ['Sentimental','www.sentimental.com.br','2001-01-01'],
  ['Somafilms','www.somafilms.com.br','2020-06-12'],
  ['Stinkfilms','www.stinkfilms.com','2013-03-26'],
  ['Studiogreat','www.studiogreat.com.br','2021-10-20'],
  ['Surrealhotelarts','surrealhotelarts.com','2021-08-25'],
  ['Teleimage','www.teleimage.com.br','2018-12-18'],
  ['Theyouth','theyouth.com.br','2024-10-01'],
  ['Tropical','www.tropical.film','2021-04-27'],
  ['Ultravioleta','ultravioleta.tv','2020-09-07'],
  ['Untitled','www.untitled.tv.br','2020-04-24'],
  ['Voxhaus','voxhaus.com.br','2023-09-13'],
  ['Zeppfilmes','www.zeppfilmes.com','2022-03-22'],
  ['Zoharcinema','zoharcinema.com.br','1990-01-01'],
  ['Zombiestudio','zombiestudio.com.br','2020-12-07'],
];

const refreshBtn = document.getElementById('refreshBtn');
const seedBtn = document.getElementById('seedBtn');
const countPill = document.getElementById('countPill');
const savePill = document.getElementById('savePill');
const errPill = document.getElementById('errPill');
const viewPill = document.getElementById('viewPill');
const netDot = document.getElementById('netDot');
const netText = document.getElementById('netText');
const inviterInput = document.getElementById('inviterInput');
const startBtn = document.getElementById('startBtn');
const chooser = document.getElementById('chooser');
const gate = document.getElementById('gate');
const grid = document.getElementById('grid');
const copyLinkBtn = document.getElementById('copyLinkBtn');
let CURRENT_INVITER = '';

function setNet(status, text){
  netDot.className = 'dot ' + (status||'');
  netText.textContent = text || 'Pronto';
}

function apiLocal(path, opts={}){
  // Ensure we use the same origin for API calls
  const url = path.startsWith('/') ? path : `/${path}`;
  console.log('Making API call to:', url);
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  }).then(async r=>{ 
    console.log('API Response status:', r.status, r.statusText);
    if(!r.ok) {
      const errorText = await r.text();
      console.error('API Error:', errorText);
      throw new Error(errorText);
    }
    return r.json(); 
  });
}

async function listRecords(){
  try {
    const params = new URLSearchParams({ 
      limit: '1000', 
      offset: '0',
      tableId: CONFIG.tableId
    });
    if (CONFIG.viewId) params.set('viewId', CONFIG.viewId);
    
    console.log('Calling API:', `/api/produtoras/list?${params}`);
    const res = await apiLocal(`/api/produtoras/list?${params}`);
    console.log('API Response:', res);
    
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.list)) return res.list;
    if (res && res.success && Array.isArray(res.list)) return res.list;
    
    console.warn('Unexpected list response shape:', res);
    return [];
  } catch (error) {
    console.error('Error in listRecords:', error);
    throw error;
  }
}

async function createMany(payload){
  // No-op via proxy (not needed in production UI)
  return { ok: true };
}

async function patchRecord(id, payload){
  const body = JSON.stringify(payload);
  const params = new URLSearchParams();
  if (CONFIG.tableId) params.set('tableId', CONFIG.tableId);
  const queryString = params.toString();
  const url = `/api/produtoras/${id}${queryString ? '?' + queryString : ''}`;
  return apiLocal(url, { method:'PATCH', body });
}

function renderGrid(rows){
  grid.innerHTML = '';
  console.log('renderGrid called with rows:', rows);
  console.log('Total rows received:', rows.length);
  
  // count only the still-available (empty inviter) items
  const availableCount = rows.filter(r => {
    const v = r[CONFIG.columns.inviter];
    const isEmpty = v === undefined || v === null || String(v).trim() === '';
    console.log('Row:', r[CONFIG.columns.name], 'inviter:', v, 'isEmpty:', isEmpty);
    return isEmpty;
  }).length;
  
  console.log('Available count:', availableCount);
  countPill.textContent = `${availableCount} disponíveis`;
  savePill.style.display = 'none'; errPill.style.display = 'none';
  viewPill.style.display = CONFIG.viewId ? 'inline-block' : 'none';

  for(const row of rows){
    const id = row.Id || row.id || row.__id || row.ncRecordId;
    const name = row[CONFIG.columns.name] ?? row.name ?? '';
    const site = row[CONFIG.columns.website] ?? row.website ?? '';
    const inviterVal = row[CONFIG.columns.inviter];
    const isEmpty = inviterVal === undefined || inviterVal === null || String(inviterVal).trim() === '';
    const isMine = CURRENT_INVITER && String(inviterVal||'').trim().toLowerCase() === CURRENT_INVITER.trim().toLowerCase();

    // Hide if taken by someone else
    if (!isEmpty && !isMine) continue;

    const btn = document.createElement('button');
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'flex-start';
    btn.style.gap = '2px';
    btn.style.padding = '12px';
    btn.style.textAlign = 'left';
    // base colors
    const baseBg = '#1b1e24';
    const baseBorder = '#23252b';
    const pickedBg = '#142b19'; // green-ish
    const pickedBorder = 'rgba(22,163,74,.45)';

    if (isMine){
      btn.style.background = pickedBg;
      btn.style.borderColor = pickedBorder;
    } else {
      btn.style.background = baseBg;
      btn.style.borderColor = baseBorder;
    }

    btn.innerHTML = `
      <span style="font-weight:600">${escapeHtml(name)}</span>
      <span class="mono">${escapeHtml(site)}</span>
      ${isMine ? '<span class="pill ok" style="margin-top:6px">Selecionado por você</span>' : ''}
    `;

    btn.addEventListener('click', async ()=>{
      if(!CURRENT_INVITER) return;
      setNet('sync','Salvando…');
      btn.disabled = true;
      try{
        // 1) Fetch current to avoid overwriting someone else concurrently
        const params = new URLSearchParams();
        if (CONFIG.tableId) params.set('tableId', CONFIG.tableId);
        const queryString = params.toString();
        const url = `/api/produtoras/${id}${queryString ? '?' + queryString : ''}`;
        const rec = await apiLocal(url);
        const currentInviter = rec[CONFIG.columns.inviter];
        const takenBySomeoneElse = currentInviter && String(currentInviter).trim() !== '' && String(currentInviter).trim().toLowerCase() !== CURRENT_INVITER.trim().toLowerCase();
        if (takenBySomeoneElse){
          // already taken, refresh list
          await boot();
          setNet('warn','Já foi escolhido por outra pessoa');
          btn.disabled = false;
          return;
        }

        // 2) Toggle assign: if already mine -> unselect; else -> select
        if (isMine){
          await patchRecord(id, { [CONFIG.columns.inviter]: '' });
          // style back to default
          btn.style.background = baseBg;
          btn.style.borderColor = baseBorder;
          const tag = btn.querySelector('.pill');
          if (tag) tag.remove();
          // available count +1
          countPill.textContent = `${(parseInt(countPill.textContent)||0) + 1} disponíveis`;
        } else {
          await patchRecord(id, { [CONFIG.columns.inviter]: CURRENT_INVITER });
          btn.style.background = pickedBg;
          btn.style.borderColor = pickedBorder;
          if (!btn.querySelector('.pill')){
            const tag = document.createElement('span');
            tag.className = 'pill ok';
            tag.style.marginTop = '6px';
            tag.textContent = 'Selecionado por você';
            btn.appendChild(tag);
          }
          // available count -1
          countPill.textContent = `${Math.max(0, (parseInt(countPill.textContent)||0) - 1)} disponíveis`;
        }

        // 3) Copy subframe URL to clipboard for convenience
        try{
          await navigator.clipboard.writeText('https://subframe.onav.com.br/');
        }catch(e){ console.warn('Clipboard API failed', e); }
        savePill.style.display = 'inline-block';
        errPill.style.display = 'none';
        setNet('ok','Atribuído');
        setTimeout(()=>{ savePill.style.display='none'; setNet('', 'Pronto'); }, 1200);
      }catch(err){
        console.error('Save error', err);
        errPill.style.display = 'inline-block';
        savePill.style.display = 'none';
        setNet('err','Erro ao salvar');
        btn.disabled = false;
      }
    });

    grid.appendChild(btn);
  }
}

function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
}
function formatDateBR(d){
  if(!d) return '';
  const dt = new Date(d);
  if(Number.isNaN(+dt)) return String(d);
  const dd = String(dt.getDate()).padStart(2,'0');
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

async function seedIfEmpty(){
  const rows = await listRecords();
  if (rows.length > 0) return false;
  // seed from DATASET
  const payload = DATASET.map(([n,s,w])=>({
    [CONFIG.columns.name]: n,
    [CONFIG.columns.website]: s,
    [CONFIG.columns.since]: w,
  }));
  await createMany(payload);
  return true;
}

async function boot(){
  try{
    setNet('sync','Carregando…');
    console.log('Starting boot process...');
    console.log('CONFIG:', CONFIG);
    
    const seeded = false; // seeding disabled in proxy mode
    const rows = await listRecords();
    console.log('Received rows:', rows);
    console.log('Sample row structure:', rows[0]);
    console.log('CONFIG.columns:', CONFIG.columns);
    
    // Show only empty or mine
    const filtered = rows.filter(r => {
      const v = r[CONFIG.columns.inviter];
      const empty = v === undefined || v === null || String(v).trim() === '';
      const mine = CURRENT_INVITER && String(v||'').trim().toLowerCase() === CURRENT_INVITER.trim().toLowerCase();
      console.log('Filtering row:', r[CONFIG.columns.name], 'inviter value:', v, 'empty:', empty, 'mine:', mine);
      return empty || mine;
    });
    console.log('Filtered rows:', filtered.length);
    
    renderGrid(filtered);
    setNet('', seeded ? 'Dados criados e carregados' : 'Carregado');
  }catch(err){
    console.error('Boot error:', err);
    console.error('Error details:', {
      message: err.message,
      status: err.status,
      stack: err.stack
    });
    setNet('err','Falha ao carregar');
    errPill.style.display = 'inline-block';
    errPill.textContent = `Erro: ${err.message}`;
  }
}

if (refreshBtn) refreshBtn.addEventListener('click', boot);
if (seedBtn) seedBtn.addEventListener('click', async ()=>{ /* disabled */ await boot(); });
if (copyLinkBtn) copyLinkBtn.addEventListener('click', async ()=>{
  try{
    await navigator.clipboard.writeText('https://subframe.onav.com.br/');
    setNet('ok','Link copiado');
    setTimeout(()=> setNet('', 'Pronto'), 1200);
  }catch(e){ setNet('err','Falha ao copiar'); }
});

startBtn.addEventListener('click', async ()=>{
  const name = inviterInput.value.trim();
  if(!name){ inviterInput.focus(); return; }
  CURRENT_INVITER = name;
  chooser.style.display = 'block';
  gate.style.display = 'none';
  await boot();
});

// Test API connection immediately on page load
window.addEventListener('DOMContentLoaded', async () => {
  console.log('Testing API connection...');
  try {
    const testUrl = '/api/produtoras/list?tableId=moxaifq5xp4bl76&limit=1';
    console.log('Testing URL:', testUrl);
    const response = await fetch(testUrl);
    console.log('Test response status:', response.status);
    const data = await response.json();
    console.log('Test response data:', data);
    
    if (data.success && data.list) {
      console.log('✅ API connection working! Found', data.list.length, 'records');
      setNet('ok', 'API conectado');
    } else {
      console.log('❌ API returned unexpected format:', data);
      setNet('err', 'Formato inesperado');
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
    setNet('err', 'API falhou');
  }
});

inviterInput.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') startBtn.click();
});

