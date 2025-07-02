import { Server, Socket } from 'socket.io';
import User from 'src/models/User';
import Whiteboard from 'src/models/Whiteboard';
import connectDB from '../lib/db';
import { verifyToken } from '../lib/auth';
import { WhiteboardElement, StickyNote, ActivityUpdate, UserPresence } from './types';

export const setupSocket = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Authenticate the user
    const token: any = socket.handshake.auth.token;

    if (!token) {
      console.log("invalid token")
      socket.disconnect();
      return;
    }

    let email: string = "";
    let userId: string = "";
    let name: string = "";

    try {
      if (typeof token !== "string") {
        console.error("Invalid token format — expected string but got", typeof token);
        socket.disconnect();
        return;
      }
      const decoded = verifyToken(token);

      email = decoded.email || "";
      userId = decoded.userId || "";
      name = decoded.name || "";

      // You can now store user info in socket for later use
      socket.data.user = { email, userId, name };
    } catch (error) {
      socket.disconnect();
      console.log("disconnected")
      return;
    }

    // Join a whiteboard room
    socket.on('join_whiteboard', async (whiteboardId: string) => {
      if (!whiteboardId) {
        socket.emit("error", { message: "whiteboardId is required" })
        return;
      }
      
      try {
        await connectDB();

        // Verify user has access to the whiteboard
        const whiteboard = await Whiteboard.findById(whiteboardId);

        if (!whiteboard) {
          console.log('Whiteboard not found:', whiteboardId);
          socket.emit('error', { message: 'Whiteboard not found' });
          return;
        }

        // ✅ Allow access if user is either the owner or a collaborator
        const isOwner = whiteboard.owner.toString() === userId;
        const isCollaborator = whiteboard.collaborators.includes(email);

        if (!isOwner && !isCollaborator) {
          console.log('User not authorized:', email, 'Owner:', whiteboard.owner.toString(), 'Collaborators:', whiteboard.collaborators);
          socket.emit('error_unauthorized', { message: 'Unauthorized access to whiteboard!' });
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
            socket.to(room).emit('drawStart', element);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: `started drawing a ${element.type}`,
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Draw start error:', error);
            socket.emit('error', { message: 'Failed to start drawing' });
          }
        });

        socket.on('drawUpdate', async (element: WhiteboardElement) => {
          try {
            // Just broadcast the update, don't save to DB yet (performance optimization)
            socket.to(room).emit('drawUpdate', element);
          } catch (error) {
            console.error('Draw update error:', error);
            socket.emit('error', { message: 'Failed to update drawing' });
          }
        });

        socket.on('drawEnd', async (element: WhiteboardElement) => {
          try {
            // Remove any existing element with the same ID and add the final version
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { elements: { id: element.id } },
            });

            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { elements: element },
            });

            socket.to(room).emit('drawEnd', element);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: `finished drawing a ${element.type}`,
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Draw end error:', error);
            socket.emit('error', { message: 'Failed to end drawing' });
          }
        });

        // Handle sticky note events
        socket.on('stickyNoteCreate', async (stickyNote: StickyNote) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { stickyNotes: stickyNote },
            });
            socket.to(room).emit('stickyNoteCreate', stickyNote);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: 'created a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Sticky note create error:', error);
            socket.emit('error', { message: 'Failed to create sticky note' });
          }
        });

        socket.on('stickyNoteUpdate', async (stickyNote: Partial<StickyNote>) => {
          try {
            // Use arrayFilters to update the specific sticky note
            const result = await Whiteboard.findOneAndUpdate(
              { _id: whiteboardId, 'stickyNotes.id': stickyNote.id },
              {
                $set: {
                  'stickyNotes.$.text': stickyNote.text,
                  'stickyNotes.$.x': stickyNote.x,
                  'stickyNotes.$.y': stickyNote.y,
                  'stickyNotes.$.width': stickyNote.width,
                  'stickyNotes.$.height': stickyNote.height,
                  'stickyNotes.$.bgColor': stickyNote.bgColor,
                  'stickyNotes.$.textColor': stickyNote.textColor,
                }
              },
              { new: true }
            );

            if (!result) {
              throw new Error('Sticky note not found for update');
            }

            socket.to(room).emit('stickyNoteUpdate', stickyNote);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: 'updated a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Sticky note update error:', error);
            socket.emit('error', { message: 'Failed to update sticky note' });
          }
        });

        socket.on('stickyNoteDelete', async (id: string) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $pull: { stickyNotes: { id } },
            });
            socket.to(room).emit('stickyNoteDelete', id);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: 'deleted a sticky note',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Sticky note delete error:', error);
            socket.emit('error', { message: 'Failed to delete sticky note' });
          }
        });

        // Handle text events
        socket.on('textCreate', async (element: WhiteboardElement) => {
          try {
            await Whiteboard.findByIdAndUpdate(whiteboardId, {
              $push: { elements: element },
            });
            socket.to(room).emit('textCreate', element);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: 'added text',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Text create error:', error);
            socket.emit('error', { message: 'Failed to create text' });
          }
        });

        socket.on('textUpdate', async (element: Partial<WhiteboardElement>) => {
          try {
            // Use findOneAndUpdate with positional operator for better performance
            const result = await Whiteboard.findOneAndUpdate(
              { _id: whiteboardId, 'elements.id': element.id },
              {
                $set: {
                  'elements.$.text': element.text,
                  'elements.$.x': element.x,
                  'elements.$.y': element.y,
                  'elements.$.color': element.color,
                }
              },
              { new: true }
            );

            if (!result) {
              // If element doesn't exist, create it
              const fullElement = { ...element, type: 'text' } as WhiteboardElement;
              await Whiteboard.findByIdAndUpdate(whiteboardId, {
                $push: { elements: fullElement },
              });
            }

            socket.to(room).emit('textUpdate', element);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: 'updated text',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Text update error:', error);
            socket.emit('error', { message: 'Failed to update text' });
          }
        });

        // Handle shape updates
        socket.on('shapeUpdate', async (element: Partial<WhiteboardElement>) => {
          try {
            // Use findOneAndUpdate with positional operator for better performance
            const result = await Whiteboard.findOneAndUpdate(
              { _id: whiteboardId, 'elements.id': element.id },
              {
                $set: {
                  'elements.$.x': element.x,
                  'elements.$.y': element.y,
                  'elements.$.width': element.width,
                  'elements.$.height': element.height,
                  'elements.$.color': element.color,
                  'elements.$.lineWidth': element.lineWidth,
                }
              },
              { new: true }
            );

            if (!result) {
              // If element doesn't exist, create it
              await Whiteboard.findByIdAndUpdate(whiteboardId, {
                $push: { elements: element as WhiteboardElement },
              });
            }

            socket.to(room).emit('shapeUpdate', element);
            const activity: ActivityUpdate = {
              userId,
              username: name,
              action: 'updated a shape',
              timestamp: new Date().toISOString(),
            };
            io.to(room).emit('activity_update', activity);
          } catch (error) {
            console.error('Shape update error:', error);
            socket.emit('error', { message: 'Failed to update shape' });
          }
        });

        // Handle cursor movement
        socket.on('cursorMove', (data: { x: number; y: number }) => {
          socket.to(room).emit('cursorMove', { 
            socketId: socket.id, 
            username: name,
            ...data 
          });
        });

        // Handle ping for latency measurement
        socket.on('ping', (timestamp: number) => {
          socket.emit('pong', timestamp);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
          const presence: UserPresence = {
            email,
            username: name,
            joined: false,
          };
          socket.to(room).emit('user_presence', presence);
          console.log(`${name} left whiteboard ${whiteboardId}`);
        });

      } catch (error: any) {
        console.error('Join whiteboard error:', error.message, 'Stack:', error.stack, 'WhiteboardId:', whiteboardId, 'UserId:', userId, 'Email:', email);
        socket.emit('error', { message: 'Failed to join whiteboard' });
      }
    });

    // Handle global disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
