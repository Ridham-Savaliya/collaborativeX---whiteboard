import { Server, Socket } from 'socket.io';
import connectDB from '../lib/db';
import Whiteboard from "@models/Whiteboard"
import User from "@models/User"
import { verifyToken } from '../lib/auth';
import { WhiteboardElement, StickyNote, ActivityUpdate, UserPresence } from './types';

export const setupSocket = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Authenticate the user
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.disconnect();
      return;
    }

    // Declare them here so you can use them later
    let email: string = "";
    let userId: string = "";

    try {
      const decoded = verifyToken(token);
      email = decoded.email || "";
      userId = decoded.userId || "";

      console.log(email, userId);

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

        // Join the room
        const room = `whiteboard_${whiteboardId}`;
        socket.join(room);

        // Broadcast user presence (join)
        const presence: UserPresence = {
          email,
          username: user,
          joined: true,
        };
        socket.to(room).emit('user_presence', presence);
        console.log(`${user} joined whiteboard ${whiteboardId}`);

        // Handle whiteboard updates
        socket.on('update_element', async (element: WhiteboardElement) => {
          try {
            // Persist the element in MongoDB
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { elements: element },
            });

            // Broadcast to all users in the room
            io.to(room).emit('update_element', element);

            // Broadcast activity update
            const activity: ActivityUpdate = {
              userId: userId,
              action: `added a ${element.type}`,
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update element' });
          }
        });

        socket.on('update_sticky_note', async (stickyNote: StickyNote) => {
          try {
            // Persist the sticky note in MongoDB
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { stickyNotes: stickyNote },
            });

            // Broadcast to all users in the room
            io.to(room).emit('update_sticky_note', stickyNote);

            // Broadcast activity update
            const activity: ActivityUpdate = {
              userId: userId,
              action: 'added a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            socket.emit('error', { message: 'Failed to update sticky note' });
          }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          const presence: UserPresence = {
            email,
            username: user,
            joined: false,
          };
          socket.to(room).emit('user_presence', presence);
          console.log(`${user} left whiteboard ${whiteboardId}`);
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join whiteboard' });
      }
    });
  });
};
