const fetch = global.fetch || require('node-fetch');
(async()=>{
 const base='http://localhost:3001';
 const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'admin123'})});
 const data=await login.json();
 console.log('token',data.token);
 const resp=await fetch(base+'/admin/users/0492bafa-e095-4d6d-aca9-b8e2f80e2cae',{method:'DELETE',headers:{Authorization:'Bearer '+data.token}});
 console.log('delete status',resp.status);console.log(await resp.text());
})();