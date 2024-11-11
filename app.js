const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const fen = require("fen");


const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res) => {
    res.render("index");
})

let players = {};
let currentPlayer = "w";

io.on("connection" , (uniqueSocket) => {
    console.log("connected");
    if(!players.white){
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole","w");
    }
    else if(!players.black){
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole","b");
    }
    else{
        uniqueSocket.emit("spectatorRole");
    }
     
    uniqueSocket.on("move",(move) => {
        try{
            if(chess.turn() == "w" && uniqueSocket.id != players.white){
                uniqueSocket.emit("other","Player White Turn Now");
                return;
            }
            if(chess.turn() == "b" && uniqueSocket.id != players.black){
                uniqueSocket.emit("other","Player Black Turn Now");
                return;
            }
            const res = chess.move(move);
            if(res){
                currentPlayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen());
            }
            else{
                uniqueSocket.emit("invalidMove",move);
            } 
        }catch(err){
            uniqueSocket.emit("invalidMove",err);
        }
    })


    uniqueSocket.on("disconnect",()=>{
        if(uniqueSocket.id == players.white){
            delete players.white;
        }
        else if(uniqueSocket.id == players.black){
            delete players.black;
        }
    })
})




server.listen(3000,() => "Listening on 3000")