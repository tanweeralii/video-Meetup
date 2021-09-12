var fs = require("fs");
var PeerServer = require("peer").PeerServer;

var server = PeerServer({
  port: 9000,
  path: "/peerjs",
  ssl: {
    key: fs.readFileSync("./../security/cert.key", "utf8"),
    cert: fs.readFileSync("./../security/cert.pem", "utf8"),
  },
});
