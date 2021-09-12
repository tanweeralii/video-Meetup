document.addEventListener(
  "DOMContentLoaded",
  function (event) {
    var peer_id;
    var username;
    var conn;

    /**
     * Important: the host needs to be changed according to your requirements.
     * e.g if you want to access the Peer server from another device, the
     * host would be the IP of your host namely 192.xxx.xxx.xx instead
     * of localhost.
     *
     * The iceServers on this example are public and can be used for your project.
     */
    var peer = new Peer({
    host: "localhost",
    port: 9000,
    path: "/peerjs",
    debug: 3,
    config: {
        iceServers: [
        { url: "stun:stun1.l.google.com:19302" },
        {
            url: "turn:numb.viagenie.ca",
            credential: "muazkh",
            username: "webrtc@live.com",
        },
        ],
    },
    });
    peer.on('open', function () {
        document.getElementById("peer-id-label").innerHTML = peer.id;
    });

    // When someone connects to your session:
    // 
    // 1. Hide the peer_id field of the connection form and set automatically its value
    // as the peer of the user that requested the connection.
    // 2. Update global variables with received values
    peer.on('connection', function (connection) {
        conn = connection;
        peer_id = connection.peer;

        // Use the handleMessage to callback when a message comes in
        conn.on('data', handleMessage);

        // Hide peer_id field and set the incoming peer id as value
        document.getElementById("peer_id").className += " hidden";
        document.getElementById("peer_id").value = peer_id;
        document.getElementById("connected_peer").innerHTML = connection.metadata.username;
    });

    peer.on('error', function(err){
        alert("An error ocurred with peer: " + err);
        console.error(err);
    });

    /**
     * Handle the on receive call event
     */
    peer.on('call', function (call) {
        var acceptsCall = confirm("Videocall incoming, do you want to accept it ?");

        if(acceptsCall){
            // Answer the call with your own video/audio stream
            call.answer(window.localStream);

            // Receive data
            call.on('stream', function (stream) {
                // Store a global reference of the other user stream
                window.peer_stream = stream;
                // Display the stream of the other user in the peer-camera video element !
                onReceiveStream(stream, 'peer-camera');
            });

            // Handle when the call finishes
            call.on('close', function(){
                alert("The videocall has finished");
            });

            // use call.close() to finish a call
        }else{
            console.log("Call denied !");
        }
    });
    function requestLocalVideo(callbacks) {
        // Monkeypatch for crossbrowser geusermedia
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        // Request audio an video
        navigator.getUserMedia({ audio: true, video: true }, callbacks.success , callbacks.error);
    }
    function onReceiveStream(stream, element_id) {
        // Retrieve the video element according to the desired
        var video = document.getElementById(element_id);
        // Set the given stream as the video source 
        video.src = window.URL.createObjectURL(stream);

        // Store a global reference of the stream
        window.peer_stream = stream;
    }
    function handleMessage(data) {
        var orientation = "text-left";

        // If the message is yours, set text to right !
        if(data.from == username){
            orientation = "text-right"
        }

        var messageHTML =  '<a href="javascript:void(0);" class="list-group-item' + orientation + '">';
                messageHTML += '<h4 class="list-group-item-heading">'+ data.from +'</h4>';
                messageHTML += '<p class="list-group-item-text">'+ data.text +'</p>';
            messageHTML += '</a>';

        document.getElementById("messages").innerHTML += messageHTML;
    }
    document.getElementById("send-message").addEventListener("click", function(){
        // Get the text to send
        var text = document.getElementById("message").value;

        // Prepare the data to send
        var data = {
            from: username, 
            text: text 
        };

        // Send the message with Peer
        conn.send(data);

        // Handle the message on the UI
        handleMessage(data);

        document.getElementById("message").value = "";
    }, false);
    document.getElementById("call").addEventListener("click", function(){
        console.log('Calling to ' + peer_id);
        console.log(peer);

        var call = peer.call(peer_id, window.localStream);

        call.on('stream', function (stream) {
            window.peer_stream = stream;

            onReceiveStream(stream, 'peer-camera');
        });
    }, false);
    document.getElementById("connect-to-peer-btn").addEventListener("click", function(){
        username = document.getElementById("name").value;
        peer_id = document.getElementById("peer_id").value;
        
        if (peer_id) {
            conn = peer.connect(peer_id, {
                metadata: {
                    'username': username
                }
            });
            
            conn.on('data', handleMessage);
        }else{
            alert("You need to provide a peer to connect with !");
            return false;
        }

        document.getElementById("chat").className = "";
        document.getElementById("connection-form").className += " hidden";
    }, false);
    requestLocalVideo({
        success: function(stream){
            window.localStream = stream;
            onReceiveStream(stream, 'my-camera');
        },
        error: function(err){
            alert("Cannot get access to your camera and video !");
            console.error(err);
        }
    });
  },
  false
);
