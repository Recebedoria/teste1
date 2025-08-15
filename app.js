// Simple demo app using localStorage. No backend.
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const KEYS = {
  USERS: 'demo_users',
  ENTRIES: 'demo_entries',
  SESSION: 'demo_session',
  PERMS: 'demo_perms'
};

function sha256(str){
  const enc = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', enc).then(buf => {
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  });
}

function load(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch(e){ return fallback }
}
function save(key, obj){ localStorage.setItem(key, JSON.stringify(obj)) }

// Seed admin ALPHA RED on first run
(function seed(){
  const users = load(KEYS.USERS, []);
  if(!users.find(u=>u.matricula==='0001')){
    // Default password: Admin@123!
    users.push({ nome:'ALPHA RED', matricula:'0001', tipo:'Diretor', hash:'', admin:true, foto:null });
    save(KEYS.USERS, users);
    sha256('Admin@123!').then(h=>{
      const u = load(KEYS.USERS, []);
      const idx = u.findIndex(x=>x.matricula==='0001');
      if(idx>=0){ u[idx].hash = h; save(KEYS.USERS, u); }
    });
    // Give gerente permission template
    save(KEYS.PERMS, { // permission flags by matricula
      // example: '1234': {managePerms:true}
    });
  }
})();

function show(id){ qsa('.screen,.view').forEach(el=>el.classList.add('hidden')); qs(id).classList.remove('hidden'); }

// Toggle eye buttons
qs('#toggle-login-eye').addEventListener('click', ()=>{
  const i = qs('#login-senha'); i.type = i.type==='password'?'text':'password';
});
qs('#toggle-reg-eye').addEventListener('click', ()=>{
  const i = qs('#reg-senha'); i.type = i.type==='password'?'text':'password';
});

// Navigation
qsa('.menuleft .link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    qsa('.view').forEach(v=>v.classList.add('hidden'));
    qs('#view-'+btn.dataset.view).classList.remove('hidden');
    if(btn.dataset.view==='consulta') renderConsulta();
    if(btn.dataset.view==='permissoes') renderPerms();
    if(btn.dataset.view==='novo-relatorio') { renderMyEntries(); }
  });
});

// Login & Register screen toggles
qs('#btn-open-register').addEventListener('click', ()=> show('#register-screen'));
qs('#btn-cancelar-cadastro').addEventListener('click', ()=> show('#login-screen'));

function validatePassword(pw){
  return /[A-Z]/.test(pw) && /\d/.test(pw) && /[^\w\s]/.test(pw);
}

qs('#btn-registrar').addEventListener('click', async ()=>{
  const nome = qs('#reg-nome').value.trim();
  const matricula = qs('#reg-matricula').value.trim();
  const tipo = qs('#reg-tipo').value;
  const senha = qs('#reg-senha').value;
  const confirma = qs('#reg-confirma').value;
  const alert = qs('#reg-alert');

  alert.classList.add('hidden');
  alert.textContent = '';

  if(!nome || !matricula || !senha || !confirma){
    alert.textContent = 'Preencha todos os campos.';
    alert.classList.remove('hidden'); return;
  }
  const users = load(KEYS.USERS, []);
  if(users.find(u=>u.matricula===matricula)){
    alert.textContent = 'Já existe usuário com esta matrícula.';
    alert.classList.remove('hidden'); return;
  }
  if(senha !== confirma){
    alert.textContent = 'As senhas não conferem.';
    alert.classList.remove('hidden'); return;
  }
  if(!validatePassword(senha)){
    alert.textContent = 'A senha não atende aos requisitos.';
    alert.classList.remove('hidden'); return;
  }
  const hash = await sha256(senha);
  users.push({ nome, matricula, tipo, hash, admin:false, foto:null });
  save(KEYS.USERS, users);
  // volta para login
  show('#login-screen');
});

qs('#btn-login').addEventListener('click', async ()=>{
  const matricula = qs('#login-matricula').value.trim();
  const senha = qs('#login-senha').value;
  const users = load(KEYS.USERS, []);
  const u = users.find(x=>x.matricula===matricula);
  if(!u){ alert('Matrícula não encontrada.'); return; }
  const h = await sha256(senha);
  if(h !== u.hash){ alert('Senha incorreta.'); return; }
  save(KEYS.SESSION, { matricula:u.matricula });
  enterApp(u);
});

function enterApp(user){
  // fill UI
  qs('#ui-nome').textContent = user.nome + (user.admin?' (Administrador)':'');
  qs('#ui-mat').textContent = user.matricula;
  qs('#ui-tipo').textContent = user.tipo;
  if(user.foto){ qs('#foto').src = user.foto } else { qs('#foto').src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"44\" height=\"44\"><rect width=\"100%\" height=\"100%\" fill=\"#111827\"/><text x=\"50%\" y=\"55%\" fill=\"#9ca3af\" font-size=\"12\" text-anchor=\"middle\">foto</text></svg>'); }
  show('#app');
  // default view
  qsa('.view').forEach(v=>v.classList.add('hidden'));
  qs('#view-home').classList.remove('hidden');
  renderMyEntries();
}

qs('#btn-sair').addEventListener('click', ()=>{
  localStorage.removeItem(KEYS.SESSION);
  show('#login-screen');
});

// Foto upload
qs('#btn-foto').addEventListener('click', ()=> qs('#upload-foto').click());
qs('#upload-foto').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    const session = load(KEYS.SESSION, null);
    if(!session) return;
    const users = load(KEYS.USERS, []);
    const idx = users.findIndex(u=>u.matricula===session.matricula);
    if(idx>=0){ users[idx].foto = reader.result; save(KEYS.USERS, users); qs('#foto').src = reader.result; }
  };
  reader.readAsDataURL(file);
});

