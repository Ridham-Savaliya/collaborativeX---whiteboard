import { Server, Socket } from 'socket.io';
import connectDB from '../lib/db';
import Whiteboard from "@models/Whiteboard";
import User from "@models/User";
import { verifyToken } from '../lib/auth';
import { WhiteboardElement, StickyNote, ActivityUpdate, UserPresence } from './types';

export const setupSocket = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Authenticate the user
    const token:any = socket.handshake.auth;
    // console.log(socket.handshake.auth.token)
    if (!token) {
      console.log("invalid token")
      socket.disconnect();

      return;
    }

    let email: string = "";
    let userId: string = "";

    try {
      const decoded = verifyToken(token);
      console.log(decoded)
      email = decoded.email || "";
      userId = decoded.userId || "";
      console.log(`Authenticated user: ${email}, ${userId}`);
    } catch (error) {
      socket.disconnect();
      return;
    }

    // Join a whiteboard room
    socket.on('join_whiteboard', async (whiteboardId: string) => {
      try {
        await connectDB();

        // Verify user has access to the whiteboard
        const whiteboard = await Whiteboard.findById(whiteboardId);
        if (!whiteboard || (!whiteboard.collaborators.includes(email) && whiteboard.owner.toString() !== userId)) {
          socket.emit('error', { message: 'Unauthorized access to whiteboard' });
          return;
        }

        const user = await User.findById(userId).select('name');
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const room = `whiteboard_${whiteboardId}`;
        socket.join(room);

        // Broadcast user presence (join)
        const presence: UserPresence = {
          email,
          username: user.name,
          joined: true,
        };
        socket.to(room).emit('user_presence', presence);
        console.log(`${user.name} joined whiteboard ${whiteboardId}`);

        // Send initial state to the joining user
        socket.emit('initial_state', {
          elements: whiteboard.elements || [],
          stickyNotes: whiteboard.stickyNotes || [],
        });

        // Handle drawing events
        socket.on('drawStart', async (element: WhiteboardElement) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { elements: element },
            });
            io.to(room).emit('drawStart', element);
            const activity: ActivityUpdate = {
              userId,
              action: `started drawing a ${element.type}`,
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to start drawing' });
          }
        });

        socket.on('drawUpdate', async (element: WhiteboardElement) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { elements: { id: element.id } },
              $push: { elements: element },
            });
            io.to(room).emit('drawUpdate', element);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update drawing' });
          }
        });

        socket.on('drawEnd', async (element: WhiteboardElement) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { elements: { id: element.id } },
              $push: { elements: element },
            });
            io.to(room).emit('drawEnd', element);
            const activity: ActivityUpdate = {
              userId,
              action: `finished drawing a ${element.type}`,
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to end drawing' });
          }
        });

        // Handle sticky note events
        socket.on('stickyNoteCreate', async (stickyNote: StickyNote) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { stickyNotes: stickyNote },
            });
            io.to(room).emit('stickyNoteCreate', stickyNote);
            const activity: ActivityUpdate = {
              userId,
              action: 'created a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to create sticky note' });
          }
        });

        socket.on('stickyNoteUpdate', async (stickyNote: Partial<StickyNote>) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { stickyNotes: { id: stickyNote.id } },
              $push: { stickyNotes: { ...stickyNote } as StickyNote },
            });
            io.to(room).emit('stickyNoteUpdate', stickyNote);
            const activity: ActivityUpdate = {
              userId,
              action: 'updated a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update sticky note' });
          }
        });

        socket.on('stickyNoteDelete', async (id: string) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { stickyNotes: { id } },
            });
            io.to(room).emit('stickyNoteDelete', id);
            const activity: ActivityUpdate = {
              userId,
              action: 'deleted a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to delete sticky note' });
          }
        });

        // Handle text events
        socket.on('textCreate', async (element: WhiteboardElement) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { elements: element },
            });
            io.to(room).emit('textCreate', element);
            const activity: ActivityUpdate = {
              userId,
              action: 'added text',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to create text' });
          }
        });

        socket.on('textUpdate', async (element: Partial<WhiteboardElement>) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { elements: { id: element.id } },
              $push: { elements: { ...element, type: 'text' } as WhiteboardElement },
            });
            io.to(room).emit('textUpdate', element);
            const activity: ActivityUpdate = {
              userId,
              action: 'updated text',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update text' });
          }
        });

        // Handle shape updates
        socket.on('shapeUpdate', async (element: Partial<WhiteboardElement>) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { elements: { id: element.id } },
              $push: { elements: { ...element } as WhiteboardElement },
            });
            io.to(room).emit('shapeUpdate', element);
            const activity: ActivityUpdate = {
              userId,
              action: 'updated a shape',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update shape' });
          }
        });

        // Handle cursor movement
        socket.on('cursorMove', (data: { x: number; y: number }) => {
          io.to(room).emit('cursorMove', { socketId: socket.id, ...data });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          const presence: UserPresence = {
            email,
            username: user.name,
            joined: false,
          };
          socket.to(room).emit('user_presence', presence);
          console.log(`${user.name} left whiteboard ${whiteboardId}`);
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join whiteboard' });
      }
    });
  });
};
