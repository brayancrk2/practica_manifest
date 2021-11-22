const CACHE ='cache-1';
const CACHE_DINAMICO ='dinamico-1';
const CACHE_INMUTABLE ='inmutable-1';

//Indicamos que durante el proceso de intalación se 
//carguen los archivos del cache estático
self.addEventListener('install', evento=>{
    /*Promesa que crea el proceso de creación del espacio 
    en cache y agrega los archivos necesarios para cargar nuestra
    aplicación*/
    const promesa =caches.open(CACHE)
        .then(cache=>{
            return cache.addAll([
                '/',
                '/index.html'

            ]);
        });

        //Separamos los archivos que no se modificarán en un espacio de cache inmutable
        const cacheInmutable =  caches.open(CACHE_INMUTABLE)
            .then(cache=>{
                cache.add('');
            });
       
            //Indicamos que la instalación espere hasta que las promesas se cumplan
        evento.waitUntil(Promise.all([promesa, cacheInmutable]));
});

//Indicamos que durante el proceso de activación se borren los
//espacios de cache estatico de versiones pasadas
self.addEventListener('activate', evento =>{
    //antes de activar el sw, obten los nombres de los espacios de cache existentes
    const respuesta=caches.keys().then(keys =>{
        //verifica cada nombre de espacios de cache
        keys.forEach(key =>{
            //si el espacio no tiene el nombre actual del cache e incluye la palabra cache
            if(key !== CACHE && key.includes('cache')){
                //borralo, la condición de include cache evitará borrar el espacio dinamico o inmutable
                return caches.delete(key);
            }
        });
    });
    evento.waitUntil(respuesta);
});

//Atrapamos las peticiones y las procesamos con alguna estrategia de cache
self.addEventListener('fetch', evento =>{

    
    //Estrategia 2 CACHE WITH NETWORK FALLBACK
    const respuesta=caches.match(evento.request)
        .then(res=>{
            //si el archivo existe en cache retornalo
            if (res) return res;

            //si no existe deberá ir a la web
            //Imprimos en consola para saber que no se encontro en cache
            console.log('No existe', evento.request.url);
        
            //Procesamos la respuesta a la petición localizada en la web
            return fetch(evento.request)
                .then(resWeb=>{//el archivo recuperado se almacena en resWeb
                    //se abre nuestro cache
                    caches.open(CACHE_DINAMICO)
                        .then(cache=>{
                            //se sube el archivo descargado de la web
                            cache.put(evento.request,resWeb);
                            //Mandamos llamar la limpieza al cargar un nuevo archivo
                            //estamos indicando que se limpiará el cache dinamico y que 
                            //solo debe haber 2 archivos
                            limpiarCache('','');
                        })
                    //se retorna el archivo recuperado para visualizar la página
                    return resWeb.clone();  
                });
        })
        .catch(err => {
            //si ocurre un error, en nuestro caso no hay conexión
            if(evento.request.headers.get('accept').includes('text/html')){
                //si lo que se pide es un archivo html muestra nuestra página offline que esta en cache
                return caches.match('');
            }
        });
        evento.respondWith(respuesta);
        

});

//recibimos el nombre del espacio de c ache a limpiar y el número de archivos permitido
function limpiarCache(nombreCache, numeroItems){
    //abrimos el cache
    caches.open(nombreCache)
        .then(cache=>{
            //recuperamos el arreglo de archivos exixtentes en el espacio de cache
            return cache.keys()
                .then(keys=>{
                    //si el número de archivos supera el limite permitido
                    if (keys.length>numeroItems){
                        //eliminamos el más antigüo y repetimos el proceso
                        cache.delete(keys[0])
                            .then(limpiarCache(nombreCache, numeroItems));
                    }
                });
        });
}