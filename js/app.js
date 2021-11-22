var url=window.location.href;
var ubicacionSw='/Ejemplo-PWA/sw.js';
if ( navigator.serviceWorker ) {

    if(url.includes('localhost')){
        ubicacionSw='/sw.js';
    }
    navigator.serviceWorker.register(ubicacionSw);
}