import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import cors from "cors"

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server);
const prisma = new PrismaClient();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
  })
)

const PORT: number = parseInt(process.env.PORT || "3000", 10);
const SocketPort:number=parseInt(process.env.SOCKET_PORT||'4000',10);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("group chat", async (msg) => {
    try {
      const message = await prisma.conversation.create({
        data: {
          senderId: msg.senderId,
          type: msg.type,
          groupId: msg.groupId,
          recId: undefined,
          message: msg.message,
        },
      });
      io.emit("group chat", message);
    } catch (err) {
      console.log({ err });
    }
  });
  socket.on("chat message", async (msg) => {
    try {
      const message = await prisma.conversation.create({
        data: {
          senderId: msg.senderId,
          recId: msg.recId,
          type: msg.type,
          message: msg.message,
        },
      });
      io.emit("chat message", message);
    } catch (err) {
      console.error(err);
    }
  });
});

app.get("/getUsers", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (err) {
    res.json({ err });
  }
});

app.post("/addUsers", async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const userData = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
      },
    });

    console.log({ userData });
    console.log("here");
    res.json(userData);
  } catch (err) {
    res.json({ err });
  }
});

app.post("/addMessage", async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (!data.senderId || !data.recId || !data.type || !data.message) {
      return res.status(400).json({
        error:
          "Incomplete data. Please provide senderId, recId, type, and message.",
      });
    }

    const senderExists = await prisma.user.findUnique({
      where: { id: data.senderId },
    });
    const receiverExists = await prisma.user.findUnique({
      where: { id: data.recId },
    });

    if (!senderExists || !receiverExists) {
      return res.status(404).json({ error: "Sender or receiver not found." });
    }

    const message = await prisma.conversation.create({
      data: {
        senderId: data.senderId,
        recId: data.recId,
        type: data.type,
        message: data.message,
      },
    });

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/addGroup", async (req: Request, res: Response) => {
  try {
    await prisma.group.create({
      data: {
        name: req.body.name,
      },
    });
    res.json({ data: "done" });
  } catch (err) {
    res.status(400).json({ err });
  }
});

app.post("/addGroupMembers/:groupId", async (req: Request, res: Response) => {
  try {
    console.log({ data: req.body });
    const data = await prisma.groupMember.create({
      data: { userId: req.body.userId, groupId: req.params.groupId },
    });
    res.json({ data: "done" });
  } catch (err) {
    res.json({ err });
  }
});

app.get("/getGroups", async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany();
    res.json({ groups });
  } catch (err) {
    res.json({ err });
  }
});

app.post("/getMessages", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const messages = await prisma.conversation.findMany({
      where: {
        senderId: body.senderId,
        recId: body.recId,
      },
      select: {
        message: true,
      },
    });
    res.json(messages);
  } catch (err) {
    res.json(err);
  }
});
app.get('/',async(req:Request,res:Response)=>{
  res.json({
    data: "Hello world"
  })
})

app.get("/getGroupMessages/:groupId", async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId;

    const groupExists = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!groupExists) {
      return res.status(404).json({ error: "Group not found." });
    }

    const groupMessages = await prisma.conversation.findMany({
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
server.listen(SocketPort, () => {
  console.log(`Chat Server is running on http://localhost:${SocketPort}`);
});