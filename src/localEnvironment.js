import {apiFetch} from './api.js';
export function createLocalEnvironment(){
 let disposed=false,revision=0;
 const timezone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 return {
  async refresh(enabled){
   const version=++revision;let location={timezone:timezone()};
   if(enabled){
    try{
     if(!globalThis.isSecureContext||!navigator.geolocation)throw Error('No geolocation');
     const p=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:7000,maximumAge:1800000}));
     location={...location,latitude:p.coords.latitude,longitude:p.coords.longitude,source:'browser'};
    }catch{
     if(disposed||version!==revision)return;
     try{
      // Run in the user's browser: server egress IP would locate the wrong computer.
      const response=await fetch('https://ipapi.co/json/',{signal:AbortSignal.timeout(5000),credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw Error('No IP location');const ip=await response.json();
      if(!ip.error&&Number.isFinite(ip.latitude)&&Number.isFinite(ip.longitude))location={...location,latitude:ip.latitude,longitude:ip.longitude,source:'ip'};
     }catch{}
    }
   }
   if(disposed||version!==revision)return;
   if(location.latitude!==undefined){location.latitude=Math.round(location.latitude*100)/100;location.longitude=Math.round(location.longitude*100)/100;}
   try{await apiFetch('/api/environment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(location)});}catch{}
  },
  dispose(){disposed=true;revision++;}
 };
}
