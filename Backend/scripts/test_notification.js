(async () => {
  const base = 'http://localhost:3001';
  const fetch = global.fetch || (await import('node-fetch')).default;

  const login = await fetch(base + '/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:'admin',password:'admin123'})});
  console.log('admin login status', login.status);
  if (login.status!==200) {
    console.log(await login.text());
    return;
  }
  const {token} = await login.json();
  const headers={Authorization:'Bearer '+token,'Content-Type':'application/json'};
  // create supervisor
  let res = await fetch(base + '/admin/users',{method:'POST',headers,body:JSON.stringify({fullName:'Test Sup2',username:'testsup2',role:'SUPERVISOR',password:'testpass'})});
  console.log('create sup',res.status, await res.text());
  // login sup
  let login2 = await fetch(base + '/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'testsup2',password:'testpass'})});
  const supData = await login2.json();
  console.log('sup login', login2.status, JSON.stringify(supData));
  const supToken = supData.token;
  // create worker
  let resw = await fetch(base + '/admin/users',{method:'POST',headers,body:JSON.stringify({fullName:'Test Work2',username:'testwork2',role:'OPERARIO',password:'workpass'})});
  console.log('create worker',resw.status, await resw.text());
  let loginw = await fetch(base + '/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'testwork2',password:'workpass'})});
  const workData = await loginw.json();
  console.log('worker login', loginw.status, JSON.stringify(workData));
  const workToken = workData.token;
  // manual DB insert for relations
  const db = new (require('better-sqlite3'))('src/db/server.db');
  const sup_id = db.prepare("select id from users where username=?").get('testsup2').id;
  const work_id = db.prepare("select id from users where username=?").get('testwork2').id;
  db.prepare("insert or ignore into supervisor_operarios(supervisor_id,operario_id,active) values(?,?,1)").run(sup_id,work_id);
  db.prepare("insert or ignore into services(id,name,active) values(?,?,1)").run(require('crypto').randomUUID(), 'ServiceX');
  const service_id = db.prepare('select id from services where name=?').get('ServiceX').id;
  db.prepare("insert or ignore into supervisor_services(supervisor_id,service_id,active) values(?,?,1)").run(sup_id,service_id);
  // create task via API
  let ctask = await fetch(base + '/supervisor/tasks',{method:'POST',headers:{Authorization:'Bearer '+supToken,'Content-Type':'application/json'},body:JSON.stringify({operarioId:work_id,title:'hello','dueDate':'2025-12-31','serviceId':service_id})});
  console.log('create task',ctask.status,await ctask.text());
  // fetch notifications
  let nots = await fetch(base + '/worker/notifications',{headers:{Authorization:'Bearer '+workToken}});
  console.log('notifs status', nots.status, await nots.text());
})();
