const KEYS={events:'club_events',registrations:'club_registrations',session:'club_admin_session'};
const CATEGORIES=['Coding','Hackathon','Workshop','Seminar','Competition'];
const FORMATS=['In person','Online','Hybrid'];
const YEARS=['1st Year','2nd Year','3rd Year','4th Year'];
const ADMIN_LOGIN={username:'admin',password:'codechef123'};
const SEED_EVENTS=[
{id:'evt-codesprint',name:'CodeSprint 2026',category:'Coding',date:'2026-10-15',time:'10:00',venue:'Computer Lab 2',description:'A three-hour individual coding contest with problems ranging from warm-ups to hard finishers. Solve as many as you can before the clock runs out.',eligibility:'Open to all undergraduate students',format:'In person',featured:false},
{id:'evt-hackforge',name:'HackForge',category:'Hackathon',date:'2026-11-07',time:'09:00',venue:'Innovation Hall',description:'A 24-hour team hackathon where you pick a problem, build a working prototype and demo it to a panel of faculty and alumni mentors.',eligibility:'Teams of 2 to 4 students from any branch',format:'In person',featured:true},
{id:'evt-frontend',name:'Frontend Fundamentals',category:'Workshop',date:'2026-09-12',time:'14:00',venue:'Seminar Room 1',description:'A hands-on session covering semantic HTML, CSS layout and DOM scripting. Participants build a small interactive page by the end.',eligibility:'Beginners welcome, bring a laptop',format:'In person',featured:false},
{id:'evt-techtalk',name:'TechTalk: Future of AI',category:'Seminar',date:'2026-10-28',time:'16:00',venue:'Main Auditorium',description:'An open talk and Q&A on how machine learning is changing software development and which skills students should build next.',eligibility:'Open to all students and faculty',format:'Hybrid',featured:false}
];

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));

function readList(key){
  try{
    const value=JSON.parse(localStorage.getItem(key));
    return Array.isArray(value)?value:null;
  }catch(error){
    return null;
  }
}

function writeList(key,list){
  try{
    localStorage.setItem(key,JSON.stringify(list));
    return true;
  }catch(error){
    return false;
  }
}

function getEvents(){
  let list=readList(KEYS.events);
  if(!list){
    list=SEED_EVENTS;
    writeList(KEYS.events,list);
  }
  return list.filter(event=>event&&event.id&&event.name&&event.date);
}

function getRegistrations(){
  return(readList(KEYS.registrations)||[]).filter(item=>item&&item.registrationId);
}

function isAuthenticated(){
  try{
    return localStorage.getItem(KEYS.session)==='true';
  }catch(error){
    return false;
  }
}

function setAuthenticated(value){
  try{
    if(value){localStorage.setItem(KEYS.session,'true')}else{localStorage.removeItem(KEYS.session)}
  }catch(error){
    return;
  }
}