// Entradas (lançamentos)
function currentUser(){
  const session = load(KEYS.SESSION, null);
  if(!session) return null;
  const users = load(KEYS.USERS, []);
  return users.find(u=>u.matricula===session.matricula) || null;
}

qs('#form-diff').addEventListener('submit', (e)=>{
  e.preventDefault();
  const user = currentUser(); if(!user) return;
  const entries = load(KEYS.ENTRIES, []);
  entries.push({
    matricula:user.matricula,
    data: qs('#dif-data').value,
    desc: qs('#dif-desc').value,
    valor: parseFloat(qs('#dif-valor').value || 0),
    id: Date.now()
  });
  save(KEYS.ENTRIES, entries);
  qs('#form-diff').reset();
  renderMyEntries();
});

function renderMyEntries(){
  const user = currentUser(); if(!user) return;
  const entries = load(KEYS.ENTRIES, []).filter(e=>e.matricula===user.matricula);
  const tbody = qs('#tbl-meus tbody');
  tbody.innerHTML = '';
  let subtotal = 0;
  for(const e of entries){
    if(e.valor < -5){ subtotal += e.valor; }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${e.data||''}</td><td>${e.desc||''}</td><td>${e.valor.toFixed(2)}</td><td><button class="secondary small" data-id="${e.id}">Excluir</button></td>`;
    tbody.appendChild(tr);
  }
  qs('#subtotal').textContent = subtotal.toFixed(2);
  qs('#restituir').textContent = Math.abs(subtotal).toFixed(2);
  tbody.querySelectorAll('button[data-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = Number(btn.dataset.id);
      const all = load(KEYS.ENTRIES, []);
      save(KEYS.ENTRIES, all.filter(x=>x.id!==id));
      renderMyEntries();
    });
  });
}

// Consulta
function renderConsulta(){
  const user = currentUser(); if(!user) return;
  const tbody = qs('#tbl-consulta tbody');
  tbody.innerHTML = '';
  const users = load(KEYS.USERS, []);
  const entries = load(KEYS.ENTRIES, []);

  const canSeeAll = user.admin || user.tipo==='Diretor';
  qs('#consulta-info').textContent = canSeeAll ? 'Visualizando todos os usuários.' : 'Visualizando apenas seus próprios dados.';

  for(const u of users){
    if(!canSeeAll && u.matricula !== user.matricula) continue;
    const uEntries = entries.filter(e=>e.matricula===u.matricula);
    let subtotal = 0;
    for(const e of uEntries){ if(e.valor < -5) subtotal += e.valor; }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.matricula}</td><td>${u.nome}</td><td>${u.tipo}${u.admin?' (Adm)':''}</td><td>${uEntries.length}</td><td>${subtotal.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  }
}

// Permissões
function renderPerms(){
  const user = currentUser(); if(!user) return;
  const wrap = qs('#perm-wrap');
  wrap.innerHTML = '';

  const canManage = user.admin || (user.tipo==='Gerente' && getPerm(user.matricula).managePerms);
  if(!canManage){
    wrap.innerHTML = '<p>Você não tem permissão para gerenciar permissões.</p>';
    return;
  }
  const users = load(KEYS.USERS, []);
  for(const u of users){
    const row = document.createElement('div');
    row.className = 'panel';
    row.style.marginBottom = '8px';
    const perms = getPerm(u.matricula);
    row.innerHTML = \`
      <div class="grid">
        <div><strong>\${u.nome}</strong><br/><span class="muted">Mat.: \${u.matricula} - \${u.tipo} \${u.admin?'(Adm)':''}</span></div>
        <div>
          <label><input type="checkbox" data-key="managePerms" \${perms.managePerms?'checked':''}/> Gerenciar permissões</label>
        </div>
        <div>
          <button class="secondary small" data-action="toggle-admin">\${u.admin?'Remover Admin':'Tornar Admin'}</button>
        </div>
      </div>
    \`;
    // events
    row.querySelectorAll('input[type="checkbox"]').forEach(chk=>{
      chk.addEventListener('change', ()=>{
        const p = getPerm(u.matricula);
        p[chk.dataset.key] = chk.checked;
        setPerm(u.matricula, p);
      });
    });
    row.querySelector('[data-action="toggle-admin"]').addEventListener('click', ()=>{
      const me = currentUser();
      if(!me.admin){ alert('Apenas administrador pode designar outro administrador.'); return; }
      const all = load(KEYS.USERS, []);
      const idx = all.findIndex(x=>x.matricula===u.matricula);
      if(idx>=0){
        all[idx].admin = !all[idx].admin;
        save(KEYS.USERS, all);
        renderPerms();
        renderConsulta();
        if(me.matricula===u.matricula) enterApp(all[idx]); // refresh header badge
      }
    });
    wrap.appendChild(row);
  }
}

function getPerm(matricula){
  const p = load(KEYS.PERMS, {});
  return p[matricula] || { managePerms:false };
}
function setPerm(matricula, perms){
  const p = load(KEYS.PERMS, {});
  p[matricula] = perms;
  save(KEYS.PERMS, p);
}

// Restore session
(function init(){
  const s = load(KEYS.SESSION, null);
  if(s){
    const u = load(KEYS.USERS, []).find(x=>x.matricula===s.matricula);
    if(u) enterApp(u);
  } else {
    show('#login-screen');
  }
})();
