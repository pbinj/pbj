import { pbj, pbjKey, context } from "@pbinj/pbj";
import { env } from "@pbinj/pbj/env";
import express from "express";
import { WebSocketServer } from "ws";
import fs from "fs";

import http from "http";

export class ServerConfig {
  constructor(
    private _port = env("PJB_PORT", "3000"),
    private _host = env("PJB_HOST", "localhost"),
    private _path = env("PJB_PATH", "/"),
    private _staticDir = env(
      "PJB_STATIC_DIR",
      new URL("../public", import.meta.url).pathname,
    ),
  ) {}
  get host() {
    return this._host + "";
  }
  get url() {
    return `http://${this.host}:${this.port}`;
  }
  get wsUrl() {
    return `ws://${this.host}:${this.port}`;
  }
  get port() {
    return Number(this._port);
  }
  get path() {
    return this._path + "";
  }
  get staticDir() {
    return this._staticDir + "";
  }
}

export async function register(ctx = context) {
  const app = express();
  const config = ctx.resolve(ServerConfig);
  const index = new URL("../index.html", import.meta.url).pathname;
  app.use(config.path, express.static(config.staticDir));
  app.get("/", (req, res) => {
    res.sendFile(index);
  });
  app.get("/api/services", (req, res) => {
    res.send(JSON.stringify(ctx.toJSON()));
  });

  const wss = new WebSocketServer({ server: http.createServer(app) });

  wss.on("connection", function connection(ws) {
    ws.on("error", console.error);

    ws.on("message", function message(data) {
      console.log("received: %s", data);
    });

    ws.send("something");
  });
  app.listen(config.port, config.host, () => {
    console.log("Websocket server started: %s", config.url);
  });
  // const server = http.createServer(app);
  // Create a WebSocket server instance and attach it to the HTTP server
  //   const websocketServer = new WebSocketServer({ server });
  //     websocketServer.on('connection', (socket, request) => {
  //         // Log a message when a new client connects
  //         console.log('client connected.');
  //         // Listen for incoming WebSocket messages
  //       socket.on('message', (data, client) => {
  //           console.log(data.toString());
  //           if (data.toString() == 'init'){
  //             socket.send(JSON.stringify(ctx.toJSON()));
  //           }
  //         });

  //         ctx.onServiceAdded((service)=>{
  //          // Broadcast the message to all connected clients
  //           websocketServer.clients.forEach(function each(client) {
  //             if (client !== socket && client.readyState === WebSocket.OPEN) {
  //               console.log('sending new service');
  //               client.send(JSON.stringify(service));
  //             }
  //           });
  //         });
  //         // Listen for WebSocket connection close events
  //         socket.on('close', () => {
  //           // Log a message when a client disconnects
  //           console.log('Client disconnected');
  //         });

  //       // Start the server listening on port 3000
  //     app.listen(config.port, config.host, () => {
  //     console.log("Websocket server started: %s", config.url);
  //       });
  // });
}
