"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
const PORT = parseInt(process.env.PORT || '3000', 10);
app.get('/getUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(users);
    }
    catch (err) {
        res.json({ err });
    }
}));
app.post('/addUsers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const userData = yield prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: data.password,
            },
        });
        console.log({ userData });
        console.log('here');
        res.json(userData);
    }
    catch (err) {
        res.json({ err });
    }
}));
app.post('/addMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        if (!data.senderId || !data.recId || !data.type || !data.message) {
            return res.status(400).json({ error: 'Incomplete data. Please provide senderId, recId, type, and message.' });
        }
        const senderExists = yield prisma.user.findUnique({ where: { id: data.senderId } });
        const receiverExists = yield prisma.user.findUnique({ where: { id: data.recId } });
        if (!senderExists || !receiverExists) {
            return res.status(404).json({ error: 'Sender or receiver not found.' });
        }
        const message = yield prisma.conversation.create({
            data: {
                senderId: data.senderId,
                recId: data.recId,
                type: data.type,
                message: data.message,
            },
        });
        res.json(message);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.post('/addGroup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.group.create({
            data: {
                name: req.body.name,
            },
        });
        res.json({ data: 'done' });
    }
    catch (err) {
        console.log(err);
        res.status(400).json({ err });
    }
}));
app.post('/addGroupMembers/:groupId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log({ data: req.body });
        const data = yield prisma.groupMember.create({
            data: { userId: req.body.userId, groupId: parseInt(req.params.groupId) },
        });
        console.log(data);
        res.json({ data: 'done' });
    }
    catch (err) {
        console.log(err);
        res.json({ err });
    }
}));
app.get('/getGroups', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groups = yield prisma.group.findMany();
        res.json({ groups });
    }
    catch (err) {
        res.json({ err });
    }
}));
app.post('/getMessages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        const messages = yield prisma.conversation.findMany({
            where: {
                senderId: body.senderId,
                recId: body.recId,
            },
            select: {
                message: true,
            },
        });
        res.json(messages);
    }
    catch (err) {
        res.json(err);
    }
}));
app.get('/getGroupMessages/:groupId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groupId = parseInt(req.params.groupId, 10);
        const groupExists = yield prisma.group.findUnique({
            where: {
                id: groupId,
            },
        });
        if (!groupExists) {
            return res.status(404).json({ error: 'Group not found.' });
        }
        const groupMessages = yield prisma.conversation.findMany({
            where: {
                groupId: groupId,
            },
            include: {
                sender: true,
                receiver: true,
                group: true,
            },
        });
        res.json(groupMessages);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
