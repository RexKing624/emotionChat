export function validEnvironment(value) {
 let timezone='UTC';
 try { if(typeof value?.timezone==='string' && value.timezone.length<80){new Intl.DateTimeFormat('en',{timeZone:value.timezone});timezone=value.timezone;} } catch {}
 const latitude=value?.latitude,longitude=value?.longitude;
 const located=Number.isFinite(latitude)&&Math.abs(latitude)<=90&&Number.isFinite(longitude)&&Math.abs(longitude)<=180&&['browser','ip'].includes(value.source);
 return {timezone,...(located?{latitude:Math.round(latitude*100)/100,longitude:Math.round(longitude*100)/100,source:value.source}:{})};
}
export function createEnvironment({fetcher=fetch,now=Date.now}={}) {
 const clients=new Map();let latest='';
 return {
  update(id,value){
   if(typeof id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(id))throw new Error('Invalid client');
   const clean=validEnvironment(value),old=clients.get(id);
   const same=old?.latitude===clean.latitude&&old?.longitude===clean.longitude;
   clients.set(id,{...clean,updated:now(),weather:same?old?.weather:null,attempt:same?old?.attempt:0});latest=id;
   for(const [key,v] of clients)if(now()-v.updated>3600000)clients.delete(key);
   if(clients.size>32)clients.delete(clients.keys().next().value);
  },
  async context(id=latest,enabled=false){
   const data=clients.get(id),fresh=data&&now()-data.updated<3600000;
   const timezone=fresh?data.timezone:'UTC';
   const time=new Intl.DateTimeFormat('zh-CN',{timeZone:timezone,dateStyle:'full',timeStyle:'short'}).format(new Date(now()));
   let out=`\n当前时间（系统时钟）：${time}，时区 ${timezone}。${fresh?'这是用户设备时区，不代表人物所在地。':'用户时区未知，仅提供 UTC 时间。'}`;
   if(!enabled||!fresh||data.latitude===undefined)return out+' 没有可用的用户当地天气，不猜测当地天气。';
   if(!data.attempt||now()-data.attempt>=1800000){
    data.attempt=now();data.weather=null;
    try{
     const url=new URL('https://api.open-meteo.com/v1/forecast');url.search=new URLSearchParams({latitude:data.latitude,longitude:data.longitude,current:'temperature_2m,precipitation,weather_code',timezone:'UTC',timeformat:'unixtime'}).toString();
     const response=await fetcher(url,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Weather unavailable');
     const c=(await response.json()).current;
     if(!Number.isFinite(c?.temperature_2m)||!Number.isFinite(c?.time)||Math.abs(now()-c.time*1000)>5400000)throw Error('Invalid weather');
     data.weather={temperatureC:c.temperature_2m,precipitationMm:Number.isFinite(c.precipitation)?c.precipitation:null,weatherCode:Number.isInteger(c.weather_code)?c.weather_code:null,observedAt:new Date(c.time*1000).toISOString(),fetchedAt:now()};
    }catch{}
   }
   if(data.weather&&now()-data.weather.fetchedAt<1800000)out+='\n用户所在地天气（Open-Meteo，近似当前天气，非人物所在地）：'+JSON.stringify(data.weather)+`。位置来自${data.source==='ip'?'公网 IP 城市估算，可能受 VPN 或移动网络影响，表达时必须说明是大致位置':'浏览器定位'}。weatherCode 是 WMO 天气代码；只根据这些数据描述当前天气，不能推断未来预报。合适时自然带入，不必每次播报，不要说成人物自己所在地的天气。`;
   else out+=' 用户当地天气获取失败，不编造天气。';
   return out;
  },
  clear(){clients.clear();latest='';}
 };
}
