const http = require('http');
const fs = require('fs');
const { Server } = require("socket.io"); // Importa a classe Server do socket.io
const { SerialPort } = require('serialport'); // Importa a classe SerialPort
const { ReadlineParser } = require('@serialport/parser-readline'); // Importa o parser Readline

const portName = 'COM5'; // Porta COM para Windows
const baudRate = 9600;

let index;
try {
    index = fs.readFileSync('index.html');
} catch (err) {
    console.error("Erro ao ler index.html:", err);
    process.exit(1); // Encerra se o arquivo HTML não for encontrado
}

const app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

// Inicializa o servidor Socket.IO anexando-o ao servidor HTTP
const io = new Server(app, {
    cors: {
      origin: "*", // Permite todas as origens, ajuste conforme necessário para produção
      methods: ["GET", "POST"]
    }
});

const serialPort = new SerialPort({
    path: portName,
    baudRate: baudRate,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    flowControl: false
});

const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

serialPort.on('open', () => {
    console.log(`Porta serial ${portName} aberta com sucesso.`);
});

serialPort.on('error', function(err) {
    console.error(`Erro na porta serial ${portName}: `, err.message);
    console.error("Verifique se a porta está correta, disponível e se o Arduino está conectado.");
});

io.on('connection', (socket) => {
    console.log('Cliente conectado via Socket.IO:', socket.id);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

parser.on('data', function(data) {
    const trimmedData = data.toString().trim(); // Converte para string e remove espaços/quebras de linha extras
    console.log(`Dados recebidos da porta serial (${portName}): ${trimmedData}`);
    io.emit('data', trimmedData); // Envia para todos os clientes conectados
});

const serverPort = 3000;
app.listen(serverPort, () => {
    console.log(`Servidor Node.js escutando na porta ${serverPort}`);
    console.log(`Acesse http://localhost:${serverPort} no seu navegador.`);
});