function esc(value){
  const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(value==null?'':value).replace(/[&<>"']/g,char=>map[char]);
}

function todayString(){
  const now=new Date();
  return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
}

function isUpcoming(event){
  return event.date>=todayString();
}

function formatDate(value){
  const date=new Date(value+'T00:00:00');
  return isNaN(date)?value:date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}

function formatTime(value){
  const parts=String(value||'').split(':').map(Number);
  if(isNaN(parts[0]))return value||'';
  return (parts[0]%12||12)+':'+String(parts[1]||0).padStart(2,'0')+' '+(parts[0]<12?'AM':'PM');
}

function plural(count,word){
  return count+' '+word+(count===1?'':'s');
}

function sortByDate(list){
  return [...list].sort((a,b)=>a.date.localeCompare(b.date));
}

function detailRows(rows){
  return rows.map(row=>'<div><dt>'+row[0]+'</dt><dd>'+esc(row[1])+'</dd></div>').join('');
}

function registerButton(event,className){
  if(!isUpcoming(event)){
    return '<span class="btn btn-disabled" aria-disabled="true">Closed</span>';
  }
  return '<a class="btn '+(className||'btn-primary')+'" href="register.html?id='+encodeURIComponent(event.id)+'">Register</a>';
}

function cardHTML(event){
  return '<article class="event-card">'+
    '<div class="card-top"><span class="date-tag">'+formatDate(event.date)+'</span><span class="badge">'+esc(event.category)+'</span></div>'+
    '<div class="card-body"><h3>'+esc(event.name)+'</h3><p>'+esc(event.description)+'</p></div>'+
    '<dl class="meta"><div><dt>Time</dt><dd>'+formatTime(event.time)+'</dd></div><div><dt>Venue</dt><dd>'+esc(event.venue)+'</dd></div></dl>'+
    '<div class="card-actions"><button class="btn btn-ghost" type="button" data-details="'+esc(event.id)+'">View Details</button>'+registerButton(event)+'</div>'+
    '</article>';
}

function emptyEventsHTML(){
  return '<div class="empty-state"><h3>NO EVENTS FOUND</h3><p>Try changing your search or filters.</p><button class="btn btn-outline" type="button" data-clear>Clear Filters</button></div>';
}

let lastFocused=null;

function openModal(html,label){
  closeModal();
  lastFocused=document.activeElement;
  const overlay=document.createElement('div');
  overlay.className='modal-overlay';
  overlay.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(label)+'" tabindex="-1">'+html+'</div>';
  overlay.addEventListener('mousedown',event=>{
    if(event.target===overlay)closeModal();
  });
  document.body.append(overlay);
  document.body.classList.add('no-scroll');
  const modal=$('.modal',overlay);
  $$('[data-close]',overlay).forEach(button=>button.addEventListener('click',closeModal));
  const firstField=$('input,select,textarea',modal);
  (firstField||modal).focus();
  return modal;
}

function closeModal(){
  const overlay=$('.modal-overlay');
  if(!overlay)return;
  overlay.remove();
  document.body.classList.remove('no-scroll');
  if(lastFocused&&lastFocused.focus)lastFocused.focus();
}

function trapFocus(event){
  const modal=$('.modal');
  if(!modal||event.key!=='Tab')return;
  const items=$$('button,a[href],input,select,textarea',modal).filter(item=>!item.disabled);
  if(!items.length)return;
  const first=items[0];
  const last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}

function showDetails(id){
  const event=getEvents().find(item=>item.id===id);
  if(!event)return;
  openModal(
    '<button class="modal-x" type="button" data-close aria-label="Close">&times;</button>'+
    '<div><span class="badge">'+esc(event.category)+'</span></div>'+
    '<h2>'+esc(event.name)+'</h2>'+
    '<p class="muted">'+esc(event.description)+'</p>'+
    '<dl class="detail-list">'+detailRows([['Date',formatDate(event.date)],['Time',formatTime(event.time)],['Venue',event.venue],['Eligibility',event.eligibility],['Event format',event.format],['Registration',isUpcoming(event)?'Open':'Closed']])+'</dl>'+
    '<div class="modal-actions">'+registerButton(event)+'<button class="btn btn-ghost" type="button" data-close>Close</button></div>',
    event.name
  );
}

function renderChrome(){
  const page=document.body.dataset.page;
  const active={home:'home',events:'events',register:'events'}[page];
  const links=[['Home','index.html','home'],['Events','events.html','events'],['About','index.html#about','about'],['Admin','admin.html','admin']];
  const header=$('#site-header');
  if(header){
    header.innerHTML='<div class="container nav-bar">'+
      '<a class="brand" href="index.html" aria-label="CodeChef Campus Club home"><strong>CODECHEF</strong><span>CAMPUS CLUB</span></a>'+
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Toggle menu"><span></span><span></span><span></span></button>'+
      '<nav class="site-nav" id="site-nav" aria-label="Main"><ul>'+
      links.map(link=>'<li><a class="nav-link'+(link[2]===active?' active':'')+'" href="'+link[1]+'"'+(link[2]===active?' aria-current="page"':'')+'>'+link[0]+'</a></li>').join('')+
      '</ul><a class="btn btn-primary btn-sm" href="events.html">Explore Events</a></nav></div>';
    const toggle=$('.nav-toggle',header);
    const nav=$('#site-nav',header);
    toggle.addEventListener('click',()=>{
      const open=nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
    });
    $$('a',nav).forEach(link=>link.addEventListener('click',()=>{
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }));
  }
  const footer=$('#site-footer');
  if(footer){
    footer.innerHTML='<div class="container"><div class="footer-grid">'+
      '<div><h3>CodeChef Campus Club</h3><p>Learn. Build. Compete.</p></div>'+
      '<div><h3>Quick Links</h3><ul>'+links.map(link=>'<li><a href="'+link[1]+'">'+link[0]+'</a></li>').join('')+'</ul></div>'+
      '<div><h3>Contact</h3><ul><li>club@campus.example</li><li>Instagram: @codechef.campus</li><li>Room 204, Computer Science Block</li></ul></div>'+
      '</div><p class="footer-base">&copy; 2026 CodeChef Campus Club. A student-run community.</p></div>';
  }
}

function fieldHTML(name,label,control,className){
  return '<div class="field '+(className||'')+'"><label for="f-'+name+'">'+label+'</label>'+control+'<p class="field-error" data-error="'+name+'"></p></div>';
}

function optionsHTML(list,selected,placeholder){
  const first=placeholder?'<option value="">'+placeholder+'</option>':'';
  return first+list.map(item=>'<option value="'+esc(item)+'"'+(item===selected?' selected':'')+'>'+esc(item)+'</option>').join('');
}

function showErrors(form,errors){
  $$('[data-error]',form).forEach(node=>{
    const message=errors[node.dataset.error]||'';
    node.textContent=message;
    const input=form.elements[node.dataset.error];
    if(input){
      input.classList.toggle('invalid',Boolean(message));
      input.setAttribute('aria-invalid',message?'true':'false');
    }
  });
}

function nextUpcoming(events){
  return sortByDate(events.filter(isUpcoming))[0];
}

function initHome(){
  const events=getEvents();
  const upcoming=sortByDate(events.filter(isUpcoming));
  const next=upcoming[0];
  $('#next-event').innerHTML=next?
    '<span class="panel-label">Next event</span><h2>'+esc(next.name)+'</h2>'+
    '<dl>'+detailRows([['Date',formatDate(next.date)],['Time',formatTime(next.time)],['Venue',next.venue]])+'</dl>'+
    '<a class="btn btn-primary" href="register.html?id='+encodeURIComponent(next.id)+'">Register &rarr;</a>':
    '<span class="panel-label">Next event</span><h2>Nothing scheduled yet</h2><p>New events are announced here as soon as they are added.</p>';
  $('#upcoming-grid').innerHTML=upcoming.length?upcoming.slice(0,3).map(cardHTML).join(''):
    '<div class="empty-state"><h3>NO UPCOMING EVENTS</h3><p>Check back soon, or browse past events.</p><a class="btn btn-outline" href="events.html">Browse Events</a></div>';
  const featured=events.find(item=>item.featured&&isUpcoming(item))||events.find(item=>item.featured)||next;
  const featuredSection=$('#featured-section');
  if(featured){
    $('#featured-event').innerHTML=
      '<div><span class="badge badge-accent">Featured event</span><h2>'+esc(featured.name)+'</h2><p>'+esc(featured.description)+'</p></div>'+
      '<div><dl>'+detailRows([['Date',formatDate(featured.date)],['Time',formatTime(featured.time)],['Venue',featured.venue]])+'</dl>'+
      '<div class="btn-row"><button class="btn btn-light" type="button" data-details="'+esc(featured.id)+'">View Details</button>'+registerButton(featured)+'</div></div>';
  }else{
    featuredSection.hidden=true;
  }
  $('#category-grid').innerHTML=CATEGORIES.map(category=>{
    const count=events.filter(item=>item.category===category).length;
    return '<a class="category-tile" href="events.html?category='+encodeURIComponent(category)+'"><span>'+category+'</span><strong>'+plural(count,'event')+'</strong></a>';
  }).join('');
}

function initEvents(){
  const state={q:'',category:'all',status:'all',sort:'date'};
  const requested=new URLSearchParams(location.search).get('category');
  if(CATEGORIES.includes(requested))state.category=requested;
  const controls={q:$('#search'),category:$('#category'),status:$('#status'),sort:$('#sort')};
  const grid=$('#events-grid');
  const count=$('#result-count');

  function visibleEvents(){
    const query=state.q.trim().toLowerCase();
    const list=getEvents().filter(event=>{
      const text=[event.name,event.description,event.category,event.venue].join(' ').toLowerCase();
      const matchesQuery=!query||text.includes(query);
      const matchesCategory=state.category==='all'||event.category===state.category;
      const matchesStatus=state.status==='all'||(state.status==='upcoming'?isUpcoming(event):!isUpcoming(event));
      return matchesQuery&&matchesCategory&&matchesStatus;
    });
    return state.sort==='name'?list.sort((a,b)=>a.name.localeCompare(b.name)):sortByDate(list);
  }

  function render(){
    const list=visibleEvents();
    count.textContent=plural(list.length,'event');
    grid.innerHTML=list.length?list.map(cardHTML).join(''):emptyEventsHTML();
  }

  Object.keys(controls).forEach(key=>{
    controls[key].value=state[key];
    controls[key].addEventListener(key==='q'?'input':'change',()=>{
      state[key]=controls[key].value;
      render();
    });
  });

  grid.addEventListener('click',event=>{
    if(!event.target.closest('[data-clear]'))return;
    Object.assign(state,{q:'',category:'all',status:'all',sort:'date'});
    Object.keys(controls).forEach(key=>{controls[key].value=state[key]});
    render();
  });
  render();
}

function validateRegistration(data){
  const errors={};
  if(!data.name.trim())errors.name='Enter your full name.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim()))errors.email='Enter a valid email address.';
  if(!data.college.trim())errors.college='Enter your college name.';
  if(!data.year)errors.year='Select your year.';
  if(!/^[6-9]\d{9}$/.test(data.phone.replace(/[\s-]/g,'')))errors.phone='Enter a valid 10-digit Indian mobile number.';
  return errors;
}

function createRegistrationId(existing){
  let id;
  do{
    id='CC26-'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0').toUpperCase();
  }while(existing.some(item=>item.registrationId===id));
  return id;
}

function initRegister(){
  const root=$('#register-root');
  const id=new URLSearchParams(location.search).get('id');
  const event=getEvents().find(item=>item.id===id);

  function message(title,text){
    root.innerHTML='<div class="success"><h1>'+title+'</h1><p class="muted">'+text+'</p><a class="btn btn-primary" href="events.html">Back to Events</a></div>';
  }

  if(!event){message('Event not found','The event you are looking for is missing or has been removed.');return}
  if(!isUpcoming(event)){message('Registration closed',esc(event.name)+' has already taken place.');return}

  function showSuccess(record){
    root.innerHTML='<div class="success"><div class="check-mark" aria-hidden="true">&#10003;</div>'+
      '<span class="eyebrow">Registration confirmed</span><h1>You&rsquo;re officially registered.</h1>'+
      '<p class="muted">Registration ID</p><div class="reg-id">'+record.registrationId+'</div>'+
      '<dl>'+detailRows([['Name',record.name],['Event',record.eventName],['Date',formatDate(event.date)]])+'</dl>'+
      '<div class="btn-row"><a class="btn btn-primary" href="events.html">Back to Events</a><button class="btn btn-ghost" type="button" id="register-another">Register Another</button></div></div>';
    $('#register-another').addEventListener('click',showForm);
  }

  function showForm(){
    root.innerHTML='<div class="container register-layout">'+
      '<section class="summary" aria-label="Event summary"><span class="badge badge-accent">'+esc(event.category)+'</span><h1>'+esc(event.name)+'</h1><p>'+esc(event.description)+'</p>'+
      '<dl>'+detailRows([['Date',formatDate(event.date)],['Time',formatTime(event.time)],['Venue',event.venue]])+'</dl></section>'+
      '<section class="form-card"><h2>Register for this event</h2><form id="register-form" class="form-grid" novalidate>'+
      fieldHTML('name','Full Name','<input class="input" id="f-name" name="name" autocomplete="name">','span-2')+
      fieldHTML('email','Email','<input class="input" id="f-email" name="email" type="email" autocomplete="email">','span-2')+
      fieldHTML('college','College','<input class="input" id="f-college" name="college">','span-2')+
      fieldHTML('year','Year','<select class="select" id="f-year" name="year">'+optionsHTML(YEARS,'','Select year')+'</select>')+
      fieldHTML('phone','Phone Number','<input class="input" id="f-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel">')+
      '<p class="form-alert span-2" id="form-error" role="alert"></p>'+
      '<button class="btn btn-primary span-2" type="submit">Submit Registration</button></form></section></div>';
    const form=$('#register-form');
    form.addEventListener('submit',submitEvent=>{
      submitEvent.preventDefault();
      const data=Object.fromEntries(new FormData(form));
      const errors=validateRegistration(data);
      showErrors(form,errors);
      const formError=$('#form-error');
      formError.textContent='';
      if(Object.keys(errors).length)return;
      const registrations=getRegistrations();
      const email=data.email.trim().toLowerCase();
      if(registrations.some(item=>item.eventId===event.id&&String(item.email).toLowerCase()===email)){
        formError.textContent='You are already registered for this event.';
        return;
      }
      const record={registrationId:createRegistrationId(registrations),eventId:event.id,eventName:event.name,name:data.name.trim(),email:data.email.trim(),college:data.college.trim(),year:data.year,phone:data.phone.replace(/[\s-]/g,''),registeredAt:new Date().toISOString()};
      if(!writeList(KEYS.registrations,[...registrations,record])){
        formError.textContent='Could not save your registration. Browser storage is unavailable.';
        return;
      }
      showSuccess(record);
    });
  }
  showForm();
}

function validateEvent(data){
  const errors={};
  const labels={name:'event name',venue:'venue',description:'description',eligibility:'eligibility',date:'a date',time:'a time'};
  Object.keys(labels).forEach(key=>{
    if(!String(data[key]||'').trim())errors[key]='Enter '+labels[key]+'.';
  });
  if(!CATEGORIES.includes(data.category))errors.category='Select a category.';
  if(!FORMATS.includes(data.format))errors.format='Select a format.';
  return errors;
}

function initAdmin(){
  const loginView=$('#login-view');
  const appView=$('#app-view');
  const content=$('#admin-content');
  const sidebar=$('#sidebar');
  const menuButton=$('#sidebar-toggle');
  const titles={dashboard:'Dashboard',events:'Events',registrations:'Registrations'};
  let view='dashboard';

  function syncAuth(){
    const authed=isAuthenticated();
    loginView.hidden=authed;
    appView.hidden=!authed;
    if(authed)render();
  }

  $('#login-form').addEventListener('submit',event=>{
    event.preventDefault();
    const data=Object.fromEntries(new FormData(event.target));
    if(data.username.trim()===ADMIN_LOGIN.username&&data.password===ADMIN_LOGIN.password){
      setAuthenticated(true);
      $('#login-error').textContent='';
      event.target.reset();
      syncAuth();
    }else{
      $('#login-error').textContent='Incorrect username or password.';
    }
  });

  $('#logout').addEventListener('click',()=>{
    setAuthenticated(false);
    sidebar.classList.remove('open');
    syncAuth();
  });

  menuButton.addEventListener('click',()=>{
    const open=sidebar.classList.toggle('open');
    menuButton.setAttribute('aria-expanded',String(open));
  });

  $$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    view=button.dataset.view;
    sidebar.classList.remove('open');
    menuButton.setAttribute('aria-expanded','false');
    render();
  }));

  function render(){
    $$('[data-view]').forEach(button=>{
      const active=button.dataset.view===view;
      button.classList.toggle('active',active);
      if(active){button.setAttribute('aria-current','page')}else{button.removeAttribute('aria-current')}
    });
    $('#view-title').textContent=titles[view];
    if(view==='dashboard')renderDashboard();
    else if(view==='events')renderEvents();
    else renderRegistrations();
  }

  function statusBadge(event){
    return isUpcoming(event)?'<span class="badge badge-up">Upcoming</span>':'<span class="badge badge-past">Past</span>';
  }

  function renderDashboard(){
    const events=getEvents();
    const registrations=getRegistrations();
    const upcoming=sortByDate(events.filter(isUpcoming));
    const featured=events.find(item=>item.featured);
    const recent=[...registrations].sort((a,b)=>String(b.registeredAt).localeCompare(String(a.registeredAt))).slice(0,5);
    content.innerHTML='<div class="stats">'+
      '<div class="stat"><span>Total Events</span><strong>'+events.length+'</strong></div>'+
      '<div class="stat"><span>Upcoming Events</span><strong>'+upcoming.length+'</strong></div>'+
      '<div class="stat"><span>Total Registrations</span><strong>'+registrations.length+'</strong></div>'+
      '<div class="stat"><span>Featured Event</span><strong class="stat-text">'+(featured?esc(featured.name):'None selected')+'</strong></div></div>'+
      '<div class="panels"><section class="panel"><h2>Upcoming Events</h2>'+
      (upcoming.length?'<ul class="list">'+upcoming.slice(0,5).map(item=>'<li><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.venue)+'</small></div><span>'+formatDate(item.date)+'</span></li>').join('')+'</ul>':'<p class="muted">No upcoming events. Add one from the Events tab.</p>')+
      '</section><section class="panel"><h2>Recent Registrations</h2>'+
      (recent.length?'<ul class="list">'+recent.map(item=>'<li><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.eventName)+'</small></div><span>'+esc(item.registrationId)+'</span></li>').join('')+'</ul>':'<p class="muted">No registrations yet.</p>')+
      '</section></div>';
  }

  function renderEvents(){
    const events=sortByDate(getEvents());
    content.innerHTML='<div class="admin-bar"><p class="muted">'+plural(events.length,'event')+'</p><button class="btn btn-primary" type="button" id="add-event">Add Event</button></div>'+
      '<div class="table-wrap"><table><thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Venue</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
      (events.length?events.map(item=>'<tr><td><strong>'+esc(item.name)+'</strong>'+(item.featured?'<small>Featured</small>':'')+'</td><td>'+esc(item.category)+'</td><td>'+formatDate(item.date)+'</td><td>'+esc(item.venue)+'</td><td>'+statusBadge(item)+'</td>'+
        '<td><div class="row-actions"><button class="btn btn-ghost btn-sm" type="button" data-edit="'+esc(item.id)+'">Edit</button><button class="btn btn-ghost btn-sm" type="button" data-delete="'+esc(item.id)+'">Delete</button></div></td></tr>').join(''):'<tr><td colspan="6" class="table-empty">No events yet. Use Add Event to create the first one.</td></tr>')+
      '</tbody></table></div>';
    $('#add-event').addEventListener('click',()=>openEventForm(null));
    $$('[data-edit]',content).forEach(button=>button.addEventListener('click',()=>openEventForm(getEvents().find(item=>item.id===button.dataset.edit))));
    $$('[data-delete]',content).forEach(button=>button.addEventListener('click',()=>confirmDelete(getEvents().find(item=>item.id===button.dataset.delete))));
  }

  function openEventForm(current){
    const value=current||{};
    const modal=openModal(
      '<button class="modal-x" type="button" data-close aria-label="Close">&times;</button><h2>'+(current?'Edit Event':'Add Event')+'</h2>'+
      '<form id="event-form" class="form-grid" novalidate>'+
      fieldHTML('name','Event Name','<input class="input" id="f-name" name="name" value="'+esc(value.name)+'">','span-2')+
      fieldHTML('category','Category','<select class="select" id="f-category" name="category">'+optionsHTML(CATEGORIES,value.category,'Select category')+'</select>')+
      fieldHTML('format','Format','<select class="select" id="f-format" name="format">'+optionsHTML(FORMATS,value.format,'Select format')+'</select>')+
      fieldHTML('date','Date','<input class="input" id="f-date" name="date" type="date" value="'+esc(value.date)+'">')+
      fieldHTML('time','Time','<input class="input" id="f-time" name="time" type="time" value="'+esc(value.time)+'">')+
      fieldHTML('venue','Venue','<input class="input" id="f-venue" name="venue" value="'+esc(value.venue)+'">','span-2')+
      fieldHTML('description','Description','<textarea class="textarea" id="f-description" name="description">'+esc(value.description)+'</textarea>','span-2')+
      fieldHTML('eligibility','Eligibility','<input class="input" id="f-eligibility" name="eligibility" value="'+esc(value.eligibility)+'">','span-2')+
      '<label class="check span-2"><input type="checkbox" name="featured"'+(value.featured?' checked':'')+'> Feature this event on the homepage</label>'+
      '<p class="form-alert span-2" id="form-error" role="alert"></p>'+
      '<div class="modal-actions span-2"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit">'+(current?'Update Event':'Add Event')+'</button></div></form>',
      current?'Edit event':'Add event'
    );
    const form=$('#event-form',modal);
    form.addEventListener('submit',submitEvent=>{
      submitEvent.preventDefault();
      const data=Object.fromEntries(new FormData(form));
      const errors=validateEvent(data);
      showErrors(form,errors);
      if(Object.keys(errors).length)return;
      const record={id:current?current.id:'evt-'+Date.now().toString(36),name:data.name.trim(),category:data.category,date:data.date,time:data.time,venue:data.venue.trim(),description:data.description.trim(),eligibility:data.eligibility.trim(),format:data.format,featured:Boolean(data.featured)};
      let list=getEvents();
      if(record.featured)list=list.map(item=>({...item,featured:false}));
      list=current?list.map(item=>item.id===current.id?record:item):[...list,record];
      if(!writeList(KEYS.events,list)){
        $('#form-error',form).textContent='Could not save. Browser storage is unavailable.';
        return;
      }
      closeModal();
      render();
    });
  }

  function confirmDelete(target){
    if(!target)return;
    const modal=openModal(
      '<button class="modal-x" type="button" data-close aria-label="Close">&times;</button><h2>Delete this event?</h2>'+
      '<p class="muted">'+esc(target.name)+' will be removed from the public site. This cannot be undone.</p>'+
      '<div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-danger" type="button" id="confirm-delete">Delete Event</button></div>',
      'Delete event'
    );
    $('#confirm-delete',modal).addEventListener('click',()=>{
      writeList(KEYS.events,getEvents().filter(item=>item.id!==target.id));
      closeModal();
      render();
    });
  }

  function renderRegistrations(){
    const events=getEvents();
    content.innerHTML='<div class="admin-bar"><div class="admin-filters">'+
      '<input class="input" id="reg-search" type="search" placeholder="Search name, email, college, event or ID" aria-label="Search registrations">'+
      '<select class="select" id="reg-event" aria-label="Filter by event"><option value="all">All events</option>'+events.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.name)+'</option>').join('')+'</select></div>'+
      '<p class="muted" id="reg-count"></p></div>'+
      '<div class="table-wrap"><table><thead><tr><th>Registration ID</th><th>Student</th><th>Event</th><th>College</th><th>Year</th><th>Phone</th><th>Registered</th></tr></thead><tbody id="reg-body"></tbody></table></div>';
    const search=$('#reg-search');
    const eventFilter=$('#reg-event');

    function renderRows(){
      const query=search.value.trim().toLowerCase();
      const list=getRegistrations().filter(item=>{
        const text=[item.name,item.email,item.college,item.eventName,item.registrationId].join(' ').toLowerCase();
        return(!query||text.includes(query))&&(eventFilter.value==='all'||item.eventId===eventFilter.value);
      });
      $('#reg-count').textContent=plural(list.length,'registration');
      $('#reg-body').innerHTML=list.length?list.map(item=>'<tr><td><strong>'+esc(item.registrationId)+'</strong></td><td>'+esc(item.name)+'<small>'+esc(item.email)+'</small></td><td>'+esc(item.eventName)+'</td><td>'+esc(item.college)+'</td><td>'+esc(item.year)+'</td><td>'+esc(item.phone)+'</td><td>'+formatDate(String(item.registeredAt).slice(0,10))+'</td></tr>').join(''):
        '<tr><td colspan="7" class="table-empty">No registrations found.</td></tr>';
    }
    search.addEventListener('input',renderRows);
    eventFilter.addEventListener('change',renderRows);
    renderRows();
  }

  syncAuth();
}

document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-details]');
  if(trigger)showDetails(trigger.dataset.details);
});

document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeModal();
  trapFocus(event);
});

document.addEventListener('DOMContentLoaded',()=>{
  renderChrome();
  const page=document.body.dataset.page;
  if(page==='home')initHome();
  else if(page==='events')initEvents();
  else if(page==='register')initRegister();
  else if(page==='admin')initAdmin();
});
