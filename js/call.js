//https://jssip.net/documentation/0.3.x/api/ua_configuration_parameters/
// Create our JsSIP instance and run it:

// Desactivamos el modo debug para que no nos aparezcan console.log
JsSIP.debug.disable('JsSIP:*');
/*JsSIP.debug.enable('JsSIP:*');*/

// Seleccioamos los nodos de los cuales vamos a obtener su value o eventos click
let nodeSocket = document.querySelector("#socket");
let nodeUri = document.querySelector("#uri");
let nodePass = document.querySelector("#pass");
let callTo = document.querySelector("#callTo");
let cancelCall = document.querySelector("#cancelCall");
let contentCall = document.querySelector(".contentCall");
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');

// Inicializamos como global la instancia de JsSiP y la sessión de la conexión
let ua = null;
let session = null;
// Eventos de la conexión (llamada)
var eventHandlers = {
    'progress': function(e) {
        contentCall.innerHTML+='<p>call is in progress</p>';
        console.log(e);
    },
    'failed': function(e) {
        contentCall.innerHTML+='<p>call failed with cause: '+ e.cause+"</p>";
        cancelCall.setAttribute("disabled","disabled");
    },
    'ended': function(e) {
        contentCall.innerHTML+='<p>call ended with cause: '+ e.cause+"</p>";
        cancelCall.removeAttribute("disabled");
    },
    'confirmed': function(e) {
        contentCall.innerHTML+='<p>call confirmed</p>';

    },
    'accepted': function(e) {
        contentCall.innerHTML+='<p>call accepted</p>';
        // Ponemos las cámaras en los cuadrados de local y remoto
        mostrarCamaras();
    },
    'started':    function(e){
        contentCall.innerHTML+='<p>call started</p>';

    },
    'addstream':  function(e){
        contentCall.innerHTML+='<p>addstream</p>';

    },
    'disconnected':  function(e){
        contentCall.innerHTML+='<p>disconnected</p>';

    },
};

// Opciones de la sesión (una vez que se conecta con el otro extremo)
var options = {
    'eventHandlers'    : eventHandlers,
    'extraHeaders': [ 'X-Foo: foo', 'X-Bar: bar' ],
    'mediaConstraints' : { 'audio': true, 'video': true }
};

// Cuando hacemos click en el botón de configurar se establece la conexión por WebSocket
document.querySelector("#config").addEventListener("click", () => {
    var socket = new JsSIP.WebSocketInterface(nodeSocket.value);
    var configuration = {
        sockets  : [ socket ],
        uri      : nodeUri.value,
        password : nodePass.value,
        log: { level: 'no' }
    };
    ua = new JsSIP.UA(configuration);
    ua.start();

    // Eventos del websocket
    ua.on('connected', function(e){
        contentCall.innerHTML+="<p>Socket conectado</p>";
    });
    ua.on('disconnected', function(e){
        contentCall.innerHTML+="<p>Socket desconectado</p>";
        console.log(e);
    });
    // Evento WebRTC --> llamada si es entreante (remote) o saliente (local)
    ua.on('newRTCSession', function(e) {
        if (e.originator === 'local') {
            contentCall.innerHTML+='<p>Llamada saliente a <strong>'+e.request.to._uri._user+'</strong></p>';
            cancelCall.removeAttribute("disabled");
        }
        else if (e.originator === 'remote') {
            contentCall.innerHTML+='<p>Llamada entrante (aceptamos automaticamente) de <strong>'+e.request.from._display_name+'</strong></p>';
            // Cogemos la llamada automaticamente
            e.session.answer(options);
            // Capturamos los eventos
            // Otros eventos https://jssip.net/documentation/3.10.x/api/session/
            e.session.on('accepted', function(data) {
                contentCall.innerHTML+='<p>call accepted</p>';
            });
            e.session.on('confirmed', function(data) {
                contentCall.innerHTML+='<p>call confirmed</p>';

                mostrarCamaras(e.session);
            });
            e.session.on('ended', function(data) {
                contentCall.innerHTML+='<p>call ended with cause: '+ data.cause+"</p>";
            });
            cancelCall.removeAttribute("disabled");
            // Ponemos las cámaras en los cuadrados de local y remoto
                /*mostrarCamaras();*/
        }
    });
} );

// Evento click del botón llamar, emite una llamada al usuario@IPServidor
document.querySelector("#call").addEventListener("click", () => {
    // Métodos https://jssip.net/documentation/3.10.x/api/ua/#method_call
    session = ua.call(callTo.value, options);
});

// Evento click sobre Cancelar llamada, finaliza la llamada
cancelCall.addEventListener("click",() =>{
    ua.terminateSessions();
    cancelCall.setAttribute("disabled","disabled");
});

// Permite mostrar las cámaras
function mostrarCamaras (sesion = session){
    if (sesion.connection != undefined){
        if (sesion.connection.getLocalStreams()!= null){
            localVideo.srcObject  = sesion.connection.getLocalStreams()[0];
        }
        if (sesion.connection.getRemoteStreams()!= null){
            remoteVideo.srcObject  = sesion.connection.getRemoteStreams()[0];
        }
    }
}